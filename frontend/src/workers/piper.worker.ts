// Placeholder for Piper TTS worker
// In production, integrate with piper/wasm

self.onmessage = async (_e: MessageEvent<string>) => {
  // const text = _e.data
  // Generate speech
  self.postMessage(new ArrayBuffer(0))
}
