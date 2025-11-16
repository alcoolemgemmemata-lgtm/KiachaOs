# KiachaOS 3D Engine - Build Guide

## Quick Start

### Linux/macOS

```bash
cd kiacha3d
bash setup.sh
```

### Windows

```powershell
cd kiacha3d
python setup.sh  # Requires bash-like environment (Git Bash, WSL, or PowerShell)
```

## Prerequisites

### All Platforms

- **CMake** 3.16 or higher
- **Python** 3.8 or higher
- **Git**
- **C++ Compiler** (GCC 10+, Clang 12+, MSVC 2019+)

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y \
    cmake \
    build-essential \
    python3-dev \
    python3-pip \
    python3-venv \
    vulkan-tools \
    libvulkan-dev \
    libvulkan1 \
    libglm-dev \
    libasound2-dev \
    portaudio19-dev \
    git
```

### macOS (Homebrew)

```bash
brew install cmake python@3.11 vulkan-headers glm
brew install portaudio
```

### Windows

1. Install **Visual Studio 2019+** with C++ support
2. Install **Vulkan SDK**: https://vulkan.lunarg.com/sdk/home
3. Install **Python 3.11+**: https://python.org
4. Install **CMake**: https://cmake.org/download/ or `choco install cmake`
5. Add Vulkan to PATH:
   ```powershell
   $env:VULKAN_SDK = "C:\VulkanSDK\<version>"
   $env:PATH += ";$env:VULKAN_SDK\Bin"
   ```

## Building from Source

### Step 1: Install Python Dependencies

```bash
# Activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\activate   # Windows

# Install packages
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Note**: On Windows, if PyAudio installation fails, use pre-built wheels:
```powershell
pip install PyAudio-0.2.13-cp311-cp311-win_amd64.whl
```

### Step 2: Configure CMake

#### Linux/macOS (Release Build)

```bash
mkdir -p build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
```

#### macOS (with specific Python)

```bash
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DPYTHON_EXECUTABLE=$(which python3) \
  ..
```

#### Windows (Visual Studio 2019)

```powershell
mkdir build
cd build
cmake -G "Visual Studio 16 2019" -A x64 ..
```

#### Windows (MinGW)

```powershell
cmake -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release ..
```

### Step 3: Build

#### Linux/macOS

```bash
make -j$(nproc)
# or for verbose output:
make VERBOSE=1 -j4
```

#### Windows (Visual Studio)

```powershell
cmake --build . --config Release
# or from Visual Studio:
msbuild kiacha3d.sln /p:Configuration=Release
```

#### Windows (MinGW)

```powershell
mingw32-make -j4
```

### Step 4: Install (Optional)

```bash
# Linux/macOS
make install

# Windows (Visual Studio)
cmake --install . --config Release
```

## Development Build (Debug)

For development with debugging symbols:

```bash
mkdir build-debug
cd build-debug
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc)
```

## Running the Application

### Option 1: Complete Stack

```bash
# Terminal 1: Python REST API
source venv/bin/activate
python api/kiacha3d_api.py
# API available at http://localhost:5000

# Terminal 2: Web UI (in another shell)
cd ui
python -m http.server 3000
# Open browser: http://localhost:3000

# Terminal 3: C++ Engine (Optional)
./build/kiacha3d
```

### Option 2: Web-Only (No C++ Engine)

```bash
# Terminal 1
source venv/bin/activate
python api/kiacha3d_api.py

# Terminal 2
cd ui
python -m http.server 3000
# Access at http://localhost:3000
```

### Option 3: C++ Engine Only (No Web UI)

```bash
./build/kiacha3d
```

## Troubleshooting

### Vulkan SDK Not Found

**Error**: `Vulkan not found`

**Solution**:
```bash
# Linux
sudo apt-get install libvulkan-dev vulkan-tools

# macOS
brew install vulkan-headers

# Windows
# Download from https://vulkan.lunarg.com/sdk/home
# Add to PATH
export VULKAN_SDK=/path/to/vulkan
```

### GLM Not Found

**Error**: `glm not found`

**Solution**:
```bash
# Linux
sudo apt-get install libglm-dev

# macOS
brew install glm

# Windows
# Download from https://github.com/g-truc/glm
# Add to PATH or specify in CMake:
cmake -DGLM_INCLUDE_DIR=C:\glm ..
```

### Python Import Errors

**Error**: `ModuleNotFoundError: No module named 'whisper'`

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### PyAudio Installation Fails (Windows)

**Error**: `error: Microsoft Visual C++ 14.0 is required`

**Solution**:
```powershell
# Use pre-built wheel
pip install PyAudio-0.2.13-cp311-cp311-win_amd64.whl

# Or install build tools
pip install windows-curses pyaudio==0.2.11
```

### CMake Configuration Errors

**Error**: `Could not find Vulkan`

