# Kiacha OS – Full Physical + Web AI Operating System

A complete, bootable AI Operating System combining embedded firmware, web services, and machine learning inference.

## 🎯 Features

✅ **Bootable x86_64 Linux 6.9** - Full system with GRUB bootloader
✅ **3D Interactive Dashboard** - Three.js WebGL visualization
✅ **Voice Recognition** - Whisper.cpp WASM + native transcription
✅ **Large Language Models** - LLaMA.cpp native inference
✅ **Text-to-Speech** - Piper WASM + native synthesis
✅ **Vision System** - WebRTC camera streaming + ONNX gesture recognition
✅ **Memory & Embeddings** - ChromaDB vector storage
✅ **OTA Updates** - Over-the-air firmware updates
✅ **Hardware Control** - I2C, temperature, LED, audio management
✅ **Full systemd Integration** - 6 managed services
✅ **Buildroot Minimal Rootfs** - ~2GB custom Linux distribution

## 📋 Prerequisites

- **Node.js** 18+ (frontend & backend)
- **Python** 3.9+ (buildroot)
- **GCC/Clang** 11+ (firmware compilation)
- **CMake** 3.20+ (firmware build)
- **Docker & Docker Compose** (optional, for dev environment)
- **QEMU** (optional, for OS testing)

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd kiacha-os
```

### 2. Build Everything

```bash
make build-os
```

Or build individually:

```bash
cd frontend && npm i && npm run build
cd ../backend && npm i && npm run build
cd ../firmware && mkdir -p build && cd build && cmake .. && make
```

### 3. Run Development Environment

```bash
make run-web
```

Then open:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **ChromaDB:** http://localhost:8000

## 🔐 Authentication

**Default Credentials:**
```
Username: kiacha
Password: kiacha
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| GET | `/api/health` | System health check |
| POST | `/memory/embed` | Store memory embedding |
| GET | `/memory/list` | List all memories |
| GET | `/ota/manifest` | Get update manifest |
| POST | `/ota/install` | Install system update |

## 🛠️ Architecture

```
kiacha-os/
├── frontend/        React + Three.js + WebRTC
├── backend/         Fastify + ChromaDB + WebSocket
├── firmware/        C++17 + ALSA + V4L2 drivers
└── os-image/        Buildroot + systemd + overlay
```

## 🔧 Deployment

### Flash to USB
```bash
make flash DEV=/dev/sdX
```

### Test with QEMU
```bash
make run-qemu
```

### Download AI Models
```bash
bash models/download.sh
```

## 📝 System Services

All services are managed by systemd and auto-restart on failure:

- `kiacha-core.service` - Firmware daemon
- `kiacha-voice.service` - Whisper transcription
- `kiacha-vision.service` - Camera streaming
- `kiacha-dashboard.service` - Web UI (Node.js)
- `kiacha-network.service` - mDNS announcer
- `kiacha-hardware.service` - Monitoring

Check status:
```bash
systemctl status kiacha-*
journalctl -u kiacha-core -f
```

## 🧠 AI Models

The system integrates three powerful ML models:

1. **Whisper.cpp** - Speech-to-Text
   - Base model: 140MB
   - 16kHz mono audio
   - English optimized

2. **LLaMA 2 7B** - Chat & Reasoning
   - Quantized 4-bit: ~4GB
   - Local inference
   - No internet required

3. **Piper** - Text-to-Speech
   - Voice: English (Amy)
   - 22kHz output
   - Real-time synthesis

Download all:
```bash
bash models/download.sh
```

## 🐳 Docker Development

```bash
docker-compose up --build

# Frontend updates hot-reload
# Backend rebuilds on file changes
```

## 📊 Performance

- **Boot Time:** ~15s
- **Memory:** ~512MB base + AI models
- **Response Time:** <500ms for inference
- **Concurrent Connections:** 100+

## 🔄 OTA Updates

System supports secure over-the-air updates:

```bash
curl http://localhost:3001/ota/check
curl -X POST http://localhost:3001/ota/install
```

Updates are cryptographically signed and verified before installation.

## 🐛 Troubleshooting

### Frontend won't load
```bash
cd frontend && npm i && npm run dev
```

### Backend connection refused
```bash
cd backend && npm i && npm run start
```

### ALSA errors on non-Linux
Audio will degrade gracefully. Firmware stubs are provided.

### QEMU slow
Enable KVM: Requires nested virtualization or native Linux host.

## 📚 Documentation

- [Firmware Development](docs/FIRMWARE.md)
- [Frontend Architecture](docs/FRONTEND.md)
- [Backend API Reference](docs/API.md)
- [Buildroot Customization](docs/BUILDROOT.md)

## 📄 License

MIT - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit with clear messages
4. Submit a pull request

---

**🎉 Happy coding! Kiacha OS is ready to power your AI applications.**
