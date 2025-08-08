'use client'
import { VoiceRESTClient } from '@/lib/voice/rest'

export interface VoiceConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  agentId: string | null
  conversationId: string | null
  isListening: boolean
  isSpeaking: boolean
}

export class VoiceWebRTCClient {
  private signalingSocket: WebSocket | null = null
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteAudio: HTMLAudioElement | null = null
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null
  private state: VoiceConnectionState = {
    status: 'disconnected',
    agentId: null,
    conversationId: null,
    isListening: false,
    isSpeaking: false,
  }
  private onStateChange?: (state: VoiceConnectionState) => void

  constructor(onStateChange?: (state: VoiceConnectionState) => void) {
    this.onStateChange = onStateChange
    this.setupAudio()
  }

  private setupAudio() {
    this.remoteAudio = new Audio()
    this.remoteAudio.autoplay = true
    this.remoteAudio.volume = 1
    this.remoteAudio.muted = false
    // Inline playback and attach to DOM to satisfy autoplay policies
    // @ts-expect-error playsInline is supported in modern browsers
    this.remoteAudio.playsInline = true
    try {
      if (typeof document !== 'undefined' && !this.remoteAudio.isConnected) {
        this.remoteAudio.style.display = 'none'
        document.body.appendChild(this.remoteAudio)
      }
    } catch {}

    this.remoteAudio.onloadstart = () => console.log('[Audio] loadstart')
    this.remoteAudio.oncanplay = () => console.log('[Audio] canplay')
    this.remoteAudio.onplay = () => {
      console.log('[Audio] playback started')
      this.updateState({ isSpeaking: true })
    }
    this.remoteAudio.onpause = () => console.log('[Audio] paused')
    this.remoteAudio.onended = () => {
      console.log('[Audio] ended')
      this.updateState({ isSpeaking: false })
    }
    this.remoteAudio.onerror = (error) => console.error('[Audio] error:', error)
  }

  private updateState(updates: Partial<VoiceConnectionState>) {
    this.state = { ...this.state, ...updates }
    this.onStateChange?.(this.state)
  }

  async connect(): Promise<void> {
    if (process.env.NEXT_PUBLIC_VOICE_TRANSPORT === 'rest') {
      console.log('[Voice] Using REST TTS transport')
      this.updateState({ status: 'connected' })
      try {
        const rest = new VoiceRESTClient()
        await rest.speak("Hello. I'm ready. Ask about squad, fixtures, or tables.")
      } catch (e) {
        console.error('[Voice REST] speak failed:', e)
      }
      return
    }
    try {
      this.updateState({ status: 'connecting' })
      console.log('[Voice] Connecting (WebRTC)…')

      // 1) Fetch short-lived token
      const tokenResponse = await fetch('/api/voice/token', {
        method: 'POST',
        credentials: 'include',
      })
      if (!tokenResponse.ok) throw new Error('Failed to get voice token')
      const { token, conversationId, agentId } = await tokenResponse.json()
      console.log('[Voice] Got token. Agent:', agentId, 'Conversation:', conversationId)

      // 2) Prepare local mic
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      this.updateState({ isListening: true })

      // 3) Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Public TURN for testing; replace with production TURN
          {
            urls: [
              'turn:openrelay.metered.ca:80',
              'turn:openrelay.metered.ca:443',
              'turns:openrelay.metered.ca:443',
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      })

      // 4) Add local tracks
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // 5) Handle remote media
      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Remote track:', event.track.kind)
        if (this.remoteAudio && event.streams && event.streams[0]) {
          this.remoteAudio.srcObject = event.streams[0]
          this.remoteAudio
            .play()
            .catch((err) => console.error('[Audio] autoplay failed:', err))
        }
      }

      // 6) Connection state updates
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState
        console.log('[WebRTC] connectionState:', state)
        if (state === 'connected') {
          this.updateState({ status: 'connected', agentId, conversationId })
        }
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.updateState({ status: 'disconnected' })
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('[WebRTC] iceConnectionState:', this.peerConnection?.iceConnectionState)
      }

      this.peerConnection.onsignalingstatechange = () => {
        console.log('[WebRTC] signalingState:', this.peerConnection?.signalingState)
      }

