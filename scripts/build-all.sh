#!/bin/sh
set -e

echo "========================================="
echo "  Kiacha OS - Build All Script"
echo "========================================="

# Build Frontend
echo ""
echo "🎨 Building Frontend..."
cd frontend
npm install
npm run build
cd ..
echo "✅ Frontend built"

# Build Backend
echo ""
echo "🔧 Building Backend..."
cd backend
npm install
npm run build
cd ..
echo "✅ Backend built"

# Build Firmware
echo ""
echo "⚙️  Building Firmware..."
cd firmware
mkdir -p build
cd build
cmake ..
make -j$(nproc)
cd ../..
echo "✅ Firmware built"

# Build OS
echo ""
echo "🐧 Building OS Image..."
cd os-image/buildroot
make kiacha_defconfig
make -j$(nproc)
cd ../..
echo "✅ OS Image built"

echo ""
echo "========================================="
echo "✨ Kiacha OS build completed successfully!"
echo "========================================="
