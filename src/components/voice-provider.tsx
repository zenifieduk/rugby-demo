'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { VoiceWebRTCClient, VoiceConnectionState } from '@/lib/voice/webrtc'
import { VoiceRESTClient } from '@/lib/voice/rest'

const VoiceControls = dynamic(() => import('./voice-controls').then(mod => ({ default: mod.VoiceControls })), {
  ssr: false
})

interface VoiceContextType {
  voiceClient: VoiceWebRTCClient | null
  state: VoiceConnectionState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  isConnected: boolean
  speak?: (text: string) => Promise<void>
}

const VoiceContext = createContext<VoiceContextType | null>(null)

export function useVoice() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

interface VoiceProviderProps {
  children: ReactNode
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [voiceClient, setVoiceClient] = useState<VoiceWebRTCClient | null>(null)
  const [state, setState] = useState<VoiceConnectionState>({
    status: 'disconnected',
    agentId: null,
    conversationId: null,
    isListening: false,
    isSpeaking: false,
  })
  const [mounted, setMounted] = useState(false)

  const clientRef = useRef<VoiceWebRTCClient | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return

    // Initialize voice client
    const client = new VoiceWebRTCClient((newState) => {
      setState(newState)
    })
    
    setVoiceClient(client)
    clientRef.current = client

    // Listen for voice intents
    const handleVoiceIntent = (event: CustomEvent) => {
      console.log('Voice intent received:', event.detail)
      // Handle voice intents here
      handleIntent(event.detail)
    }

    window.addEventListener('voiceIntent', handleVoiceIntent as EventListener)

    return () => {
      window.removeEventListener('voiceIntent', handleVoiceIntent as EventListener)
      client.disconnect()
    }
  }, [])

  const handleIntent = (intent: any) => {
    // Route voice intents to appropriate actions
    switch (intent.action) {
      case 'navigate':
        if (intent.target === 'squad') {
          window.location.href = '/squad'
        } else if (intent.target === 'fixtures') {
          window.location.href = '/fixtures'
        } else if (intent.target === 'tables') {
          window.location.href = '/tables'
        }
        break
      case 'filter':
        // Dispatch filter events
        const filterEvent = new CustomEvent('voiceFilter', {
          detail: intent.params
        })
        window.dispatchEvent(filterEvent)
        break
      case 'select':
        // Dispatch selection events
        const selectEvent = new CustomEvent('voiceSelect', {
          detail: intent.params
        })
        window.dispatchEvent(selectEvent)
        break
      default:
        console.log('Unknown voice intent:', intent)
    }
  }

  const connect = async () => {
    if (clientRef.current) {
      await clientRef.current.connect()
    }
  }

  const disconnect = async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect()
    }
  }

  const startListening = async () => {
    if (clientRef.current) await clientRef.current.startListening()
  }

  const stopListening = async () => {
    if (clientRef.current) await clientRef.current.stopListening()
  }

  const isConnected = state.status === 'connected'

  const value: VoiceContextType = {
    voiceClient,
    state,
    connect,
    disconnect,
    startListening,
    stopListening,
    isConnected,
    speak: async (text: string) => {
      if (process.env.NEXT_PUBLIC_VOICE_TRANSPORT === 'rest') {
        const rest = new VoiceRESTClient()
        await rest.speak(text)
      }
    },
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
      {mounted && <VoiceControls />}
    </VoiceContext.Provider>
  )
}
