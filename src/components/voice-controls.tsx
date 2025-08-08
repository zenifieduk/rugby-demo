'use client'

import { useState, useEffect } from 'react'
import { useVoice } from './voice-provider'
import { Button } from './ui/button'
import { Mic } from 'lucide-react'

export function VoiceControls() {
  const { state, connect, disconnect, isConnected } = useVoice()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleConnection = async () => {
    setIsLoading(true)
    try {
      if (isConnected) {
        await disconnect()
      } else {
        await connect()
      }
    } catch (error) {
      console.error('Voice connection error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleToggleConnection}
        disabled={isLoading || state.status === 'connecting'}
        size="lg"
        variant={isConnected ? 'destructive' : 'default'}
        className={`
          flex items-center gap-2 px-6 py-3 text-base font-medium rounded-full shadow-lg
          ${isConnected 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
          }
          ${state.status === 'connecting' ? 'animate-pulse' : ''}
        `}
      >
        <Mic className="w-5 h-5" />
         {isLoading ? 'Connecting...' : isConnected ? 'End Call' : 'Start Voice Call'}
      </Button>
    </div>
  )
}
