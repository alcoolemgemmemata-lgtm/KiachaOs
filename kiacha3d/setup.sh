#!/bin/bash
# KiachaOS 3D Engine - Build and Setup Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  KiachaOS 3D Engine - Setup & Build    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo -e "${GREEN}✓ Detected: Linux${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo -e "${GREEN}✓ Detected: macOS${NC}"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    echo -e "${GREEN}✓ Detected: Windows${NC}"
else
    echo -e "${RED}✗ Unsupported OS${NC}"
    exit 1
fi

# Check for required tools
echo -e "\n${BLUE}Checking dependencies...${NC}"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 not found${NC}"
        return 1
    fi
}

MISSING=0
check_command "cmake" || MISSING=1
check_command "python3" || MISSING=1
check_command "pip3" || MISSING=1
check_command "git" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo -e "\n${YELLOW}Installing missing dependencies...${NC}"
    
    if [ "$OS" = "linux" ]; then
        sudo apt-get update
        sudo apt-get install -y cmake python3-pip python3-dev
        sudo apt-get install -y libvulkan-dev vulkan-tools
        sudo apt-get install -y libglm-dev
        
        # Python audio dependencies
        sudo apt-get install -y libasound2-dev portaudio19-dev python3-pyaudio
    elif [ "$OS" = "macos" ]; then
        # Assume homebrew is installed
        brew install cmake python@3.11 vulkan-loader
        brew install glm
    fi
fi

echo -e "\n${BLUE}Setting up Python environment...${NC}"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install Python dependencies
echo -e "${BLUE}Installing Python packages...${NC}"
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Create build directory
echo -e "\n${BLUE}Creating build directory...${NC}"
mkdir -p build
cd build

# CMake configuration
echo -e "${BLUE}Configuring CMake...${NC}"
if [ "$OS" = "windows" ]; then
    cmake -G "Visual Studio 16 2019" -A x64 ..
else
    cmake -DCMAKE_BUILD_TYPE=Release ..
fi

# Build
echo -e "${BLUE}Building C++ engine...${NC}"
if [ "$OS" = "windows" ]; then
    cmake --build . --config Release
else
    make -j$(nproc)
fi

cd ..

echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Build Completed Successfully    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}To run the application:${NC}"
echo "1. Activate Python environment: source venv/bin/activate (or .\\venv\\Scripts\\activate on Windows)"
echo "2. Start REST API: python3 api/kiacha3d_api.py"
echo "3. Open browser: http://localhost:3000"
echo "4. Run C++ engine: ./build/kiacha3d"

echo -e "\n${YELLOW}For development:${NC}"
echo "- Code formatting: black api/ input/"
echo "- Linting: flake8 api/ input/"
echo "- Type checking: mypy api/ input/"
echo "- Tests: pytest tests/"
