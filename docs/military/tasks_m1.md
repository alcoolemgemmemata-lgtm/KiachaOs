# Tasks — M1 (Kernel de Defesa e TCB mínimo)

M1.E1 — Escolha de arquitetura e TCB
- M1.E1.T1: Documento de trade-offs e escolha Híbrido / Microkernel
- M1.E1.T2: Definir lista de componentes no TCB

M1.E2 — Memory safety primitives
- M1.E2.T1: Habilitar ASLR de kernel e usuário; validar no QEMU
- M1.E2.T2: Guard pages e stack canaries
- M1.E2.T3: CFI e LTO para kernel builds

M1.E3 — Syscall reduction & policy
- M1.E3.T1: Projetar syscall whitelist e policy enforcer
- M1.E3.T2: Implement syscall proxy para WASM/apps

M1.E4 — Secure Boot
- M1.E4.T1: Provision RootSigningKey no HSM
- M1.E4.T2: Bootloader validation tests (QEMU)

M1.E5 — User-mode drivers
- M1.E5.T1: Portar framebuffer/v4l2/alsa para user agents
- M1.E5.T2: Capability-based IPC for drivers

Estime: 12–20 semanas.
