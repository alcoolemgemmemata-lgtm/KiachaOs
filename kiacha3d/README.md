# KiachaOS 3D Engine v2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)

A professional-grade 3D visualization engine with integrated voice, gesture, and touch control, AI autonomy, and advanced rendering capabilities.

## ✨ Features

### 🎮 Multi-Modal Input
- **Voice Control**: OpenAI Whisper + Vosk for natural language commands
- **Gesture Recognition**: MediaPipe-powered hand gesture detection (9 gestures)
- **Touch Input**: Multi-touch support with pinch, rotate, swipe, and long-press
- **Real-time Feedback**: Live gesture and voice indicators

### 🎨 Advanced Rendering
- **Vulkan 1.2 Backend**: Modern, high-performance GPU rendering
- **Deferred Rendering**: Efficient lighting with multiple light sources
- **Shadow Mapping**: Realistic shadow support with quality levels
- **Post-Processing**: Bloom, tone mapping, and custom effects
- **Material System**: PBR-ready material properties (roughness, metallic)

### 🤖 AI Autonomy
- **Intelligent Suggestions**: AI analyzes scene and recommends improvements
- **Natural Language Commands**: "Make it look dramatic" → automatic adjustments
- **LLM Integration**: Optional ChatGPT or local LLM support
- **Scene Learning**: Adapts to user preferences over time

### 🌐 Modern Web UI
- **Three.js Integration**: Beautiful real-time visualization
- **Responsive Design**: Works on desktop and tablet
- **Real-time Metrics**: FPS, memory, triangle count monitoring
- **Touch-optimized Controls**: Native support for touch devices

### 📡 REST API
- **25+ Endpoints**: Complete scene control
- **JSON Responses**: Machine-readable data format
- **Error Handling**: Comprehensive error codes
- **CORS Support**: Cross-origin requests enabled

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- CMake 3.16+
- Vulkan SDK
- C++ Compiler (GCC 10+, Clang 12+, or MSVC 2019+)

### Installation (Linux/macOS)

```bash
cd kiacha3d
bash setup.sh
```

### Installation (Windows)

```powershell
cd kiacha3d
# Use WSL, Git Bash, or PowerShell with bash compatibility layer
bash setup.sh
```

### Running

```bash
# Terminal 1: API Server
source venv/bin/activate
python api/kiacha3d_api.py
# Available at http://localhost:5000

# Terminal 2: Web UI
cd ui
python -m http.server 3000
# Open http://localhost:3000 in browser
```

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and component overview
- **[BUILD.md](BUILD.md)** - Detailed build instructions for all platforms
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete REST API documentation
- **[TESTING.md](TESTING.md)** - Testing procedures and quality assurance

## 🏗️ Project Structure

```
kiacha3d/
├── engine/                 # Vulkan rendering core
│   ├── renderer.hpp       # Main renderer interface
│   ├── renderer.cpp       # Renderer implementation
│   ├── vulkan_backend.hpp # Vulkan abstraction layer
│   └── vulkan_backend.cpp # Vulkan implementation
├── core/                   # Scene graph and model loading
│   ├── scene_manager.hpp  # Scene object management
│   ├── scene_manager.cpp  # Scene implementation
│   ├── object_loader.hpp  # Model format handlers
│   └── object_loader.cpp  # OBJ parser, GLTF support
├── input/                  # Multi-modal input recognition
│   ├── voice.py           # Whisper + Vosk voice recognition
│   ├── gesture.py         # MediaPipe hand gesture detection
│   └── touch_handler.ts   # TypeScript touch event handling
├── api/                    # REST API and commands
│   ├── kiacha3d_api.py    # Flask REST server
│   └── kiacha3d_commands.json  # Command schema and patterns
├── ui/                     # Web-based interface
│   ├── index.html         # Main UI layout
│   ├── panel.js           # Control logic and scene sync
│   └── three_ui.ts        # Three.js visualization
├── CMakeLists.txt         # C++ build configuration
├── requirements.txt       # Python dependencies
├── setup.sh               # Automated setup script
└── README.md              # This file
```

## 💻 System Architecture

