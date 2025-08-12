'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableFieldItemProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}

export function SortableFieldItem({ field, isSelected, onSelect, onRemove }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-background border rounded-lg p-4 cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50 z-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Field Preview */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{field.label || field.key}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {field.type}
            </span>
            {field.required && (
              <span className="text-destructive text-sm">*</span>
            )}
          </div>
          
          {/* Field Type Specific Preview */}
          {renderFieldPreview(field)}
          
          {field.helpText && (
            <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function renderFieldPreview(field: FormField) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
    case 'currency':
      return (
        <div className="h-9 bg-muted rounded-md border w-full max-w-sm" />
      )
    
    case 'textarea':
      return (
        <div className="h-20 bg-muted rounded-md border w-full max-w-sm" />
      )
    
    case 'select':
      return (
        <div className="h-9 bg-muted rounded-md border w-full max-w-sm flex items-center px-3">
          <span className="text-muted-foreground text-sm">Select...</span>
        </div>
      )
    
    case 'checkbox':
    case 'toggle':
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border rounded" />
          <span className="text-sm text-muted-foreground">
            {field.type === 'checkbox' ? field.text || 'Checkbox' : 'Toggle'}
          </span>
        </div>
      )
    
    case 'radio':
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 2).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 border rounded-full" />
              <span className="text-sm text-muted-foreground">{opt.label}</span>
            </div>
          ))}
        </div>
      )
    
    case 'matrix':
      return (
        <div className="border rounded-md p-2 bg-muted/30">
          <div className="grid grid-cols-4 gap-1 text-xs">
            {field.columns?.slice(0, 4).map((col, i) => (
              <div key={i} className="bg-background px-1 py-0.5 rounded text-center">
                {col.label}
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'section':
      return (
        <div className="text-sm text-muted-foreground">
          Section with {field.fields?.length || 0} fields
        </div>
      )
    
    default:
      return null
  }
}