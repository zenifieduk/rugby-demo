import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text, voiceId: voiceIdOverride } = await req.json()
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'Missing ELEVENLABS_API_KEY' }, { status: 500 })
    }
    const voiceId = voiceIdOverride || process.env.ELEVENLABS_VOICE_ID
    if (!voiceId) {
      return NextResponse.json({ error: 'Missing ELEVENLABS_VOICE_ID' }, { status: 500 })
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({ text }),
    })
    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => 'upstream error')
      return NextResponse.json({ error: `TTS failed: ${upstream.status} ${errText}` }, { status: 502 })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'TTS route error' }, { status: 500 })
  }
}


