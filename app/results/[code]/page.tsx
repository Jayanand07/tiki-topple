'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import Token from '@/components/ui/Token'
import Button from '@/components/ui/Button'
import { calculateScores } from '@/lib/gameLogic'
import { TOKEN_COLORS, TRACK_LENGTH, ALL_TOKENS } from '@/lib/constants'
import { playWinSound } from '@/lib/sounds'
import type { GameState, ScoreResult, TokenID } from '@/lib/types'

/** Build a ranked list of all 9 tokens for the rankings table */
function buildTokenRankings(state: GameState) {
  const rankings: {
    rank: number
    tokenId: TokenID
    position: number
    stackIndex: number
    points: number
    ownerId: number
    ownerName: string
    ownerColor: string
  }[] = []

  // Find token owners
  const ownerLookup: Record<string, { id: number; name: string; color: string }> = {}
  for (const p of state.players) {
    for (const t of p.tokens) {
      ownerLookup[t] = { id: p.id, name: p.name, color: p.color }
    }
  }

  let currentRank = 1
  for (let pos = TRACK_LENGTH; pos >= 0; pos--) {
    const stack = state.track[pos]
    for (let i = stack.length - 1; i >= 0; i--) {
      const tid = stack[i] as TokenID
      const owner = ownerLookup[tid] || { id: -1, name: '?', color: '#888' }
      rankings.push({
        rank: currentRank,
        tokenId: tid,
        position: pos,
        stackIndex: i,
        points: ALL_TOKENS.length - currentRank + 1,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerColor: owner.color,
      })
      currentRank++
    }
  }

  return rankings
}

const staggerRow = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.6 + i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

