import { TokenID } from './types'

/** Hex color for each of the 9 tiki tokens */
export const TOKEN_COLORS: Record<string, string> = {
  T1: '#FF6B6B', // coral red
  T2: '#FFD93D', // golden yellow
  T3: '#6BCB77', // leaf green
  T4: '#4D96FF', // sky blue
  T5: '#FF922B', // tangerine orange
  T6: '#CC5DE8', // vivid purple
  T7: '#20C997', // teal
  T8: '#F06595', // hot pink
  T9: '#74C0FC', // light blue
}

/** Colors assigned to players (up to 4 players) */
export const PLAYER_COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D']

/** The last valid position index on the track (0-based) */
export const TRACK_LENGTH = 35

/** Total number of turns before the game ends automatically */
export const MAX_TURNS = 25

/** Ordered list of every token ID */
export const ALL_TOKENS: TokenID[] = [
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9',
]

/**
 * How tokens are distributed among players based on player count.
 * Each inner array holds the *indices* into ALL_TOKENS for one player.
 *   - 2 players → 4 + 5 tokens
 *   - 3 players → 3 + 3 + 3 tokens
 *   - 4 players → 2 + 2 + 2 + 3 tokens
 */
export const TOKEN_DISTRIBUTION: Record<number, number[][]> = {
  2: [[0, 1, 2, 3], [4, 5, 6, 7, 8]],
  3: [[0, 1, 2], [3, 4, 5], [6, 7, 8]],
  4: [[0, 1], [2, 3], [4, 5], [6, 7, 8]],
}
