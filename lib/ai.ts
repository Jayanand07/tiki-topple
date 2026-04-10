import type { GameState, TokenID } from './types'
import {
  moveTokens,
  reorderTokens,
  nextTurn,
  checkGameOver,
  getAccessibleStack,
} from './gameLogic'
import { TRACK_LENGTH } from './constants'

/**
 * Represents a single legal action the AI can take.
 */
export interface AIMove {
  type: 'move' | 'reorder'
  /** Number of tokens to move (1, 2, or 3) — only for type='move' */
  count?: 1 | 2 | 3
  /** New token arrangement — only for type='reorder' */
  newOrder?: TokenID[]
}

// ─── Entry Point ───────────────────────────────────────────────────────────────

/**
 * Determine the best move for an AI player using Minimax with Alpha-Beta pruning.
 *
 * Adds a small artificial delay (800–1200ms) so the AI doesn't feel instant.
 *
 * @param state      - Current game state.
 * @param aiPlayerId - The player index controlled by the AI.
 * @returns The best AIMove found at depth 3.
 */
export async function getAIMove(
  state: GameState,
  aiPlayerId: number
): Promise<AIMove> {
  // Artificial thinking delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))

  const moves = getLegalMoves(state)
  if (moves.length === 0) {
    return { type: 'move', count: 1 } // Fallback
  }

  let bestMove = moves[0]
  let bestScore = -Infinity

  for (const move of moves) {
    try {
      const newState = applyMove(state, move)
      const score = minimax(newState, 3, -Infinity, Infinity, false, aiPlayerId)
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    } catch {
      // Illegal move — skip
    }
  }

  return bestMove
}

// ─── Minimax Algorithm ─────────────────────────────────────────────────────────

/**
 * Minimax with Alpha-Beta pruning.
 *
 * @param state        - Game state to evaluate.
 * @param depth        - Remaining search depth.
 * @param alpha        - Best already-found score for maximizer.
 * @param beta         - Best already-found score for minimizer.
 * @param isMaximizing - Whether the current layer is the AI's turn.
 * @param aiPlayerId   - Which player the AI controls.
 * @returns Heuristic evaluation score for the AI player.
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayerId: number
): number {
  if (depth === 0 || checkGameOver(state)) {
    return evaluateState(state, aiPlayerId)
  }

  const moves = getLegalMoves(state)
  if (moves.length === 0) {
    return evaluateState(state, aiPlayerId)
  }

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      try {
        const newState = applyMove(state, move)
        const score = minimax(
          newState,
          depth - 1,
          alpha,
          beta,
          false,
          aiPlayerId
        )
        maxEval = Math.max(maxEval, score)
        alpha = Math.max(alpha, score)
        if (beta <= alpha) break // prune
      } catch {
        // skip illegal
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      try {
        const newState = applyMove(state, move)
        const score = minimax(
          newState,
          depth - 1,
          alpha,
          beta,
          true,
          aiPlayerId
        )
        minEval = Math.min(minEval, score)
        beta = Math.min(beta, score)
        if (beta <= alpha) break // prune
      } catch {
        // skip illegal
      }
    }
    return minEval
  }
}

// ─── Heuristic Evaluation ──────────────────────────────────────────────────────

/**
 * Evaluate how favorable the current game state is for the AI player.
 *
 * Factors:
 * - Token position (further = better for AI-owned tokens)
 * - Stack height bonus (higher in stack = better ranking)
 * - End zone bonus (reaching position 35 is very valuable)
 * - Opponent penalty (opponent tokens further ahead is bad)
 * - Secret objective bonus (if the AI has one, favor those tokens)
 */
function evaluateState(state: GameState, aiPlayerId: number): number {
  let score = 0
  const aiPlayer = state.players[aiPlayerId]
  if (!aiPlayer) return 0

  const aiTokenSet = new Set<string>(aiPlayer.tokens)

  for (let pos = 0; pos <= TRACK_LENGTH; pos++) {
    const stack = state.track[pos]
    stack.forEach((tokenId, stackIdx) => {
      const isAIToken = aiTokenSet.has(tokenId)
      const positionValue = pos * 10
      const heightBonus = stackIdx * 5
      const endBonus = pos === TRACK_LENGTH ? 100 : 0

      if (isAIToken) {
        score += positionValue + heightBonus + endBonus
      } else {
        score -= positionValue * 0.3 // penalize opponent progress
      }
    })
  }

  // Secret objective bonus: strongly favor these tokens being near the top
  if (aiPlayer.objective) {
    const { primary, secondary, tertiary } = aiPlayer.objective

    // Build current ranking
    let rank = 1
    for (let pos = TRACK_LENGTH; pos >= 0; pos--) {
      const stack = state.track[pos]
      for (let i = stack.length - 1; i >= 0; i--) {
        const tid = stack[i]
        if (tid === primary && rank === 1) score += 50
        else if (tid === primary && rank <= 3) score += 20
        if (tid === secondary && rank <= 2) score += 30
        else if (tid === secondary && rank <= 4) score += 10
        if (tid === tertiary && rank <= 3) score += 15
        else if (tid === tertiary && rank <= 5) score += 5
        rank++
      }
    }
  }

  return score
}

// ─── Legal Move Generation ─────────────────────────────────────────────────────

/**
 * Enumerate all legal moves from the current game state.
 *
 * This includes:
 * - Move 1, 2, or 3 tokens forward (if stack has enough tokens)
 * - All permutations of reordering top 2 tokens
 * - All permutations of reordering top 3 tokens
 */
function getLegalMoves(state: GameState): AIMove[] {
  const moves: AIMove[] = []

  let accessible: { position: number; tokens: TokenID[] } | null = null
  try {
    accessible = getAccessibleStack(state)
  } catch {
    return moves
  }

  const { tokens } = accessible
  const topCount = tokens.length

  // Move options
  if (topCount >= 1) moves.push({ type: 'move', count: 1 })
  if (topCount >= 2) moves.push({ type: 'move', count: 2 })
  if (topCount >= 3) moves.push({ type: 'move', count: 3 })

  // Reorder top 2: 1 permutation (swap)
  if (topCount >= 2) {
    const top2 = tokens.slice(-2) as TokenID[]
    moves.push({ type: 'reorder', newOrder: [top2[1], top2[0]] })
  }

  // Reorder top 3: all 5 non-identity permutations
  if (topCount >= 3) {
    const [a, b, c] = tokens.slice(-3) as TokenID[]
    moves.push({ type: 'reorder', newOrder: [a, c, b] })
    moves.push({ type: 'reorder', newOrder: [b, a, c] })
    moves.push({ type: 'reorder', newOrder: [b, c, a] })
    moves.push({ type: 'reorder', newOrder: [c, a, b] })
    moves.push({ type: 'reorder', newOrder: [c, b, a] })
  }

  return moves
}

// ─── Move Application ──────────────────────────────────────────────────────────

/**
 * Apply an AIMove to a game state, returning the resulting state
 * (with turn already advanced).
 */
function applyMove(state: GameState, move: AIMove): GameState {
  if (move.type === 'move' && move.count) {
    return nextTurn(moveTokens(state, move.count))
  }
  if (move.type === 'reorder' && move.newOrder) {
    return nextTurn(reorderTokens(state, move.newOrder))
  }
  return state
}
