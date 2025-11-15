# 📥 Kiacha OS — Installation & Download Guide

**Last Updated**: Phase 5 Complete  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start (Pre-built ISO)

### Option 1: Download from GitHub Releases

```bash
# Download latest release ISO
curl -L -O "https://github.com/alcoolemgemmemata-lgtm/KiachaOs/releases/download/v1.0/kiacha.iso"

# Download signature file (recommended for verification)
curl -L -O "https://github.com/alcoolemgemmemata-lgtm/KiachaOs/releases/download/v1.0/kiacha.iso.sig"

# Download public key for verification
curl -L -O "https://raw.githubusercontent.com/alcoolemgemmemata-lgtm/KiachaOs/main/signing_pub.pem"
```

### Option 2: Clone Repository & Build

```bash
# Clone the repository
git clone https://github.com/alcoolemgemmemata-lgtm/KiachaOs.git
cd KiachaOs

# Build ISO from source
bash scripts/build_and_run.sh --build-only

# Result: build/kiacha-os.iso or iso/kiacha.iso (see docs/BUILD.md for exact path)
```

---

## ✅ Verify Signature (Security Check)

### Why Verify?
Signature verification ensures the ISO hasn't been tampered with and comes from the official repository.

### Verification Steps

```bash
# Verify RSA-2048-SHA256 signature
openssl dgst -sha256 -verify signing_pub.pem -signature kiacha.iso.sig kiacha.iso

# Expected output: Verified OK
# Error output: Verification Failure (do NOT use this ISO)
```

### Manual Verification (no OpenSSL)
If you don't have OpenSSL, you can:
1. Compare ISO hash with official hash from release page
2. Boot in QEMU first to verify functionality
3. Visually inspect boot log for security markers

---

## 💻 Boot Methods

### Method 1: QEMU Emulator (Recommended for Testing)

```bash
# Linux/WSL/Mac with QEMU installed
qemu-system-x86_64 -m 2048 -cdrom kiacha.iso -boot d

# With KVM acceleration (faster, Linux only)
qemu-system-x86_64 -m 2048 -cdrom kiacha.iso -boot d -enable-kvm
```

### Method 2: VirtualBox VM

1. Create new VM:
   - Type: Linux
   - Version: Other Linux (64-bit)
   - Memory: 2048 MB
   - Disk: 20 GB dynamic

2. Attach ISO:
   - Settings → Storage → Controller IDE
   - Add CD/DVD Device
   - Select `kiacha.iso`

3. Boot:
   - Start VM
   - GRUB bootloader appears
   - Press Enter to boot Kiacha OS

### Method 3: USB Stick (Real Hardware)

**WARNING**: This will erase the USB device completely!

#### On Linux
```bash
# List devices to find your USB stick
lsblk

# Example: /dev/sdb (NOT /dev/sdb1)
# WARNING: Replace /dev/sdX with YOUR device

sudo umount /dev/sdX*  # Unmount if auto-mounted
sudo dd if=kiacha.iso of=/dev/sdX bs=4M status=progress conv=fsync
sudo sync

# Eject safely
sudo eject /dev/sdX
```

#### On macOS
```bash
# List devices
diskutil list

# Convert ISO to IMG (if needed)
hdiutil convert -format UDRW -o kiacha.img kiacha.iso

# Write to USB (example: /dev/disk2)
sudo dd if=kiacha.img.dmg of=/dev/rdisk2 bs=4m
sudo diskutil eject /dev/disk2
```

#### On Windows
Use one of these tools:
- **Rufus** (GUI): https://rufus.ie/
  1. Select Device (your USB)
  2. Select kiacha.iso
  3. Write method: DD
  4. Click START

- **BalenaEtcher** (GUI): https://www.balena.io/etcher/
  1. Select Image: kiacha.iso
  2. Select Drive: your USB
  3. Click Flash

