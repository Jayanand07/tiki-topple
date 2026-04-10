import { Server, Origins } from 'boardgame.io/server'
import { TikiTopple } from './game'

/**
 * Standalone boardgame.io server for Tiki Topple.
 *
 * Accepts connections from:
 * - http://localhost:3000 (local dev)
 * - FRONTEND_URL env var (production deploy)
 * - Any *.vercel.app subdomain (preview deploys)
 */

const PORT = parseInt(process.env.PORT || '3001', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const server = Server({
  games: [TikiTopple],
  origins: [
    FRONTEND_URL,
    'http://localhost:3000',
    // Match any Vercel preview/production subdomain
    Origins.LOCALHOST_IN_DEVELOPMENT,
  ].filter(Boolean),
})

server.run(PORT, () => {
  console.log(`🗿 Tiki Topple server running on port ${PORT}`)
  console.log(`   Accepting connections from: ${FRONTEND_URL}`)
})
