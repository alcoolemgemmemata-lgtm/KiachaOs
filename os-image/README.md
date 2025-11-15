KiachaOS os-image Build System

This directory contains the build automation for KiachaOS boot and system images.

## Directory Structure

- `initramfs-root/` - root filesystem tree for the initial ramdisk
  - `sbin/init` - init script
  - `bin/sh` - shell
  - `bin/busybox` - busybox stub
  - `dev/` - device placeholders
  - `proc/` - procfs mountpoint
  - `sys/` - sysfs mountpoint

- `efiboot/` - EFI boot files (UEFI loaders)
  - `BOOTX64.EFI` - main EFI loader
  - `grubx64.efi` - GRUB EFI binary (optional)
  - `limine.efi` - Limine EFI loader (optional)

## Generated Artifacts

- `initramfs.img` - compressed initial ramdisk (cpio newc + gzip)
- `efiboot.img` - FAT-formatted EFI system partition image (20 MB)
- `kiachaos.img` - sparse disk image placeholder (64 MB)
- `kiachaos.iso` - bootable ISO image (hybrid UEFI/BIOS)

## Build Scripts

- `build-initramfs.sh` - packs initramfs-root/ into initramfs.img
  - Uses system `cpio` if available
  - Falls back to bundled `create_cpio_newc.py`
  - Final fallback to tar.gz

- `build-efiboot.sh` - creates FAT-formatted efiboot.img
  - Requires: mkfs.vfat, mount
  - Formats the image and copies EFI files

- `build-kiacha-img.sh` - creates 64 MB sparse disk image
  - Uses truncate/fallocate for sparse file creation
  - Provides instructions for partitioning

- `build-iso.sh` - builds EFI-bootable ISO
  - Uses xorriso (preferred) or grub-mkrescue
  - Creates ISO with EFI/BOOT directory structure

- `create_cpio_newc.py` - Python CPIO newc packer (standalone)
  - Used as fallback when system cpio unavailable
  - Handles file modes, ownership, and timestamps

## Makefile Targets

```sh
make initramfs    # Build initramfs.img
make efiboot      # Build efiboot.img
make kiacha       # Build kiachaos.img
make iso          # Build kiachaos.iso
make all          # Build all artifacts
make clean        # Remove generated images
```

## Usage

### Local Build (requires Linux/WSL)

```sh
cd os-image
make all
# or individual targets:
make initramfs
make efiboot
make kiacha
make iso
```

### GitHub Actions Build (automatic)

The `.github/workflows/build.yml` workflow:
- Installs all dependencies: cpio, dosfstools, xorriso, etc.
- Runs all build scripts
- Uploads artifacts to Actions tab
- Publishes to GitHub Releases on tagged commits

### Testing in QEMU

```sh
# Boot with initramfs (no disk):
qemu-system-x86_64 -m 1024 \
  -kernel ../artifacts/kernel/kernel.elf \
  -initrd initramfs.img \
  -nographic

# Boot from disk image:
qemu-system-x86_64 -m 1024 \
  -drive file=kiachaos.img,format=raw \
  -nographic

# Boot from ISO:
qemu-system-x86_64 -m 1024 \
  -cdrom kiachaos.iso \
  -nographic
```

## Customization

To modify initramfs contents:
1. Edit files in `initramfs-root/`
2. Run `make initramfs` to rebuild

To add EFI binaries:
1. Place `.efi` files in `efiboot/`
2. Run `make efiboot` to rebuild

To adjust image sizes:
- Edit SIZE variables in build scripts
- Rebuild with `make clean && make all`

## Dependencies

- `cpio` - file archiver
- `gzip` - compression
- `mkfs.vfat` - FAT filesystem formatter (dosfstools)
- `xorriso` - ISO 9660 generator (for ISO builds)
- `python3` - fallback CPIO packer (create_cpio_newc.py)

On Debian/Ubuntu:
```sh
sudo apt-get install cpio dosfstools xorriso gzip
```

On Alpine/minimal:
```sh
apk add cpio dosfstools xorriso
```

## Troubleshooting

**Issue**: `cpio: command not found`
- **Solution**: Install cpio or use bundled Python packer

**Issue**: `mkfs.vfat not found`
- **Solution**: Install dosfstools; efiboot.img will be created but not formatted

**Issue**: `Cannot mount loop device` (efiboot build)
- **Solution**: This is expected in some CI environments; the image is created but not populated

**Issue**: `xorriso not found`
- **Solution**: Install xorriso; placeholder ISO will be created

## Notes

- All scripts are POSIX-compatible and tested on Ubuntu 20.04+
- Windows users should use WSL2 with Ubuntu 20.04 or later
- macOS users may need to install GNU tools via Homebrew
- The bundled Python packer works as a universal fallback when `cpio` is unavailable