- **PowerShell** (Command Line):
```powershell
# List disks
Get-Disk

# WARNING: Replace Disk 2 with YOUR USB disk number
$disk = Get-Disk -Number 2
$disk | Clear-Disk -RemoveData -Confirm:$false

# Convert ISO to VHD
$iso = "C:\path\to\kiacha.iso"
$vhd = "C:\temp\kiacha.vhd"
Convert-WindowsImage -SourcePath $iso -VHD $vhd -VHDFormat VHD -VHDPartitionStyle MBR

# Write to USB
$usb = "\\.\PhysicalDrive2"
[byte[]]$bytes = [System.IO.File]::ReadAllBytes($vhd)
[System.IO.File]::WriteAllBytes($usb, $bytes)
```

### Method 4: Boot from USB (BIOS Setup)

1. Insert USB stick into computer
2. Restart computer and press boot menu key:
   - Dell: F12
   - HP: F9
   - Lenovo: F12
   - ASUS: ESC
   - Generic: DEL or F2

3. Select USB device from boot menu
4. Press Enter
5. GRUB bootloader loads
6. Kiacha OS boots automatically

---

## 🎯 What Happens After Boot

### GRUB Bootloader Screen
```
================================================================================
                       GNU GRUB version 2.06
   Powered by Kiacha OS Phase 5
================================================================================

Kiacha OS (kernel 6.9) [UEFI, secure boot]
Diagnostic Mode
Reboot
================================================================================
```

Press Enter to select "Kiacha OS" (default).

### Boot Sequence

1. **EFI Bootloader** (bootx64.c)
   - Loads kernel from ISO/device
   - Verifies RSA-2048-SHA256 signature (if STRICT_SECURITY=1)
   - Sets up paging and relocations

2. **Kernel Boot** (Phase 3-5 Kernel)
   - Initialize stack canaries (per-boot randomization)
   - Initialize ASLR (heap/module randomization)
   - Initialize memory management
   - Initialize drivers (VGA, keyboard, timer)

3. **System Initialization**
   - Start scheduler
   - Launch services (init, logd, netd)

### Boot Messages (Expected Output)
```
[efi] Boot loader initialization
[efi] Loading kernel...
[efi] Verifying signature...
[kernel] Initializing stack canaries...
[kernel] Initializing ASLR...
[kernel] Initializing memory manager...
[kernel] Initializing drivers...
[kernel] Starting scheduler...
[drivers] VGA initialized (80x25)
[drivers] Keyboard initialized (PS/2)
[drivers] Timer initialized (100 Hz)
[services] Init service started
[services] Logging daemon started
[services] Network daemon started
```

If you see these messages, boot was successful! ✅

### Common Boot Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Hang at GRUB | ISO corrupted | Re-download and verify signature |
| Kernel panic | ASLR conflict | Disable with `STRICT_SECURITY=0` environment var |
| No video output | VGA driver issue | Try QEMU with `-nographic` flag |
| Keyboard not working | PS/2 driver issue | Check BIOS PS/2 controller enabled |

---

## 📊 System Specifications

After boot, you can check:

```bash
# Check CPU and RAM
cat /proc/cpuinfo
cat /proc/meminfo

# Check boot time
dmesg | grep "boot"

# Check security features
cat /proc/sys/kernel/unprivileged_userns_clone  # ASLR status
```

## 🔧 Configuration & Customization

### Build with Custom Security Level

```bash
# Permissive mode (no signature verification)
STRICT_SECURITY=0 bash scripts/build_and_run.sh --build-only

# Hardened mode (enforce signature verification)
STRICT_SECURITY=1 bash scripts/build_and_run.sh --build-only
```

### Custom QEMU Timeout (for CI/CD testing)

```bash
QEMU_TIMEOUT=120 bash scripts/build_and_run.sh
```

### Build with Logging Output

```bash
bash scripts/build_and_run.sh --build-only --log build.log
```

---

## 🧪 Testing the Installation

### Run Smoke Tests

```bash
bash tests/run_smoke.sh
```

This automatically:
1. Builds the kernel
2. Creates ISO
3. Boots in QEMU
4. Verifies boot markers
5. Checks binary symbols

### Verify Symbols & Relocations

```bash
bash tests/check_expected.sh kernel_pie_rust/target/x86_64-unknown-none/release/kernel_pie_rust
```

This verifies:
- All Phase 3 symbols (scheduler, memory, kalloc/kfree)
- All Phase 4 symbols (drivers, services)
- Relocation types (RELA, REL, TLS, COPY)
- Security attributes (NX bit)

