'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createTikiClient } from '@/lib/boardgame-client'
import TikiBoard from '@/components/game/TikiBoard'
import { motion } from 'framer-motion'

const TikiGame = createTikiClient(TikiBoard)

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const matchID = (params.code as string).toUpperCase()
  
  const [playerID, setPlayerID] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const pID = localStorage.getItem(`tiki-playerID-${matchID}`)
    const creds = localStorage.getItem(`tiki-credentials-${matchID}`)
    
    // If no credentials found, kick back to home page with auto-fill
    if (!pID || !creds) {
      router.replace(`/?join=${matchID}`)
      return
    }
    
    setPlayerID(pID)
    setCredentials(creds)
    setMounted(true)
  }, [matchID, router])

  if (!mounted || !playerID || !credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
           className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <TikiGame 
      matchID={matchID} 
      playerID={playerID} 
      credentials={credentials} 
    />
  )
}

