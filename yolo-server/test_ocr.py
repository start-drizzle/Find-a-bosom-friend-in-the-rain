"""
OCR 模型测试脚本 — 使用 OCRService（与服务器实际逻辑一致）
用法: python test_ocr.py <图片路径>
"""

import sys
from pathlib import Path

from ocr_service import OCRService


def main():
    if len(sys.argv) < 2:
        print("用法: python test_ocr.py <图片路径>")
        return

    img_path = Path(sys.argv[1])
    if not img_path.exists():
        print(f"文件不存在: {img_path}")
        return

    service = OCRService(model_dir="ocr")
    print("[Test] 加载 OCR 模型...")
    service.load()
    print(f"[Test] label_map 大小: {len(service.label_map)}")
    print()

    image_bytes = img_path.read_bytes()
    print(f"[Test] 读取图片: {img_path} ({len(image_bytes)} bytes)")

    result = service.recognize(image_bytes)

    print(f"[Test] 识别结果: '{result['text']}'")
    print(f"[Test] 耗时: {result['time_ms']:.1f}ms")
    if "error" in result:
        print(f"[Test] 错误: {result['error']}")


if __name__ == "__main__":
    main()
