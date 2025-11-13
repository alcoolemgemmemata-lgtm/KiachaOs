#!/bin/sh
set -e

DEV=${1}

if [ -z "$DEV" ]; then
  echo "Usage: $0 /dev/sdX"
  exit 1
fi

echo "⚠️  Warning: This will erase all data on $DEV"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelled"
  exit 1
fi

IMG="os-image/buildroot/output/images/sdcard.img"

if [ ! -f "$IMG" ]; then
  echo "❌ Image not found: $IMG"
  exit 1
fi

echo "📝 Flashing $IMG to $DEV..."
sudo dd if=$IMG of=$DEV bs=4M status=progress
sync

echo "✅ Flash completed! Eject and boot your device."
