# Kiacha OS — Languages and Runtimes

This document lists the languages and runtimes used across Kiacha OS and explains what each is used for.

## Web (Interface & Apps)

### 1) JavaScript / TypeScript
- Essential for all Kiacha OS applications and the web dashboard
- Used for:
  - Kiacha OS apps
  - Dashboard 3D (Three.js)
  - Interactive panels and UI
  - WebRTC client logic
  - ONNX Runtime Web integration (in-browser inference)
  - Radial Menu, Hologram UI, visual components
- All apps will be authored in JavaScript or TypeScript (TypeScript preferred for type safety)

### 2) HTML + CSS (TailwindCSS)
- UI structure and styling
- Panels, animations and visual components
- TailwindCSS used as utility-first framework for fast styling and consistent design

## AI & In-browser ML

### 3) C++ + WebAssembly (WASM)
- Core for performant, offline, local inference in-browser via WASM bindings
- Typical uses:
  - `whisper.cpp` → Speech-to-text in WASM
  - `llama.cpp`  → Local language model in WASM
  - `stable-diffusion` variants compiled to WASM (Stable Diffusion Turbo WASM)
  - ONNX runtime backends compiled to WASM for vision tasks
- These enable true multimodal local AI without server roundtrips

### 4) Python (optional, development)
- Used for model training, dataset generation, model conversion (to ONNX/WASM), and tooling
- Not required on-device — used in developer workflows

## Backend & Data

### 5) Node.js (JavaScript / TypeScript)
- Backend runtime for Kiacha OS services
- Used for:
  - Fastify API server
  - WebSocket server
  - Cloud sync and plugin store backend
  - Authentication (JWT)
  - Voice processing orchestration
  - IoT command distribution
  - Logging and orchestration of modules

### 6) SQL (PostgreSQL or SQLite)
- Persistent storage for:
  - User accounts
  - System and app configurations
  - Installed apps metadata
  - Persistent memories and logs
- SQLite for single-device/no-server mode; PostgreSQL for cloud deployments

### 7) Redis (with optional Lua scripting)
- Fast cache and ephemeral session storage
- Pub/Sub and real-time event bus
- Short-term memory and rate limiting

## Boot & System Scripts

### 8) Shell scripts (bash/sh)
- Boot-time init scripts and service wrappers
- Buildroot configuration and customization
- OTA update helpers and flash utilities

### 9) YAML / JSON
- Configuration formats for: system config, app manifests, CI/CD, plugin manifests, and deployment pipelines

## Design & UI Assets

### 10) SVG
- Vector icons, hologram visuals, widgets and scalable UI assets

## Hardware & Low-level

### 11) Device Tree (DTS)
- Hardware mapping for ARM platforms
- GPIO, cameras, microphones, LEDs, and other peripherals

### 12) Makefile
- Used for OS builds, cross-compilation, firmware builds, and automation of the whole toolchain

## SUPREME SUMMARY — COMPLETE LANGUAGE LIST
- C
- C++
- JavaScript
- TypeScript
- HTML
- CSS (TailwindCSS)
- Shell Script (bash/sh)
- SQL (PostgreSQL/SQLite)
- YAML
- JSON
- Python (optional)
- WebAssembly (WASM)
- Device Tree (DTS)
- Makefile
- SVG

## WHY THESE MATTER
With this set of languages and runtimes Kiacha OS can:
- Boot on real hardware and provide a minimal, secure OS
- Provide a 3D, interactive, responsive web dashboard
- Run powerful AI models locally inside the browser using WASM
- Orchestrate backend services (Fastify + Node.js) with persistent storage
- Provide OTA updates, plugin store, and app manifests
- Control real hardware (microphone, camera, LEDs) via firmware + device tree

---

If you want, I can:
- Add this `LANGUAGES.md` entry to the `README.md` (I will do that next),
- Produce short example snippets for each language showing recommended patterns, or
- Generate CI checks that validate presence of required toolchains (Node, Python, CMake, WASM toolchain). 

Tell me which of these you'd like next.