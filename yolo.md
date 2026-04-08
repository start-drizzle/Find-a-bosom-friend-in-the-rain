云端 YOLO 模型推理服务 — 开发技术文档

文档版本： v1.1
最后更新： 2026-04-06
编写目的： 为开发人员提供完整的技术规范与实施方案



目录

一、项目概述
二、系统架构
三、现有环境与已完成配置
四、服务端技术规范
五、客户端技术规范
六、API 接口规范
七、坐标系统规范（重点）
八、并发处理方案
九、安全规范
十、部署规范
十一、代码规范
十二、测试要求
十三、验收标准


一、项目概述

1.1 项目背景

现有基于 Electron + Vue3 的桌面端软件，需要增加一项"智能识别"功能：用户点击识别按钮后，软件截取当前屏幕画面，发送至云端服务器进行 YOLO 模型推理，服务器返回检测框坐标，客户端在截图上绘制标注结果。


1.2 核心目标

客户端截图后通过 HTTPS 将图片发送至云端服务器
服务器调用已训练好的 YOLO 模型进行目标检测
服务器返回标准化的检测结果（含坐标、类别、置信度）
客户端在截图上精确绘制检测框
支持多个客户端同时使用，服务端合理控制并发

1.3 技术栈总览

层级	技术
客户端	Electron + Vue3 + TypeScript
服务端	Python 3.10+ + FastAPI + ultralytics
Web 服务器	IIS（反向代理 + HTTPS）
进程管理	NSSM（将 Python 服务注册为 Windows 服务）
通信协议	HTTPS + JSON


二、系统架构

2.1 架构图

text
text
┌──────────────────────────────┐
│      Electron 客户端          │
│                              │
│  ┌─────────┐  ┌───────────┐ │
│  │ Vue3 UI │  │ 主进程     │ │
│  │ 渲染进程  │◄─┤ 截图/IPC  │ │
│  └────┬────┘  └─────┬─────┘ │
│       │              │       │
│       └──────┬───────┘       │
│              │               │
│        Axios HTTP 请求        │
└──────────────┼───────────────┘
               │  HTTPS
               ▼