---

## 📚 Next Steps After Installation

### 1. Understand the Architecture
Read: `docs/DIAGRAMS.md`
- System layers
- Boot sequence flowchart
- Memory layout
- CI/CD pipeline

### 2. Review Security Implementation
Read: `docs/SECURITY.md`
- Stack canary details
- ASLR configuration
- Signature verification procedure

### 3. Explore the Codebase
Start with: `kernel_pie_rust/src/lib.rs`
- Kernel entry point (kmain)
- Memory initialization
- Hardening integration

### 4. Build Custom Kernel
Read: `docs/BUILD.md`
- Modify kernel code
- Rebuild with custom flags
- Test in QEMU

### 5. Contribute
Read: `docs/CONTRIBUTING.md`
- Code style guidelines
- Testing procedures
- Commit conventions

---

## 🐛 Troubleshooting

### ISO Won't Boot in QEMU
```bash
# Check ISO validity
file kiacha.iso
# Should output: ISO 9660 CD-ROM filesystem data

# Try with verbose logging
qemu-system-x86_64 -m 2048 -cdrom kiacha.iso -boot d -d guest_errors -D qemu.log
cat qemu.log
```

### USB Stick Not Bootable
```bash
# Re-verify USB write
sudo dd if=/dev/sdX of=usb_backup.iso  # Back up to file
sudo cmp kiacha.iso usb_backup.iso      # Compare byte-for-byte

# If different, write again with verification
sudo dd if=kiacha.iso of=/dev/sdX bs=4M status=progress conv=fsync
sudo dd if=/dev/sdX of=verify.iso bs=4M status=progress
cmp kiacha.iso verify.iso
```

### Signature Verification Fails
```bash
# Check signature file integrity
file kiacha.iso.sig
# Should show: data

# Check key validity
openssl rsa -pubin -in signing_pub.pem -text -noout

# Re-download both files and try again
curl -L -O "https://github.com/alcoolemgemmemata-lgtm/KiachaOs/releases/download/v1.0/kiacha.iso"
curl -L -O "https://github.com/alcoolemgemmemata-lgtm/KiachaOs/releases/download/v1.0/kiacha.iso.sig"
```

### Kernel Panic on Boot
```bash
# Try permissive security mode
STRICT_SECURITY=0 bash scripts/build_and_run.sh

# Check logs
cat tests/output/kernel.log

# If ASLR issue: disable temporarily
# In bootx64.c, comment out init_aslr() call
```

---

## 🔐 Security Notes

✅ **Before Using in Production**:
1. ✅ Verify signature (all downloads)
2. ✅ Test boot in QEMU first (all hardware)
3. ✅ Review security settings (STRICT_SECURITY mode)
4. ✅ Check boot messages for errors (all deployments)

⚠️ **Known Limitations** (Phase 5):
- Single-core only (SMP coming in Phase 6+)
- No network stack yet (Phase 8+)
- Limited filesystem support (Phase 7+)
- Cooperative multitasking (Phase 6+ preemptive)

---

## 📞 Support & Help

### Documentation
- **BUILD.md**: Complete build guide
- **CONTRIBUTING.md**: Development guide
- **SECURITY.md**: Security procedures
- **DIAGRAMS.md**: Architecture visualization
- **CHECKLIST_FINAL.md**: Completion status

### GitHub Issues
Report bugs: https://github.com/alcoolemgemmemata-lgtm/KiachaOs/issues

### Community
Discussions: https://github.com/alcoolemgemmemata-lgtm/KiachaOs/discussions

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Nov 2025 | Phase 5 Release: CI/CD, hardening, documentation |
| v0.4 | Oct 2025 | Phase 4: Drivers & Services |
| v0.3 | Sep 2025 | Phase 3: Scheduler & Memory |
| v0.2 | Aug 2025 | Phase 2: Security Framework |
| v0.1 | Jul 2025 | Phase 1: UEFI Bootloader |

---

**🎉 Ready to install Kiacha OS? Start with Method 1 above!**

For questions or issues, see the Troubleshooting section or open a GitHub issue.
