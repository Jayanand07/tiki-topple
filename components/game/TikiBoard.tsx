import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import TrackBoard from '@/components/game/TrackBoard'
import ActionPanel from '@/components/game/ActionPanel'
import ScorePanel from '@/components/game/ScorePanel'
import ChatPanel from '@/components/game/ChatPanel'
import LobbyView from '@/components/game/LobbyView'
import { getAIMove } from '@/lib/ai'
import { playWinSound, playMoveSound } from '@/lib/sounds'
import type { GameState, Player, TokenID } from '@/lib/types'

function buildOwnerMap(players: Player[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of players) {
    for (const tid of p.tokens) {
      map[tid] = p.color
    }
  }
  return map
}

interface TikiBoardProps {
  G: GameState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moves: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any
  playerID: string | null
  matchID: string
}

export default function TikiBoard({ G, ctx, moves, playerID, matchID }: TikiBoardProps) {
  const router = useRouter()
  const myPlayerIndex = playerID ? parseInt(playerID, 10) : 0
  
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState<'choose' | 'move' | 'reorder' | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const prevChatCount = useRef(0)

  const showToast = useCallback((msg: string, duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  const ownerMap = buildOwnerMap(G.players)
  const isMyTurn = ctx.currentPlayer === String(myPlayerIndex)

  // ── AI Hand-off Logic ──
  // If it's an AI's turn, the Host (Player 0) calculates and dispatches the move
  useEffect(() => {
    if (ctx.phase !== 'play' || ctx.gameover) return
    const activePlayer = G.players[parseInt(ctx.currentPlayer, 10)]
    
    // Only the Host (playerID '0') manages the AI to prevent duplicate moves from other real players
    if (activePlayer?.isAI && playerID === '0') {
      let isCancelled = false
      const timer = setTimeout(() => {
        showToast(`🤖 ${activePlayer.name} is thinking...`, 1500)
        
        getAIMove(G, parseInt(ctx.currentPlayer, 10)).then(bestMove => {
          if (isCancelled) return
          playMoveSound()
          if (bestMove.type === 'move' && bestMove.count) {
            moves.doMove(bestMove.count)
          } else if (bestMove.type === 'reorder' && bestMove.newOrder) {
            moves.doReorder(bestMove.newOrder)
          }
        }).catch(() => {
          if (!isCancelled) moves.doMove(1)
        })
        
      }, 500)
      return () => {
        isCancelled = true
        clearTimeout(timer)
      }
    }
  }, [ctx.currentPlayer, ctx.phase, ctx.gameover, G, playerID, moves, showToast])

  // Navigate to results
  useEffect(() => {
    if (ctx.gameover && !showCelebration) {
      setShowCelebration(true)
      playWinSound()
      setTimeout(() => {
        localStorage.setItem(`tiki-result-${matchID}`, JSON.stringify(G))
        router.push(`/results/${matchID}`)
      }, 3000)
    }
  }, [ctx.gameover, showCelebration, matchID, G, router])

  // Chat notifications
  useEffect(() => {
    const list = G.chatMessages || []
    if (list.length > prevChatCount.current && !chatOpen) {
      const lastMsg = list[list.length - 1]
      if (lastMsg && lastMsg.playerId !== myPlayerIndex) {
        showToast(`💬 ${lastMsg.playerName}: ${lastMsg.type === 'emoji' ? lastMsg.message : 'New message'}`, 3000)
      }
    }
    prevChatCount.current = list.length
  }, [G.chatMessages, chatOpen, myPlayerIndex, showToast])

  const handleMove = useCallback((k: 1 | 2 | 3) => {
    if (!isMyTurn) return
    moves.doMove(k)
    playMoveSound()
    setKeyboardMode(null)
  }, [isMyTurn, moves])

  const handleReorder = useCallback((newOrder: TokenID[]) => {
    if (!isMyTurn) return
    moves.doReorder(newOrder)
    playMoveSound()
    setKeyboardMode(null)
  }, [isMyTurn, moves])

  const handleSendChat = useCallback((message: string) => {
    moves.sendChat(message, String(myPlayerIndex))
  }, [moves, myPlayerIndex])

  // Context phase switch
  if (ctx.phase === 'lobby') {
    return <LobbyView G={G} ctx={ctx} moves={moves} playerID={playerID || ''} matchID={matchID} />
  }

  // Active Game UI
  return (
    <div className="min-h-screen flex flex-col relative bg-background">
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
            <p className="text-sm text-white/80 font-body whitespace-nowrap">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="text-7xl mb-4">🏆</div>
              <h2 className="font-heading text-3xl font-bold text-white mb-2">Game Over!</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-lg text-white">🌺 Tiki Topple</h1>
            <span className="text-xs text-white/20 font-mono">#{matchID}</span>
            <div className="flex items-center gap-1 ml-1">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-[10px] text-green-400/60 hidden sm:inline">Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:inline">
              {G.players.filter(p => !p.isAI).length} real players
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: G.players[parseInt(ctx.currentPlayer, 10)]?.color || '#888' }}
              />
              <span className="text-xs text-white/50">
                {G.players[parseInt(ctx.currentPlayer, 10)]?.name || 'Player'}
              </span>
            </div>
            <span className="text-sm text-white/40">
              Turn {G.turnCount + 1} / {G.maxTurns}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pb-20 lg:pb-4">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="glass-card p-4">
            <TrackBoard gameState={G} ownerMap={ownerMap} />
          </div>
          
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
                   {G.players[parseInt(ctx.currentPlayer, 10)]?.name || 'Opponent'} is playing...
                 </p>
               </div>
             </motion.div>
          )}

          <ActionPanel
            gameState={G}
            isMyTurn={isMyTurn}
            onMove={handleMove}
            onReorder={handleReorder}
            playerName={G.players[myPlayerIndex]?.name || 'You'}
            actionMode={keyboardMode}
            onClearActionMode={() => setKeyboardMode(null)}
          />

          {G.moveHistory.length > 0 && (
            <motion.div className="glass-card p-4">
              <h3 className="font-heading text-sm text-white/40 mb-2">📜 Move Log</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...G.moveHistory].reverse().map((msg, i) => (
                  <p key={i} className={`text-xs ${i === 0 ? 'text-white/60' : 'text-white/25'}`}>
                    {msg}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
          <ScorePanel
            players={G.players}
            currentPlayer={parseInt(ctx.currentPlayer, 10)}
            myPlayerIndex={myPlayerIndex}
            turnCount={G.turnCount}
            maxTurns={G.maxTurns}
          />
        </div>
      </div>

      <ChatPanel
        messages={G.chatMessages || []}
        currentPlayer={G.players[myPlayerIndex]}
        onSendMessage={handleSendChat}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  )
}