const staggerCard = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 1.4 + i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [scores, setScores] = useState<ScoreResult[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`tiki-result-${code}`)
    if (!stored) {
      router.push('/')
      return
    }

    try {
      const state: GameState = JSON.parse(stored)
      setGameState(state)
      const results = calculateScores(state)
      setScores(results)

      // Victory sound
      setTimeout(() => playWinSound(), 400)

      // Confetti burst 1 — central spray
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.45, x: 0.5 },
          colors: Object.values(TOKEN_COLORS),
        })
      }, 600)

      // Confetti burst 2 — side cannons
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: Object.values(TOKEN_COLORS),
        })
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: Object.values(TOKEN_COLORS),
        })
      }, 1200)

      // Confetti burst 3 — delayed rain
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 120,
          startVelocity: 15,
          origin: { y: 0 },
          colors: Object.values(TOKEN_COLORS),
        })
      }, 2000)
    } catch {
      router.push('/')
    }
  }, [code, router])

  const handleShareScore = useCallback(async () => {
    if (!gameState || scores.length === 0) return

    const lines = [
      `🌺 Tiki Topple — Game #${code}`,
      `🏆 Winner: ${scores[0].playerName} (${scores[0].totalScore}pts)`,
      '',
      ...scores.map(
        (s, i) =>
          `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'} ${s.playerName}: ${s.totalScore}pts`
      ),
      '',
      `Played ${gameState.turnCount} turns`,
    ]

    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard not available
    }
  }, [gameState, scores, code])

  const handlePlayAgain = () => {
    localStorage.removeItem(`tiki-result-${code}`)
    const lobbyData = localStorage.getItem(`tiki-lobby-${code}`)
    if (lobbyData) {
      try {
        const lobby = JSON.parse(lobbyData)
        const params = new URLSearchParams({
          host: 'true',
          name: lobby.playerName || 'Player 1',
          players: String(lobby.maxPlayers || 2),
        })
        router.push(`/lobby/${code}?${params.toString()}`)
        return
      } catch {
        // Fall through
      }
    }
    router.push('/')
  }

  if (!gameState || scores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const winner = scores[0]
  const tokenRankings = buildTokenRankings(gameState)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background glow matching winner color */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: winner.playerColor }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-12 max-w-3xl mx-auto">
        {/* ── Trophy Section ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl sm:text-8xl mb-4 inline-block"
          >
            🏆
          </motion.div>

          <h1 className="font-heading text-4xl sm:text-6xl font-bold mb-2">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${winner.playerColor}, #FFD93D, ${winner.playerColor})`,
                backgroundSize: '200% 200%',
                animation: 'shimmer 2s linear infinite',
              }}
            >
              {winner.playerName} Wins!
            </span>
          </h1>

          <p className="text-white/50 text-lg">
            with{' '}
            <span className="text-accent-secondary font-heading font-bold text-2xl">
              {winner.totalScore}
            </span>{' '}
            points in {gameState.turnCount} turns
          </p>
        </motion.div>

        {/* ── Token Rankings Table ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full glass-card p-4 sm:p-6 mb-6"
        >
          <h2 className="font-heading text-lg text-white/70 mb-4">
            📊 Token Rankings
          </h2>

          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 text-xs text-white/30 uppercase tracking-wider mb-2 px-2">
            <span>Rank</span>
            <span>Token</span>
            <span className="text-center">Pos</span>
            <span className="text-center">Pts</span>
            <span className="text-right">Owner</span>
          </div>

          {/* Table rows */}
          <div className="space-y-1">
            {tokenRankings.map((row, i) => (
              <motion.div
                key={row.tokenId}
                custom={i}
                variants={staggerRow}
                initial="hidden"
                animate="visible"
                className={`
                  grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 items-center
                  px-3 py-2.5 rounded-xl transition-colors
                  ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/[0.02] hover:bg-white/[0.04]'}
                `}
                style={i === 0 ? {
                  backgroundImage: 'linear-gradient(90deg, rgba(255,217,61,0.05) 0%, transparent 50%, rgba(255,217,61,0.05) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                } : undefined}
              >
                {/* Rank */}
                <span className={`font-heading font-bold text-sm ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'
                }`}>
                  #{row.rank}
                </span>

                {/* Token */}
                <div className="flex items-center gap-2">
                  <Token id={row.tokenId} size="sm" />
                  <span className="text-sm text-white/70 font-mono">{row.tokenId}</span>
                </div>

                {/* Position */}
                <span className="text-center text-sm text-white/50 font-mono">
                  {row.position}/{TRACK_LENGTH}
                </span>

                {/* Points */}
                <span className={`text-center font-heading font-bold text-sm ${
                  i === 0 ? 'text-yellow-400' : 'text-accent-secondary'
                }`}>
                  {row.points}pt
                </span>

                {/* Owner */}
                <div className="flex items-center justify-end gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: row.ownerColor }}
                  />
                  <span className="text-xs text-white/50 truncate">
                    {row.ownerName}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Player Score Cards ── */}
        <div className="w-full space-y-3 mb-8">
          <h2 className="font-heading text-lg text-white/70 px-1">
            🎯 Final Scores
          </h2>

          {scores.map((result, i) => {
            const player = gameState.players.find((p) => p.id === result.playerId)
            if (!player) return null

            const isWinner = i === 0
            const badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'

            return (
              <motion.div
                key={result.playerId}
                custom={i}
                variants={staggerCard}
                initial="hidden"
                animate="visible"
                className={`glass-card p-5 ${
                  isWinner
                    ? 'ring-2 ring-yellow-500/40 shadow-lg shadow-yellow-500/10'
                    : ''
                }`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: result.playerColor,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Badge */}
                  <span className="text-3xl">{badge}</span>

                  {/* Name and score */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-lg text-white truncate">
                      {result.playerName}
                    </p>
                    <p className="text-xs text-white/30">
                      {player.tokens.length} tokens owned
                    </p>
                  </div>

                  {/* Total score */}
                  <div className="text-right">
                    <p className={`font-heading font-bold text-3xl ${
                      isWinner ? 'text-yellow-400' : 'text-accent-secondary'
                    }`}>
                      {result.totalScore}
                    </p>
                    <p className="text-[10px] text-white/25 uppercase">points</p>
                  </div>
                </div>

                {/* Token breakdown */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {result.tokenBreakdown.map((tb) => (
                    <div
                      key={tb.tokenId}
                      className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg"
                    >
                      <Token id={tb.tokenId} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/30">#{tb.rank}</span>
                        <span className="text-xs text-accent-secondary font-bold">
                          {tb.points}pt
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlayAgain}
            className="flex-1"
          >
            🔄 Play Again
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              localStorage.removeItem(`tiki-result-${code}`)
              localStorage.removeItem(`tiki-players-${code}`)
              localStorage.removeItem(`tiki-lobby-${code}`)
              router.push('/')
            }}
            className="flex-1"
          >
            🏠 New Game
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleShareScore}
            className="flex-1"
          >
            {copied ? '✅ Copied!' : '📊 Share Score'}
          </Button>
        </motion.div>

        {/* ── Footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-10 text-white/15 text-xs"
        >
          Game #{code} • {gameState.turnCount} turns played
        </motion.p>
      </div>
    </div>
  )
}
