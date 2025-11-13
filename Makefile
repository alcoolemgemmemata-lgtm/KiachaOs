.PHONY: all build-os flash run-web run-qemu clean help

help:
	@echo "Kiacha OS - Makefile Commands"
	@echo "=============================="
	@echo "make build-os      - Build all components (frontend, backend, firmware, OS)"
	@echo "make run-web       - Run frontend and backend with Docker Compose"
	@echo "make run-qemu      - Run OS image in QEMU"
	@echo "make flash DEV=/dev/sdX - Flash OS to USB device"
	@echo "make clean         - Remove all build artifacts"

all: build-os

build-os:
	@bash scripts/build-all.sh

run-web:
	docker-compose up --build

run-qemu:
	@bash scripts/run-qemu.sh

flash:
	@bash scripts/flash-usb.sh $(DEV)

clean:
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/node_modules backend/dist
	rm -rf firmware/build
	rm -rf os-image/buildroot/output

.SILENT: help
