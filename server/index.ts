import { Server } from 'boardgame.io/server'
import { TikiTopple } from './game'

const PORT = parseInt(process.env.PORT || '8080', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const server = Server({
  games: [TikiTopple],
  origins: [
    FRONTEND_URL,
    'http://localhost:3000',
    /\.vercel\.app$/, // Allow all Vercel subdomains
  ]
})

// Add health check route for Railway (Koa middleware style)
server.app.use(async (ctx: any, next: any) => {
  if (ctx.path === '/') {
    ctx.body = { status: 'ok', game: 'tiki-topple' }
    return
  }
  await next()
})

server.run(PORT, () => {
  console.log(`🌺 Tiki Topple server running on port ${PORT}`)
  console.log(`   Accepting connections from: ${FRONTEND_URL}`)
})
