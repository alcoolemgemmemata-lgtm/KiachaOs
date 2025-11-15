# Arquitetura Recomendada — Módulo Militar

Visão geral de componentes e fluxo de confiança.

Componentes principais:
- Boot: UEFI Secure Boot -> Signed Bootloader -> Kernel image verification
- Kernel: Híbrido (microkernel para componentes críticos, compat layer separado)
- Drivers: user-mode driver agents com capabilities limitadas
- Keys & Attestation: HSM (RootSigningKey) + TPM2 per device
- Logging: Local WORM store -> signed bundles -> remote SIEM
- Network: Zero-trust overlay, per-service mTLS, L7 proxy for inspection
- CI/CD: Reproducible builds, SBOM, artifact signing, SLSA practices
- Forensics: snapshot service + notarized evidence packaging

Fluxo de boot e runtime:
1. Device powers on -> UEFI Secure Boot verifies bootloader
2. Bootloader verifies kernel signature via RootSigningKey (HSM)
3. Kernel initializes TCB, mounts encrypted rootfs (TPM unseal)
4. LogSigner starts and signs local events
5. EventBus forwards events to D-IDS and policy engine
6. Policy engine may trigger containment actions and evidence collection
7. OTA server provides signed updates; A/B partitioning handles rollback

Considerações de implementação:
- Separar componentes críticos em processos isolados (minimizar TCB)
- Preferir Rust para novos módulos; C para compat com drivers existentes
- Enforce least-privilege: capabilities, namespace isolation, seccomp-like policies
- Model management: sign models and verify on-device before load

Diagrama textual simplificado:
[Bootloader] -> [Kernel (TCB)] -> [LogSigner] -> [EventBus] -> [D-IDS] -> [Policy Engine] -> [Containment]

