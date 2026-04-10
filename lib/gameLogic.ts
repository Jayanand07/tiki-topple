import { GameState, TokenID, Player, ScoreResult, SecretObjective } from './types'
import {
  ALL_TOKENS,
  TOKEN_DISTRIBUTION,
  PLAYER_COLORS,
  TRACK_LENGTH,
  MAX_TURNS,
} from './constants'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Deep-clone a GameState so mutations never leak */
function cloneState(state: GameState): GameState {
  return {
    ...state,
    track: state.track.map((stack) => [...stack]),
    players: state.players.map((p) => ({
      ...p,
      tokens: [...p.tokens],
      objective: p.objective ? { ...p.objective } : undefined,
    })),
    moveHistory: [...state.moveHistory],
    chatMessages: state.chatMessages ? [...state.chatMessages] : [],
  }
}

/** Push an entry to moveHistory, keeping only the last 10 entries */
function pushHistory(state: GameState, message: string): void {
  state.moveHistory.push(message)
  if (state.moveHistory.length > 10) {
    state.moveHistory = state.moveHistory.slice(-10)
  }
}

/** Fisher-Yates shuffle — returns a new shuffled copy */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ─── Token Rankings (shared helper) ────────────────────────────────────────────

/**
 * Build a flat ranked list of all tokens on the board.
 * rank 1 = highest position + highest in stack (last element).
 */
