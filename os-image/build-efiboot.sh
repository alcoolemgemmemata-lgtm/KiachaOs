#!/bin/sh
set -e
# build-efiboot.sh
# Creates efiboot.img (FAT formatted) with EFI files

HERE="$(cd "$(dirname "$0")" && pwd)"
EFIDIR="$HERE/efiboot"
OUT="$HERE/efiboot.img"
SIZE=20M

if [ ! -d "$EFIDIR" ]; then
  echo "ERROR: efiboot dir not found: $EFIDIR"
  exit 1
fi

# Remove existing
rm -f "$OUT"

# Create sparse file
echo "Creating sparse file of size $SIZE"
if command -v truncate >/dev/null 2>&1; then
  truncate -s $SIZE "$OUT"
elif command -v fallocate >/dev/null 2>&1; then
  fallocate -l $SIZE "$OUT"
else
  dd if=/dev/zero of="$OUT" bs=1M count=0 seek=$((20))
fi

echo "✓ Created sparse file: $OUT"

# Try mkfs.vfat if available
if command -v mkfs.vfat >/dev/null 2>&1; then
  echo "Formatting as FAT..."
  mkfs.vfat -n EFI "$OUT"
  
  # Try to mount and copy files
  MNTDIR=$(mktemp -d)
  echo "Mount directory: $MNTDIR"
  
  if mount -o loop "$OUT" "$MNTDIR" 2>/dev/null; then
    echo "Mounted successfully. Copying EFI files..."
    mkdir -p "$MNTDIR/EFI/BOOT"
    cp -v "$EFIDIR"/* "$MNTDIR/EFI/BOOT/" 2>/dev/null || true
    sync
    umount "$MNTDIR" || true
    rmdir "$MNTDIR" || true
    echo "✓ Successfully populated $OUT with EFI files"
  else
    echo "⚠ Could not mount loop device (may need sudo). Image created but not populated."
    echo "  To populate manually:"
    echo "    sudo losetup --find --show $OUT"
    echo "    sudo mount /dev/loopX $MNTDIR"
    echo "    sudo mkdir -p $MNTDIR/EFI/BOOT"
    echo "    sudo cp efiboot/* $MNTDIR/EFI/BOOT/"
    echo "    sudo umount $MNTDIR"
    rmdir "$MNTDIR" || true
  fi
else
  echo "⚠ mkfs.vfat not available. Created sparse file but cannot format."
  echo "  On Debian/Ubuntu: sudo apt-get install dosfstools"
fi

ls -lh "$OUT"
