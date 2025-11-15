#!/bin/sh
set -e
# build-kiacha-img.sh
# Creates a sparse 64MB disk image for KiachaOS

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/kiachaos.img"
SIZE=64M

# Remove existing if present
rm -f "$OUT"

# Create sparse file using truncate (preferred) or fallocate
if command -v truncate >/dev/null 2>&1; then
  truncate -s $SIZE "$OUT"
elif command -v fallocate >/dev/null 2>&1; then
  fallocate -l $SIZE "$OUT"
else
  # Fallback: dd with seek (slower)
  dd if=/dev/zero of="$OUT" bs=1M count=0 seek=$((64))
fi

echo "Created sparse image $OUT of size $SIZE"
echo "To partition and install:"
echo "  1) losetup --find --show $OUT"
echo "  2) Partition with sfdisk/parted"
echo "  3) mkfs.vfat /dev/loopXpY (for EFI)"
echo "  4) mkfs.ext4 /dev/loopXpZ (for rootfs)"
echo "  5) Mount and copy files"