function buildRankedTokens(
  state: GameState
): { tokenId: TokenID; rank: number; points: number }[] {
  const ranked: { tokenId: TokenID; rank: number; points: number }[] = []
  let currentRank = 1

  for (let pos = TRACK_LENGTH; pos >= 0; pos--) {
    const stack = state.track[pos]
    for (let i = stack.length - 1; i >= 0; i--) {
      const points = ALL_TOKENS.length - currentRank + 1
      ranked.push({ tokenId: stack[i], rank: currentRank, points })
      currentRank++
    }
  }

  return ranked
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a brand-new game state.
 *
 * - Builds 36 empty track slots (indices 0–35).
 * - Places all 9 tokens into track[0] (T1 at bottom, T9 at top).
 * - Distributes token ownership to each player via TOKEN_DISTRIBUTION.
 *
 * @param players - Array of Player objects (must have 2–4 entries).
 * @returns A fully initialised GameState with phase='playing'.
 */
export function createInitialState(players: Player[]): GameState {
  // Build 36 empty arrays
  const track: TokenID[][] = Array.from({ length: TRACK_LENGTH + 1 }, () => [])

  // All 9 tokens start stacked at position 0 (T1 bottom → T9 top)
  track[0] = [...ALL_TOKENS]

  // Assign token ownership based on player count
  const distribution = TOKEN_DISTRIBUTION[players.length]
  const assignedPlayers = players.map((p, index) => ({
    ...p,
    id: index,
    color: p.color || PLAYER_COLORS[index],
    tokens: (distribution?.[index] ?? []).map(
      (tokenIndex) => ALL_TOKENS[tokenIndex]
    ),
  }))

  return {
    track,
    players: assignedPlayers,
    currentPlayer: 0,
    turnCount: 0,
    maxTurns: MAX_TURNS,
    phase: 'playing',
    moveHistory: [],
    chatMessages: [],
  }
}

/**
 * Find the frontmost (highest-position) stack on the track that contains
 * at least one token.
 *
 * The "top" of the stack is the last element of the array at that position.
 *
 * @returns The position index and the full token array at that position.
 * @throws If the track is completely empty (should never happen mid-game).
 */
export function getAccessibleStack(
  state: GameState
): { position: number; tokens: TokenID[] } {
  for (let pos = TRACK_LENGTH; pos >= 0; pos--) {
    if (state.track[pos].length > 0) {
      return { position: pos, tokens: [...state.track[pos]] }
    }
  }
  throw new Error('No tokens found on the track')
}

/**
 * Move the top *k* tokens of the frontmost stack forward by 1 position.
 *
 * - Validates that k is 1, 2, or 3 and the stack has enough tokens.
 * - Caps movement at TRACK_LENGTH (position 35).
 * - Does **not** advance the turn — call `nextTurn()` separately.
 *
 * @param state - Current game state.
 * @param k     - Number of tokens to move (1, 2, or 3).
 * @returns A new GameState with the tokens moved.
 */
export function moveTokens(state: GameState, k: 1 | 2 | 3): GameState {
  const newState = cloneState(state)
  const { position } = getAccessibleStack(state)
  const stack = newState.track[position]

  if (stack.length < k) {
    throw new Error(
      `Cannot move ${k} tokens — only ${stack.length} available at position ${position}`
    )
  }

  if (k < 1 || k > 3) {
    throw new Error('k must be 1, 2, or 3')
  }

  // Splice the top k tokens (last k elements, preserving order)
  const moved = stack.splice(stack.length - k, k)

  // Destination is 1 step forward, capped at track end
  const dest = Math.min(position + 1, TRACK_LENGTH)

  // Push them onto the destination stack (same relative order)
  newState.track[dest].push(...moved)

  const playerName = newState.players[newState.currentPlayer].name
  pushHistory(
    newState,
    `${playerName} moved ${k} token${k > 1 ? 's' : ''} forward from position ${position}`
  )

  return newState
}

/**
 * Reorder the top 2 or 3 tokens of the frontmost stack.
 *
 * - `newOrder` must contain exactly the same tokens as the current top-k
 *   (where k = newOrder.length), just in a different arrangement.
 * - Does **not** advance the turn — call `nextTurn()` separately.
 *
 * @param state    - Current game state.
 * @param newOrder - The desired new arrangement (bottom → top).
 * @returns A new GameState with the tokens reordered.
 */
export function reorderTokens(
  state: GameState,
  newOrder: TokenID[]
): GameState {
  const k = newOrder.length
  if (k < 2 || k > 3) {
    throw new Error('Can only reorder 2 or 3 tokens')
  }

  const newState = cloneState(state)
  const { position } = getAccessibleStack(state)
  const stack = newState.track[position]

  if (stack.length < k) {
    throw new Error(
      `Cannot reorder ${k} tokens — only ${stack.length} available`
    )
  }

  // Grab the current top-k tokens
  const currentTopK = stack.slice(stack.length - k)

  // Validate that newOrder contains exactly the same tokens
  const sortedCurrent = [...currentTopK].sort()
  const sortedNew = [...newOrder].sort()
  if (
    sortedCurrent.length !== sortedNew.length ||
    sortedCurrent.some((t, i) => t !== sortedNew[i])
  ) {
    throw new Error(
      `newOrder must contain the same tokens as the current top ${k}. ` +
        `Expected [${sortedCurrent}], got [${sortedNew}]`
    )
  }

  // Replace the top-k with the new order
  stack.splice(stack.length - k, k, ...newOrder)

  const playerName = newState.players[newState.currentPlayer].name
  pushHistory(newState, `${playerName} reordered ${k} tokens at position ${position}`)

  return newState
}

/**
 * Advance to the next player's turn and increment the turn counter.
 *
 * If the game-over condition is met after advancing, the phase is set
 * to `'ended'`.
 *
 * @param state - Current game state (after a move or reorder).
 * @returns A new GameState with the turn advanced.
 */
export function nextTurn(state: GameState): GameState {
  const newState = cloneState(state)
  newState.currentPlayer =
    (newState.currentPlayer + 1) % newState.players.length
  newState.turnCount += 1

  if (checkGameOver(newState)) {
    newState.phase = 'ended'
  }

  return newState
}

/**
 * Determine whether the game should end.
 *
 * The game ends when:
 * 1. The turn count reaches `maxTurns` (default 25), **or**
 * 2. All 9 tokens have reached the final track position (35).
 *
 * @param state - The game state to evaluate.
 * @returns `true` if the game is over.
 */
export function checkGameOver(state: GameState): boolean {
  if (state.turnCount >= state.maxTurns) {
    return true
  }

  if (state.track[TRACK_LENGTH].length === ALL_TOKENS.length) {
    return true
  }

  return false
}

/**
 * Calculate final scores for all players (basic rank-based scoring).
 *
 * Ranking logic:
 *   - Iterate from position 35 down to 0.
 *   - Within each position, iterate from top of stack (last element)
 *     to bottom (first element).
 *   - The first token encountered is rank 1, then rank 2, etc.
 *   - Points: rank 1 = 9 pts, rank 2 = 8 pts, …, rank 9 = 1 pt.
 *
 * @param state - The final game state.
 * @returns An array of ScoreResult objects, sorted by totalScore descending.
 */
export function calculateScores(state: GameState): ScoreResult[] {
  const rankedTokens = buildRankedTokens(state)

  // Build a lookup: tokenId → { rank, points }
  const tokenLookup = new Map(
    rankedTokens.map((t) => [t.tokenId, t])
  )

  // Score each player
  const results: ScoreResult[] = state.players.map((player) => {
    const breakdown = player.tokens.map((tokenId) => {
      const entry = tokenLookup.get(tokenId)
      return {
        tokenId,
        rank: entry?.rank ?? 0,
        points: entry?.points ?? 0,
      }
    })

    const totalScore = breakdown.reduce((sum, b) => sum + b.points, 0)

    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      totalScore,
      tokenBreakdown: breakdown.sort((a, b) => a.rank - b.rank),
    }
  })

  return results.sort((a, b) => b.totalScore - a.totalScore)
}

