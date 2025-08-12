'use client'

import React from 'react'
import { TextAreaField } from '@/lib/types/form'
import { cn } from '@/lib/utils'

interface TextareaFieldProps {
  field: TextAreaField
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function TextareaField({ field, value, onChange, onBlur, disabled, error }: TextareaFieldProps) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={disabled}
      rows={field.rows || 4}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive'
      )}
    />
  )
}