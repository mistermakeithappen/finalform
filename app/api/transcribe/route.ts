import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user's org and check for OpenAI integration
    const { data: orgUser } = await supabase
      .from('org_users')
      .select('org_id')
      .eq('user_id', user.id)
      .single()
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    const { data: integration } = await supabase
      .from('org_integrations')
      .select('api_key_cipher')
      .eq('org_id', orgUser.org_id)
      .eq('provider', 'openai')
      .single()
    
    if (!integration) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add it in settings.' },
        { status: 400 }
      )
    }
    
    // Get the audio file from the request
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const fieldKey = formData.get('fieldKey') as string
    const storagePath = formData.get('storagePath') as string
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }
    
    // Here we would decrypt the API key (in production, use a proper KMS)
    // For now, we'll use it directly (you should implement proper encryption)
    const openaiApiKey = integration.api_key_cipher
    
    // Call OpenAI Whisper API
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioFile)
    openaiFormData.append('model', 'whisper-1')
    openaiFormData.append('language', 'en')
    
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: openaiFormData
    })
    
    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Transcription failed. Please check your OpenAI API key.' },
        { status: 500 }
      )
    }
    
    const { text: transcription } = await openaiResponse.json()
    
    // Store transcription record
    await supabase
      .from('transcriptions')
      .insert({
        recording_id: crypto.randomUUID(), // In production, link to actual recording
        status: 'succeeded',
        provider: 'openai-whisper-1',
        language: 'en',
        text: transcription,
        completed_at: new Date().toISOString()
      })
    
    return NextResponse.json({
      transcription,
      fieldKey,
      storagePath
    })
    
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}