'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import TokenStack from './TokenStack'
import type { GameState, TokenID } from '@/lib/types'
import { TRACK_LENGTH } from '@/lib/constants'

interface TrackBoardProps {
  /** Current game state */
  gameState: GameState
  /** Map of tokenId → owner hex color */
  ownerMap: Record<string, string>
  /** Set of currently selected token IDs */
  selectedTokens?: Set<string>
  /** Called when a token in a stack is clicked */
  onTokenClick?: (tokenId: TokenID, stackIndex: number) => void
}

/**
 * The main game track — horizontally scrollable strip of 36 positions.
 * Features: auto-scroll, progress bar, END zone glow, fire emojis for contested stacks.
 */
export default function TrackBoard({
  gameState,
  ownerMap,
  selectedTokens = new Set(),
  onTokenClick,
}: TrackBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Find the frontmost (highest position) stack with tokens
  let activePosition = 0
  for (let i = TRACK_LENGTH; i >= 0; i--) {
    if (gameState.track[i].length > 0) {
      activePosition = i
      break
    }
  }

  // Auto-scroll to active position
  useEffect(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const slotWidth = 64
    const targetScroll = Math.max(
      0,
      activePosition * slotWidth - container.clientWidth / 2 + slotWidth / 2
    )
    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [activePosition])

  // Check if a stack has "competing" tokens (multiple owners)
  function hasCompetition(stack: TokenID[]): boolean {
    if (stack.length < 2) return false
    const owners = new Set(stack.map((t) => ownerMap[t]).filter(Boolean))
    return owners.size > 1
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Track label */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-heading text-sm text-white/50">🛤️ Token Track</h3>
        <span className="text-xs text-white/30">
          Position {activePosition} / {TRACK_LENGTH}
        </span>
      </div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-3 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-2 min-w-max px-2 py-3">
          {gameState.track.map((stack, pos) => {
            const isNearActive = Math.abs(pos - activePosition) <= 5
            const hasTokens = stack.length > 0
            const isFinish = pos === TRACK_LENGTH
            const isCompeted = hasCompetition(stack as TokenID[])

            // Skip distant empty positions (but show every 5th as a dot)
            if (!hasTokens && !isNearActive && !isFinish && pos !== 0) {
              if (pos % 5 === 0) {
                return (
                  <div
                    key={pos}
                    className="flex flex-col items-center justify-end"
                  >
                    <div className="w-2 h-2 rounded-full bg-white/5" />
                    <span className="text-[8px] text-white/10 mt-1">{pos}</span>
                  </div>
                )
              }
              return null
            }

            return (
              <div key={pos} className="relative flex flex-col items-center">
                {/* Fire emoji for contested stacks */}
                {isCompeted && hasTokens && (
                  <motion.span
                    animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-sm mb-0.5 select-none"
                  >
                    🔥
                  </motion.span>
                )}

                {/* END zone glow */}
                {isFinish && (
                  <motion.div
                    className="absolute -inset-3 rounded-2xl pointer-events-none"
                    animate={{
                      boxShadow: [
                        '0 0 15px 5px rgba(255, 217, 61, 0.15)',
                        '0 0 25px 10px rgba(255, 217, 61, 0.25)',
                        '0 0 15px 5px rgba(255, 217, 61, 0.15)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Finish line label */}
                {isFinish && !hasTokens && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-yellow-500/30 flex items-center justify-center text-sm"
                    >
                      🏁
                    </motion.div>
                    <span className="text-[9px] text-yellow-500/50 mt-1 font-bold">
                      END
                    </span>
                  </div>
                )}

                {/* Finish line with tokens */}
                {isFinish && hasTokens && (
                  <div className="relative">
                    {/* Arrival particle effect */}
                    <motion.div
                      className="absolute -inset-4 pointer-events-none"
                      animate={{ opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {[0, 1, 2, 3].map((j) => (
                        <motion.div
                          key={j}
                          className="absolute w-1 h-1 rounded-full bg-yellow-400/40"
                          style={{
                            top: `${25 + Math.sin(j * 1.5) * 25}%`,
                            left: `${25 + Math.cos(j * 1.5) * 25}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: j * 0.3,
                          }}
                        />
                      ))}
                    </motion.div>

                    <TokenStack
                      tokens={stack as TokenID[]}
                      position={pos}
                      isActive={pos === activePosition}
                      ownerMap={ownerMap}
                      selectedTokens={selectedTokens}
                      onTokenClick={onTokenClick}
                    />
                    <span className="text-[9px] text-yellow-500/50 font-bold block text-center">
                      END
                    </span>
                  </div>
                )}

                {/* Regular positions */}
                {!isFinish && (
                  <TokenStack
                    tokens={stack as TokenID[]}
                    position={pos}
                    isActive={pos === activePosition && hasTokens}
                    ownerMap={ownerMap}
                    selectedTokens={selectedTokens}
                    onTokenClick={onTokenClick}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 mx-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77)',
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${(activePosition / TRACK_LENGTH) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
        />
      </div>
    </motion.div>
  )
}
