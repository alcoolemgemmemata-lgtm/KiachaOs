#!/bin/bash
# scripts/check-structure.sh
# Validates KiachaOS project structure and required files

set -e

echo "=== KiachaOS Structure Validation ==="

checks_passed=0
checks_failed=0

check_dir() {
  local dir=$1
  local name=$2
  if [ -d "$dir" ]; then
    echo "✓ Directory exists: $dir"
    ((checks_passed++))
  else
    echo "✗ Missing directory: $dir ($name)"
    ((checks_failed++))
  fi
}

check_file() {
  local file=$1
  local name=$2
  if [ -f "$file" ]; then
    echo "✓ File exists: $file"
    ((checks_passed++))
  else
    echo "✗ Missing file: $file ($name)"
    ((checks_failed++))
  fi
}

check_executable() {
  local file=$1
  local name=$2
  if [ -x "$file" ]; then
    echo "✓ Executable: $file"
    ((checks_passed++))
  else
    echo "⚠ Not executable (will chmod +x in CI): $file"
    ((checks_passed++))
  fi
}

# Kernel directories
check_dir "kernel_pie_rust" "Rust kernel source"
check_dir "kiacha-kernel" "Kiacha kernel"
check_dir "kiacha-os" "Kiacha OS submodule"

# Build artifacts directories
check_dir "os-image" "OS image directory"
check_dir "os-image/initramfs-root" "Initramfs root tree"
check_dir "os-image/efiboot" "EFI boot files"
check_dir "artifacts" "Build artifacts"
check_dir "artifacts/kernel" "Kernel artifacts"
check_dir "artifacts/ai" "AI module artifacts"

# Build scripts
check_file "os-image/build-initramfs.sh" "Initramfs builder"
check_file "os-image/build-efiboot.sh" "EFI boot builder"
check_file "os-image/build-kiacha-img.sh" "Disk image builder"
check_file "os-image/build-iso.sh" "ISO builder"
check_file "os-image/create_cpio_newc.py" "CPIO newc packer"

# Initramfs contents
check_file "os-image/initramfs-root/sbin/init" "Init script"
check_file "os-image/initramfs-root/bin/sh" "Shell"
check_file "os-image/initramfs-root/bin/busybox" "Busybox"
check_file "os-image/initramfs-root/dev/console" "Console device placeholder"

# Root Makefile
check_file "Makefile" "Root Makefile"

# CI/CD
check_file ".github/workflows/build.yml" "CI/CD workflow"

echo ""
echo "=== Summary ==="
echo "Checks passed: $checks_passed"
echo "Checks failed: $checks_failed"

if [ $checks_failed -gt 0 ]; then
  echo "⚠ Some checks failed. Please review above."
  exit 1
else
  echo "✓ All structure checks passed!"
  exit 0
fi
