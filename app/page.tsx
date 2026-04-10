'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import Token from '@/components/ui/Token'
import { ALL_TOKENS } from '@/lib/constants'

/** Generate a random 4-letter uppercase room code */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const HOW_TO_PLAY = [
  {
    emoji: '🏠',
    title: 'Create or Join a Room',
    description: 'Create a room & share the code or QR, or paste a link to join instantly.',
  },
  {
    emoji: '🌺',
    title: 'Stack, Move, and Reorder',
    description: 'Move tokens forward or reorder the top of the stack to gain strategic advantage.',
  },
  {
    emoji: '🏆',
    title: 'Highest Score Wins!',
    description: 'Secret objectives & token rankings determine the winner. Outsmart your opponents!',
  },
]

export default function HomePage() {
  const router = useRouter()

  // Create Room state
  const [createName, setCreateName] = useState('')
  const [numPlayers, setNumPlayers] = useState(2)

  // Join Room state
  const [joinName, setJoinName] = useState('')
  const [joinInput, setJoinInput] = useState('')

  const handleCreate = () => {
    if (!createName.trim()) return
    const code = generateRoomCode()
    const params = new URLSearchParams({
      host: 'true',
      name: createName.trim(),
      players: String(numPlayers),
    })
    router.push(`/lobby/${code}?${params.toString()}`)
  }

  const handleJoin = () => {
    if (!joinName.trim()) return
    let code = joinInput.trim().toUpperCase()

    // If it looks like a URL, extract the code from the last path segment
    if (code.includes('/')) {
      const parts = code.split('/')
      const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || ''
      // Strip query params
      code = lastPart.split('?')[0].substring(0, 4).toUpperCase()
    }

    if (code.length !== 4) return

    const params = new URLSearchParams({
      name: joinName.trim(),
    })
    router.push(`/lobby/${code}?${params.toString()}`)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-10 sm:py-16">
        {/* ── Hero Section ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Floating token decoration */}
          <div className="flex justify-center gap-2 mb-4">
            {ALL_TOKENS.slice(0, 5).map((id, i) => (
              <motion.div
                key={id}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
              >
                <Token id={id} size="sm" />
              </motion.div>
            ))}
          </div>

          <h1 className="font-heading text-5xl sm:text-7xl font-bold mb-3">
            <span className="bg-gradient-to-r from-accent via-accent-secondary to-cyan-400 bg-clip-text text-transparent">
              🌺 Tiki Topple
            </span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-md mx-auto">
            The Stack Battle Game — Outsmart, Outstack, Win
          </p>
        </motion.div>

        {/* ── Cards Section ── */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* CREATE ROOM card */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="glass-card p-6 sm:p-8 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🏠</span>
              <h2 className="font-heading text-xl font-semibold text-white">
                Create Room
              </h2>
            </div>

            <label className="text-sm text-white/50 mb-1.5">Your Name</label>
            <input
              id="create-name"
              type="text"
              placeholder="e.g. Tiki Master"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/30 outline-none
                         focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200 mb-4"
            />

            <label className="text-sm text-white/50 mb-1.5">
              Number of Players
            </label>
            <select
              id="num-players"
              value={numPlayers}
              onChange={(e) => setNumPlayers(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-white outline-none appearance-none
                         focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200 mb-6 cursor-pointer"
            >
              <option value={2} className="bg-surface text-white">
                2 Players
              </option>
              <option value={3} className="bg-surface text-white">
                3 Players
              </option>
              <option value={4} className="bg-surface text-white">
                4 Players
              </option>
            </select>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCreate}
              disabled={!createName.trim()}
              className="w-full mt-auto"
            >
              Create Room →
            </Button>
          </motion.div>

          {/* JOIN ROOM card */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="glass-card p-6 sm:p-8 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🎯</span>
              <h2 className="font-heading text-xl font-semibold text-white">
                Join Room
              </h2>
            </div>

            <label className="text-sm text-white/50 mb-1.5">Your Name</label>
            <input
              id="join-name"
              type="text"
              placeholder="e.g. Tiki Warrior"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/30 outline-none
                         focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200 mb-4"
            />

            <label className="text-sm text-white/50 mb-1.5">
              Room Code or Link
            </label>
            <input
              id="room-code"
              type="text"
              placeholder="Enter code (TIKI) or paste link"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/30 outline-none
                         font-body text-sm
                         focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200 mb-6"
            />

            <Button
              variant="secondary"
              size="lg"
              onClick={handleJoin}
              disabled={!joinName.trim() || joinInput.trim().length < 4}
              className="w-full mt-auto"
            >
              Join Room →
            </Button>
          </motion.div>
        </div>

        {/* ── Token Color Preview ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="mt-10 sm:mt-14 text-center"
        >
          <p className="text-white/30 text-sm mb-3">9 Tiki Tokens</p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            {ALL_TOKENS.map((id) => (
              <Token key={id} id={id} size="sm" />
            ))}
          </div>
        </motion.div>

        {/* ── How to Play ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="mt-14 sm:mt-20 w-full max-w-3xl"
        >
          <h2 className="text-center font-heading text-xl text-white/60 mb-6">
            How to Play
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_TO_PLAY.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className="glass-card p-5 text-center"
              >
                <div className="text-3xl mb-3">{step.emoji}</div>
                <h3 className="font-heading text-base font-semibold text-white mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {step.description}
                </p>
                <div className="mt-2 text-[10px] text-white/15 font-heading">
                  Step {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-white/20 text-xs"
        >
          Built with 🌴 for game night
        </motion.p>
      </div>
    </div>
  )
}
