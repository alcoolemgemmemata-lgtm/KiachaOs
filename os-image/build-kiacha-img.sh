#!/bin/sh
set -e
# build-kiacha-img.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/kiachaos.img"
SIZE=64M

if command -v truncate >/dev/null 2>&1; then
  truncate -s $SIZE "$OUT"
elif command -v fallocate >/dev/null 2>&1; then
  fallocate -l $SIZE "$OUT"
else
  dd if=/dev/zero of="$OUT" bs=1 count=0 seek=$SIZE
fi

echo "Created sparse image $OUT of size $SIZE"
cat > "$OUT" <<'EOF'
# This is a placeholder sparse disk image for KiachaOS.
# To partition and install:
# 1) Associate loop device: losetup --find --show kiachaos.img
# 2) Partition with sfdisk or parted
# 3) Create filesystems (mkfs.vfat, mkfs.ext4)
# 4) Mount and copy EFI and rootfs files.
EOF
