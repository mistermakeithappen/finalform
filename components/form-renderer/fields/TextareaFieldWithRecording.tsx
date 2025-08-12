'use client'

import React, { useState } from 'react'
import { FormField } from '@/lib/types/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mic, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioRecorder } from '../AudioRecorder'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TextareaFieldWithRecordingProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function TextareaFieldWithRecording({ 
  field, 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  error 
}: TextareaFieldWithRecordingProps) {
  const [showRecorder, setShowRecorder] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [charCount, setCharCount] = useState(value?.length || 0)

  const handleTranscription = (text: string) => {
    // Handle append vs replace based on field settings
    if (field.meta?.recordingMode === 'append' && value) {
      onChange(value + '\n\n' + text)
    } else {
      onChange(text)
    }
    setShowRecorder(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    
    // Apply character limit if set
    if (field.validation?.maxLength) {
      newValue = newValue.slice(0, field.validation.maxLength)
    }
    
    setCharCount(newValue.length)
    onChange(newValue)
  }

  const textareaContent = (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value || ''}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={field.placeholder}
          disabled={disabled}
          className={cn(
            error && 'border-destructive',
            field.meta?.resizable === false && 'resize-none',
            'min-h-[100px]'
          )}
          rows={field.meta?.rows || 4}
          maxLength={field.validation?.maxLength}
          minLength={field.validation?.minLength}
          spellCheck={field.meta?.spellCheck !== false}
          style={{
            minHeight: field.meta?.minHeight ? `${field.meta.minHeight}px` : undefined,
            maxHeight: field.meta?.maxHeight ? `${field.meta.maxHeight}px` : undefined,
          }}
        />
        
        {/* Control buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Audio Recording Button */}
          {field.meta?.recordingEnabled && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowRecorder(!showRecorder)}
              title="Record audio"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
          
          {/* Expand/Collapse Button */}
          {field.meta?.expandable && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Character/Word counter */}
      {(field.validation?.maxLength || field.meta?.showWordCount) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <div>
            {field.meta?.showWordCount && (
              <span>{value ? value.trim().split(/\s+/).length : 0} words</span>
            )}
          </div>
          <div>
            {field.validation?.maxLength && field.meta?.showCharCount !== false && (
              <span>{charCount} / {field.validation.maxLength}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Recording UI */}
      {showRecorder && field.meta?.recordingEnabled && (
        <AudioRecorder
          fieldKey={field.key}
          formId={field.meta?.formId || 'form'}
          onTranscription={handleTranscription}
          mode="inline"
          className="mt-2"
        />
      )}
      
      {/* Format hint */}
      {field.meta?.formatHint && (
        <p className="text-xs text-muted-foreground">{field.meta.formatHint}</p>
      )}
    </div>
  )

  if (isExpanded) {
    return (
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{field.label || 'Text Editor'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {textareaContent}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return textareaContent
}