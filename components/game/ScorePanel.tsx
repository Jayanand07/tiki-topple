'use client'

import { motion } from 'framer-motion'
import Token from '@/components/ui/Token'
import type { Player, TokenID } from '@/lib/types'

interface ScorePanelProps {
  /** All players */
  players: Player[]
  /** Index of the player who is currently taking their turn */
  currentPlayer: number
  /** This client's player index */
  myPlayerIndex: number
  /** Current turn count */
  turnCount: number
  /** Maximum turns */
  maxTurns: number
}

/**
 * Side panel showing player info, token ownership, and turn progress.
 */
export default function ScorePanel({
  players,
  currentPlayer,
  myPlayerIndex,
  turnCount,
  maxTurns,
}: ScorePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-3"
    >
      {/* Turn Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-sm text-white/60">⏱️ Progress</h3>
          <span className="text-xs text-white/40">
            {turnCount}/{maxTurns}
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #6BCB77, #FFD93D, #FF6B6B)',
            }}
            animate={{ width: `${(turnCount / maxTurns) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] text-white/20 mt-1 text-right">
          {maxTurns - turnCount} turns remaining
        </p>
      </div>

      {/* Player Cards */}
      {players.map((player, i) => {
        const isActive = i === currentPlayer
        const isMe = i === myPlayerIndex

        return (
          <motion.div
            key={player.id}
            layout
            className={`glass-card p-4 transition-all duration-300 ${
              isActive
                ? 'ring-2 ring-offset-1 ring-offset-transparent'
                : 'opacity-70'
            }`}
            style={{
              ...(isActive ? { ringColor: player.color } : {}),
              borderLeftWidth: 3,
              borderLeftColor: player.color,
            }}
          >
            {/* Player header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white/90 flex-shrink-0"
                style={{ backgroundColor: player.color }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm text-white truncate">
                  {player.name}
                  {isMe && (
                    <span className="text-[10px] text-white/30 ml-1">
                      (you)
                    </span>
                  )}
                </p>
              </div>
              {isActive && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-xs"
                >
                  🎯
                </motion.span>
              )}
            </div>

            {/* Token ownership */}
            <div className="flex flex-wrap gap-1.5">
              {player.tokens.map((tid: TokenID) => (
                <Token
                  key={tid}
                  id={tid}
                  size="sm"
                  showOwner
                  ownerColor={player.color}
                />
              ))}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
