'use client'

import React from 'react'
import { DateField as DateFieldType } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  field: DateFieldType
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function DateField({ field, value, onChange, onBlur, disabled, error }: DateFieldProps) {
  const inputType = field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'datetime-local'
  
  return (
    <Input
      type={inputType}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      min={field.minDate}
      max={field.maxDate}
      className={cn(error && 'border-destructive')}
    />
  )
}