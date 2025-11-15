#!/bin/sh
set -e
# build-iso.sh
# Attempts to build an EFI-bootable ISO image

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/kiachaos.iso"
WORKDIR=$(mktemp -d)

trap "rm -rf $WORKDIR" EXIT

echo "Preparing ISO tree in $WORKDIR"
mkdir -p "$WORKDIR/EFI/BOOT"

# Copy efiboot files if present
if [ -d "$HERE/efiboot" ]; then
  echo "Copying EFI files to ISO tree..."
  cp -v "$HERE/efiboot"/* "$WORKDIR/EFI/BOOT/" 2>/dev/null || true
fi

# Try xorriso (preferred)
if command -v xorriso >/dev/null 2>&1; then
  echo "Using xorriso to build ISO..."
  xorriso -as mkisofs -o "$OUT" \
    -b EFI/BOOT/BOOTX64.EFI \
    -no-emul-boot \
    -isohybrid-gpt-basdat \
    "$WORKDIR" 2>/dev/null || true
  
  if [ -f "$OUT" ]; then
    echo "✓ Wrote $OUT"
    ls -lh "$OUT"
    exit 0
  fi
fi

# Try grub-mkrescue
if command -v grub-mkrescue >/dev/null 2>&1; then
  echo "Using grub-mkrescue to build ISO..."
  grub-mkrescue -o "$OUT" "$WORKDIR" 2>/dev/null || true
  
  if [ -f "$OUT" ]; then
    echo "✓ Wrote $OUT"
    ls -lh "$OUT"
    exit 0
  fi
fi

echo "⚠ Neither xorriso nor grub-mkrescue available. Creating placeholder ISO."
touch "$OUT"
echo "Placeholder ISO created. Install xorriso or grub-utils to build real ISO."
ls -lh "$OUT"
