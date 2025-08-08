import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST() {
  try {
    // For development, skip auth check and return mock token
    console.log('Voice token request received')
    
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('Missing ELEVENLABS_API_KEY')
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    // Get WebRTC token using the correct endpoint
    const tokenResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.ELEVENLABS_AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get WebRTC token:', tokenResponse.status, errorText)
      throw new Error(`Failed to get WebRTC token: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Got WebRTC token successfully')

    // Try to get session but don't require it for development
    const session = await auth()
    console.log('Session:', session ? 'found' : 'not found')

    return NextResponse.json({
      token: tokenData.token,
      conversationId: tokenData.conversation_id,
      agentId: process.env.ELEVENLABS_AGENT_ID || null,
      userId: session?.user?.id || 'anonymous',
    })

  } catch (error) {
    console.error('Voice token error:', error)
    return NextResponse.json(
      { error: `Failed to generate voice token: ${error.message}` },
      { status: 500 }
    )
  }
}
