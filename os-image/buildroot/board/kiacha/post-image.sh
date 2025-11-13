#!/bin/sh
set -e

echo "🖼️  Kiacha post-image script"

# Copy GRUB configuration
mkdir -p ${BINARIES_DIR}/efi-part/EFI/BOOT
cp board/kiacha/grub.cfg ${BINARIES_DIR}/efi-part/EFI/BOOT/grub.cfg

# Copy splash image
cp board/kiacha/splash.ppm ${BINARIES_DIR}/splash.ppm || true

echo "✅ Post-image completed"
