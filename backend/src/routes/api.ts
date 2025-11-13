export async function apiRoutes(fastify: any) {
  fastify.get('/', async () => {
    return {
      name: 'Kiacha OS API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString()
    }
  })

  fastify.get('/health', async () => {
    return { status: 'healthy', uptime: process.uptime() }
  })

  fastify.get('/info', async () => {
    return {
      services: ['voice', 'vision', 'memory', 'ota'],
      features: ['WebRTC', 'Whisper.cpp', 'LLaMA', 'Piper TTS'],
      platform: process.platform
    }
  })
}
