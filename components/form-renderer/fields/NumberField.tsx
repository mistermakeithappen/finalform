'use client'

import React from 'react'
import { NumberField as NumberFieldType } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  field: NumberFieldType
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function NumberField({ field, value, onChange, onBlur, disabled, error }: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
    onChange(isNaN(val) ? 0 : val)
  }

  return (
    <div className="relative">
      {field.prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {field.prefix}
        </span>
      )}
      <Input
        type="number"
        step={field.precision ? `0.${'0'.repeat(field.precision - 1)}1` : '1'}
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(
          field.prefix && 'pl-8',
          field.suffix && 'pr-12',
          error && 'border-destructive'
        )}
        placeholder={field.placeholder}
      />
      {field.suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {field.suffix}
        </span>
      )}
    </div>
  )
}