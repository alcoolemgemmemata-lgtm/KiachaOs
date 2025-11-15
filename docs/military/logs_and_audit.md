# Logs & Auditoria — Módulo Militar

Formato de log (envelope canônico):
- version
- source_id (device UUID)
- seq_no
- timestamp (ISO8601 UTC)
- event_type
- payload (JSON structured)
- prev_hash
- signature (DeviceKey)

Storage:
- Local: WORM append-only store, encrypted at rest
- Remote: signed bundles push to SIEM over mTLS

APIs:
- POST /api/logs/batch — aceita envelopes assinados
- GET /api/forensics/evidence/{id} — retorna pacote de evidência (approval required)

Forensic bundle:
- metadata.json (signed)
- memory.dmp (encrypted)
- artifacts.tar.gz (hash manifest)
- timeline.log (signed)

Chain-of-custody:
- Every action logged and signed
- Evidence notarized by attestation server

Retention & archival:
- Hot: 90 days
- Cold: 2 years
- Archive: 7+ years (signed)

