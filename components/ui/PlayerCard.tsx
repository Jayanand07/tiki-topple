'use client'

import { motion } from 'framer-motion'
import Token from '@/components/ui/Token'
import type { Player, TokenID } from '@/lib/types'

interface PlayerCardProps {
  /** Player data */
  player: Player
  /** Whether this player is currently taking their turn */
  isActive?: boolean
  /** Whether this is the local player */
  isMe?: boolean
  /** Rank/placement (1st, 2nd, etc.) — used on results screen */
  rank?: number
  /** Score — shown when provided */
  score?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * A card displaying a player's info, token ownership, and optional score/rank.
 * Used in both the lobby and results screens.
 */
export default function PlayerCard({
  player,
  isActive = false,
  isMe = false,
  rank,
  score,
  className = '',
}: PlayerCardProps) {
  const rankEmoji =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎖️'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-5 transition-all duration-300 ${
        isActive ? 'ring-2 ring-offset-2 ring-offset-background' : ''
      } ${className}`}
      style={{
        ...(isActive
          ? { '--tw-ring-color': player.color } as React.CSSProperties
          : {}),
        borderLeftWidth: 4,
        borderLeftColor: player.color,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Rank or avatar */}
        {rank !== undefined ? (
          <div className="text-2xl flex-shrink-0">{rankEmoji}</div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-white/90 flex-shrink-0"
            style={{ backgroundColor: player.color }}
          >
            {player.id + 1}
          </div>
        )}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-white truncate">
            {player.name}
            {isMe && (
              <span className="text-xs text-white/30 ml-1.5">(you)</span>
            )}
          </p>
          {score !== undefined && (
            <p className="text-sm text-accent-secondary font-bold">
              {score} points
            </p>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xl"
          >
            🎯
          </motion.div>
        )}
      </div>

      {/* Token ownership */}
      {player.tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
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
      )}
    </motion.div>
  )
}