┌──────────────────────────────────────────┐
│        腾讯云服务器 42.193.231.199         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │           IIS (443端口)             │  │
│  │                                    │  │
│  │  startdrizzling.cn        → 网页   │  │
│  │  startdrizzling.cn/api/*  → 转发   │  │
│  └──────────────┬─────────────────────┘  │
│                 │  本地 HTTP              │
│                 │  127.0.0.1:8000         │
│                 ▼                         │
│  ┌────────────────────────────────────┐  │
│  │      FastAPI 服务 (Python)          │  │
│  │                                    │  │
│  │   - 接收图片                        │  │
│  │   - 调用 YOLO 模型推理              │  │
│  │   - 返回 JSON 检测结果              │  │
│  │   - 并发控制（信号量）               │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘

2.2 数据流向

text
text
1. 用户点击"识别"按钮
2. 客户端主进程截取当前屏幕（真实物理分辨率）
3. 客户端将截图压缩为 JPEG（减少传输体积）
4. 客户端通过 HTTPS POST 将图片发送到 startdrizzling.cn/api/detect
5. IIS 匹配 /api/ 路径，将请求转发到本地 127.0.0.1:8000
6. FastAPI 调用 YOLO 模型进行推理
7. FastAPI 返回 JSON 格式的检测结果
8. IIS 将响应返回给客户端
9. 客户端解析结果，在截图上绘制检测框


三、现有环境与已完成配置

3.1 服务器信息

项目	值
云服务商	腾讯云
公网 IP	42.193.231.199
域名	startdrizzling.cn
HTTPS	已配置，证书已生效
Web 服务器	IIS
现有用途	展示网页（80/443 端口）

3.2 已完成的 IIS 配置

反向代理方式：路径转发（非子域名）


text
text
startdrizzling.cn           → IIS 正常处理，展示现有网页
startdrizzling.cn/api/*     → IIS URL 重写规则，转发到 127.0.0.1:8000

已安装的 IIS 组件：


组件	状态	作用
IIS 基础服务	✅ 已启用	Web 服务器
Application Request Routing (ARR)	✅ 已安装并启用代理	反向代理核心组件
URL Rewrite	✅ 已安装	URL 转发规则

ARR 代理功能：


text
text
IIS 管理器 → 顶层服务器节点 → Application Request Routing Cache
  → Server Proxy Settings → Enable proxy → 已勾选 ✅

URL 重写规则：


text
text
规则名称：ProxyToYolo
匹配模式：api/(.*)
操作类型：重写
重写 URL：http://127.0.0.1:8000/api/{R:1}
状态：已启用 ✅

链路验证结果：


text
text
本地电脑浏览器访问 https://startdrizzling.cn/api/health
  → 返回 {"status":"ok","message":"服务正常运行"} ✅

本地电脑运行 test_client.py
  → 健康检查接口：200 ✅
  → 识别测试接口：200 ✅

整条链路：客户端 → 公网 HTTPS → IIS → 本地转发 → Python 服务 → 通 ✅

3.3 端口规划

端口	用途	监听地址	对外暴露
80	HTTP（自动跳转 HTTPS）	公网	✅
443	HTTPS（IIS）	公网	✅
8000	Python FastAPI 服务	127.0.0.1	❌ 仅本机

重要：Python 服务必须监听 127.0.0.1，绝不能监听 0.0.0.0 或公网 IP。外部流量只通过 IIS 的 443 端口进入，由 IIS 转发到本地 8000 端口。


3.4 项目目录结构

text
text
D:\yolo-server\
├── main.py              # FastAPI 入口文件
├── inference.py         # YOLO 推理逻辑封装
├── config.py            # 配置文件
├── test_server.py       # 测试用服务（链路验证用，正式部署后可删除）
├── requirements.txt     # 依赖清单
├── models\
│   └── best.pt          # 训练好的模型文件
└── venv\                # Python 虚拟环境


四、服务端技术规范

4.1 运行环境

项目	要求
操作系统	Windows Server 2019+ 或 Windows 10/11
Python 版本	3.10 或 3.11（不支持 3.12+，部分依赖兼容性差）
内存	最低 8GB，推荐 16GB+（模型加载到内存需要占用）
硬盘	预留 5GB 以上（模型文件 + 依赖库）

4.2 依赖库清单

库	用途
fastapi	Web 框架
uvicorn	ASGI 服务器
python-multipart	解析 multipart/form-data 请求
pydantic-settings	配置管理
ultralytics	YOLO 推理库（包含 PyTorch）
Pillow	图片处理
numpy	数值计算

4.3 关键配置项

开发人员需要根据实际情况调整以下配置：


配置项	说明	建议值
MODEL_PATH	模型文件路径	models/best.pt
CONFIDENCE_THRESHOLD	置信度阈值，低于此值的检测结果不返回	0.5
DEVICE	推理设备，有 GPU 填 "0"，没有填 "cpu"	按实际情况
MAX_CONCURRENT_INFERENCE	最大同时推理数量	CPU 推理建议 2~4，GPU 推理建议 4~8
MAX_QUEUE_SIZE	最大排队数量，超出直接拒绝	50
REQUEST_TIMEOUT	请求超时时间（秒）	30
MAX_IMAGE_SIZE_MB	最大允许上传的图片大小（MB）	10
API_KEY	API 鉴权密钥	随机生成一个强密码

4.4 服务端核心逻辑说明

4.4.1 模型加载

服务启动时一次性加载模型到内存
后续所有请求复用同一个模型实例
严禁每次请求都重新加载模型（会严重拖慢响应速度）

4.4.2 推理流程

1.接收客户端上传的图片文件
2.校验文件类型（仅接受 PNG / JPEG / WEBP）
3.校验文件大小（不超过配置的上限）
4.将图片字节转为 PIL Image 对象，获取图片原始宽高
5.将图片送入 YOLO 模型进行推理
6.解析模型输出，提取每个检测框的：
类别 ID 和类别名称
置信度
边界框坐标（xyxy 格式）
7.将像素坐标归一化为 0~1 范围
8.构造 JSON 响应返回

4.4.3 坐标归一化计算

text
text
归一化 x1 = 像素 x1 ÷ 图片宽度
归一化 y1 = 像素 y1 ÷ 图片高度
归一化 x2 = 像素 x2 ÷ 图片宽度
归一化 y2 = 像素 y2 ÷ 图片高度

4.4.4 响应格式中必须包含的字段

success：布尔值，标识是否成功
image_width：服务器接收到的图片宽度（像素）
image_height：服务器接收到的图片高度（像素）
detections：检测结果数组
count：检测到的目标数量
inference_time_ms：推理耗时（毫秒）


五、客户端技术规范

5.1 环境要求

项目	要求
Electron 版本	28+
Node.js 版本	18+
TypeScript	5.0+

5.2 服务器地址配置

text
text
API 基础地址：https://startdrizzling.cn/api
识别接口：    https://startdrizzling.cn/api/detect
健康检查：    https://startdrizzling.cn/api/health

所有 API 请求都走 startdrizzling.cn/api/ 路径，IIS 会自动转发到 Python 服务。


5.3 截图模块规范

5.3.1 获取屏幕真实分辨率

这是保证坐标正确的最关键一步。开发人员必须严格按以下逻辑获取分辨率：


text
text
第一步：获取主显示器的逻辑尺寸
  → 使用 screen.getPrimaryDisplay().size
  → 返回的是系统缩放后的逻辑分辨率（例如 1707×960）

第二步：获取缩放因子
  → 使用 screen.getPrimaryDisplay().scaleFactor
  → 返回的是系统缩放比例（例如 1.5）

第三步：计算真实物理分辨率
  → 真实宽度 = 逻辑宽度 × 缩放因子
  → 真实高度 = 逻辑高度 × 缩放因子
  → 例如：1707 × 1.5 = 2560，960 × 1.5 = 1440

绝对禁止写死分辨率（如 1920×1080），必须动态获取。


5.3.2 截图执行

text
text
第一步：调用 desktopCapturer.getSources()
  → types 设为 ['screen']
  → thumbnailSize 设为上面计算出的真实物理分辨率

第二步：从返回结果中取第一个屏幕源的 thumbnail

第三步：将 thumbnail 转为 PNG Buffer
  → 使用 thumbnail.toPNG()

第四步：将 PNG Buffer 压缩
  → 先缩放到合适的宽度（建议 1280px 或模型训练时的输入分辨率）
  → 转为 JPEG 格式，质量设为 75
  → 注意：压缩后用于传输，但原始截图要保留用于画框

5.3.3 截图必须在主进程执行

desktopCapturer 只能在 Electron 主进程中调用。渲染进程（Vue 组件）需要通过 IPC 通信调用主进程的截图功能：


text
text
渲染进程 → ipcRenderer.invoke('capture-screen') → 主进程
主进程执行截图 → 返回图片数据 → 渲染进程接收

5.4 图片压缩规范

项目	要求
压缩格式	JPEG
压缩质量	75（可调范围 60~85）
缩放宽度	建议 1280px（高度按原始比例自动计算）
压缩目的	减少网络传输体积，从几 MB 降到几百 KB

注意： 压缩只影响发给服务器的图片。客户端本地用于画框的图片应该是原始截图（未压缩），以保证画框精度。


5.5 网络请求规范

项目	要求
请求库	Axios
请求方法	POST
Content-Type	multipart/form-data
超时时间	30000ms（30 秒）
API Key	放在请求 Header 的 X-API-Key 字段
文件字段名	file

5.6 画框模块规范

5.6.1 画框原理

在截图上方覆盖一个 Canvas 元素，Canvas 尺寸与截图显示尺寸一致，然后在 Canvas 上绘制检测框。


5.6.2 坐标换算公式

text
text
显示区域宽度 = 截图在界面上实际显示的宽度
显示区域高度 = 截图在界面上实际显示的高度

缩放比例 X = 显示区域宽度 ÷ 截图原始宽度
缩放比例 Y = 显示区域高度 ÷ 截图原始高度

画框 x1 = 检测框像素 x1 × 缩放比例 X
画框 y1 = 检测框像素 y1 × 缩放比例 Y
画框宽度 = (检测框像素 x2 - 检测框像素 x1) × 缩放比例 X
画框高度 = (检测框像素 y2 - 检测框像素 y1) × 缩放比例 Y

5.6.3 画框样式规范

元素	规范
框线颜色	绿色 #00FF88，不同类别可以用不同颜色区分
框线宽度	2~3px
标签背景	半透明色块，覆盖在框的左上角上方
标签文字	显示 类别名 + 置信度百分比，例如 猫 92%
标签字号	12~14px

5.6.4 画框前的校验

在画框之前，必须执行一次校验：


text
text
服务器返回的 image_width 是否等于客户端发送的图片宽度
服务器返回的 image_height 是否等于客户端发送的图片高度

如果一致 → 正常画框
如果不一致 → 提示用户"坐标数据异常，请重试"，不画框

5.7 UI 交互规范

状态	界面表现
空闲状态	识别按钮可用，显示"开始识别"
请求中	识别按钮禁用，显示"识别中..."，可加一个加载动画
识别成功	在截图上绘制检测框，显示检测数量
识别失败	显示具体错误信息（网络超时、服务器繁忙等）
无目标	提示"未检测到目标"


六、API 接口规范

6.1 接口总览

方法	路径	说明
POST	https://startdrizzling.cn/api/detect	提交图片进行目标检测
GET	https://startdrizzling.cn/api/health	健康检查

6.2 目标检测接口

请求：


text
text
URL:    https://startdrizzling.cn/api/detect
Method: POST
Header:
  X-API-Key: 你的密钥
  Content-Type: multipart/form-data
Body:
  file: 图片文件（字段名为 file）

成功响应（200）：


json
json
{
  "success": true,
  "image_width": 2560,
  "image_height": 1440,
  "detections": [
    {
      "class_id": 0,
      "class_name": "猫",
      "confidence": 0.9234,
      "bbox": {
        "x1": 0.1250,
        "y1": 0.3400,
        "x2": 0.5625,
        "y2": 0.7800
      },
      "bbox_pixel": {
        "x1": 320,
        "y1": 490,
        "x2": 1440,
        "y2": 1123
      }
    }
  ],
  "count": 1,
  "inference_time_ms": 230.5
}

失败响应：


HTTP 状态码	含义	场景
400	请求格式错误	文件类型不对、没有上传文件
401	鉴权失败	API Key 错误或缺失
413	文件太大	图片超过大小限制
429	请求过多	超过限流阈值
503	服务不可用	推理队列已满
500	服务器内部错误	模型推理异常

失败响应格式：


json
json
{
  "success": false,
  "error": "具体的错误描述"
}

6.3 健康检查接口

请求：


text
text
URL:    https://startdrizzling.cn/api/health
Method: GET

响应：


json
json
{
  "status": "ok",
  "queue": 3
}

queue 字段表示当前正在排队等待推理的请求数量，可用于监控。



七、坐标系统规范（重点）

7.1 问题背景

不同用户的屏幕分辨率不同，Windows 系统还有显示缩放设置。如果截图分辨率和画框时用的分辨率不一致，检测框就会错位。本节规定整个链路中坐标处理的标准流程，所有开发人员必须严格遵守。


7.2 坐标链路全流程

text
text
┌─────────────────────────────────────────────────────────┐
│ 第一步：获取屏幕真实分辨率                                  │
│                                                         │
│   逻辑尺寸（缩放后）  ×  缩放因子  =  真实物理分辨率        │
│   例如：1707×960     ×  1.5      =  2560×1440           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 第二步：用真实分辨率截图                                    │
│                                                         │
│   thumbnailSize 设为 { width: 2560, height: 1440 }      │
│   截出的图片就是 2560×1440                                │
│                                                         │
│   记录：screenshotWidth = 2560                          │
│         screenshotHeight = 1440                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 第三步：压缩用于传输                                      │
│                                                         │
│   将图片等比缩放到 1280px 宽度                            │
│   缩放比例 = 1280 / 2560 = 0.5                          │
│   压缩后高度 = 1440 × 0.5 = 720                         │
│   压缩后图片尺寸：1280×720

服务器繁忙，请稍后再试