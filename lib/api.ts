import { SERVER_URL } from './boardgame-client'

export interface CreateMatchResponse {
  matchID: string
}

export interface JoinMatchResponse {
  playerCredentials: string
}

/**
 * Request the server to create a new match.
 */
export async function apiCreateMatch(numPlayers: number): Promise<string> {
  const res = await fetch(`${SERVER_URL}/games/tiki-topple/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numPlayers }),
  })
  if (!res.ok) throw new Error('Failed to create match')
  const data: CreateMatchResponse = await res.json()
  return data.matchID
}

/**
 * Request the server to let a player join an existing match.
 */
export async function apiJoinMatch(
  matchID: string,
  playerID: string,
  playerName: string
): Promise<string> {
  const res = await fetch(`${SERVER_URL}/games/tiki-topple/${matchID}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerID, playerName }),
  })
  if (!res.ok) {
    throw new Error('Failed to join match or seat already taken')
  }
  const data: JoinMatchResponse = await res.json()
  return data.playerCredentials
}

/**
 * Get the match state from the Lobby API, used to find an empty seat.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGetMatch(matchID: string): Promise<any> {
  const res = await fetch(`${SERVER_URL}/games/tiki-topple/${matchID}`)
  if (!res.ok) throw new Error('Match not found')
  return await res.json()
}
