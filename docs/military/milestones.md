# Milestones — Módulo Militar (Kiacha OS)

Visão geral dos milestones com objetivos, prazos estimados e prioridade.

M0 — Fundação de Segurança Militar (2–4 semanas) — P0
- Governança, CI/CD seguro, SBOM, key store skeleton

M1 — Kernel de Defesa e TCB mínimo (12–20 semanas) — P0
- TCB documentado, mitigations (ASLR/CFI), syscall policy, user-mode drivers

M2 — Criptografia, Keys & Attestation (8–12 semanas) — P0
- TPM integration, HSM-backed signing, provisioning, encrypted rootfs

M3 — Observabilidade Avançada & IA Defensiva (12–16 semanas) — P0/P1
- Signed logs, D-IDS (detector ML), triage & containment playbooks

M4 — Network Defense & Intrusion Prevention (12–20 semanas) — P0/P1
- Kernel flow telemetry, L7 inspection, zero-trust overlay

M5 — Hardening para Certificação & Compliance (24–48 semanas) — P1/P2
- Fuzzing, formal evidence packages, third-party audits

M6 — Resiliência, Redundância & DR (12–20 semanas) — P1
- A/B updates, consensus for critical config, offline provisioning

M7 — Operacionalização (contínuo)
- SOPs, exercises, training, SOC integration

---

Para tarefas detalhadas por milestone veja os arquivos `tasks_m0.md` .. `tasks_m7.md`.
