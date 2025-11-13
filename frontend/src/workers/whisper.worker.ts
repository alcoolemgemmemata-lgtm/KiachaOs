// Placeholder for Whisper WASM worker
// In production, integrate with whisper.cpp/wasm

self.onmessage = async (_e: MessageEvent<Blob>) => {
  // const audioBlob = _e.data
  // Process audio and transcribe
  self.postMessage('transcription result')
}
