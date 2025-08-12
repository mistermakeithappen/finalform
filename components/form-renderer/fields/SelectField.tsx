'use client'

import React from 'react'
import { SelectField as SelectFieldType } from '@/lib/types/form'
import { cn } from '@/lib/utils'

interface SelectFieldProps {
  field: SelectFieldType
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function SelectField({ field, value, onChange, onBlur, disabled, error }: SelectFieldProps) {
  if (field.type === 'radio') {
    return (
      <div className="space-y-2">
        {field.options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              className="h-4 w-4"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'multiselect') {
    return (
      <div className="space-y-2">
        {field.options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2">
            <input
              type="checkbox"
              value={option.value}
              checked={Array.isArray(value) && value.includes(option.value)}
              onChange={(e) => {
                const currentValues = Array.isArray(value) ? value : []
                if (e.target.checked) {
                  onChange([...currentValues, option.value])
                } else {
                  onChange(currentValues.filter((v: any) => v !== option.value))
                }
              }}
              onBlur={onBlur}
              disabled={disabled}
              className="h-4 w-4"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive'
      )}
    >
      <option value="">Select...</option>
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}