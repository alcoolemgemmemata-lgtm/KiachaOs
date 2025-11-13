export async function whisperService() {
  return {
    transcribe: async (audioBuffer: Buffer) => {
      // Placeholder for Whisper transcription
      return {
        text: 'Transcribed audio',
        confidence: 0.95,
        language: 'en'
      }
    },
    startStream: async () => {
      return { streaming: true }
    }
  }
}
