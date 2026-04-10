import { INVALID_MOVE } from 'boardgame.io/core'
import type { Game, Ctx } from 'boardgame.io'
import {
  createInitialState,
  moveTokens,
  reorderTokens,
  nextTurn,
  checkGameOver,
  calculateSecretScores,
} from '../lib/gameLogic'
import { PLAYER_COLORS } from '../lib/constants'
import type { GameState, TokenID, ChatMessage } from '../lib/types'

/**
 * boardgame.io Game definition for Tiki Topple.
 *
 * Moves return a brand-new state object (immutable pattern).
 * The `endIf` hook checks for game-over after every move and
 * returns the final scores + winner when the game ends.
 */
export const TikiTopple: Game<GameState> = {
  name: 'tiki-topple',

  /**
   * Called once when a match is created.
   * Builds a Player[] from ctx.numPlayers, then delegates to createInitialState.
   */
  setup: ({ ctx }: { ctx: Ctx }) => {
    const players = Array.from({ length: ctx.numPlayers }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      color: PLAYER_COLORS[i],
      tokens: [] as TokenID[],
    }))
    return createInitialState(players)
  },

  moves: {
    /**
     * Move the top k tokens (1, 2, or 3) of the frontmost stack forward
     * by one position, then advance to the next player's turn.
     */
    doMove: ({ G, ctx }, k: number) => {
      // Only the active player may act
      if (ctx.currentPlayer !== String(G.currentPlayer)) return INVALID_MOVE
      if (![1, 2, 3].includes(k)) return INVALID_MOVE

      try {
        let newState = moveTokens(G, k as 1 | 2 | 3)
        newState = nextTurn(newState)
        return newState
      } catch {
        return INVALID_MOVE
      }
    },

    /**
     * Reorder the top 2 or 3 tokens of the frontmost stack,
     * then advance to the next player's turn.
     */
    doReorder: ({ G, ctx }, newOrder: string[]) => {
      if (ctx.currentPlayer !== String(G.currentPlayer)) return INVALID_MOVE
      if (![2, 3].includes(newOrder.length)) return INVALID_MOVE

      try {
        let newState = reorderTokens(G, newOrder as TokenID[])
        newState = nextTurn(newState)
        return newState
      } catch {
        return INVALID_MOVE
      }
    },

    /**
     * Let a player set their display name before or during the game.
     */
    setPlayerName: ({ G }, name: string, playerID: string) => {
      const newState = {
        ...G,
        players: G.players.map((p) => ({
          ...p,
          tokens: [...p.tokens],
          objective: p.objective ? { ...p.objective } : undefined,
        })),
        track: G.track.map((s) => [...s]),
        moveHistory: [...G.moveHistory],
        chatMessages: [...(G.chatMessages || [])],
      }
      const idx = parseInt(playerID, 10)
      if (idx >= 0 && idx < newState.players.length) {
        newState.players[idx].name = name
      }
      return newState
    },

    /**
     * Send a chat message. This is a free action — does NOT consume a turn.
     */
    sendChat: ({ G }, message: string, playerID: string) => {
      const idx = parseInt(playerID, 10)
      const player = G.players[idx]
      if (!player) return INVALID_MOVE

      const chatMsg: ChatMessage = {
        playerId: idx,
        playerName: player.name,
        playerColor: player.color,
        message: message.slice(0, 200), // Limit message length
        timestamp: Date.now(),
        type: message.startsWith(':') ? 'emoji' : 'chat',
      }

      return {
        ...G,
        players: G.players.map((p) => ({
          ...p,
          tokens: [...p.tokens],
          objective: p.objective ? { ...p.objective } : undefined,
        })),
        track: G.track.map((s) => [...s]),
        moveHistory: [...G.moveHistory],
        chatMessages: [...(G.chatMessages || []), chatMsg],
      }
    },
  },

  turn: {
    moveLimit: 1,
  },

  /**
   * Evaluated after every move.
   * When the game is over, returns `{ scores, winner }` which boardgame.io
   * stores as the match result.
   */
  endIf: ({ G }) => {
    if (checkGameOver(G)) {
      const scores = calculateSecretScores(G)
      return { scores, winner: scores[0].playerId }
    }
  },

  ai: {
    enumerate: (G: GameState) => {
      const moves = []
      for (const k of [1, 2, 3]) {
        moves.push({ move: 'doMove', args: [k] })
      }
      return moves
    },
  },
}
