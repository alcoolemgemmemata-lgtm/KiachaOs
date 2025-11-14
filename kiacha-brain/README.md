# Kiacha Core Brain

The **Core Brain** is the central orchestrator of Kiacha OS — where all multimodal AI processing happens.

## Architecture

- **Kernel**: Rust-based system for secure module management
- **Core Brain**: Node.js/TypeScript orchestrator
- **Python Modules**: Multimodal AI services (vision, audio, reasoning)
- **Memory**: Persistent semantic storage
- **Router**: Smart event dispatcher

## Modules

### 1. `kcore.infer(prompt: string)` → `Promise<string>`
Main inference function. Generates text from a prompt.

### 2. `kcore.reason(task: string)` → `Promise<string>`
Chain-of-thought reasoning with multiple steps.

### 3. `kcore.vision(imageData: unknown)` → `Promise<string>`
Image analysis and object detection.

### 4. `kcore.audio.transcribe(audioData: unknown)` → `Promise<string>`
Audio-to-text transcription (Whisper).

### 5. `kcore.audio.speak(text: string)` → `Promise<unknown>`
Text-to-speech synthesis (Piper).

### 6. `kcore.memory.store(data: unknown)` → `Promise<string>`
Store data in semantic memory.

### 7. `kcore.memory.search(query: string)` → `Promise<MemoryEntry[]>`
Search for memories by semantic similarity.

### 8. `kcore.router(event)` → `Promise<unknown>`
Route events to appropriate modules.

## Running

```bash
npm install
npm run dev
```

The Brain exposes:
- **REST API** on port 3001
- **WebSocket** on port 3002 for real-time UI communication

## Integration with Kernel

The Core Brain communicates with the Kiacha Kernel via gRPC for:
- Module spawning
- Permission checking
- Resource monitoring
- WASM execution
- Security auditing
