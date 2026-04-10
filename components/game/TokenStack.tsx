'use client'

import { motion } from 'framer-motion'
import Token from '@/components/ui/Token'
import type { TokenID } from '@/lib/types'

interface TokenStackProps {
  /** Array of token IDs in this stack (index 0 = bottom, last = top) */
  tokens: TokenID[]
  /** Track position index */
  position: number
  /** Whether this is the active (frontmost) stack */
  isActive?: boolean
  /** Map of tokenId → owner color for showing ownership rings */
  ownerMap?: Record<string, string>
  /** Currently selected token IDs */
  selectedTokens?: Set<string>
  /** Called when a token in the stack is clicked */
  onTokenClick?: (tokenId: TokenID, index: number) => void
}

/**
 * Renders a vertical stack of tokens at a single track position.
 * Tokens are displayed bottom-to-top with slight overlap.
 */
export default function TokenStack({
  tokens,
  position,
  isActive = false,
  ownerMap = {},
  selectedTokens = new Set(),
  onTokenClick,
}: TokenStackProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full border-2 border-dashed
            ${isActive ? 'border-white/20' : 'border-white/5'}`}
        />
        <span className="text-[9px] text-white/20 mt-1">{position}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Stack — bottom token rendered first (at bottom of flex column-reverse) */}
      <div className="flex flex-col-reverse items-center">
        {tokens.map((tokenId, i) => {
          const isTop = i === tokens.length - 1
          const isSelected = selectedTokens.has(tokenId)
          const ownerColor = ownerMap[tokenId]

          return (
            <motion.div
              key={`${tokenId}-${i}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              style={{ marginTop: i > 0 ? -8 : 0, zIndex: i }}
            >
              <Token
                id={tokenId}
                size="md"
                selected={isSelected}
                showOwner={!!ownerColor}
                ownerColor={ownerColor}
                dimmed={isActive && !isTop && !isSelected}
                onClick={
                  onTokenClick ? () => onTokenClick(tokenId, i) : undefined
                }
              />
            </motion.div>
          )
        })}
      </div>

      {/* Position label */}
      <span
        className={`text-[9px] mt-1 ${
          isActive ? 'text-accent font-bold' : 'text-white/20'
        }`}
      >
        {position}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="w-1.5 h-1.5 rounded-full bg-accent mt-0.5"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  )
}
