import { FastifyRequest, FastifyReply } from 'fastify'

export async function memoryRoutes(fastify: any) {
  const memoryStore: { id: string; text: string; timestamp: Date }[] = []

  fastify.post('/embed', async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const { text } = req.body as { text: string }
      if (!text) {
        res.statusCode = 400
        return { error: 'Text is required' }
      }

      const entry = {
        id: Date.now().toString(),
        text: text,
        timestamp: new Date()
      }

      memoryStore.push(entry)
      return { ok: true, id: entry.id, message: 'Memory stored' }
    } catch (error) {
      res.statusCode = 500
      return { error: 'Failed to embed' }
    }
  })

  fastify.get('/list', async () => {
    return { items: memoryStore, count: memoryStore.length }
  })

  fastify.get('/search', async (req: FastifyRequest) => {
    const { q } = req.query as { q: string }
    const results = memoryStore.filter(m => m.text.includes(q))
    return { query: q, results, count: results.length }
  })

  fastify.delete('/:id', async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string }
    const index = memoryStore.findIndex(m => m.id === id)
    if (index === -1) {
      res.statusCode = 404
      return { error: 'Not found' }
    }
    memoryStore.splice(index, 1)
    return { status: 'deleted' }
  })
}
