/** All possible token identifiers (T1 through T9) */
export type TokenID = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9'

/** Secret objective assigned to each player at game start */
export interface SecretObjective {
  /** +9pts if this token finishes at rank 1 */
  primary: TokenID
  /** +5pts if this token finishes at rank 1 or 2 */
  secondary: TokenID
  /** +2pts if this token finishes at rank 1, 2, or 3 */
  tertiary: TokenID
}

/** Represents a player in the game */
export interface Player {
  /** Unique player index (0-based) */
  id: number
  /** Display name */
  name: string
  /** Hex color assigned to this player */
  color: string
  /** Which tokens this player owns (used for scoring) */
  tokens: TokenID[]
  /** Secret scoring objective (hidden from other players) */
  objective?: SecretObjective
  /** Whether this player is controlled by AI */
  isAI?: boolean
  /** AI difficulty level if this is an AI player */
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

/** A chat or system message in the game */
export interface ChatMessage {
  playerId: number
  playerName: string
  playerColor: string
  message: string
  timestamp: number
  type: 'chat' | 'emoji' | 'system'
}

/** The complete game state at any point in time */
export interface GameState {
  /**
   * The game track — an array of 36 slots (positions 0–35).
   * Each slot holds a stack of tokens (array of TokenID).
   *   - index 0 of a stack = bottom token
   *   - last index of a stack = top token
   * At game start, track[0] contains all 9 tokens; all others are empty.
   */
  track: TokenID[][]

  /** All players in the game */
  players: Player[]

  /** Index of the player whose turn it currently is */
  currentPlayer: number

  /** How many individual turns have been taken so far */
  turnCount: number

  /** The turn limit for the game (default 25) */
  maxTurns: number

  /** Current phase of the game lifecycle */
  phase: 'lobby' | 'playing' | 'ended'

  /** Rolling log of the last 10 human-readable action descriptions */
  moveHistory: string[]

  /** In-game chat messages */
  chatMessages: ChatMessage[]
}

/** Score breakdown for a single player at end of game */
export interface ScoreResult {
  playerId: number
  playerName: string
  playerColor: string
  totalScore: number
  tokenBreakdown: {
    tokenId: TokenID
    rank: number
    points: number
  }[]
  /** Bonus points awarded from secret objectives (if applicable) */
  secretBonus?: number
}
