import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Token from '@/components/ui/Token'
import RoomShare from '@/components/ui/RoomShare'
import type { GameState } from '@/lib/types'

interface LobbyViewProps {
  G: GameState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moves: any
  playerID: string
  matchID: string
}

const slideIn = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
}

export default function LobbyView({ G, moves, playerID, matchID }: LobbyViewProps) {
  const [copied, setCopied] = useState(false)
  const isHost = playerID === '0'

  const handleCopyLink = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?join=${matchID}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleStartGame = () => {
    if (!isHost) return
    moves.fillWithAI()
    moves.startGame()
  }

  // A player is "joined" if they have set a name that isn't the default 'Player X' placeholder
  const joinedPlayers = G.players.filter((p) => p.name && !p.name.startsWith('Player '))
  const readyCount = joinedPlayers.length
  // Host can start anytime, empty seats will become AI

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 bg-background">
      {/* ── Room Code Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 sm:mb-12"
      >
        <p className="text-white/40 text-sm font-body mb-1">Room Code</p>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-[0.15em] text-white">
            {matchID}
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
          {readyCount}/{G.players.length} players joined
        </p>
      </motion.div>

      {/* ── Room Share (QR + Code) ── */}
      <div className="w-full max-w-lg mb-8">
        <RoomShare
          roomCode={matchID}
          roomUrl={typeof window !== 'undefined' ? window.location.origin : ''}
        />
      </div>

      {/* ── Player Slots ── */}
      <div className="w-full max-w-lg space-y-3 mb-8">
        <AnimatePresence mode="popLayout">
          {G.players.map((player, i) => {
            const isReady = player.name && !player.name.startsWith('Player ')
            return (
              <motion.div
                key={player.id}
                variants={slideIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`glass-card p-4 sm:p-5 flex items-center gap-4
                  ${isReady ? '' : 'border-dashed !border-white/10'}`}
              >
                {/* Color circle */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 flex items-center justify-center font-heading font-bold text-lg text-white/90"
                  style={{
                    backgroundColor: isReady ? player.color : 'transparent',
                    border: isReady ? 'none' : `2px dashed ${player.color}55`,
                  }}
                >
                  {isReady ? i + 1 : '?'}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className={`font-heading font-semibold text-base truncate ${
                    isReady ? 'text-white' : 'text-white/30'
                  }`}>
                    {isReady ? player.name : 'Waiting for player...'}
                    {String(i) === playerID && ' (You)'}
                  </p>

                  {/* Token ownership dots */}
                  {isReady && player.tokens && player.tokens.length > 0 && (
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

                  {/* AI Add Buttons for Host */}
                  {!isReady && isHost && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => moves.addAI(player.id, 'easy')}
                        className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                      >
                        + Easy AI
                      </button>
                      <button
                        onClick={() => moves.addAI(player.id, 'medium')}
                        className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                      >
                        + Mid AI
                      </button>
                      <button
                        onClick={() => moves.addAI(player.id, 'hard')}
                        className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        + Hard AI
                      </button>
                    </div>
                  )}
                </div>

                {/* Ready badge */}
                <div className="flex-shrink-0">
                  {isReady ? (
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
            )
          })}
        </AnimatePresence>
      </div>

      {/* ── Action Area ── */}
      <div className="w-full max-w-lg pb-12">
        {isHost ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            className="w-full"
          >
            {readyCount === G.players.length ? '🚀 Start Game' : '🤖 Start Game (Fill empty with AI)'}
          </Button>
        ) : (
          <div className="glass-card p-5 text-center">
            <p className="text-white/50 font-body">
              ⏳ Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
