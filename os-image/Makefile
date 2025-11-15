# Makefile for KiachaOS os-image build system
.PHONY: all initramfs efiboot kiacha iso clean verify help

all: initramfs efiboot kiacha iso

initramfs:
	@echo "Building initramfs.img..."
	sh build-initramfs.sh

efiboot:
	@echo "Building efiboot.img..."
	sh build-efiboot.sh

kiacha:
	@echo "Building kiachaos.img (sparse 64MB)..."
	sh build-kiacha-img.sh

iso:
	@echo "Building kiachaos.iso..."
	sh build-iso.sh

verify:
	@echo "Verifying build artifacts..."
	@ls -lh initramfs.img efiboot.img kiachaos.img kiachaos.iso 2>/dev/null || echo "Some artifacts missing"
	@file initramfs.img kiachaos.img kiachaos.iso 2>/dev/null || true

clean:
	@echo "Cleaning up generated artifacts..."
	rm -f initramfs.img efiboot.img kiachaos.img kiachaos.iso
	rm -f *.tmp
	@echo "Clean complete."

help:
	@echo "KiachaOS os-image Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  make all        - Build all artifacts"
	@echo "  make initramfs  - Build initramfs.img"
	@echo "  make efiboot    - Build efiboot.img"
	@echo "  make kiacha     - Build kiachaos.img"
	@echo "  make iso        - Build kiachaos.iso"
	@echo "  make verify     - Verify generated artifacts"
	@echo "  make clean      - Remove all generated files"
	@echo "  make help       - Show this message"