```
┌─────────────────────────────────────┐
│         Web UI (Three.js)            │
│    http://localhost:3000             │
└────────────────┬────────────────────┘
                 │
        REST API (Flask)
        http://localhost:5000
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
   C++         Input         AI
  Vulkan    Recognition   Autonomy
  Renderer   (Voice/       (LLM
           Gesture/      Suggestions)
           Touch)
```

## 🎯 Use Cases

### 3D Content Visualization
- Interactive model viewer with voice control
- Real-time lighting and material adjustments
- Professional presentation mode

### Game Development
- Prototype game scenes
- Real-time editing with voice commands
- Performance monitoring and profiling

### Architecture & Design
- Architectural visualization with gesture navigation
- Lighting design with AI suggestions
- Walk-through pre-visualization

### Educational
- Interactive 3D demonstrations
- Voice-guided tours of complex models
- Real-time parameter adjustment

## 🔧 Build System

### Quick Build (Automatic)
```bash
bash setup.sh
```

### Manual Build
```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

### Debug Build
```bash
mkdir build-debug && cd build-debug
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc)
```

### Cross-Compilation
```bash
cmake -DCMAKE_SYSTEM_NAME=Windows -DCMAKE_C_COMPILER=i686-w64-mingw32-gcc ..
```

## 📊 Performance

| Metric | Target | Typical |
|--------|--------|---------|
| **FPS (1080p)** | 60 | 85-120 |
| **Memory Usage** | <500MB | ~250MB |
| **Model Load Time** | <1s | 0.5-0.8s |
| **Voice Latency** | <500ms | 200-300ms |
| **Touch Latency** | <50ms | 16-33ms |
| **Gesture Recognition** | 30 FPS | 30 FPS |

## 🎤 Voice Commands

```
"rotate 45 degrees"           → Rotate camera 45° around Y-axis
"zoom in"                     → Increase zoom by 20%
"zoom out"                    → Decrease zoom by 20%
"pan left"                    → Pan camera left
"add light at 10, 20, 10"     → Create light at coordinates
"make it dramatic"            → AI adjusts lighting and camera
"focus on details"            → Zoom in and adjust lighting
```

## 🖐️ Gestures

| Gesture | Action |
|---------|--------|
| **PINCH** | Zoom out |
| **GRAB** | Zoom in |
| **POINT** | Rotate around X-axis |
| **PEACE** | Rotate around Y-axis |
| **THUMBS_UP** | Scale up |
| **OK** | Scale down |
| **OPEN_PALM** | Reset view |
| **CALL_ME** | Toggle wireframe |

## 📱 Touch Controls

- **Tap**: Select object
- **Long Press**: Context menu
- **Swipe**: Pan camera
- **Pinch**: Zoom
- **Rotate**: Rotate view

## 🤖 AI Autonomy Features

### Scene Analysis
- Detects objects and their relationships
- Calculates optimal camera angles
- Suggests lighting improvements

### Natural Language Understanding
- Parses complex commands
- Learns user preferences
- Provides contextual suggestions

### Automatic Adjustments
- Camera positioning
- Lighting optimization
- Material adjustments
- Animation control

## 📦 Dependencies

### C++
- **Vulkan SDK** 1.2+
- **GLM** (GLM - OpenGL Mathematics)
- **CMake** 3.16+

### Python
- **Flask** 2.3+ - Web framework
- **Whisper** - Speech recognition
- **Vosk** - Lightweight speech recognition
- **OpenCV** - Computer vision
- **MediaPipe** - Hand pose estimation
- **PyAudio** - Audio input

### Web
- **Three.js** r128+ - 3D rendering
- **TypeScript** 5.0+ - Type-safe JavaScript
- **HTML5/CSS3** - Responsive UI

## ⚙️ Configuration

### Environment Variables

```bash
# Vulkan
export VULKAN_SDK=/path/to/vulkan/sdk

# Python
export PYTHONUNBUFFERED=1  # Real-time logging
export FLASK_ENV=production

