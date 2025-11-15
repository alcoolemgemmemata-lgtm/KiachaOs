#!/bin/sh
set -e
# build-efiboot.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
EFIDIR="$HERE/efiboot"
OUT="$HERE/efiboot.img"
SIZE=20M

if [ ! -d "$EFIDIR" ]; then
  echo "efiboot dir not found: $EFIDIR"
  exit 1
fi

# Create empty sparse file
if command -v truncate >/dev/null 2>&1; then
  truncate -s $SIZE "$OUT"
elif command -v fallocate >/dev/null 2>&1; then
  fallocate -l $SIZE "$OUT"
else
  dd if=/dev/zero of="$OUT" bs=1 count=0 seek=$SIZE
fi

# Try mkfs.vfat
if command -v mkfs.vfat >/dev/null 2>&1; then
  mkfs.vfat -n EFI "$OUT"
  # mount loop and copy
  mntdir=$(mktemp -d)
  if mount -o loop "$OUT" "$mntdir"; then
    mkdir -p "$mntdir"/EFI/BOOT
    cp -r "$EFIDIR"/* "$mntdir"/EFI/BOOT/
    sync
    umount "$mntdir"
    rmdir "$mntdir"
    echo "Wrote $OUT with EFI files"
    exit 0
  else
    echo "Failed to mount loop image; efiboot.img created but not populated"
    exit 1
  fi
else
  echo "mkfs.vfat not available; created sparse $OUT. Please format and copy EFI files manually."
  exit 0
fi
