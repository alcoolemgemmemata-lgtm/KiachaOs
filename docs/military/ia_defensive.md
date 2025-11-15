# IA Defensiva — Módulo Militar

Módulos:
- D-IDS (Detector) — ensemble de modelos para anomalia
- Triage Engine — correlaciona e prioriza alerts
- Containment Planner — sugere ações de contenção (aprovadas manualmente antes da execução)
- Forensic Classifier — agrupa evidências e correlaciona TTPs
- Model Management — pipeline de treino, signing e deploy

APIs internas:
- POST /dids/score — retorna score + explanation
- POST /triage/create — cria ticket com evidence pointer
- POST /containment/plan — retorna ações sugeridas (approval required)
- GET /models/{version}/metadata — retorna metadata assinada

Requisitos técnicos:
- On-device inference: quantized int8 models, fallback to lightweight rules
- Model signing: sign model artifacts and verify before load
- Explainability: provide SHAP/feature attribution for high-score alerts
- Privacy: minimize retention of raw user content; use feature extraction locally

Treino e validação:
- Off-device training pipeline with dataset provenance
- Adversarial robustness testing and drift detection

