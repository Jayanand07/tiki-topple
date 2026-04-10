'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface RoomShareProps {
  roomCode: string
  roomUrl: string
}

/**
 * Two-column room sharing card: Room Code letters + QR code.
 * Copy-to-clipboard for both code and link.
 */
export default function RoomShare({ roomCode, roomUrl }: RoomShareProps) {
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }, [roomCode])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }, [roomUrl])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-card p-6 rounded-2xl"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* ── LEFT: Room Code ── */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Room Code
          </p>

          {/* Letter Boxes */}
          <div className="flex gap-2 mb-4">
            {roomCode.split('').map((letter, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="w-[60px] h-[70px] rounded-xl bg-white/5
                           border-2 border-accent/60
                           flex items-center justify-center
                           font-heading text-3xl font-bold text-white"
              >
                {letter}
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-white/5 border border-white/10
                       hover:bg-white/10 transition-colors
                       text-sm text-white/60 hover:text-white/80"
          >
            {codeCopied ? (
              <>
                <span className="text-green-400">✓</span>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy Code</span>
              </>
            )}
          </motion.button>
        </div>

        {/* ── Divider ── */}
        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="w-px h-16 bg-white/10" />
          <span className="text-xs text-white/20 font-heading">OR</span>
          <div className="w-px h-16 bg-white/10" />
        </div>
        <div className="flex md:hidden items-center gap-3 w-full">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/20 font-heading">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── RIGHT: QR Code ── */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Scan to Join
          </p>

          {/* QR Code */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-4">
            {roomUrl ? (
              <QRCodeSVG
                value={roomUrl}
                size={160}
                bgColor="#0F0F1A"
                fgColor="#FF6B6B"
                level="M"
              />
            ) : (
              <div className="w-[160px] h-[160px] flex items-center justify-center text-white/20 text-xs">
                Loading...
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-white/5 border border-white/10
                       hover:bg-white/10 transition-colors
                       text-sm text-white/60 hover:text-white/80"
          >
            {linkCopied ? (
              <>
                <span className="text-green-400">✓</span>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <span>📱</span>
                <span>Copy Link</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
