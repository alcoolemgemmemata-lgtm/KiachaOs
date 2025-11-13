import { FastifyRequest, FastifyReply } from 'fastify'

export async function authRoutes(fastify: any) {
  fastify.post('/login', async (req: FastifyRequest, res: FastifyReply) => {
    const { user, pass } = req.body as { user: string; pass: string }
    if (user === 'kiacha' && pass === 'kiacha') {
      const token = fastify.jwt.sign({ user })
      return { token, status: 'success' }
    }
    res.statusCode = 401
    return { error: 'Unauthorized' }
  })

  fastify.post('/register', async (req: FastifyRequest, res: FastifyReply) => {
    const { user, pass } = req.body as { user: string; pass: string }
    if (!user || !pass) {
      res.statusCode = 400
      return { error: 'Missing credentials' }
    }
    // In production, hash password and save to database
    return { status: 'registered', user }
  })

  fastify.post('/logout', async (req: FastifyRequest, res: FastifyReply) => {
    // Token invalidation logic
    return { status: 'logged out' }
  })
}
