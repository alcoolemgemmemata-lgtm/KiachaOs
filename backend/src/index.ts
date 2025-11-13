import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import jwt from '@fastify/jwt'
import { apiRoutes } from './routes/api'
import { authRoutes } from './routes/auth'
import { memoryRoutes } from './routes/memory'
import { otaRoutes } from './routes/ota'

const server = Fastify({ logger: true })

await server.register(jwt, { secret: 'kiacha-os-jwt-super-secret' })
await server.register(websocket)

await server.register(authRoutes, { prefix: '/auth' })
await server.register(apiRoutes, { prefix: '/api' })
await server.register(memoryRoutes, { prefix: '/memory' })
await server.register(otaRoutes, { prefix: '/ota' })

await server.listen({ port: 3001, host: '0.0.0.0' })
console.log('🚀 Kiacha Backend running on http://0.0.0.0:3001')
