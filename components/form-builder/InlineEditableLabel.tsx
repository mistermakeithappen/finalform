'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Edit2 } from 'lucide-react'

interface InlineEditableLabelProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  required?: boolean
}

export function InlineEditableLabel({
  value,
  onChange,
  className,
  placeholder = 'Field Label',
  required = false
}: InlineEditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setTempValue(value)
  }

  const handleSave = () => {
    onChange(tempValue || placeholder)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "text-sm font-medium bg-background border-b-2 border-primary outline-none px-1 py-0.5",
          className
        )}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div 
      className={cn(
        "group inline-flex items-center gap-1 cursor-text hover:bg-muted/50 rounded px-1 py-0.5 -ml-1",
        className
      )}
      onClick={handleStartEdit}
    >
      <span className="text-sm font-medium">
        {value || placeholder}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  )
}