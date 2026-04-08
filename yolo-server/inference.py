"""
YOLO Inference Engine
YOLO 模型推理引擎 — 启动时加载模型到内存，后续请求复用同一实例
"""

import time
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


# 默认检测框颜色表（按 class_id 取色）
_DEFAULT_COLORS = [
    "#00FF88",  # 绿
    "#FF6B6B",  # 红
    "#4ECDC4",  # 青
    "#FFE66D",  # 黄
    "#A78BFA",  # 紫
    "#F97316",  # 橙
    "#06B6D4",  # 蓝绿
    "#EC4899",  # 粉
]


class YOLOInference:
    """YOLO 推理引擎（单例模式，服务启动时加载一次）"""

    def __init__(
        self,
        model_path: str,
        confidence_threshold: float = 0.5,
        device: str = "cpu",
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device
        self.model = None
        self._class_names: dict[int, str] = {}

    # ── 模型生命周期 ──────────────────────────────────────

    def load_model(self) -> None:
        """加载 YOLO 模型到内存（仅在启动时调用一次）"""
        from ultralytics import YOLO

        path = Path(self.model_path)
        if not path.exists():
            raise FileNotFoundError(f"模型文件不存在: {path}")

        self.model = YOLO(str(path))
        self.model.to(self.device)

        # 从模型元数据中提取类别名称
        if hasattr(self.model, "names"):
            self._class_names = {int(k): str(v) for k, v in self.model.names.items()}

        print(f"[YOLO] 模型已加载: {path} | 设备: {self.device} | 类别数: {len(self._class_names)}")

    # ── 推理 ─────────────────────────────────────────────

    def infer(self, image: Image.Image) -> tuple[list[dict[str, Any]], float]:
        """
        执行目标检测推理

        Args:
            image: PIL Image 对象

        Returns:
            (detections, inference_time_ms)
            detections 中每个元素包含 class_id / class_name / confidence / bbox / bbox_pixel
        """
        if self.model is None:
            self.load_model()

        img_width, img_height = image.size
        t0 = time.perf_counter()

        results = self.model(image, conf=self.confidence_threshold, verbose=False)

        inference_time_ms = (time.perf_counter() - t0) * 1000

        detections: list[dict[str, Any]] = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())

                detections.append(
                    {
                        "class_id": class_id,
                        "class_name": self._get_class_name(class_id),
                        "confidence": round(confidence, 4),
                        "bbox": {
                            "x1": round(x1 / img_width, 6),
                            "y1": round(y1 / img_height, 6),
                            "x2": round(x2 / img_width, 6),
                            "y2": round(y2 / img_height, 6),
                        },
                        "bbox_pixel": {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                        },
                    }
                )

        return detections, inference_time_ms

    # ── 标注绘图 ─────────────────────────────────────────

    def draw_annotations(self, image: Image.Image, detections: list[dict[str, Any]]) -> Image.Image:
        """
        在图片上绘制检测框和标签，返回标注后的新 Image
        """
        img = image.copy()
        draw = ImageDraw.Draw(img)

        label_font_size = 14
        try:
            font = ImageFont.truetype("arial.ttf", label_font_size)
        except OSError:
            font = ImageFont.load_default()

        for det in detections:
            px = det["bbox_pixel"]
            x1, y1, x2, y2 = px["x1"], px["y1"], px["x2"], px["y2"]
            color = _DEFAULT_COLORS[det["class_id"] % len(_DEFAULT_COLORS)]

            # 画框
            line_width = 3
            draw.rectangle([x1, y1, x2, y2], outline=color, width=line_width)

            # 标签文字
            label = f'{det["class_name"]} {det["confidence"] * 100:.0f}%'
            bbox = draw.textbbox((x1, y1), label, font=font)
            label_h = bbox[3] - bbox[1] + 6
            label_w = bbox[2] - bbox[0] + 8

            # 标签背景
            draw.rectangle(
                [x1, y1 - label_h, x1 + label_w, y1],
                fill=color,
            )
            draw.text((x1 + 4, y1 - label_h + 2), label, fill="white", font=font)

        return img

    # ── 内部工具 ─────────────────────────────────────────

    def _get_class_name(self, class_id: int) -> str:
        return self._class_names.get(class_id, f"class_{class_id}")
