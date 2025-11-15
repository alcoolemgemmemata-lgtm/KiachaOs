# SOPs (Standard Operating Procedures) — Módulo Militar

Este arquivo contém runbooks essenciais a serem armazenados e revisados periodicamente.

SOP: Detecção → Contenção → Coleta
- Trigger: D-IDS alerta com confidence > threshold
- Ações automáticas (pre-aprovadas): freeze process, isolate network, snapshot memory
- Ações manuais (requer approval): deep memory analysis, binary instrumentation
- Notificação: SOC, on-call, create signed incident packet

SOP: Emergency Lockdown (War Mode)
- Condição: alta confiança de comprometimento ou ordem de autoridade
- Etapas:
  1. Disparar lockdown (signed command, threshold multi-sig)
  2. Disable external network interfaces (hardware-level if possible)
  3. Boot devices into signed recovery image
  4. Maintain signed logs + evidence queue

SOP: Key rotation & revocation
- Rotation schedule (e.g., RootSigningKey yearly, DeviceKey per lifecycle)
- Emergency revocation: publish CRL; devices check during boot and periodically

SOP: OTA rollout & rollback
- Canary group rollout
- Health checks and automatic rollback if health fails
- Signed manifest validation at boot

SOP: Evidence handling & chain of custody
- All artifacts signed
- Metadata: collector id, timestamp, chain hash
- Transfer only over mTLS to authorized forensic servers

SOP: Incident post-mortem
- Timeline reconstruction from signed logs
- Root cause analysis and patch timeline
- Add findings to threat model and update policies

