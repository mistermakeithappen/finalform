'use client'

import React, { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '@/lib/types/form'
import { FieldRenderer } from '../form-renderer/FieldRenderer'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldContextMenu } from './FieldContextMenu'
import { useFormBuilderStore } from '@/lib/stores/form-builder'

interface SortableFieldPreviewProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  testValue?: any
  onTestValueChange?: (fieldId: string, value: any) => void
}

export function SortableFieldPreview({ 
  field, 
  isSelected, 
  onSelect, 
  onRemove,
  testValue,
  onTestValueChange
}: SortableFieldPreviewProps) {
  const [localValue, setLocalValue] = useState(testValue)
  const { updateField, addField } = useFormBuilderStore()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field: field
    }
  })

  const handleDuplicate = () => {
    const duplicatedField = {
      ...field,
      id: `field_${Date.now()}`,
      key: `${field.key}_copy`,
      label: field.label
    }
    addField(duplicatedField)
  }

  useEffect(() => {
    setLocalValue(testValue)
  }, [testValue])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get initial value for field
  const getInitialValue = () => {
    if (localValue !== undefined) return localValue
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return ''
      case 'number':
      case 'currency':
        return ''
      case 'checkbox':
      case 'toggle':
        return false
      case 'select':
      case 'radio':
        return ''
      case 'multiselect':
        return []
      case 'date':
        return ''
      case 'matrix':
      case 'fieldgroup':
        return []
      default:
        return null
    }
  }

  const handleValueChange = (value: any) => {
    setLocalValue(value)
    if (onTestValueChange) {
      onTestValueChange(field.id, value)
    }
  }

  return (
    <FieldContextMenu
      field={field}
      onUpdate={updateField}
      onDuplicate={handleDuplicate}
      onRemove={onRemove}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative transition-all",
          isDragging && "opacity-50 z-50"
        )}
      >
        <div
          onClick={onSelect}
          className={cn(
            "relative rounded-md transition-all cursor-pointer",
            isSelected 
              ? "ring-2 ring-primary ring-offset-2" 
              : "hover:bg-muted/50",
          )}
        >
        {/* Drag handle - subtle and on the left */}
        <div className={cn(
          "absolute -left-8 top-1/2 -translate-y-1/2 transition-opacity",
          isSelected || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-50 hover:!opacity-100"
        )}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-move p-1.5 hover:bg-muted rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Action buttons - only show when selected */}
        {isSelected && (
          <div className="absolute -right-2 top-0 flex gap-1 -translate-y-1/2">
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 shadow-md bg-background"
              onClick={(e) => {
                e.stopPropagation()
                // Settings are handled by selecting the field
              }}
              title="Edit Field Properties"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 shadow-md bg-background hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              title="Delete Field"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Actual field preview - looks exactly like the real form */}
        <div className={cn(
          "transition-all p-2 rounded-md",
          isSelected && "bg-primary/5"
        )}>
          <FieldRenderer
            field={field}
            value={getInitialValue()}
            onChange={handleValueChange}
            disabled={false} // Allow interaction in test mode
            required={field.required}
            isBuilder={true}
            onFieldUpdate={updateField}
          />
        </div>
      </div>
      </div>
    </FieldContextMenu>
  )
}