# Requisitos do Kiacha OS — Graph e Checklist

Este arquivo organiza os requisitos que você descreveu em um gráfico (Mermaid) e em uma checklist priorizada em três níveis: "OS Completo", "Complexo/Avançado" e "Militar". Também mapeia cada requisito para componentes do repositório onde faz sentido trabalhar (ex.: `kiacha-kernel`, `firmware`, `frontend`, `backend`, `kiacha-brain`).

> Observação: este documento foi gerado automaticamente a partir da sua lista — revise e diga se quer que eu crie issues/PRs com estes itens.

## Graph (Mermaid)

```mermaid
graph LR
  A[OS Completo] --> K[Kernel]
  A --> B[Bootloader]
  A --> F[Filesystem]
  A --> D[Drivers]
  A --> G[GUI]
  A --> P[Package Manager]
  A --> Apps[Aplicativos Essenciais]

  K --> K1[Gerenciamento de processos]
  K --> K2[Gerenciamento de memória]
  K --> K3[Gerenciamento de hardware]
  K --> K4[Scheduler]
  K --> K5[Syscalls]
  K --> K6[Threads]

  B --> UEFI[UEFI compatível]
  B --> Load[Carregar kernel]
  B --> HandOff[Hand-off para init]

  F --> FS[EXT4/BTRFS/ZFS/XFS]
  F --> Journaling[Journaling]
  F --> Perm[Permissões/ACLs]

  D --> DK[Drivers essenciais]
  DK --> Keyboard[Teclado]
  DK --> Mouse[Mouse]
  DK --> GPU[GPU]
  DK --> Audio[Audio]
  DK --> Network[Network]
  DK --> Disk[Disco]
  DK --> USB[USB]
  DK --> Camera[Câmera]

  G --> Compositor[Compositor (Wayland/X11/own)]
  G --> WM[Window Manager]
  G --> Accel[Aceleração gráfica]
  G --> Input[Input multimodal]

  Apps --> Explorer[Explorador de arquivos]
  Apps --> Browser[Navegador]
  Apps --> Terminal[Terminal]
  Apps --> Settings[Configurações]
  Apps --> Store[App Store]
  Apps --> TaskManager[Gerenciador de tarefas]
  Apps --> Editor[Editor de texto]

  %% Avançado
  Av[Complexo / Avançado] --> Sandbox[Permissões / Sandboxing]
  Av --> Multimodal[Framework multimodal]
  Av --> Virtual[Virtualização]
  Av --> HWAI[Integração HW ↔ IA ↔ SW]
  Av --> OTA[Atualizações delta]

  %% Militar
  M[Militar] --> Hardened[Hardened Kernel]
  M --> Crypto[Criptografia forte]
  M --> NetSec[Rede militar / IDS IPS]
  M --> Policies[Políticas de segurança MAC / SELinux]
  M --> Audit[Auditoria / Logs imutáveis]
  M --> PhysSec[Anti-intrusão física]
  M --> Certs[Certificações]

  %% Mapeamento para repo
  K --- kiachaKernel[kiacha-kernel]
  firmware --- firmwareRepo[firmware]
  frontend --- frontendRepo[frontend]
  backend --- backendRepo[backend]
  Brain --- brainRepo[kiacha-brain]

  style kiachaKernel fill:#f9f,stroke:#333,stroke-width:1px
  style firmwareRepo fill:#ff9,stroke:#333,stroke-width:1px
  style frontendRepo fill:#9ff,stroke:#333,stroke-width:1px
  style backendRepo fill:#9f9,stroke:#333,stroke-width:1px
  style brainRepo fill:#f99,stroke:#333,stroke-width:1px
```

> Observação: visualização Mermaid pode depender do viewer que você usar (GitHub suporta Mermaid; alguns viewers do VS Code também suportam).

---

## Checklist Prioritária (nível: Mínimo → Avançado → Militar)

### A. Requisitos para ser um OS COMPLETO (prioridade ALTA)
- [ ] Kernel de verdade
  - [ ] Gerenciamento de processos (criação, troca de contexto, IPC)
  - [ ] Gerenciamento de memória (paging, virtualização, proteção)
  - [ ] Gerenciamento de hardware (drivers, interrupções, IOAPIC, IRQs)
  - [ ] Scheduler (inicial: round-robin; evolução: CFS-like)
  - [ ] Syscalls (open/read/write/spawn/kill/mmap/ioctl)
  - [ ] Threads e sincronização
