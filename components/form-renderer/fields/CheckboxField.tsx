'use client'

import React from 'react'
import { CheckboxField as CheckboxFieldType } from '@/lib/types/form'

interface CheckboxFieldProps {
  field: CheckboxFieldType
  value: boolean
  onChange: (value: boolean) => void
  onBlur?: () => void
  disabled?: boolean
}

export function CheckboxField({ field, value, onChange, onBlur, disabled }: CheckboxFieldProps) {
  if (field.type === 'toggle') {
    return (
      <label className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${value ? 'bg-primary' : 'bg-input'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${value ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        {field.text && <span className="text-sm">{field.text}</span>}
      </label>
    )
  }

  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        disabled={disabled}
        className="h-4 w-4 rounded border-input"
      />
      {field.text && <span className="text-sm">{field.text}</span>}
    </label>
  )
}