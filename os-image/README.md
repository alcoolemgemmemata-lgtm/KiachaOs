KiachaOS os-image build

This folder contains helpers to create minimal boot artifacts for KiachaOS.

Files and targets:

- `initramfs-root/` - root tree used to build `initramfs.img`.
  - `sbin/init` - minimal init script (placeholder)
  - `bin/sh` - placeholder shell
  - `bin/busybox` - busybox stub
  - `dev/console`, `dev/null`, `proc/`, `sys/` - placeholders
- `initramfs.img` - generated initramfs (cpio newc + gzip)
- `efiboot/` - EFI files (BOOTX64.EFI, grubx64.efi, limine.efi)
- `efiboot.img` - FAT image with EFI partition (created by `build-efiboot.sh`)
- `kiachaos.img` - sparse disk image (64MB) created by `build-kiacha-img.sh`

Build commands (from `os-image/`):

```sh
make initramfs    # builds initramfs.img
make efiboot      # builds efiboot.img (requires mkfs.vfat and loop mount)
make kiacha       # creates kiachaos.img (64MB sparse)
make iso          # attempts to build kiachaos.iso (requires xorriso or grub-mkrescue)
```

Notes:
- `build-initramfs.sh` prefers system `cpio` if present, otherwise uses the bundled `create_cpio_newc.py` to produce a `initramfs.img` (gzip'd cpio newc).
- `build-efiboot.sh` formats `efiboot.img` as FAT when `mkfs.vfat` is available and mounts it to copy EFI files.
- These scripts are written to be portable but assume a POSIX environment (Linux/WSL/macOS). On Windows native PowerShell, use WSL or adapt commands.

To test in QEMU (example):

```sh
# using kernel and generated initramfs
qemu-system-x86_64 -m 1024 -kernel ../artifacts/kernel/kernel.elf -initrd initramfs.img -nographic
```

To build a bootable disk image with EFI partition, follow the comments in `build-kiacha-img.sh` to partition, create filesystems, and copy EFI and rootfs content.
