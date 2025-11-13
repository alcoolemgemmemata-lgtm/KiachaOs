#!/bin/sh
set -e

echo "📦 Kiacha post-build script"

# Copy systemd services
mkdir -p ${TARGET_DIR}/etc/systemd/system
cp -r board/kiacha/overlay/etc/systemd/system/* ${TARGET_DIR}/etc/systemd/system/

# Enable services
for s in ${TARGET_DIR}/etc/systemd/system/kiacha-*.service; do
  service=$(basename $s)
  mkdir -p ${TARGET_DIR}/etc/systemd/system/multi-user.target.wants
  ln -sf ../$service ${TARGET_DIR}/etc/systemd/system/multi-user.target.wants/$service || true
done

echo "✅ Post-build completed"
