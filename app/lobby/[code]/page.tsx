'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Token from '@/components/ui/Token'
import RoomShare from '@/components/ui/RoomShare'
import { PLAYER_COLORS, ALL_TOKENS, TOKEN_DISTRIBUTION } from '@/lib/constants'
import type { TokenID } from '@/lib/types'

interface LobbyPlayer {
  id: number
  name: string
  color: string
  tokens: TokenID[]
  ready: boolean
}

const slideIn = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
}

export default function LobbyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const code = (params.code as string).toUpperCase()
  const isHost = searchParams.get('host') === 'true'
  const playerName = searchParams.get('name') || 'Player'
  const maxPlayers = Number(searchParams.get('players') || '2')

  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [copied, setCopied] = useState(false)

  // Initialise player list on mount
  useEffect(() => {
    const numPlayers = Math.min(Math.max(maxPlayers, 2), 4)
    const distribution = TOKEN_DISTRIBUTION[numPlayers] || TOKEN_DISTRIBUTION[2]

    const initialPlayers: LobbyPlayer[] = []

    // Add current player (host = slot 0, joiner = slot 1)
    const mySlot = isHost ? 0 : 1
    for (let i = 0; i < numPlayers; i++) {
      const tokens = (distribution[i] || []).map(
        (idx) => ALL_TOKENS[idx] as TokenID
      )

      if (i === mySlot) {
        initialPlayers.push({
          id: i,
          name: playerName,
          color: PLAYER_COLORS[i],
          tokens,
          ready: true,
        })
      } else if (isHost && i > 0) {
        // Host sees AI / waiting slots
        initialPlayers.push({
          id: i,
          name: '',
          color: PLAYER_COLORS[i],
          tokens,
          ready: false,
        })
      } else if (!isHost && i === 0) {
        initialPlayers.push({
          id: i,
          name: 'Host',
          color: PLAYER_COLORS[i],
          tokens,
          ready: true,
        })
      } else {
        initialPlayers.push({
          id: i,
          name: '',
          color: PLAYER_COLORS[i],
          tokens,
          ready: false,
        })
      }
    }

    setPlayers(initialPlayers)

    // Persist lobby state to localStorage for the game page
    const lobbyData = {
      code,
      isHost,
      playerName,
      maxPlayers: numPlayers,
    }
    localStorage.setItem(`tiki-lobby-${code}`, JSON.stringify(lobbyData))
  }, [code, isHost, playerName, maxPlayers])

  // Simulate players joining (for demo — replace with real socket in production)
  useEffect(() => {
    if (!isHost) return

    const timers: NodeJS.Timeout[] = []
    const demoNames = ['Coral', 'Reef', 'Wave']

    setPlayers((currentPlayers) => {
      currentPlayers.forEach((p, i) => {
        if (i === 0 || p.ready) return
        const timer = setTimeout(() => {
          setPlayers((prev) =>
            prev.map((pl) =>
              pl.id === i
                ? { ...pl, name: demoNames[i - 1] || `Player ${i + 1}`, ready: true }
                : pl
            )
          )
        }, 1500 + i * 2000)
        timers.push(timer)
      })
      return currentPlayers
    })

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/lobby/${code}?name=`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — select a temp input
    }
  }, [code])

  const handleStartGame = () => {
    // Save final player list for the game page
    localStorage.setItem(`tiki-players-${code}`, JSON.stringify(players))
    router.push(`/game/${code}`)
  }

  const allReady = players.filter((p) => p.ready).length >= 2
  const readyCount = players.filter((p) => p.ready).length

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      {/* ── Room Code Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 sm:mb-12"
      >
        <p className="text-white/40 text-sm font-body mb-1">Room Code</p>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-[0.15em] text-white">
            {code}
          </h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopyLink}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            title="Copy invite link"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </motion.button>
        </div>
        <p className="text-white/30 text-sm mt-2">
          {readyCount}/{players.length} players ready
        </p>
      </motion.div>

      {/* ── Room Share (QR + Code) ── */}
      <div className="w-full max-w-lg mb-8">
        <RoomShare
          roomCode={code}
          roomUrl={typeof window !== 'undefined' ? window.location.href : ''}
        />
      </div>

      {/* ── Player Slots ── */}
      <div className="w-full max-w-lg space-y-3 mb-8">
        <AnimatePresence mode="popLayout">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              variants={slideIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={`glass-card p-4 sm:p-5 flex items-center gap-4
                ${player.ready ? '' : 'border-dashed !border-white/10'}`}
            >
              {/* Color circle */}
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 flex items-center justify-center font-heading font-bold text-lg text-white/90"
                style={{
                  backgroundColor: player.ready ? player.color : 'transparent',
                  border: player.ready ? 'none' : `2px dashed ${player.color}55`,
                }}
              >
                {player.ready ? i + 1 : '?'}
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className={`font-heading font-semibold text-base truncate ${
                  player.ready ? 'text-white' : 'text-white/30'
                }`}>
                  {player.ready ? player.name : 'Waiting for player...'}
                </p>

                {/* Token ownership dots */}
                {player.ready && (
                  <div className="flex gap-1.5 mt-1.5">
                    {player.tokens.map((tid) => (
                      <Token
                        key={tid}
                        id={tid}
                        size="sm"
                        showOwner
                        ownerColor={player.color}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Ready badge */}
              <div className="flex-shrink-0">
                {player.ready ? (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                    READY
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/5 text-white/30 text-xs font-semibold border border-white/10">
                    WAITING
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Action Area ── */}
      <div className="w-full max-w-lg">
        {isHost ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            disabled={!allReady}
            className="w-full"
          >
            {allReady ? '🚀 Start Game' : `Waiting for players (${readyCount}/${players.length})...`}
          </Button>
        ) : (
          <div className="glass-card p-5 text-center">
            <p className="text-white/50 font-body">
              ⏳ Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>

      {/* ── Back link ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => router.push('/')}
        className="mt-8 text-white/20 hover:text-white/50 text-sm transition-colors"
      >
        ← Back to home
      </motion.button>
    </div>
  )
}
