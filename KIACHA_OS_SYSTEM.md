# 🚀 Kiacha OS — The Supreme AI Operating System

**Kiacha OS** is not just a chatbot—it's a complete **AI Operating System** built for multimodal intelligence, local deployment, and unlimited extensibility.

## 🎯 Core Philosophy

Kiacha is a distributed AI system that runs entirely locally, combining:
- **Rust Kernel** for security and performance
- **Node.js Orchestrator** for real-time coordination  
- **Python AI Brain** for deep learning and vision
- **WebAssembly Runtime** for sandboxed high-performance code
- **React UI** for beautiful multimodal interaction
- **Multiple hardware targets** (PC, Raspberry Pi, Android, iOS)

---

## 📂 Project Structure

```
Kiacha OS/
├── kiacha-kernel/           # Rust: Core OS kernel, permissions, resource management
├── kiacha-brain/            # Node.js + Python: Main orchestrator and AI brain
├── frontend/                # React + Three.js + WebGPU: User interface
├── backend/                 # Fastify: REST API layer (legacy, being replaced by kiacha-brain)
├── firmware/                # C++17: Embedded hardware drivers
├── os-image/                # Buildroot: Linux OS image for physical hardware
├── models/                  # ML models and weights
└── scripts/                 # Build, deploy, and utility scripts
```

---

## 🏗️ Architecture

### System Layers

```
┌─────────────────────────────────────────────────────┐
│  🎨 User Interface Layer (React + WebGPU)          │
│  • Voice input/output                              │
│  • Real-time 3D visualization                      │
│  • Module dashboard                                │
└────────────────────┬────────────────────────────────┘
                     │ WebSocket / REST API
┌────────────────────▼────────────────────────────────┐
│  🧠 Kiacha Core Brain (Node.js Orchestrator)       │
│  • Event routing                                   │
│  • Memory management                               │
│  • Module coordination                             │
└────────────────────┬────────────────────────────────┘
                     │ gRPC / FFI
┌────────────────────▼────────────────────────────────┐
│  🔐 Kiacha Kernel (Rust)                           │
│  • Module spawning & lifecycle                     │
│  • Permission/security enforcement                 │
│  • Resource monitoring (CPU, RAM, GPU)             │
│  • WASM sandbox execution                          │
└────────────────────┬────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┬────────────────┐
      │              │              │                │
  ┌───▼───┐  ┌──────▼─────┐  ┌────▼────┐  ┌───────▼──┐
  │ Python │  │ C++ WASM   │  │ Go      │  │ Firmware │
  │ AI     │  │ Reasoning  │  │ Workers │  │ Drivers  │
  │ Brain  │  │ Engine     │  │         │  │          │
  └────────┘  └────────────┘  └─────────┘  └──────────┘
```

---

## 🧩 Core Modules

### 1. **Kiacha Kernel** (Rust)
The heart of the OS. Manages modules, security, and resources.

**Key Functions:**
- `kernel.spawn(name, type)` — Create a module instance
- `kernel.ipc.send(from, to, data)` — Inter-process communication
- `kernel.permissions.check(module, action)` — Permission enforcement
- `kernel.resources.monitor()` — CPU, RAM, GPU tracking
- `kernel.wasm.run(bytes, args)` — Execute WASM in sandbox
- `kernel.security.audit()` — Security logging

**Build:**
```bash
cd kiacha-kernel
cargo build --release
```

---

### 2. **Kiacha Core Brain** (Node.js + Python)
The central AI orchestrator. Coordinates all modules.

**Key Functions:**
- `kcore.infer(prompt)` — Text generation
- `kcore.reason(task)` — Chain-of-thought reasoning
- `kcore.vision(image)` — Image analysis
- `kcore.audio.transcribe(audio)` — Speech-to-text
- `kcore.audio.speak(text)` — Text-to-speech
- `kcore.memory.store(data)` — Save to semantic memory
- `kcore.memory.search(query)` — Find memories
- `kcore.router(event)` — Smart routing

**Build & Run:**
```bash
cd kiacha-brain
npm install
npm run build
npm start
```

REST API: `http://localhost:3001`
WebSocket: `ws://localhost:3002`

---

### 3. **Frontend UI** (React + WebGPU)
Beautiful, real-time multimodal interface.

**Features:**
- Voice input & output
- Real-time camera feed
- 3D WebGPU visualization
- Module status dashboard
- WASM integration

**Build & Run:**
```bash
cd frontend
npm install
npm run dev
```

**Production build:**
```bash
npm run build
```

---

### 4. **WASM Reasoning Module** (C++)
High-performance sandboxed code execution.

**Build:**
```bash
# Requires Emscripten in WSL/Linux
cd frontend/wasm
bash ../../scripts/build-wasm.sh
```

**Output:**
- `frontend/public/wasm/hello_kiacha.wasm`
- `frontend/public/wasm/hello_kiacha.js`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Rust 1.70+
- Python 3.11+
- Emscripten (for WASM builds)

