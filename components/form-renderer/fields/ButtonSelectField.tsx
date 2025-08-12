'use client'

/* 
 * Tailwind CSS class safelist for dynamic grid columns
 * Ensures these classes are included in production build:
 * grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4
 */

import React, { useState, useEffect } from 'react'
import { ButtonSelectField as ButtonSelectFieldType } from '@/lib/types/form'
import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ButtonSelectFieldProps {
  field: ButtonSelectFieldType
  value: string | string[]
  onChange: (value: string | string[]) => void
  onNavigate?: (targetPage: number) => void
  error?: string
  preview?: boolean
}

export function ButtonSelectField({ 
  field, 
  value, 
  onChange, 
  onNavigate,
  error, 
  preview = false 
}: ButtonSelectFieldProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    if (field.allowMultiple) {
      return Array.isArray(value) ? value : (value ? [value] : [])
    }
    return value ? [value as string] : []
  })

  useEffect(() => {
    if (field.allowMultiple) {
      const newValue = Array.isArray(value) ? value : (value ? [value] : [])
      setSelectedValues(newValue)
    } else {
      setSelectedValues(value ? [value as string] : [])
    }
  }, [value, field.allowMultiple])

  const handleSelect = (optionValue: string, targetPage?: number) => {
    let newValues: string[]
    
    if (field.allowMultiple) {
      if (selectedValues.includes(optionValue)) {
        newValues = selectedValues.filter(v => v !== optionValue)
      } else {
        newValues = [...selectedValues, optionValue]
      }
      onChange(newValues)
      setSelectedValues(newValues)
    } else {
      newValues = [optionValue]
      onChange(optionValue)
      setSelectedValues(newValues)
      
      // Navigate immediately if target page is set (no toggle required)
      if (targetPage && onNavigate && !preview) {
        setTimeout(() => onNavigate(targetPage), 300) // Small delay for visual feedback
      }
    }
  }

  const buttonSizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-4 text-base',
    large: 'p-6 text-lg',
    xl: 'p-8 text-xl'
  }

  const buttonSize = field.buttonSize || 'large'
  const layout = field.layout || 'vertical'
  const columns = field.columns || 1

  if (!field.options || field.options.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500">No options configured</p>
        {preview && (
          <p className="text-xs text-gray-400 mt-2">Add options in the property panel</p>
        )}
      </div>
    )
  }

  // Use explicit grid classes to ensure Tailwind includes them
  const getGridClass = () => {
    if (layout !== 'grid') return 'flex flex-col gap-3'
    
    switch (columns) {
      case 2:
        return 'grid grid-cols-2 gap-3'
      case 3:
        return 'grid grid-cols-3 gap-3'
      case 4:
        return 'grid grid-cols-4 gap-3'
      default:
        return 'grid grid-cols-1 gap-3'
    }
  }

  return (
    <div className={cn(getGridClass(), 'w-full')}>
      {field.options.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          const hasTargetPage = option.targetPage && option.targetPage > 0
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value, option.targetPage)}
              className={cn(
                'relative flex items-start justify-between rounded-lg border-2 transition-all duration-200',
                'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                buttonSizeClasses[buttonSize],
                isSelected ? 
                  'border-primary bg-primary/5 text-primary shadow-sm' : 
                  'border-gray-200 bg-white hover:border-gray-300',
                'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                field.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
              disabled={field.disabled || preview}
            >
              <div className="flex items-start gap-3 w-full">
                {field.showIcon && option.icon && (
                  <div className={cn(
                    'flex-shrink-0',
                    buttonSize === 'xl' ? 'text-3xl' : 
                    buttonSize === 'large' ? 'text-2xl' : 
                    buttonSize === 'medium' ? 'text-xl' : 
                    'text-lg'
                  )}>
                    {option.icon}
                  </div>
                )}
                
                <div className="flex-1 text-left">
                  <div className={cn(
                    'font-semibold',
                    option.color && `text-[${option.color}]`
                  )}>
                    {option.label}
                  </div>
                  
                  {field.showDescription && option.description && (
                    <div className={cn(
                      'mt-1 text-gray-600',
                      buttonSize === 'xl' ? 'text-base' : 
                      buttonSize === 'large' ? 'text-sm' : 
                      'text-xs'
                    )}>
                      {option.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  
                  {hasTargetPage && (
                    <ChevronRight className={cn(
                      'text-gray-400',
                      isSelected && 'text-primary'
                    )} />
                  )}
                </div>
              </div>
            </button>
          )
      })}
    </div>
  )
}