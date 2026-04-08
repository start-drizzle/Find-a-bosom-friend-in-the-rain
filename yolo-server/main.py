"""
YOLO Detection Server — FastAPI 入口
启动时加载模型到内存，后续请求复用模型实例
"""

import asyncio
import hmac
import io
import json
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import Image

from config import settings
from inference import YOLOInference
from ocr_service import OCRService

# ── 目录初始化 ──────────────────────────────────────────
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

OUTPUT_DIR = Path(settings.OUTPUT_DIR)
OUTPUT_DIR.mkdir(exist_ok=True)

# ── 模型初始化（启动时加载一次，常驻内存） ──────────────
engine = YOLOInference(
    model_path=settings.MODEL_PATH,
    confidence_threshold=settings.CONFIDENCE_THRESHOLD,
    device=settings.DEVICE,
)

ocr_engine = OCRService(
    model_dir=settings.OCR_MODEL_DIR,
    device=settings.DEVICE,
)

# ── 并发控制 ────────────────────────────────────────────
_semaphore: asyncio.Semaphore | None = None
_active_count = 0

# ── 速率限制 ────────────────────────────────────────────
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(client_ip: str) -> bool:
    """per-IP 滑动窗口限流"""
    now = time.time()
    window = settings.RATE_LIMIT_WINDOW
    max_req = settings.RATE_LIMIT_MAX_REQUESTS
    timestamps = _rate_limit_store[client_ip]
    # 清除过期记录
    _rate_limit_store[client_ip] = [t for t in timestamps if t > now - window]
    if len(_rate_limit_store[client_ip]) >= max_req:
        return False
    _rate_limit_store[client_ip].append(now)
    return True


# ── 输出文件清理 ──────────────────────────────────────
def _cleanup_output_dir() -> None:
    """保留最近的 MAX_OUTPUT_FILES 个文件，删除其余"""
    files = sorted(OUTPUT_DIR.glob("*"), key=lambda f: f.stat().st_mtime, reverse=True)
    for old_file in files[settings.MAX_OUTPUT_FILES :]:
        old_file.unlink(missing_ok=True)


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_INFERENCE)
    return _semaphore


# ── FastAPI 应用 ────────────────────────────────────────
app = FastAPI(
    title="YOLO Detection API",
    description="YOLO 目标检测服务",
    version="1.0.0",
)


@app.on_event("startup")
async def on_startup() -> None:
    """服务启动时加载模型到内存"""
    print("[Server] 正在加载 YOLO 模型...")
    engine.load_model()

    if settings.OCR_ENABLED:
        print("[Server] 正在加载 OCR 模型...")
        ocr_engine.load()

    _cleanup_output_dir()
    print("[Server] 全部模型加载完成，服务就绪")


# ── 健康检查 ────────────────────────────────────────────
@app.get("/api/health")
async def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "queue": _active_count,
        "model_loaded": engine.model is not None,
    }


# ── 目标检测 ────────────────────────────────────────────
@app.post("/api/detect")
async def detect_objects(
    request: Request,
    file: UploadFile = File(...),
    x_api_key: str | None = Header(None),
) -> dict[str, Any]:
    global _active_count

    # 1. 鉴权（timing-safe 比较）
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )

    # 2. 速率限制
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试",
        )

    # 3. 文件类型校验
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {file.content_type}",
        )

    # 4. 读取 & 大小校验
    image_data = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"图片过大，最大支持 {settings.MAX_IMAGE_SIZE_MB}MB",
        )

    # 5. 解码图片
    try:
        image = Image.open(io.BytesIO(image_data))
        image_width, image_height = image.size
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"图片解码失败: {exc}",
        )

    print(f"[Server] 收到图片: {image_width}x{image_height}, {len(image_data)} bytes")

    # 6. 并发控制 — 信号量
    sem = _get_semaphore()
    if sem.locked() and _active_count >= settings.MAX_QUEUE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="服务器繁忙，请稍后再试",
        )

    async with sem:
        _active_count += 1
        try:
            # 7. YOLO 推理
            detections, inference_time_ms = engine.infer(image)
        except Exception as exc:
            print(f"[Server] 推理异常: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"模型推理异常: {exc}",
            )
        finally:
            _active_count -= 1

    print(f"[Server] 检测完成: {len(detections)} 个目标, {inference_time_ms:.1f}ms")

    # 8. 绘制标注图 & 保存结果到 output 目录（用于验证）
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    try:
        annotated = engine.draw_annotations(image, detections)

        annotated_path = OUTPUT_DIR / f"annotated_{timestamp}.jpg"
        annotated.save(annotated_path, "JPEG", quality=90)

        coords_path = OUTPUT_DIR / f"coords_{timestamp}.json"
        result_data = {
            "success": True,
            "image_width": image_width,
            "image_height": image_height,
            "detections": detections,
            "count": len(detections),
            "inference_time_ms": round(inference_time_ms, 2),
        }
        coords_path.write_text(json.dumps(result_data, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"[Server] 结果已保存: {annotated_path.name}, {coords_path.name}")
    except Exception as exc:
        print(f"[Server] 保存结果失败（不影响返回）: {exc}")

    # 9. 返回检测结果
    return {
        "success": True,
        "image_width": image_width,
        "image_height": image_height,
        "detections": detections,
        "count": len(detections),
        "inference_time_ms": round(inference_time_ms, 2),
    }


# ── OCR 文字识别 ──────────────────────────────────────
@app.post("/api/ocr")
async def ocr_recognize(
    request: Request,
    file: UploadFile = File(...),
    x_api_key: str | None = Header(None),
) -> dict[str, Any]:
    """接收裁剪后的文本行图片，返回识别文字"""
    if not settings.OCR_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR 服务未启用",
        )

    # 1. 鉴权（timing-safe 比较）
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )

    # 2. 速率限制
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试",
        )

    # 3. 文件类型校验
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {file.content_type}",
        )

    # 4. 读取图片
    image_data = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"图片过大，最大支持 {settings.MAX_IMAGE_SIZE_MB}MB",
        )

    # 5. OCR 推理
    result = ocr_engine.recognize(image_data)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )

    print(f"[Server] OCR 识别完成: '{result['text']}' ({result['time_ms']:.1f}ms)")
    return {"success": True, **result}


# ── 全局异常处理 ────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Any, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


# ── 启动入口 ────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
