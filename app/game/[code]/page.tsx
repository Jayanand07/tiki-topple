'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import TrackBoard from '@/components/game/TrackBoard'
import ActionPanel from '@/components/game/ActionPanel'
import ScorePanel from '@/components/game/ScorePanel'
import ChatPanel from '@/components/game/ChatPanel'
import {
  createInitialState,
  moveTokens,
  reorderTokens,
  nextTurn,
  checkGameOver,
} from '@/lib/gameLogic'
import { playWinSound, playMoveSound } from '@/lib/sounds'
import { PLAYER_COLORS } from '@/lib/constants'
import type { GameState, TokenID, Player, ChatMessage } from '@/lib/types'

/**
 * Build a lookup: tokenId → owner's hex color
 */
function buildOwnerMap(players: Player[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of players) {
    for (const tid of p.tokens) {
      map[tid] = p.color
    }
  }
  return map
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myPlayerIndex] = useState(0)
  const [moveHistory, setMoveHistory] = useState<string[]>([])

  // Toast state
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)

  // Celebration overlay
  const [showCelebration, setShowCelebration] = useState(false)

  // Keyboard action mode
  const [keyboardMode, setKeyboardMode] = useState<'choose' | 'move' | 'reorder' | null>(null)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const prevChatCount = useRef(0)

  // Show toast helper
  const showToast = useCallback((msg: string, duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  // Initialise game from lobby data or defaults
  useEffect(() => {
    let players: Player[] = []

    const stored = localStorage.getItem(`tiki-players-${code}`)
    if (stored) {
      try {
        const lobbyPlayers = JSON.parse(stored)
        players = lobbyPlayers.map(
          (p: { id: number; name: string; color: string; tokens: TokenID[] }) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            tokens: [] as TokenID[],
          })
        )
      } catch {
        // Fall through to defaults
      }
    }

    if (players.length < 2) {
      players = Array.from({ length: 2 }, (_, i) => ({
        id: i,
        name: `Player ${i + 1}`,
        color: PLAYER_COLORS[i],
        tokens: [] as TokenID[],
      }))
    }

    const state = createInitialState(players)
    setGameState(state)
    setChatMessages(state.chatMessages || [])
    showToast(`🎮 ${state.players[0].name}'s turn — Let's go!`, 3000)
  }, [code, showToast])

  const ownerMap = gameState ? buildOwnerMap(gameState.players) : {}
  const isMyTurn = gameState?.currentPlayer === myPlayerIndex

  // Handle sending chat messages
  const handleSendChat = useCallback(
    (message: string, type: 'chat' | 'emoji') => {
      if (!gameState) return
      const player = gameState.players[myPlayerIndex]
      if (!player) return

      const chatMsg: ChatMessage = {
        playerId: myPlayerIndex,
        playerName: player.name,
        playerColor: player.color,
        message,
        timestamp: Date.now(),
        type,
      }

      setChatMessages((prev) => [...prev, chatMsg])
    },
    [gameState, myPlayerIndex]
  )

  // Show toast for new chat messages when panel is closed
  useEffect(() => {
    if (chatMessages.length > prevChatCount.current && !chatOpen) {
      const lastMsg = chatMessages[chatMessages.length - 1]
      if (lastMsg && lastMsg.playerId !== myPlayerIndex) {
        const preview =
          lastMsg.type === 'emoji'
            ? lastMsg.message
            : lastMsg.message.length > 30
              ? lastMsg.message.slice(0, 30) + '...'
              : lastMsg.message
        showToast(`💬 ${lastMsg.playerName}: ${preview}`, 3000)
      }
    }
    prevChatCount.current = chatMessages.length
  }, [chatMessages.length, chatOpen, myPlayerIndex, showToast, chatMessages])

  // Navigate to results
  const goToResults = useCallback(
    (state: GameState) => {
      setShowCelebration(true)
      playWinSound()

      setTimeout(() => {
        localStorage.setItem(`tiki-result-${code}`, JSON.stringify(state))
        router.push(`/results/${code}`)
      }, 2500)
    },
    [code, router]
  )

  // Simulate opponent moves (AI demo mode)
  const simulateOpponent = useCallback(
    (state: GameState) => {
      if (state.currentPlayer === myPlayerIndex) return
      if (checkGameOver(state)) return

      const opponentName = state.players[state.currentPlayer]?.name || 'Opponent'
      showToast(`⏳ ${opponentName} is thinking...`)

      const delay = 800 + Math.random() * 1200
      setTimeout(() => {
        try {
          const choices: (1 | 2 | 3)[] = [1, 2, 3]
          const k = choices[Math.floor(Math.random() * choices.length)]
          let newState = moveTokens(state, k)
          newState = nextTurn(newState)
          setGameState(newState)
          setMoveHistory(newState.moveHistory)
          playMoveSound()

          if (checkGameOver(newState)) {
            goToResults(newState)
          } else if (newState.currentPlayer !== myPlayerIndex) {
            simulateOpponent(newState)
          } else {
            const myName = newState.players[myPlayerIndex]?.name || 'You'
            showToast(`🎮 ${myName}'s turn`)
          }
        } catch {
          try {
            let newState = moveTokens(state, 1)
            newState = nextTurn(newState)
            setGameState(newState)
            setMoveHistory(newState.moveHistory)

            if (checkGameOver(newState)) {
              goToResults(newState)
            } else if (newState.currentPlayer !== myPlayerIndex) {
              simulateOpponent(newState)
            } else {
              const myName = newState.players[myPlayerIndex]?.name || 'You'
              showToast(`🎮 ${myName}'s turn`)
            }
          } catch {
            // Game stuck
          }
        }
      }, delay)
    },
    [myPlayerIndex, goToResults, showToast]
  )

  const handleMove = useCallback(
    (k: 1 | 2 | 3) => {
      if (!gameState || !isMyTurn) return
      try {
        let newState = moveTokens(gameState, k)
        newState = nextTurn(newState)
        setGameState(newState)
        setMoveHistory(newState.moveHistory)
        setKeyboardMode(null)

        if (checkGameOver(newState)) {
          goToResults(newState)
        } else {
          simulateOpponent(newState)
        }
      } catch (err) {
        console.error('Move failed:', err)
      }
    },
    [gameState, isMyTurn, goToResults, simulateOpponent]
  )

  const handleReorder = useCallback(
    (newOrder: TokenID[]) => {
      if (!gameState || !isMyTurn) return
      try {
        let newState = reorderTokens(gameState, newOrder)
        newState = nextTurn(newState)
        setGameState(newState)
        setMoveHistory(newState.moveHistory)
        setKeyboardMode(null)

        if (checkGameOver(newState)) {
          goToResults(newState)
        } else {
          simulateOpponent(newState)
        }
      } catch (err) {
        console.error('Reorder failed:', err)
      }
    },
    [gameState, isMyTurn, goToResults, simulateOpponent]
  )

  // Keyboard shortcuts
  useEffect(() => {
    if (!isMyTurn) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      switch (e.key.toLowerCase()) {
        case 'm':
          setKeyboardMode('move')
          showToast('⌨️ Move mode — press 1, 2, or 3')
          break
        case 'r':
          setKeyboardMode('reorder')
          break
        case '1':
          if (keyboardMode === 'move' || keyboardMode === null) handleMove(1)
          break
        case '2':
          if (keyboardMode === 'move' || keyboardMode === null) handleMove(2)
          break
        case '3':
          if (keyboardMode === 'move' || keyboardMode === null) handleMove(3)
          break
        case 'escape':
          setKeyboardMode(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMyTurn, keyboardMode, handleMove, showToast])

  if (!gameState) {
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

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                       bg-surface/95 backdrop-blur-md border border-white/10
                       px-5 py-2.5 rounded-xl shadow-xl"
          >
            <p className="text-sm text-white/80 font-body whitespace-nowrap">
              {toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Celebration Overlay ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="glass-card p-10 text-center max-w-md mx-4"
            >
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="font-heading text-3xl font-bold text-white mb-2">
                Game Over!
              </h2>
              <p className="text-white/50">
                Calculating final scores...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-lg text-white">🌺 Tiki Topple</h1>
            <span className="text-xs text-white/20 font-mono">#{code}</span>
            {/* Connection status dot */}
            <div className="flex items-center gap-1 ml-1">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-[10px] text-green-400/60 hidden sm:inline">
                Connected
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Player count */}
            <span className="text-xs text-white/30">
              {gameState.players.length}/{gameState.players.length} players
            </span>
            {/* Current turn indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    gameState.players[gameState.currentPlayer]?.color || '#888',
                }}
              />
              <span className="text-xs text-white/50">
                {gameState.players[gameState.currentPlayer]?.name || 'Player'}
              </span>
            </div>
            <span className="text-sm text-white/40">
              Turn {gameState.turnCount + 1} / {gameState.maxTurns}
            </span>
          </div>
        </div>

        {/* Turn progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(((gameState.turnCount + 1) / gameState.maxTurns) * 100, 100)}%`,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            style={{
              background: (() => {
                const pct = (gameState.turnCount + 1) / gameState.maxTurns
                if (pct < 0.5) return 'linear-gradient(90deg, #6BCB77, #6BCB77)'
                if (pct < 0.8) return 'linear-gradient(90deg, #6BCB77, #FFD93D)'
                return 'linear-gradient(90deg, #FFD93D, #FF6B6B)'
              })(),
            }}
          />
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pb-20 lg:pb-4">
        {/* Left: Track + Actions (main area) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Track Board */}
          <div className="glass-card p-4">
            <TrackBoard gameState={gameState} ownerMap={ownerMap} />
          </div>

          {/* AI Thinking Indicator */}
          {!isMyTurn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-2xl"
              >
                🤖
              </motion.div>
              <div>
                <p className="text-sm text-white/70 font-semibold">
                  {gameState.players[gameState.currentPlayer]?.name || 'AI'} is thinking...
                </p>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-accent/60"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Panel */}
          <ActionPanel
            gameState={gameState}
            isMyTurn={isMyTurn}
            onMove={handleMove}
            onReorder={handleReorder}
            playerName={gameState.players[myPlayerIndex]?.name || 'You'}
            actionMode={keyboardMode}
            onClearActionMode={() => setKeyboardMode(null)}
          />

          {/* Move History */}
          {moveHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4"
            >
              <h3 className="font-heading text-sm text-white/40 mb-2">
                📜 Move Log
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...moveHistory].reverse().map((msg, i) => (
                  <p
                    key={i}
                    className={`text-xs ${
                      i === 0 ? 'text-white/60' : 'text-white/25'
                    }`}
                  >
                    {msg}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Score Panel (sidebar) */}
        <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
          <ScorePanel
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            myPlayerIndex={myPlayerIndex}
            turnCount={gameState.turnCount}
            maxTurns={gameState.maxTurns}
          />
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <ChatPanel
        messages={chatMessages}
        currentPlayer={gameState.players[myPlayerIndex]}
        onSendMessage={handleSendChat}
        isOpen={chatOpen}
        onToggle={() => setChatOpen((prev) => !prev)}
      />
    </div>
  )
}
