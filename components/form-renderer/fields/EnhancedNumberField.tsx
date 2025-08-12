'use client'

import React, { useState, useEffect } from 'react'
import { FormField } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedNumberFieldProps {
  field: FormField
  value: number | string
  onChange: (value: number | string) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function EnhancedNumberField({ 
  field, 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  error 
}: EnhancedNumberFieldProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [focused, setFocused] = useState(false)

  // Parse numeric value
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0

  // Format number for display
  useEffect(() => {
    if (!focused) {
      setDisplayValue(formatNumber(numericValue))
    }
  }, [numericValue, focused])

  const formatNumber = (num: number): string => {
    if (field.type === 'currency') {
      const currency = field.meta?.currency || 'USD'
      const locale = field.meta?.locale || 'en-US'
      
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: field.meta?.decimalPlaces ?? 2,
          maximumFractionDigits: field.meta?.decimalPlaces ?? 2,
        }).format(num)
      } catch {
        return `$${num.toFixed(field.meta?.decimalPlaces ?? 2)}`
      }
    }
    
    if (field.meta?.format === 'percentage') {
      return `${(num * 100).toFixed(field.meta?.decimalPlaces ?? 0)}%`
    }
    
    if (field.meta?.thousandsSeparator) {
      const locale = field.meta?.locale || 'en-US'
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: field.meta?.decimalPlaces ?? 0,
        maximumFractionDigits: field.meta?.decimalPlaces ?? 2,
      }).format(num)
    }
    
    return num.toFixed(field.meta?.decimalPlaces ?? 0)
  }

  const parseInputValue = (input: string): number => {
    // Remove currency symbols and formatting
    let cleaned = input.replace(/[$,\s%]/g, '')
    
    // Handle percentage input
    if (field.meta?.format === 'percentage') {
      const val = parseFloat(cleaned)
      return isNaN(val) ? 0 : val / 100
    }
    
    const val = parseFloat(cleaned)
    return isNaN(val) ? 0 : val
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDisplayValue(input)
    
    // Allow typing negative sign and decimal point
    if (input === '-' || input === '.' || input === '-.') {
      return
    }
    
    const numValue = parseInputValue(input)
    
    // Apply min/max constraints
    let constrainedValue = numValue
    if (field.validation?.min !== undefined && numValue < field.validation.min) {
      constrainedValue = field.validation.min
    }
    if (field.validation?.max !== undefined && numValue > field.validation.max) {
      constrainedValue = field.validation.max
    }
    
    onChange(constrainedValue)
  }

  const handleIncrement = () => {
    const step = field.meta?.step || 1
    const newValue = numericValue + step
    
    if (field.validation?.max !== undefined && newValue > field.validation.max) {
      onChange(field.validation.max)
    } else {
      onChange(newValue)
    }
  }

  const handleDecrement = () => {
    const step = field.meta?.step || 1
    const newValue = numericValue - step
    
    if (field.validation?.min !== undefined && newValue < field.validation.min) {
      onChange(field.validation.min)
    } else {
      onChange(newValue)
    }
  }

  // Slider input mode
  if (field.meta?.inputMode === 'slider') {
    const min = field.validation?.min ?? 0
    const max = field.validation?.max ?? 100
    const step = field.meta?.step ?? 1
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Slider
            value={[numericValue]}
            onValueChange={([v]) => onChange(v)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="flex-1 mr-4"
          />
          <div className="w-20 text-right font-medium">
            {formatNumber(numericValue)}
          </div>
        </div>
        
        {field.meta?.showScale && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatNumber(min)}</span>
            <span>{formatNumber(max)}</span>
          </div>
        )}
      </div>
    )
  }

  // Stepper input mode
  if (field.meta?.inputMode === 'stepper') {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || (field.validation?.min !== undefined && numericValue <= field.validation.min)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Input
          type="text"
          value={focused ? displayValue : formatNumber(numericValue)}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true)
            setDisplayValue(numericValue.toString())
          }}
          onBlur={() => {
            setFocused(false)
            onBlur?.()
          }}
          disabled={disabled}
          className={cn(
            "text-center w-32",
            error && "border-destructive"
          )}
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || (field.validation?.max !== undefined && numericValue >= field.validation.max)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Default input with optional prefix/suffix
  return (
    <div className="relative">
      {field.meta?.prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {field.meta.prefix}
        </span>
      )}
      
      <Input
        type={focused ? "text" : "text"}
        inputMode="decimal"
        value={focused ? displayValue : formatNumber(numericValue)}
        onChange={handleInputChange}
        onFocus={() => {
          setFocused(true)
          setDisplayValue(numericValue.toString())
        }}
        onBlur={() => {
          setFocused(false)
          onBlur?.()
        }}
        placeholder={field.placeholder}
        disabled={disabled}
        className={cn(
          error && "border-destructive",
          field.meta?.prefix && "pl-10",
          field.meta?.suffix && "pr-10"
        )}
        min={field.validation?.min}
        max={field.validation?.max}
        step={field.meta?.step}
      />
      
      {field.meta?.suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {field.meta.suffix}
        </span>
      )}
      
      {/* Min/Max hints */}
      {(field.validation?.min !== undefined || field.validation?.max !== undefined) && 
       field.meta?.showRange && (
        <p className="text-xs text-muted-foreground mt-1">
          {field.validation?.min !== undefined && (
            <span>Min: {formatNumber(field.validation.min)}</span>
          )}
          {field.validation?.min !== undefined && field.validation?.max !== undefined && (
            <span> • </span>
          )}
          {field.validation?.max !== undefined && (
            <span>Max: {formatNumber(field.validation.max)}</span>
          )}
        </p>
      )}
    </div>
  )
}