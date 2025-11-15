# Tasks — M0 (Fundação de Segurança Militar)

M0.E1 — Governança & chaves
- M0.E1.T1: Criar `SECURITY_CONTACTS.md` (owner list)
- M0.E1.T2: Documentar key lifecycle e roles (RootSigningKey, DeviceKey, SessionKeys)

M0.E2 — CI/CD seguro & pipeline
- M0.E2.T1: Implementar `ci-build.yml` com SBOM generation
- M0.E2.T2: Implement `sign-artifact` job (env var for key store)

M0.E3 — SBOM & inventory
- M0.E3.T1: Criar script `tools/generate_sbom.sh` para cargo/npm/python
- M0.E3.T2: Baseline SBOM for root components

M0.E4 — Key Vault skeleton
- M0.E4.T1: Terraform playbook for Vault dev
- M0.E4.T2: Policy for key rotation (doc)

Estime: 2–4 semanas. Entregáveis: templates, SBOMs, key skeleton, CI workflows.
