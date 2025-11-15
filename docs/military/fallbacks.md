# Protocolos de Fallback e Redundância

- OTA A/B with verified boot: if new partition fails, rollback to previous
- Local quorum config: require N-of-M signatures for critical config apply
- Network failover: dual-homed networks (mgmt vs data); switch to mgmt channel on failure
- Revocation: CRL/OCSP-style service; devices check revocation at boot
- Crisis mode: threshold-signed global lock command to put fleet into lockdown
- Evidence escrow: devices store signed evidence locally and replicate when network is available

