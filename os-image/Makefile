# Makefile for os-image build tasks
.PHONY: all initramfs efiboot kiacha iso clean
all: initramfs efiboot kiacha iso

initramfs:
	sh build-initramfs.sh

efiboot:
	sh build-efiboot.sh

kiacha:
	sh build-kiacha-img.sh

iso:
	sh build-iso.sh

clean:
	rm -f initramfs.img efiboot.img kiachaos.img kiachaos.iso
	rm -f *.tmp