      // 7) Open signaling WebSocket (agent_id required by provider)
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?token=${token}&agent_id=${encodeURIComponent(agentId ?? '')}`
      this.signalingSocket = new WebSocket(wsUrl)

      // 8) Send ICE candidates to server
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalingSocket?.readyState === 1) {
          const payload = {
            type: 'ice_candidate',
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          }
          this.signalingSocket.send(JSON.stringify(payload))
          console.log('[Signaling] sent ICE')
        }
      }

      this.signalingSocket.onopen = async () => {
        console.log('[Signaling] WebSocket open')
        // Consider connection active upon WS open for UX; will refine when PC connects
        this.updateState({ status: 'connected', agentId, conversationId })
        // 9) Create and send offer
        const offer = await this.peerConnection!.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        })
        await this.peerConnection!.setLocalDescription(offer)
        // Send SDP offer in provider-expected schema
        this.signalingSocket!.send(JSON.stringify({ type: 'sdp_offer', sdp: offer.sdp }))
        console.log('[Signaling] sent SDP offer')
      }

      this.signalingSocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data)
          // Expected message types from server: sdp_answer, webrtc_answer, ice_candidate, agent_response, audio_* etc.
          if ((message.type === 'sdp_answer') && message.sdp) {
            await this.peerConnection!.setRemoteDescription({ type: 'answer', sdp: message.sdp })
            console.log('[Signaling] applied SDP answer')
          } else if ((message.type === 'ice_candidate') && message.candidate) {
            try {
              const cand = message.candidate.candidate ? message.candidate : new RTCIceCandidate(message.candidate)
              await this.peerConnection!.addIceCandidate(cand)
              console.log('[Signaling] applied ICE candidate')
            } catch (err) {
              console.error('[Signaling] failed to add ICE:', err)
            }
          } else if (message.type === 'audio_start') {
            this.updateState({ isSpeaking: true })
          } else if (message.type === 'audio_end') {
            this.updateState({ isSpeaking: false })
          } else if (message.type === 'audio' && (message.audio_data || message.audio)) {
            // Realtime WS fallback playback
            const base64 = message.audio_data || message.audio
            if (typeof base64 === 'string') this.playBase64Audio(base64)
          } else if (typeof message.text === 'string') {
            // Some servers emit agent/user messages with text
            this.handleAgentMessage(message.text)
          } else {
            // Log other server messages for debugging
            if (message.type) console.log('[Signaling] message:', message.type)
          }
        } catch (err) {
          console.error('[Signaling] parse error:', err)
        }
      }

      this.signalingSocket.onerror = (err) => {
        console.error('[Signaling] error:', err)
        this.updateState({ status: 'error' })
      }

      this.signalingSocket.onclose = (e) => {
        console.log('[Signaling] closed code=', e.code, 'reason=', e.reason)
        if (this.keepAliveTimer) { clearInterval(this.keepAliveTimer); this.keepAliveTimer = null }
        // Reflect disconnection in state
        this.updateState({ status: 'disconnected' })
      }
    } catch (error) {
      console.error('[Voice] connect error:', error)
      this.updateState({ status: 'error' })
      throw error
    }
  }

  async startListening(): Promise<void> {
    this.updateState({ isListening: true })
  }

  async stopListening(): Promise<void> {
    this.updateState({ isListening: false })
  }

  private handleAgentMessage(message: string) {
    console.log('[Agent]', message)
    if (message.includes('squad') || message.includes('show squad')) {
      this.handleVoiceIntent({ action: 'navigate', target: 'squad' })
    } else if (message.includes('fixtures') || message.includes('show fixtures')) {
      this.handleVoiceIntent({ action: 'navigate', target: 'fixtures' })
    } else if (message.includes('tables') || message.includes('view tables')) {
      this.handleVoiceIntent({ action: 'navigate', target: 'tables' })
    }
  }

  private handleVoiceIntent(intent: any) {
    const evt = new CustomEvent('voiceIntent', { detail: intent })
    window.dispatchEvent(evt)
  }

  async disconnect(): Promise<void> {
    try {
      if (this.signalingSocket) {
        try { this.signalingSocket.close() } catch {}
      }
      this.signalingSocket = null

      if (this.peerConnection) {
        try { this.peerConnection.close() } catch {}
      }
      this.peerConnection = null

      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop())
      }
      this.localStream = null

      this.updateState({
        status: 'disconnected',
        agentId: null,
        conversationId: null,
        isListening: false,
        isSpeaking: false,
      })
    } catch (err) {
      console.error('[Voice] disconnect error:', err)
    }
  }

  getState(): VoiceConnectionState {
    return { ...this.state }
  }

  private extractSdpAnswer(message: any): string | null {
    if (!message) return null
    if (typeof message.sdp === 'string' && message.sdp.includes('v=0') && message.sdp.includes('m=audio')) {
      return message.sdp
    }
    const sdp = message?.payload?.sdp || message?.data?.sdp
    if (typeof sdp === 'string' && sdp.includes('v=0') && sdp.includes('m=audio')) {
      return sdp
    }
    return null
  }

  private playBase64Audio(base64: string) {
    try {
      const binary = atob(base64)
      const len = binary.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)

      const tryPlay = async (blob: Blob) => {
        if (!this.remoteAudio) return
        const url = URL.createObjectURL(blob)
        this.remoteAudio.srcObject = null
        this.remoteAudio.src = url
        await this.remoteAudio.play()
      }

      // First, try as MP3 (common for chunked TTS)
      const mp3Blob = new Blob([bytes], { type: 'audio/mpeg' })
      try {
        void tryPlay(mp3Blob)
        return
      } catch {}

      // Fallback: wrap as PCM16 WAV (assume 16000 Hz mono)
      const wavBlob = this.pcm16ToWav(bytes, 16000, 1)
      try {
        void tryPlay(wavBlob)
        return
      } catch (e) {
        console.error('[Audio] play error (mp3,wav):', e)
      }
    } catch (e) {
      console.error('[Audio] failed to decode base64:', e)
    }
  }

  private pcm16ToWav(pcmBytes: Uint8Array, sampleRate: number, numChannels: number): Blob {
    const byteRate = (sampleRate * numChannels * 16) / 8
    const blockAlign = (numChannels * 16) / 8
    const dataSize = pcmBytes.byteLength
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }

    // RIFF header
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')

    // fmt chunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // PCM
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, 16, true) // bits per sample

    // data chunk
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)
    new Uint8Array(buffer, 44).set(pcmBytes)

    return new Blob([buffer], { type: 'audio/wav' })
  }
}
