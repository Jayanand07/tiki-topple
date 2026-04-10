'use client'

import { Client } from 'boardgame.io/react'
import type { BoardProps } from 'boardgame.io/react'
import { SocketIO } from 'boardgame.io/multiplayer'
import { TikiTopple } from '../server/game'
import type { GameState } from './types'

/**
 * The server URL for the boardgame.io multiplayer backend.
 * Reads from NEXT_PUBLIC_SERVER_URL so it can be configured per environment.
 */
let rawUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
if (rawUrl && !rawUrl.startsWith('http')) {
  rawUrl = 'https://' + rawUrl
}
export const SERVER_URL = rawUrl || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://tiki-topple-production.up.railway.app')

/**
 * Create a configured boardgame.io client instance for use in React.
 *
 * @param BoardComponent - The React component that renders the game board.
 *                         Receives `G`, `ctx`, `moves`, `playerID`, etc. as props.
 * @returns A wrapped React component connected to the multiplayer server.
 *
 * @example
 * ```tsx
 * import { createTikiClient } from '@/lib/boardgame-client'
 * import MyBoard from '@/components/game/MyBoard'
 *
 * const TikiGame = createTikiClient(MyBoard)
 *
 * export default function GamePage() {
 *   return <TikiGame playerID="0" matchID="my-match" />
 * }
 * ```
 */
export function createTikiClient(BoardComponent: React.ComponentType<BoardProps<GameState>>) {
  return Client({
    game: TikiTopple,
    board: BoardComponent,
    multiplayer: SocketIO({ server: SERVER_URL }),
    debug: process.env.NODE_ENV === 'development',
  })
}

export { SERVER_URL }
export type { BoardProps }
