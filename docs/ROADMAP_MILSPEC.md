# ROADMAP MILSPEC — Kiacha OS (Estilo Híbrido C)

Este documento resume o roadmap MIL-SPEC solicitado. Estimativas destinadas a um time de 4–8 engenheiros com experiência mista (kernel, Rust/C/C++, infra, segurança). Ajuste prazos conforme o time real.

Princípios de projeto
- Segurança primeiro — "secure by design": princípio do menor privilégio, assinaturas e logs imutáveis.
- Incremental & testável — entregas em marcos com validação.
- Reprodutível — builds determinísticos, hashes e artefatos versionados.
- Segregação de responsabilidades — kernel ≠ brain ≠ UI.
- Auditabilidade — telemetria privada, logs assinados.
- Fail-safe / Rollback — atualizações com rollback seguro.

## Marcos (Milestones)

Milestone 0 — Preparação (2–4 semanas)
- 0.1 docs/ROADMAP_MILSPEC.md (este documento)
- 0.2 Repositório de artifacts e signing (GHA upload)
- 0.3 Templates (ISSUE/PULL)
- 0.4 SECURITY.md e CODEOWNERS
- 0.5 CI básico (lint, build, wasm validation)
- 0.6 SCA & dependency scanning
- 0.7 Static analysis baseline (rustfmt, clippy, clang-tidy, bandit)
- 0.8 Provisionar artifact repo + signing key store (GPG/TUF/HashiVault)

Milestone 1 — OS FUNCIONAL (10–16 semanas)
Objetivo: ter um sistema que boote, rode kernel mínimo ou Linux-based root, rode Brain & UI e ofereça APIs via EventBus. Estratégia inicial: reusar Linux/Buildroot e estender com componentes Rust.
- 1.1 Boot & Base system (UEFI + GRUB/Limine, Buildroot image)
- 1.2 Kernel runtime & services (kiacha-core.service, módulos stubs: framebuffer/v4l2/alsa)
- 1.3 IPC / Event Bus hardening (protobuf + registry)
- 1.4 Brain + Frontend baseline (services e UI embedding)
- 1.5 Storage & Memory (SQLite/Postgres + ChromaDB local, memory backup)

Milestone 2 — OS COMPLETO (12–20 semanas)
Objetivo: drivers, package manager, secure update, apps nativos, multimodal pipeline.
- 2.1 Driver framework & essential drivers (GPU DRM/VAAPI, ALSA, V4L2, USB, Network)
- 2.2 App sandbox & package manager (signed .kiacha / WASM packages)
- 2.3 OTA com A/B & rollback
- 2.4 Multimodal pipeline productionize (whisper.cpp, llama.cpp, model storage)
- 2.5 Apps nativos 2.0 (Control Center, Explorer, Monitor, Privacy UI)

Milestone 3 — OS AVANÇADO (12–24 semanas)
Objetivo: motor cognitivo avançado, UX 3D, automações.
- 3.1 Supreme Cognition optimization (parallel, LTO, wasm perf)
- 3.2 HeartCore & Personality persist (encrypted long-term memory)
- 3.3 UX 3D + Window Manager (Wayland-like / WebGPU)
- 3.4 Automation and shortcuts (visual editor)

Milestone 4 — MIL-SPEC HARDENING & CERTIFICATION (24–48 semanas)
Objetivo: preparar o OS para ambientes governamentais/defesa (auditorias externas, documentação formal).
- 4.1 Threat model & security architecture (STRIDE)
- 4.2 Kernel hardening & minimal TCB (ASLR, shadow stacks, CFI)
- 4.3 Crypto & key management (TPM, signed boot)
- 4.4 Mandatory Access Control (SELinux/AppArmor)
- 4.5 Logging / Auditing Chain (signed, tamper-evident)
- 4.6 Network Defense (kernel IDS/IPS)
- 4.7 Secure Dev & Supply Chain (SLSA, SBOM)
- 4.8 Certification & Compliance (Common Criteria, FIPS)

Milestone 5 — MISSION-CRITICAL / PRODUCTION OPS (ongoing)
- SOPs, incident response playbooks, redundancy e SLAs.

## Divisão de trabalho sugerida (times)
- Core Systems Team (2–3 eng): kernel, drivers, boot.
- Platform Team (2–3 eng): build system, package manager, OTA.
- AI & Brain Team (2–4 eng): cognition, perception.
- Security Team (2 eng + auditor): threat model, certs.
- UI Team (2–3 eng): frontend, compositor.
- QA & Infra (2 eng): CI/CD, tests, artifact repo.

## CI/CD & Reproducible Builds (detalhado)
- Pipelines: build-wasm, build-frontend, build-kernel, image-build, sign-and-release, smoke-tests, security-scan.
- Artifact signing: GPG/TUF; SBOM (CycloneDX).
- SLSA level 2/3; self-hosted runners para builds pesados.
- Matrix: x86_64 e aarch64.

## Testes e Hardening (resumo)
- Unit, Integration (QEMU boot → services), HIL, fuzzing, pentest.
- Security checklist: Secure Boot + TPM, disk encryption (LUKS2), read-only rootfs, least-privilege, SELinux, asset signing.

## Timeline estimada (conservadora)
- Milestone 0: 2–4 semanas
- Milestone 1: 10–16 semanas
- Milestone 2: 12–20 semanas
- Milestone 3: 12–24 semanas
- Milestone 4: 24–48 semanas
- Total: ~1.5–3+ anos (depende de equipe e auditorias)

## Próximos passos imediatos
- Criar issues/milestones no GitHub para Milestone 1. 
- Implementar CI build + reproducible image pipeline.
- Provisionar signing key store e artifact repo.


*Gerado automaticamente — revise e diga se quer que eu crie issues/milestones/PR com estes arquivos.*
