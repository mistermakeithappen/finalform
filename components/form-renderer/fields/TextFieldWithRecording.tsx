'use client'

import React, { useState } from 'react'
import { TextField } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioRecorder } from '../AudioRecorder'

interface TextFieldWithRecordingProps {
  field: TextField
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function TextFieldWithRecording({ 
  field, 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  error 
}: TextFieldWithRecordingProps) {
  const [showRecorder, setShowRecorder] = useState(false)

  const handleTranscription = (text: string) => {
    // Handle append vs replace based on field settings
    if (field.meta?.recordingMode === 'append' && value) {
      onChange(value + ' ' + text)
    } else {
      onChange(text)
    }
    setShowRecorder(false)
  }

  // Apply input mask if configured
  const applyMask = (val: string) => {
    if (!field.mask) return val
    
    // Simple phone mask example
    if (field.mask === '(999) 999-9999') {
      const numbers = val.replace(/\D/g, '')
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    }
    
    return val
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    
    // Apply character limit if set
    if (field.validation?.maxLength) {
      newValue = newValue.slice(0, field.validation.maxLength)
    }
    
    // Apply mask
    if (field.mask) {
      newValue = applyMask(newValue)
    }
    
    // Apply pattern validation for real-time feedback
    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern)
      if (!regex.test(newValue) && newValue !== '') {
        return // Don't update if pattern doesn't match
      }
    }
    
    onChange(newValue)
  }

  const inputType = field.type === 'email' ? 'email' : 
                   field.type === 'phone' ? 'tel' : 
                   field.inputType || 'text'

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={field.placeholder}
          disabled={disabled}
          className={cn(
            error && 'border-destructive',
            field.meta?.recordingEnabled && 'pr-10'
          )}
          autoComplete={field.meta?.autoComplete}
          maxLength={field.validation?.maxLength}
          minLength={field.validation?.minLength}
          pattern={field.validation?.pattern}
          inputMode={field.meta?.inputMode}
        />
        
        {/* Audio Recording Button */}
        {field.meta?.recordingEnabled && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setShowRecorder(!showRecorder)}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Character counter */}
      {field.validation?.maxLength && field.meta?.showCharCount && (
        <p className="text-xs text-muted-foreground text-right">
          {value?.length || 0} / {field.validation.maxLength}
        </p>
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
}