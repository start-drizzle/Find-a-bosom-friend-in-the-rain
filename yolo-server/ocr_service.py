"""
OCR Service — ConvNextViT 文字识别 (ONNX Runtime)
启动时加载模型到内存，后续请求复用同一实例
"""

import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import onnxruntime as ort


class OCRService:
    """ONNX OCR 推理服务（单例，启动时加载一次）"""

    def __init__(self, model_dir: str = "ocr", device: str = "cpu"):
        self.model_dir = Path(model_dir)
        self.device = device
        self.session: ort.InferenceSession | None = None
        self.vocab: list[str] = []

    # ── 模型生命周期 ──────────────────────────────────────

    def load(self) -> None:
        """加载 ONNX 模型和词表（启动时调用一次）"""
        model_path = self.model_dir / "model.onnx"
        vocab_path = self.model_dir / "vocab.txt"

        if not model_path.exists():
            raise FileNotFoundError(f"OCR 模型不存在: {model_path}")
        if not vocab_path.exists():
            raise FileNotFoundError(f"词表文件不存在: {vocab_path}")

        providers: list[str | tuple[str, dict[str, Any]]]
        if self.device != "cpu":
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        else:
            providers = ["CPUExecutionProvider"]

        self.session = ort.InferenceSession(str(model_path), providers=providers)

        # 按照官方 README 方式构建映射: index 从 2 开始
        # index 0 = CTC blank, index 1 = 特殊 token
        lines = vocab_path.read_text(encoding="utf-8").strip().splitlines()
        self.label_map: dict[int, str] = {}
        for i, line in enumerate(lines):
            self.label_map[i + 2] = line.strip()

        print(f"[OCR] 模型已加载: {model_path} | 词表大小: {len(self.label_map)}")

    # ── 预处理 ─────────────────────────────────────────────

    @staticmethod
    def _keepratio_resize(img: np.ndarray, mask_height: int = 32, mask_width: int = 804) -> np.ndarray:
        """等比例缩放并填充到固定尺寸"""
        h, w = img.shape[:2]
        ratio = w / float(h)
        target_w = min(mask_width, int(mask_height * ratio))
        resized = cv2.resize(img, (target_w, mask_height))
        mask = np.zeros((mask_height, mask_width, 3), dtype=np.uint8)
        mask[:, :target_w, :] = resized
        return mask

    def _preprocess(self, img: np.ndarray) -> np.ndarray:
        """keepratio_resize → chunk → normalize → 转为模型输入格式"""
        img = self._keepratio_resize(img).astype(np.float32)

        # 分块: 3 块，每块宽 300，步长 252 (overlap=48)
        chunks = []
        for i in range(3):
            left = (300 - 48) * i
            chunks.append(img[:, left : left + 300, :])

        # shape: (3, 32, 300, 3) → (3, 3, 32, 300)
        merged = np.concatenate(chunks, axis=0).reshape(3, 32, 300, 3)
        return (merged / 255.0).transpose(0, 3, 1, 2).astype(np.float32)

    # ── CTC 解码 ─────────────────────────────────────────

    def _ctc_decode(self, preds: np.ndarray) -> str:
        """CTC greedy decode: 去重 + 去 blank（与官方 README 一致）"""
        chars: list[str] = []
        last_p = 0
        for p in preds:
            if p != last_p and p != 0:  # 跳过连续重复和 blank
                if p in self.label_map:
                    chars.append(self.label_map[p])
            last_p = p
        return "".join(chars)

    # ── 推理 ─────────────────────────────────────────────

    def recognize(self, image_bytes: bytes) -> dict[str, Any]:
        """
        从图片二进制数据识别文字

        Args:
            image_bytes: 图片的二进制数据（支持 JPEG/PNG）

        Returns:
            {"text": str, "time_ms": float, "error"?: str}
        """
        if self.session is None:
            self.load()

        t0 = time.perf_counter()

        # 解码图片
        img_arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        if img is None:
            return {"text": "", "time_ms": 0, "error": "图片解码失败"}

        # 预处理
        input_data = self._preprocess(img)

        # ONNX 推理
        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        logits = self.session.run([output_name], {input_name: input_data})[0]

        # CTC 解码
        preds = np.argmax(logits, axis=-1).flatten()
        text = self._ctc_decode(preds)

        time_ms = (time.perf_counter() - t0) * 1000

        return {"text": text, "time_ms": round(time_ms, 2)}
