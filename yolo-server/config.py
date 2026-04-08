"""
YOLO Server Configuration
服务配置文件
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # 服务器配置
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # API 鉴权
    API_KEY: str = "change_this_to_a_secure_key"

    # 模型配置
    MODEL_PATH: str = "best.pt"
    CONFIDENCE_THRESHOLD: float = 0.5
    DEVICE: str = "cpu"  # "0" for GPU, "cpu" for CPU

    # 并发控制
    MAX_CONCURRENT_INFERENCE: int = 2
    MAX_QUEUE_SIZE: int = 50

    # 请求限制
    REQUEST_TIMEOUT: int = 30
    MAX_IMAGE_SIZE_MB: int = 10

    # 速率限制（per-IP 滑动窗口）
    RATE_LIMIT_WINDOW: int = 60       # 窗口大小（秒）
    RATE_LIMIT_MAX_REQUESTS: int = 30  # 每个窗口最大请求数

    # 输出文件清理
    MAX_OUTPUT_FILES: int = 100        # 保留最近 N 个文件

    # 允许的图片格式
    ALLOWED_IMAGE_TYPES: tuple[str, ...] = (
        "image/jpeg",
        "image/png",
        "image/webp",
    )

    # 检测结果输出目录（用于验证）
    OUTPUT_DIR: str = "detection_output"

    # OCR 配置
    OCR_MODEL_DIR: str = "ocr"
    OCR_ENABLED: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