# Voice Recognition
export WHISPER_MODEL=base  # tiny, base, small, medium, large
export VOSK_MODEL=/path/to/vosk/model
```

### API Settings (api/config.json)

```json
{
  "port": 5000,
  "host": "0.0.0.0",
  "cors_origins": ["http://localhost:3000"],
  "voice_enabled": true,
  "gesture_enabled": true,
  "ai_enabled": true,
  "max_objects": 1000,
  "shadow_quality": "high"
}
```

## 🧪 Testing

### Unit Tests
```bash
cd build
ctest --verbose
```

### Integration Tests
```bash
pytest tests/integration/
```

### Performance Benchmarks
```bash
./build/kiacha3d --benchmark
```

## 🔒 Security

- **Input Validation**: All API inputs validated
- **Command Injection Prevention**: Sanitized voice commands
- **Memory Safety**: Buffer overflow protection
- **API Security**: CORS origin validation
- **Rate Limiting**: Planned for production

## 🐛 Troubleshooting

### Vulkan not found
```bash
# Install Vulkan SDK
# Linux: sudo apt-get install vulkan-tools libvulkan-dev
# macOS: brew install vulkan-loader
# Windows: Download from https://vulkan.lunarg.com
```

### PyAudio errors
```bash
# Install audio development files
# Linux: sudo apt-get install libasound2-dev portaudio19-dev
# macOS: brew install portaudio
```

### GPU not detected
```bash
# Check Vulkan validation
export VK_INSTANCE_LAYERS=VK_LAYER_KHRONOS_validation
./build/kiacha3d
```

See [BUILD.md](BUILD.md) for detailed troubleshooting.

## 📈 Performance Optimization

### Build Optimizations
```bash
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-O3 -march=native" \
  -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=ON \
  ..
```

### Runtime Optimization
- Use shadow quality "low" for performance testing
- Disable post-processing effects if needed
- Monitor GPU utilization

## 🔄 Development Workflow

### Local Development
```bash
# Activate environment
source venv/bin/activate

# Code formatting
black api/ input/

# Linting
flake8 api/ input/

# Type checking
mypy api/ input/

# Run tests
pytest tests/

# Start development servers
python api/kiacha3d_api.py &
cd ui && python -m http.server 3000
```

### Code Style

- **C++**: Google C++ Style Guide
- **Python**: PEP 8 (enforced with Black)
- **TypeScript**: Google TypeScript Style Guide

## 🚢 Deployment

### Docker

```bash
docker build -t kiacha3d .
docker run -p 5000:5000 -p 3000:3000 kiacha3d
```

### Production Checklist
- [ ] Enable API authentication
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure reverse proxy (nginx)
- [ ] Enable logging and profiling

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Follow code style guidelines
2. Add tests for new features
3. Update documentation
4. Submit pull requests

## 📞 Support

- **Documentation**: See [docs/](docs/) folder
- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions

## 🙏 Acknowledgments

- **Vulkan** - For high-performance graphics
- **Three.js** - For web-based 3D rendering
- **MediaPipe** - For hand pose estimation
- **OpenAI** - For Whisper speech recognition
- **Vosk** - For lightweight speech recognition

## 🗓️ Roadmap

### v2.1 (Q2 2024)
- [ ] GLTF 2.0 full support with animations
- [ ] glTF draco compression
- [ ] WebGL 2.0 fallback renderer
- [ ] Multi-user collaboration

### v2.2 (Q3 2024)
- [ ] Real-time ray tracing (RTX)
- [ ] Procedural texture generation
- [ ] Physics-based simulation
- [ ] Mobile app (iOS/Android)

### v3.0 (Q4 2024)
- [ ] Full game engine integration
- [ ] VR/AR support
- [ ] Distributed rendering
- [ ] Advanced AI visual understanding

## 📊 Project Status

- ✅ **Core Engine**: Complete (v2.0)
- ✅ **Input System**: Complete (voice, gesture, touch)
- ✅ **REST API**: Complete (25+ endpoints)
- ✅ **Web UI**: Complete
- 🔄 **Documentation**: In progress
- 🔄 **Testing Suite**: In progress
- 📅 **Production Ready**: Q2 2024

## 📄 Version History

### v2.0.0 (Current)
- Vulkan rendering backend
- Complete input system (voice, gesture, touch)
- REST API with 25+ endpoints
- AI autonomy module
- Web-based UI
- Professional documentation

### v1.0.0
- Basic renderer
- Scene management
- OBJ model loading

---

**Made with ❤️ for KiachaOS**

**Last Updated**: January 2024 | **Maintainer**: KiachaOS Team
