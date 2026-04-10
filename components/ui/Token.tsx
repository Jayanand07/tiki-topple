'use client'

import { motion } from 'framer-motion'
import { TOKEN_COLORS } from '@/lib/constants'

interface TokenProps {
  /** Token identifier (T1–T9) */
  id: string
  /** Display size */
  size?: 'sm' | 'md' | 'lg'
  /** Show an owner-color ring around the token */
  showOwner?: boolean
  /** Hex color for the owner ring */
  ownerColor?: string
  /** Highlight with a glowing pulse */
  selected?: boolean
  /** Reduce to 40% opacity */
  dimmed?: boolean
  /** Optional click handler */
  onClick?: () => void
  /** Extra CSS classes */
  className?: string
}

const SIZE_MAP = {
  sm: { px: 24, text: 'text-[8px]', ring: 2 },
  md: { px: 36, text: 'text-[11px]', ring: 3 },
  lg: { px: 48, text: 'text-sm', ring: 3 },
} as const

/**
 * A single tiki token rendered as a colored circle with its label.
 *
 * Supports owner rings, selected glow, dimmed state, and three sizes.
 */
export default function Token({
  id,
  size = 'md',
  showOwner = false,
  ownerColor,
  selected = false,
  dimmed = false,
  onClick,
  className = '',
}: TokenProps) {
  const color = TOKEN_COLORS[id] || '#888'
  const { px, text, ring } = SIZE_MAP[size]

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.15 } : undefined}
      whileTap={onClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center rounded-full
        font-heading font-bold select-none
        transition-opacity duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${dimmed ? 'opacity-40' : 'opacity-100'}
        ${selected ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      style={{
        width: px,
        height: px,
        backgroundColor: color,
        boxShadow: selected
          ? `0 0 16px 4px ${color}88`
          : `0 2px 8px ${color}44`,
        border: showOwner && ownerColor
          ? `${ring}px solid ${ownerColor}`
          : `${ring}px solid ${color}33`,
      }}
    >
      {/* Inner highlight gradient for depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Token label */}
      <span
        className={`relative z-10 ${text} text-white drop-shadow-md`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {id}
      </span>
    </motion.div>
  )
}
