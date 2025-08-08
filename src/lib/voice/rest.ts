'use client'

export class VoiceRESTClient {
  private audio: HTMLAudioElement
  constructor() {
    this.audio = new Audio()
    // @ts-expect-error playsInline is supported
    this.audio.playsInline = true
    this.audio.autoplay = true
    if (typeof document !== 'undefined') {
      this.audio.style.display = 'none'
      document.body.appendChild(this.audio)
    }
  }

  async speak(text: string, voiceId?: string) {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    this.audio.src = url
    await this.audio.play()
  }
}


