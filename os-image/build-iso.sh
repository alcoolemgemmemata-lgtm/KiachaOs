#!/bin/sh
set -e
# build-iso.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/kiachaos.iso"
WORKDIR=$(mktemp -d)

echo "Preparing ISO tree in $WORKDIR (placeholder)"
mkdir -p "$WORKDIR/EFI/BOOT"
# copy efiboot files if present
if [ -d "$HERE/efiboot" ]; then
  cp -r "$HERE/efiboot"/* "$WORKDIR/EFI/BOOT/" || true
fi

# Try to use xorriso or grub-mkrescue
if command -v xorriso >/dev/null 2>&1; then
  xorriso -as mkisofs -o "$OUT" -b EFI/BOOT/BOOTX64.EFI -no-emul-boot -isohybrid-gpt-basdat "$WORKDIR"
  echo "Wrote $OUT"
elif command -v grub-mkrescue >/dev/null 2>&1; then
  grub-mkrescue -o "$OUT" "$WORKDIR" || true
  echo "Wrote $OUT"
else
  echo "xorriso/grub-mkrescue not available. Created placeholder $OUT"
  touch "$OUT"
fi

rm -rf "$WORKDIR"
