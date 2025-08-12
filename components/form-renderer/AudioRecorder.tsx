'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  fieldKey: string
  formId: string
  onTranscription: (text: string) => void
  mode?: 'inline' | 'meeting'
  className?: string
}

export function AudioRecorder({ 
  fieldKey, 
  formId, 
  onTranscription, 
  mode = 'inline',
  className 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      
      // Check if org has OpenAI key configured
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: orgUser } = await supabase
          .from('org_users')
          .select('org_id')
          .eq('user_id', user.id)
          .single()
        
        if (orgUser) {
          const { data: integration } = await supabase
            .from('org_integrations')
            .select('id')
            .eq('org_id', orgUser.org_id)
            .eq('provider', 'openai')
            .single()
          
          if (!integration) {
            setError('OpenAI API key not configured. Please add it in settings.')
            return
          }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }
  
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Upload audio to Supabase Storage
      const fileName = `${formId}/${fieldKey}/${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob)
      
      if (uploadError) throw uploadError
      
      // Call transcription API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('fieldKey', fieldKey)
      formData.append('storagePath', uploadData.path)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }
      
      const { transcription } = await response.json()
      onTranscription(transcription)
      
    } catch (err: any) {
      console.error('Error processing audio:', err)
      setError(err.message || 'Failed to process audio')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  if (mode === 'meeting') {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 z-50",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Meeting Recorder</p>
            {isRecording && (
              <p className="text-xs text-muted-foreground">
                Recording: {formatTime(recordingTime)}
              </p>
            )}
            {isProcessing && (
              <p className="text-xs text-muted-foreground">Processing...</p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
          
          <Button
            type="button"
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <MicOff className="h-4 w-4 mr-2" />
            Stop ({formatTime(recordingTime)})
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Record
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}