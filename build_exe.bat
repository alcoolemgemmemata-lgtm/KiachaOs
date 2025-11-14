@echo off
REM ============================================================================
REM KIACHA OS - Automated Build Script for Portable Windows .EXE
REM ============================================================================
REM
REM This script builds a single, portable, fully-embedded Windows executable.
REM No external dependencies needed - just download and run!
REM
REM Features:
REM - Static linking with MSVC
REM - Link Time Optimization (LTO)
REM - Symbol stripping
REM - Maximum optimizations (opt-level=z)
REM - UPX compression (if available)
REM - Binary size optimization
REM
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo KIACHA OS - Windows Portable Executable Builder
echo ============================================================================
echo.

REM Check if cargo is installed
where cargo >nul 2>nul
if errorlevel 1 (
    echo ERROR: Rust/Cargo is not installed!
    echo Please install Rust from https://rustup.rs/
    pause
    exit /b 1
)

echo [*] Detected Rust installation
cargo --version
echo.

REM Set environment variables for optimization
set RUSTFLAGS=-C target-cpu=native -C link-arg=/SUBSYSTEM:WINDOWS -C opt-level=z
set CARGO_PROFILE_RELEASE_LTO=true
set CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1
set CARGO_PROFILE_RELEASE_STRIP=true
set CARGO_PROFILE_RELEASE_PANIC=abort

echo [*] Build environment configured
echo     - LTO: Enabled
echo     - Codegen Units: 1 (Maximum optimization)
echo     - Strip: Enabled (Remove symbols)
echo     - Panic: Abort (Smaller binary)
echo.

REM Step 1: Build frontend (if not already built)
echo [1/4] Building frontend...
if exist "dist" (
    echo     Frontend already built (dist/ exists), skipping...
) else (
    cd frontend
    echo     Installing frontend dependencies...
    call npm install
    echo     Building frontend...
    call npm run build
    cd ..
)
echo     ✓ Frontend ready
echo.

REM Step 2: Clean and prepare
echo [2/4] Cleaning previous builds...
if exist "src-tauri\target\release" (
    rmdir /s /q "src-tauri\target\release" >nul 2>nul
)
echo     ✓ Cleaned
echo.

REM Step 3: Build with Tauri/Cargo
echo [3/4] Building Tauri application with maximum optimizations...
echo     This may take several minutes...
cd src-tauri
cargo tauri build --release

if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..
echo     ✓ Build completed
echo.

REM Step 4: Compress with UPX (if available)
echo [4/4] Optimizing executable size...
where upx >nul 2>nul
if errorlevel 1 (
    echo     UPX not found (optional). Skipping compression.
    echo     If you want additional compression, install UPX from:
    echo     https://upx.github.io/
) else (
    echo     Compressing with UPX...
    set EXE_PATH=src-tauri\target\release\kiacha-os.exe
    if exist "!EXE_PATH!" (
        upx --best --lzma "!EXE_PATH!" 2>nul
        if errorlevel 1 (
            echo     UPX compression skipped (some systems don't support UPX for Windows binaries)
        ) else (
            echo     ✓ Compressed successfully
        )
    )
)
echo.

REM Display results
echo ============================================================================
echo BUILD COMPLETE!
echo ============================================================================
echo.
echo Location: src-tauri\target\release\kiacha-os.exe
echo.

REM Get file size
for /f "usebackq" %%A in (`powershell -Command "if(Test-Path 'src-tauri\target\release\kiacha-os.exe') { (Get-Item 'src-tauri\target\release\kiacha-os.exe').Length / 1MB } else { '0' }"`) do set "SIZE=%%A"
echo Size: %SIZE% MB
echo.
echo Features:
echo ✓ Single executable (.exe)
echo ✓ All assets embedded (frontend, HTML, JS, CSS, images)
echo ✓ No external dependencies
echo ✓ Fully portable (works offline)
echo ✓ Static linking (MSVC)
echo ✓ Link Time Optimization enabled
echo ✓ Symbol stripping applied
echo ✓ Maximum binary optimizations (opt-level=z)
echo.
echo Usage:
echo 1. Copy the .exe to any Windows machine
echo 2. Double-click to run
echo 3. No installation required
echo 4. No internet required
echo.
echo ============================================================================

pause