// ─── Secret Tiki Scoring ────────────────────────────────────────────────────────

/**
 * Assign unique secret objectives to each player.
 *
 * Shuffles the token pool and deals 3 unique tokens per player as
 * primary / secondary / tertiary objectives.
 * No two players share the same primary token.
 *
 * @param players - Array of players (2–4).
 * @returns A map of playerId → SecretObjective.
 */
export function assignSecretObjectives(
  players: Player[]
): Record<number, SecretObjective> {
  const shuffled = shuffle([...ALL_TOKENS])
  const objectives: Record<number, SecretObjective> = {}

  for (let i = 0; i < players.length; i++) {
    // Each player gets 3 consecutive tokens from the shuffled pool
    const base = i * 3
    objectives[players[i].id] = {
      primary: shuffled[base % shuffled.length],
      secondary: shuffled[(base + 1) % shuffled.length],
      tertiary: shuffled[(base + 2) % shuffled.length],
    }
  }

  return objectives
}

/**
 * Calculate final scores using the Secret Tiki objective system.
 *
 * Uses the same base rank scoring as `calculateScores`, then adds
 * bonus points from each player's secret objective:
 *   - primary token at rank 1 → +9 bonus pts
 *   - secondary token at rank 1 or 2 → +5 bonus pts
 *   - tertiary token at rank 1, 2, or 3 → +2 bonus pts
 *
 * Maximum bonus per player = 16 pts (9 + 5 + 2).
 *
 * @param state - The final game state.
 * @returns An array of ScoreResult objects, sorted by totalScore descending.
 */
export function calculateSecretScores(state: GameState): ScoreResult[] {
  const rankedTokens = buildRankedTokens(state)

  // Build a lookup: tokenId → { rank, points }
  const tokenLookup = new Map(
    rankedTokens.map((t) => [t.tokenId, t])
  )

  const results: ScoreResult[] = state.players.map((player) => {
    // Base rank scoring
    const breakdown = player.tokens.map((tokenId) => {
      const entry = tokenLookup.get(tokenId)
      return {
        tokenId,
        rank: entry?.rank ?? 0,
        points: entry?.points ?? 0,
      }
    })

    const baseScore = breakdown.reduce((sum, b) => sum + b.points, 0)

    // Secret objective bonus
    let secretBonus = 0
    if (player.objective) {
      const { primary, secondary, tertiary } = player.objective
      const primaryRank = tokenLookup.get(primary)?.rank ?? 99
      const secondaryRank = tokenLookup.get(secondary)?.rank ?? 99
      const tertiaryRank = tokenLookup.get(tertiary)?.rank ?? 99

      if (primaryRank === 1) secretBonus += 9
      if (secondaryRank <= 2) secretBonus += 5
      if (tertiaryRank <= 3) secretBonus += 2
    }

    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      totalScore: baseScore + secretBonus,
      secretBonus,
      tokenBreakdown: breakdown.sort((a, b) => a.rank - b.rank),
    }
  })

  return results.sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Get the ID of the winning player.
 *
 * @param state - The final game state.
 * @returns The `playerId` of the player with the highest total score.
 */
export function getWinner(state: GameState): number {
  const scores = calculateScores(state)
  return scores[0].playerId
}
