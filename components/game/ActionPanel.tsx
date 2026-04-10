'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Token from '@/components/ui/Token'
import { getAccessibleStack } from '@/lib/gameLogic'
import { playMoveSound, playReorderSound, playErrorSound } from '@/lib/sounds'
import type { GameState, TokenID } from '@/lib/types'

interface ActionPanelProps {
  /** Current game state */
  gameState: GameState
  /** Whether it's this player's turn */
  isMyTurn: boolean
  /** Called when the player chooses to move k tokens */
  onMove: (k: 1 | 2 | 3) => void
  /** Called when the player submits a reorder */
  onReorder: (newOrder: TokenID[]) => void
  /** Current player's name */
  playerName: string
  /** External action mode override (for keyboard shortcuts) */
  actionMode?: 'choose' | 'move' | 'reorder' | null
  /** Callback to clear external action mode */
  onClearActionMode?: () => void
}

type ActionMode = 'choose' | 'move' | 'reorder'

/**
 * Control panel for player actions: move tokens forward or reorder the top stack.
 * Includes sound effects for all actions.
 */
export default function ActionPanel({
  gameState,
  isMyTurn,
  onMove,
  onReorder,
  playerName,
  actionMode: externalMode,
  onClearActionMode,
}: ActionPanelProps) {
  const [mode, setMode] = useState<ActionMode>('choose')
  const [reorderTokens, setReorderTokens] = useState<TokenID[]>([])

  // Use external mode if provided
  const effectiveMode = externalMode || mode

  // Get accessible stack info
  let stackInfo: { position: number; tokens: TokenID[] } | null = null
  try {
    stackInfo = getAccessibleStack(gameState)
  } catch {
    stackInfo = null
  }

  const stackSize = stackInfo?.tokens.length ?? 0

  const handleMove = (k: 1 | 2 | 3) => {
    if (stackSize < k) {
      playErrorSound()
      return
    }
    playMoveSound()
    onMove(k)
    setMode('choose')
    onClearActionMode?.()
  }

  const handleStartReorder = (count: 2 | 3) => {
    if (!stackInfo || stackSize < count) {
      playErrorSound()
      return
    }
    const topTokens = stackInfo.tokens.slice(-count)
    setReorderTokens([...topTokens])
    setMode('reorder')
  }

  const handleSwap = (indexA: number, indexB: number) => {
    setReorderTokens((prev) => {
      const next = [...prev]
      ;[next[indexA], next[indexB]] = [next[indexB], next[indexA]]
      return next
    })
  }

  const handleConfirmReorder = () => {
    playReorderSound()
    onReorder(reorderTokens)
    setMode('choose')
    setReorderTokens([])
    onClearActionMode?.()
  }

  const handleCancel = () => {
    setMode('choose')
    setReorderTokens([])
    onClearActionMode?.()
  }

  if (!isMyTurn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-5 text-center"
      >
        <p className="text-white/40 font-body">
          ⏳ Waiting for{' '}
          <span className="text-white/70 font-semibold">
            {gameState.players[gameState.currentPlayer]?.name || 'opponent'}
          </span>
          {"'s"} turn...
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base text-white">
          🎮 Your Turn, {playerName}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">
            Turn {gameState.turnCount + 1}/{gameState.maxTurns}
          </span>
          <span className="text-[10px] text-white/15 hidden sm:inline">
            [M]ove · [R]eorder · [1/2/3]
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Choose / Move Action Mode ── */}
        {(effectiveMode === 'choose' || effectiveMode === 'move') && (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Move section */}
            <div>
              <p className="text-sm text-white/50 mb-2">
                Move top tokens forward 1 position
              </p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((k) => (
                  <Button
                    key={k}
                    variant="primary"
                    size="md"
                    disabled={stackSize < k}
                    onClick={() => handleMove(k)}
                    className="flex-1"
                  >
                    <span className="mr-1">Move {k}</span>
                    <kbd className="text-[10px] opacity-50 bg-white/10 px-1 rounded hidden sm:inline">
                      {k}
                    </kbd>
                  </Button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/20">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Reorder section */}
            <div>
              <p className="text-sm text-white/50 mb-2">
                Reorder top tokens in the stack
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={stackSize < 2}
                  onClick={() => handleStartReorder(2)}
                  className="flex-1"
                >
                  Reorder 2
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={stackSize < 3}
                  onClick={() => handleStartReorder(3)}
                  className="flex-1"
                >
                  Reorder 3
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Reorder Mode ── */}
        {effectiveMode === 'reorder' && reorderTokens.length > 0 && (
          <motion.div
            key="reorder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-white/50">
              Tap adjacent tokens to swap them. Bottom → Top order:
            </p>

            {/* Token arrangement */}
            <div className="flex items-center justify-center gap-3 py-3">
              {reorderTokens.map((tid, i) => (
                <div key={`${tid}-${i}`} className="flex items-center gap-1">
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Token
                      id={tid}
                      size="lg"
                      selected
                      onClick={
                        i < reorderTokens.length - 1
                          ? () => handleSwap(i, i + 1)
                          : i > 0
                            ? () => handleSwap(i - 1, i)
                            : undefined
                      }
                    />
                  </motion.div>
                  {i < reorderTokens.length - 1 && (
                    <button
                      onClick={() => handleSwap(i, i + 1)}
                      className="text-white/30 hover:text-white/70 transition-colors text-lg"
                      title="Swap"
                    >
                      ⇄
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-white/30">
              <span>Bottom</span>
              <span>→</span>
              <span>Top</span>
            </div>

            {/* Confirm / Cancel */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel <kbd className="text-[10px] opacity-50 ml-1 hidden sm:inline">Esc</kbd>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmReorder}
                className="flex-1"
              >
                Confirm Reorder
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
