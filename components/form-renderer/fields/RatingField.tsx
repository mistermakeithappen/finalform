'use client'

import React from 'react'
import { RatingField as RatingFieldType } from '@/lib/types/form'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingFieldProps {
  field: RatingFieldType
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function RatingField({ field, value = 0, onChange, disabled }: RatingFieldProps) {
  const maxRating = field.maxRating || 5
  
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          disabled={disabled}
          className={cn(
            "p-1 transition-colors",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              rating <= value ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}