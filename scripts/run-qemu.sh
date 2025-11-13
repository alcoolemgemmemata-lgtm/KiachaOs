#!/bin/sh

qemu-system-x86_64 \
  -m 2G \
  -drive file=os-image/buildroot/output/images/sdcard.img,format=raw \
  -netdev user,id=net0,hostfwd=tcp::3001-:3001,hostfwd=tcp::3000-:3000 \
  -device e1000,netdev=net0 \
  -enable-kvm \
  -display gtk \
  -serial mon:stdio
