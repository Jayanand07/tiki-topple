'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage, Player } from '@/lib/types'

interface ChatPanelProps {
  messages: ChatMessage[]
  currentPlayer: Player
  onSendMessage: (msg: string, type: 'chat' | 'emoji') => void
  isOpen: boolean
  onToggle: () => void
}

const QUICK_EMOJIS = ['🔥', '😂', '😤', '🎉', '👑', '💀', '🌺', '⚡', '🎯']

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * In-game chat panel with emoji quick-send and text messaging.
 * Fixed position bottom-right, slides up from bottom.
 */
export default function ChatPanel({
  messages,
  currentPlayer,
  onSendMessage,
  isOpen,
  onToggle,
}: ChatPanelProps) {
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(messages.length)

  // Track unread messages when panel is closed
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const newCount = messages.length - prevMessageCount.current
      if (!isOpen) {
        setUnread((prev) => prev + newCount)
      }
    }
    prevMessageCount.current = messages.length
  }, [messages.length, isOpen])

  // Clear unread when panel opens
  useEffect(() => {
    if (isOpen) setUnread(0)
  }, [isOpen])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isOpen])

  const handleSend = () => {
    const msg = text.trim()
    if (!msg) return
    onSendMessage(msg, 'chat')
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* ── Toggle Button ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full
                   bg-accent/90 hover:bg-accent text-white
                   shadow-lg shadow-accent/20 flex items-center justify-center
                   transition-colors"
      >
        <span className="text-xl">💬</span>
        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                         bg-red-500 text-white text-[10px] font-bold
                         flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 420, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 z-30
                       w-[calc(100%-2rem)] sm:w-80
                       h-[400px] rounded-2xl overflow-hidden
                       bg-[#1a1a2e] border border-white/10
                       shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="font-heading text-sm text-white/70">💬 Chat</h3>
              <button
                onClick={onToggle}
                className="text-white/30 hover:text-white/60 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
              {messages.length === 0 && (
                <p className="text-center text-white/20 text-xs mt-8">
                  No messages yet. Say hi! 👋
                </p>
              )}

              {messages.map((msg, i) => {
                if (msg.type === 'system') {
                  return (
                    <p
                      key={i}
                      className="text-center text-white/25 text-[11px] italic py-1"
                    >
                      {msg.message}
                    </p>
                  )
                }

                const isMe = msg.playerId === currentPlayer.id
                return (
                  <div
                    key={i}
                    className={`flex gap-2 items-start ${
                      isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Sender dot */}
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: msg.playerColor }}
                    />

                    <div
                      className={`max-w-[75%] ${
                        isMe ? 'text-right' : 'text-left'
                      }`}
                    >
                      <p className="text-[10px] text-white/30 mb-0.5">
                        {msg.playerName}
                      </p>
                      {msg.type === 'emoji' ? (
                        <span className="text-3xl">{msg.message}</span>
                      ) : (
                        <div
                          className={`inline-block px-3 py-1.5 rounded-xl text-sm ${
                            isMe
                              ? 'bg-accent/20 text-white/80'
                              : 'bg-white/5 text-white/70'
                          }`}
                        >
                          {msg.message}
                        </div>
                      )}
                      <p className="text-[9px] text-white/15 mt-0.5">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Row */}
            <div className="flex items-center gap-1 px-3 py-2 border-t border-white/5">
              {QUICK_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSendMessage(emoji, 'emoji')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg
                             hover:bg-white/5 transition-colors text-base"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {/* Text Input */}
            <div className="flex gap-2 px-3 py-2 border-t border-white/5">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 150))}
                onKeyDown={handleKeyDown}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                           text-white text-xs placeholder-white/25 outline-none
                           focus:border-accent/40 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!text.trim()}
                className="px-3 py-2 rounded-xl bg-accent/80 hover:bg-accent
                           text-white text-xs font-semibold
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors"
              >
                Send →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
