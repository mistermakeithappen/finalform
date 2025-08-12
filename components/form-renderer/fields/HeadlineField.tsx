'use client'

import React from 'react'
import { HeadlineField as HeadlineFieldType } from '@/lib/types/form'
import { cn } from '@/lib/utils'

interface HeadlineFieldProps {
  field: HeadlineFieldType
}

export function HeadlineField({ field }: HeadlineFieldProps) {
  const HeadingTag = field.level || 'h2'
  
  const getHeadingStyles = () => {
    switch (field.level) {
      case 'h1':
        return 'text-4xl font-bold'
      case 'h2':
        return 'text-3xl font-bold'
      case 'h3':
        return 'text-2xl font-semibold'
      case 'h4':
        return 'text-xl font-semibold'
      case 'h5':
        return 'text-lg font-medium'
      case 'h6':
        return 'text-base font-medium'
      default:
        return 'text-2xl font-semibold'
    }
  }

  const getAlignment = () => {
    switch (field.alignment) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <div className="py-2">
      <HeadingTag 
        className={cn(
          getHeadingStyles(),
          getAlignment(),
          "text-foreground",
          field.className
        )}
      >
        {field.text || field.label || 'Headline'}
      </HeadingTag>
      {field.helpText && (
        <p className={cn(
          "text-sm text-muted-foreground mt-1",
          getAlignment()
        )}>
          {field.helpText}
        </p>
      )}
    </div>
  )
}