'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { VideoField } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Video, 
  VideoOff, 
  Circle, 
  Square, 
  RotateCcw, 
  Upload, 
  Camera,
  Smartphone,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VideoRecordingFieldProps {
  field: VideoField
  value: any
  onChange: (value: any) => void
  disabled?: boolean
}

export function VideoRecordingField({ 
  field, 
  value, 
  onChange, 
  disabled 
}: VideoRecordingFieldProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [useNativeCamera, setUseNativeCamera] = useState(false)
  const [isReviewingRecording, setIsReviewingRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoAccepted, setVideoAccepted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Check if mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // Calculate video constraints based on resolution setting
  const getVideoConstraints = () => {
    const resolutionMap = {
      '480p': { width: 640, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      'auto': { width: { ideal: 1280 }, height: { ideal: 720 } }
    }
    
    const resolution = resolutionMap[field.resolution || 'auto']
    
    return {
      video: {
        facingMode: field.preferredCamera === 'user' ? 'user' : 
                   field.preferredCamera === 'environment' ? 'environment' : 
                   undefined,
        ...resolution
      },
      audio: field.includeAudio !== false
    }
  }
  
  // Start camera preview
  const startCamera = async () => {
    try {
      setError(null)
      const constraints = getVideoConstraints()
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsPreviewing(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Unable to access camera. Please check permissions.')
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsPreviewing(false)
  }
  
  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera()
    }
    
    chunksRef.current = []
    
    // Set up MediaRecorder with compression settings
    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: field.compressionQuality === 'low' ? 500000 :
                          field.compressionQuality === 'high' ? 2000000 :
                          1000000 // medium default
    }
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current!, options)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)
        setIsReviewingRecording(true)
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          // Auto-stop at max duration
          if (field.maxDuration && newTime >= field.maxDuration) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Unable to start recording. Please try again.')
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      stopCamera()
    }
  }
  
  // Process and compress video
  const processVideo = async (blob: Blob) => {
    setIsCompressing(true)
    setCompressionProgress(0)
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Check file size
      const sizeMB = blob.size / (1024 * 1024)
      
      if (field.maxSize && sizeMB > field.maxSize) {
        setError(`Video size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed (${field.maxSize}MB)`)
        setIsCompressing(false)
        setIsUploading(false)
        return
      }
      
      // Simulate compression progress
      for (let i = 0; i <= 100; i += 10) {
        setCompressionProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Create a file object that can be submitted
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' })
      onChange(file)
      setVideoAccepted(true)
      setIsReviewingRecording(false)
      
    } catch (err) {
      console.error('Processing error:', err)
      setError('Error processing video. Please try again.')
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
    }
  }
  
  // Handle user accepting the recording
  const acceptRecording = async () => {
    if (recordedBlob) {
      await processVideo(recordedBlob)
    }
  }
  
  // Handle user canceling and retrying
  const cancelAndRetry = () => {
    setRecordedBlob(null)
    setIsReviewingRecording(false)
    setRecordingTime(0)
    setError(null)
    setVideoAccepted(false)
    // Restart camera preview
    startCamera()
  }
  
  // Handle native camera file input
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size
      const sizeMB = file.size / (1024 * 1024)
      
      if (field.maxSize && sizeMB > field.maxSize) {
        setError(`Video size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed (${field.maxSize}MB)`)
        return
      }
      
      setRecordedBlob(file)
      setIsReviewingRecording(true)
    }
  }
  
  // Reset recording
  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    setError(null)
    onChange(null)
    setIsReviewingRecording(false)
    setVideoAccepted(false)
    setUploadProgress(0)
    setCompressionProgress(0)
    stopCamera()
  }
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Render native camera option for mobile
  if (isMobile && field.allowNativeCamera !== false && !isPreviewing) {
    return (
      <div className="space-y-4">
        {!recordedBlob && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Use Device Camera
            </Button>
          
            {field.allowUpload && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setUseNativeCamera(true)}
                disabled={disabled}
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-2" />
                Record in Browser
              </Button>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          capture={field.preferredCamera === 'user' ? 'user' : 'environment'}
          onChange={handleFileInput}
          className="hidden"
        />
        
        {recordedBlob && (
          <Card className="p-4">
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full rounded mb-3"
            />
            
            {isReviewingRecording && !isCompressing && !isUploading && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecordedBlob(null)
                    setIsReviewingRecording(false)
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cancel & Retry
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  onClick={acceptRecording}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Use Video
                </Button>
              </div>
            )}
            
            {videoAccepted && !isCompressing && !isUploading && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRecording}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Record Again
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  disabled
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Video Uploaded
                </Button>
              </div>
            )}
            
            {(isCompressing || isUploading) && (
              <div className="space-y-3 mt-3">
                {isCompressing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Compressing video...</p>
                      <span className="text-sm text-muted-foreground">{compressionProgress}%</span>
                    </div>
                    <Progress value={compressionProgress} className="h-2" />
                  </div>
                )}
                
                {isUploading && !isCompressing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Uploading video...</p>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }
  
  // Render browser recording interface
  return (
    <div className="space-y-4">
      {/* Video preview/playback */}
      <Card className="relative overflow-hidden bg-black">
        <div className="aspect-video flex items-center justify-center">
          {(recordedBlob && (isReviewingRecording || videoAccepted)) ? (
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full h-full"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                !isPreviewing && "hidden"
              )}
            />
          )}
          
          {!isPreviewing && !recordedBlob && (
            <div className="text-white/60 text-center">
              <VideoOff className="h-12 w-12 mx-auto mb-2" />
              <p>Camera preview will appear here</p>
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <Circle className="h-3 w-3 fill-current animate-pulse" />
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
          
          {isReviewingRecording && !isCompressing && !isUploading && (
            <div className="absolute top-4 left-4 bg-background/90 text-foreground px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Review Recording</span>
            </div>
          )}
        </div>
      </Card>
      
      {/* Recording controls */}
      <div className="flex gap-2">
        {!recordedBlob && !isRecording && !isReviewingRecording && (
          <Button
            type="button"
            onClick={isPreviewing ? startRecording : startCamera}
            disabled={disabled}
            className="flex-1"
          >
            {isPreviewing ? (
              <>
                <Circle className="h-4 w-4 mr-2" />
                Start Recording
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Open Camera
              </>
            )}
          </Button>
        )}
        
        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {isReviewingRecording && recordedBlob && !isCompressing && !isUploading && (
          <>
            <Button
              type="button"
              onClick={cancelAndRetry}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancel & Retry
            </Button>
            
            <Button
              type="button"
              onClick={acceptRecording}
              variant="default"
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Use Recording
            </Button>
          </>
        )}
        
        {videoAccepted && !isCompressing && !isUploading && (
          <>
            <Button
              type="button"
              onClick={resetRecording}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Record Again
            </Button>
            
            <Button
              type="button"
              variant="default"
              disabled
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Video Uploaded
            </Button>
          </>
        )}
        
        {isPreviewing && !isRecording && !recordedBlob && !isReviewingRecording && (
          <Button
            type="button"
            onClick={stopCamera}
            variant="outline"
          >
            <VideoOff className="h-4 w-4 mr-2" />
            Close Camera
          </Button>
        )}
      </div>
      
      {/* Max duration indicator */}
      {field.maxDuration && isRecording && (
        <Progress 
          value={(recordingTime / field.maxDuration) * 100} 
          className="h-2"
        />
      )}
      
      {/* Compression and upload progress */}
      {(isCompressing || isUploading) && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            {isCompressing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Compressing video...</p>
                  <span className="text-sm text-muted-foreground">{compressionProgress}%</span>
                </div>
                <Progress value={compressionProgress} className="h-2" />
              </div>
            )}
            
            {isUploading && !isCompressing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Uploading video...</p>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* File upload option */}
      {field.allowUpload && !recordedBlob && !isPreviewing && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Video File
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </>
      )}
      
      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Help text */}
      {field.helpText && !error && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  )
}