#!/bin/sh
set -e
# build-initramfs.sh
# Creates os-image/initramfs.img from os-image/initramfs-root
# Tries: system cpio -> Python packer -> tar.gz fallback

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOTDIR="$HERE/initramfs-root"
OUT="$HERE/initramfs.img"

if [ ! -d "$ROOTDIR" ]; then
  echo "ERROR: initramfs root not found: $ROOTDIR"
  exit 1
fi

# Method 1: System cpio (preferred)
if command -v cpio >/dev/null 2>&1 && command -v gzip >/dev/null 2>&1; then
  echo "Using system cpio to build initramfs"
  (cd "$ROOTDIR" && find . -print0 | cpio --null -o -H newc 2>/dev/null) | gzip -9 > "$OUT"
  echo "✓ Wrote $OUT"
  ls -lh "$OUT"
  exit 0
fi

# Method 2: Python bundled packer
if command -v python3 >/dev/null 2>&1; then
  echo "Using bundled Python cpio newc packer"
  python3 "$HERE/create_cpio_newc.py" "$ROOTDIR" "$OUT"
  ls -lh "$OUT"
  exit 0
fi

# Method 3: tar.gz fallback (not ideal for initramfs)
if command -v tar >/dev/null 2>&1 && command -v gzip >/dev/null 2>&1; then
  echo "WARNING: Using tar.gz fallback (cpio not available)"
  (cd "$ROOTDIR" && tar czf "$OUT" .)
  echo "✓ Wrote tar.gz fallback as $OUT"
  ls -lh "$OUT"
  exit 0
fi

echo "ERROR: No compression tools available (need cpio, python3, or tar)"
exit 1
