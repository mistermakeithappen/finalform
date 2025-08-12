'use client'

import React from 'react'
import { SliderField as SliderFieldType } from '@/lib/types/form'

interface SliderFieldProps {
  field: SliderFieldType
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderField({ field, value = 0, onChange, disabled }: SliderFieldProps) {
  const min = field.min || 0
  const max = field.max || 100
  const step = field.step || 1
  
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span className="font-medium text-foreground">{value}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}