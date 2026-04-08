# YOLO Detection Server

云端 YOLO 目标检测服务

## 部署步骤

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，根据实际情况修改配置：

```bash
cp .env.example .env
```

### 3. 放置模型文件

将训练好的 `best.pt` 模型文件放入 `models/` 目录。

```
yolo-server/
├── models/
│   └── best.pt    ← 模型文件放这里
```

### 4. 启动服务

```bash
python main.py
```

服务将在 `http://127.0.0.1:8000` 启动。模型会在启动时自动加载到内存。

### 5. 验证检测结果

每次检测完成后，结果会保存在 `detection_output/` 目录：

- `annotated_*.jpg` — 标注了检测框的截图
- `coords_*.json` — 检测框坐标数据

## API 接口

### 健康检查

```http
GET /api/health
```

### 目标检测

```http
POST /api/detect
Headers:
  X-API-Key: your_api_key
  Content-Type: multipart/form-data
Body:
  file: <image_file>
```

#### 成功响应示例

```json
{
  "success": true,
  "image_width": 1280,
  "image_height": 720,
  "detections": [
    {
      "class_id": 0,
      "class_name": "object",
      "confidence": 0.92,
      "bbox": { "x1": 0.1, "y1": 0.2, "x2": 0.5, "y2": 0.8 },
      "bbox_pixel": { "x1": 128, "y1": 144, "x2": 640, "y2": 576 }
    }
  ],
  "count": 1,
  "inference_time_ms": 230.5
}
```

## 注册为 Windows 服务（使用 NSSM）

```bash
nssm install YoloServer "C:\Users\Administrator\yolo-server\venv\Scripts\python.exe" "C:\Users\Administrator\yolo-server\main.py"
nssm set YoloServer AppDirectory "C:\Users\Administrator\yolo-server"
nssm set YoloServer AppEnvironmentExtra API_KEY=your_api_key
nssm start YoloServer
```