### 1. Start the Kiacha Kernel
```bash
cd kiacha-kernel
cargo run --release
```

Expected output:
```
🚀 Kiacha OS Kernel starting...
✓ Kiacha OS Kernel running
IPC server listening on [::1]:50051
```

### 2. Start the Core Brain
```bash
cd kiacha-brain
npm install
npm run dev
```

Expected output:
```
🧠 Kiacha Core Brain API listening on port 3001
🌐 WebSocket server listening on port 3002
✓ Kiacha Core Brain is running!
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
➜ Local: http://localhost:5173/
```

### 4. Test the system
Open your browser to `http://localhost:5173` and interact with Kiacha!

---

## 📡 Communication Protocols

### gRPC (Internal Module Communication)
Fast, binary communication between Kernel and modules.
- Port: `50051`
- Used for: permission checks, resource monitoring, WASM execution

### WebSockets (Real-time UI Updates)
Live data streaming to the frontend.
- Port: `3002`
- Used for: chat, audio streams, 3D updates

### REST API (External Access)
Standard HTTP endpoints for integration.
- Port: `3001`
- Endpoints: `/api/infer`, `/api/reason`, `/api/memory/search`, etc.

---

## 🧠 AI Capabilities

### Multimodal Input
- **Text**: Natural language prompts
- **Voice**: ASR via Whisper
- **Vision**: Image/video analysis with OpenCV
- **Code**: Execute WASM safely

### Reasoning
- Chain-of-thought decomposition
- Multi-step planning
- Parallel reasoning branches
- Memory-augmented inference

### Memory
- Semantic embeddings
- Long-term storage
- Retrieval-augmented generation (RAG)
- Experience replay

---

## 🎨 UI/UX Features

### Current
- React 18 with TypeScript
- Three.js 3D rendering
- Zustand state management
- TailwindCSS styling
- Web Workers for async tasks

### Planned (Next)
- WebGPU compute shaders
- Gesture recognition
- Voice command parsing
- Real-time audio visualization
- Module plugin system

---

## 🔐 Security & Permissions

### WASM Sandbox
- Isolated memory
- No direct system access
- Controlled via `kernel.wasm.run()`

### Permission System
- Module-scoped capabilities
- Permission grants/revokes
- Audit logging
- Rate limiting (future)

### Security Audit
All actions logged with timestamps.
```bash
# View security logs
curl http://localhost:50051/audit
```

---

## 📦 Building for Hardware

### Build Linux OS Image
```bash
cd os-image/buildroot
cp ../configs/kiacha_defconfig .config
make -j$(nproc)
```

Output: `buildroot/output/images/sdcard.img`

### Flash to USB/SD
```bash
bash scripts/flash-usb.sh /dev/sdX
```

### Run in QEMU
```bash
bash scripts/run-qemu.sh
```

---

## 🛣️ Roadmap

### ✅ Phase 1 (Current)
- [x] Kiacha Kernel (Rust)
- [x] Core Brain orchestrator
- [x] Frontend UI
- [x] WASM support
- [x] CI/CD (GitHub Actions)

### 🔄 Phase 2 (Next)
- [ ] Advanced reasoning engine
- [ ] Vision models (YOLOv8, Depth estimation)
- [ ] Mobile app (Kotlin Android)
- [ ] Go worker daemon
- [ ] Browser extension

### 🎯 Phase 3 (Future)
- [ ] Edge TPU support
- [ ] iOS/macOS app (Swift)
- [ ] Distributed multi-node setup
- [ ] Hardware accelerators (GPU, NPU)
- [ ] Commercial deployment

---

## 🤝 Contributing

Kiacha OS is open-source and welcomes contributions!

### Areas to Help
- **Kernel**: Memory optimizations, new drivers
- **Brain**: New AI models, multimodal fusion
- **Frontend**: UX improvements, accessibility
- **Hardware**: Embedded device support
- **Docs**: Examples, tutorials

### Development Workflow
```bash
# 1. Make changes
git checkout -b feature/your-feature
# ... edit files ...

# 2. Test locally
npm run dev (or cargo run)

# 3. Commit and push
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature

# 4. Create PR on GitHub
```

---

## 📚 Documentation

- [Kiacha Kernel Guide](kiacha-kernel/README.md)
- [Core Brain API](kiacha-brain/README.md)
- [Frontend Components](frontend/README.md)
- [Hardware Deployment](HARDWARE_DEPLOYMENT.md)
- [Languages & Runtimes](LANGUAGES.md)

---

## 📝 License

MIT License — Free for personal and commercial use.

---

## 🔗 Links

- **GitHub**: https://github.com/alguem2025/KiachaOs
- **Docs**: [Project Wiki](https://github.com/alguem2025/KiachaOs/wiki)
- **Issues**: [Bug Reports](https://github.com/alguem2025/KiachaOs/issues)

---

**Built with ❤️ by the Kiacha OS Community**

The AI OS of the future, running entirely on your machine.

**Let's build the future together! 🚀**
