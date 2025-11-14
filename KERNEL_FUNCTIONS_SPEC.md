# 🧩 Kernel Functions Specification (Rust)

Lista das funções do Kernel Kiacha OS, status e dependências.

| Função                      | Categoria         | Status   | Dependências |
|-----------------------------|-------------------|----------|--------------|
| Process manager             | Core              | [~]      | Thread, Mem  |
| Thread scheduler            | Core              | [~]      | Process      |
| Memory allocator            | Core              | [X]      |              |
| Garbage collector inteligente| Core              | [ ]      | Mem          |
| GPU compute scheduler       | Performance       | [ ]      | GPU, Thread  |
| WASM sandbox runtime        | Virtualização     | [X]      | WASM         |
| File system virtual         | Storage           | [~]      | Disk         |
| Smart page swapping         | Performance       | [ ]      | Mem          |
| Hypervisor leve             | Virtualização     | [ ]      | VM           |
| Kernel Logs                 | Diagnóstico       | [X]      |              |
| Error recovery automático   | Diagnóstico       | [~]      | Logs         |
| Live kernel patching        | Segurança         | [ ]      |              |
| Driver runtime loader       | Hardware          | [~]      | Device tree  |
| Device tree                 | Hardware          | [~]      |              |
| Hardware detection AI-assisted| Hardware        | [ ]      | AI           |
| Energy manager              | Performance       | [~]      | Power        |
| Power profiles (eco, turbo, AI)| Performance   | [ ]      | Energy       |
| System integrity checker    | Segurança         | [X]      | Logs         |
| Rootless permissions        | Segurança         | [X]      | ACL          |
| ...existing code...         | ...               | ...      | ...          |

Status: [X] Implementada | [~] Parcial | [ ] Nova