- [ ] Bootloader compatível (UEFI)
  - [ ] Sequência de boot validada
  - [ ] Carregar kernel
  - [ ] Hand-off para Init
- [ ] Sistema de arquivos (escolher: EXT4/BTRFS/ZFS/XFS)
  - [ ] Journaling
  - [ ] Permissões e ACLs
  - [ ] Indexação de diretórios
- [ ] Drivers essenciais
  - [ ] Teclado, mouse, GPU (framebuffer), áudio, rede, disco, USB, câmera
- [ ] Interface gráfica (compositor, WM, aceleração gráfica)
- [ ] Gerenciador de pacotes
- [ ] Aplicativos essenciais (explorador, navegador, terminal, settings, store, task manager, editor)
- [ ] Atualizações OTA e sistema de empacotamento/assinatura

### B. Requisitos para ser COMPLEXO / AVANÇADO (prioridade MÉDIA)
- [ ] Sandboxing / Permissões por app (modelo tipo iOS)
- [ ] Framework multimodal (voz, visão, LLMs, pipeline IA)
- [ ] Módulos de virtualização (QEMU/KVM, containers, WASM runtime)
- [ ] Integração hardware ↔ IA ↔ software (ACELERAÇÃO HW para IA, cameras, microfones)
- [ ] Sistema de atualizações delta e rollback (A/B partitions)

### C. Requisitos para nível MILITAR (prioridade BAIXA/CRÍTICA se alvo militar)
- [ ] Kernel Hardened extremo (shadow stacks, PAC, ASLR++, redução de syscalls)
- [ ] Criptografia de alto nível (AES-256, RSA-4096, SHA-3, FIPS)
- [ ] Rede militar (IDS/IPS, firewall L7, monitoramento em tempo real)
- [ ] Políticas MAC (SELinux custom, AppArmor reforçado)
- [ ] Auditoria completa, Chain of Trust, TPM, logs imutáveis
- [ ] Anti-intrusão física e controles de boot seguro
- [ ] Certificações: Common Criteria, FIPS, NIST compliance

---

## Mapeamento sugerido para o repositório (onde começar)
- `kiacha-kernel/` — iniciar desenvolvimento do kernel mínimo (A3.1–A3.4)
- `src-tauri/` + `frontend/` — prototipar GUI, compositor leve e integração Tauri
- `frontend/` — UI/UX, window manager e ferramentas de configuração
- `backend/` — serviços, API, update server, indexação e gerenciamento de pacotes
- `firmware/` — drivers e integração hardware (inicialmente emulados ou via drivers Linux)
- `kiacha-brain/` — framework multimodal, engines de voz/visão/LLM, runtime Isolado (WASM)
- `wasm/` — componentes portáveis e seguros para execução em sandbox

---

## Propostas de próximos passos imediatos (curto prazo)
1. Definir a arquitetura do kernel (Monolítico / Microkernel / Híbrido). Recomendado: Microkernel ou híbrido para isolamento e integração IA.
2. Criar um repositório/branch `kernel-minimal` (ou começar em `kiacha-kernel/`) com um kernel de boot que:
   - Inicie e registre RAM
   - Execute um scheduler simples (RR)
   - Carregue um usuário `init`
3. Criar issues para cada item crítico (kernel, bootloader, fs, drivers essenciais) e atribuir prioridades/estimativas.
4. Prototipar o sistema de permissões/sandboxing usando containers/WASM para reduzir o trabalho inicial no kernel.
5. Planejar milestones trimestrais: M1 (kernel mínimo + init + shell), M2 (filesystem + drivers básicos), M3 (GUI + package manager + OTA)

---

## Perguntas para você
- Deseja que eu crie issues no GitHub para cada item desta checklist? (posso criar por prioridade automática)
- Prefere que eu abra um PR adicionando este arquivo `docs/REQUIREMENTS_GRAPH.md` ao repositório agora?

---

Fim do arquivo.