```bash
# Set Vulkan SDK explicitly
cmake -DVULKAN_SDK=/opt/VulkanSDK/1.3.280 ..

# Or on Windows
cmake -DVULKAN_SDK="C:\VulkanSDK\1.3.280" ..
```

### Permission Denied (Linux)

**Error**: `permission denied` on `setup.sh`

```bash
chmod +x setup.sh
./setup.sh
```

## Performance Optimization

### Compile Optimizations

```bash
# For maximum performance
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-O3 -march=native" \
  ..
```

### Link-Time Optimization (LTO)

```bash
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=ON \
  ..
```

### Vulkan Validation Layers (Development)

```bash
export VK_LAYER_PATH=/opt/VulkanSDK/1.3.280/etc/vulkan/explicit_layer.d
export VK_INSTANCE_LAYERS=VK_LAYER_KHRONOS_validation
./build/kiacha3d
```

## Testing

### Unit Tests

```bash
# Configure with tests enabled
cmake -DBUILD_TESTING=ON ..
make test
# or
ctest --verbose
```

### Integration Tests

```bash
# Start API server
python api/kiacha3d_api.py &

# Run integration tests
pytest tests/integration/

# or manual testing with curl
curl http://localhost:5000/api/scene
curl -X POST http://localhost:5000/api/object -H "Content-Type: application/json" -d '{"name":"test"}'
```

### Performance Profiling

```bash
# Linux with perf
perf record ./build/kiacha3d
perf report

# macOS with Instruments
xcrun xctrace record --template "System Trace" -- ./build/kiacha3d

# Windows with Visual Studio Profiler
# Open solution and use Debug → Performance Profiler
```

## Code Quality

### Code Formatting

```bash
# C++ (requires clang-format)
clang-format -i engine/*.cpp engine/*.hpp core/*.cpp core/*.hpp

# Python
source venv/bin/activate
black api/ input/
```

### Linting

```bash
# Python
flake8 api/ input/ --max-line-length=100

# C++ (requires clang-tidy)
clang-tidy -checks=* engine/renderer.cpp -- -I. -I/usr/include/vulkan
```

### Static Analysis

```bash
# CMake with clang-tidy
cmake -DCMAKE_CXX_CLANG_TIDY="clang-tidy" ..

# Or manual
cppcheck --enable=all engine/ core/
```

## Cross-Compilation

### Linux → Windows (MinGW)

```bash
mkdir build-mingw
cd build-mingw
cmake \
  -DCMAKE_SYSTEM_NAME=Windows \
  -DCMAKE_C_COMPILER=i686-w64-mingw32-gcc \
  -DCMAKE_CXX_COMPILER=i686-w64-mingw32-g++ \
  ..
make -j$(nproc)
```

### macOS → Linux (Docker)

```bash
docker run -it -v $(pwd):/workspace ubuntu:22.04
apt-get update && apt-get install -y build-essential cmake vulkan-headers libglm-dev
cd /workspace && mkdir build-linux && cd build-linux
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

## Docker Build

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    cmake build-essential python3-dev python3-pip \
    vulkan-tools libvulkan-dev libglm-dev

WORKDIR /app
COPY . .

RUN bash setup.sh && \
    cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build

EXPOSE 5000 3000
CMD ["bash", "-c", "python api/kiacha3d_api.py & python -m http.server 3000"]
```

Build and run:
```bash
docker build -t kiacha3d .
docker run -p 5000:5000 -p 3000:3000 kiacha3d
```

## Continuous Integration

### GitHub Actions

See `.github/workflows/build.yml` for automated builds on:
- Ubuntu (GCC, Clang)
- macOS (Clang)
- Windows (MSVC)

### Local CI Simulation

```bash
# Test all configurations locally
for config in Release Debug; do
  for compiler in gcc clang; do
    mkdir build-$config-$compiler
    cd build-$config-$compiler
    cmake -DCMAKE_BUILD_TYPE=$config -DCMAKE_CXX_COMPILER=$compiler ..
    make test
    cd ..
  done
done
```

## Installation Paths

### Linux
```
/usr/local/bin/kiacha3d
/usr/local/share/kiacha3d/ui/
/usr/local/share/doc/kiacha3d/
```

### macOS
```
/usr/local/bin/kiacha3d
/usr/local/share/kiacha3d/ui/
/usr/local/share/doc/kiacha3d/
```

### Windows
```
%PROGRAMFILES%\KiachaOS\kiacha3d.exe
%PROGRAMFILES%\KiachaOS\ui\
%PROGRAMFILES%\KiachaOS\doc\
```

## Clean Build

```bash
# Remove build directory
rm -rf build

# Or clean specific target
cmake --build build --target clean
```

## Next Steps

- See [TESTING.md](TESTING.md) for testing procedures
- See [API_REFERENCE.md](API_REFERENCE.md) for API documentation
- See [ARCHITECTURE.md](ARCHITECTURE.md) for design details
