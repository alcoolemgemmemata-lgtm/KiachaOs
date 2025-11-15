#!/bin/sh
set -e
# build-initramfs.sh
# Creates os-image/initramfs.img from os-image/initramfs-root
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOTDIR="$HERE/initramfs-root"
OUT="$HERE/initramfs.img"

if [ ! -d "$ROOTDIR" ]; then
  echo "initramfs root not found: $ROOTDIR"
  exit 1
fi

# Prefer system cpio if available
if command -v cpio >/dev/null 2>&1; then
  echo "Using system cpio to build initramfs"
  (cd "$ROOTDIR" && find . | cpio -o -H newc) | gzip -9 > "$OUT"
  echo "Wrote $OUT"
  exit 0
fi

# Fallback to bundled Python packer
if command -v python3 >/dev/null 2>&1; then
  echo "Using bundled create_cpio_newc.py"
  python3 "$HERE/create_cpio_newc.py" "$ROOTDIR" "$OUT"
  exit 0
fi

# Fallback to tar.gz (not ideal for initramfs, but provided)
echo "cpio not available and python3 not found; creating tar.gz fallback"
( cd "$ROOTDIR" && tar czf "$OUT" . )
echo "Wrote tar.gz fallback as $OUT"
