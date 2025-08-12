'use client'

import React, { useState, useMemo } from 'react'
import { FieldGroupField as FieldGroupFieldType, FormField, FieldWidth } from '@/lib/types/form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldRenderer } from '../form-renderer/FieldRenderer'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FieldContextMenu } from './FieldContextMenu'

interface SortableFieldGroupProps {
  field: FieldGroupFieldType
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onUpdate: (field: FieldGroupFieldType) => void
  onDuplicate?: () => void
  testValues?: Record<string, any>
  onTestValueChange?: (fieldId: string, value: any) => void
}

interface SortableFieldItemProps {
  field: FormField
  onRemove: () => void
  onSelect: () => void
  isSelected: boolean
  testValue?: any
  onTestValueChange?: (fieldId: string, value: any) => void
}

function InternalSortableFieldItem({ 
  field, 
  onRemove, 
  onSelect, 
  isSelected,
  testValue,
  onTestValueChange,
  onUpdate,
  onDuplicate
}: SortableFieldItemProps & { 
  onUpdate: (field: FormField) => void
  onDuplicate: () => void 
}) {
  // Make this field sortable with a unique ID
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `group-field-${field.id}`,
    data: {
      type: 'group-field',
      field: field
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get preview value for the field
  const getPreviewValue = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return field.placeholder || ''
      case 'number':
      case 'currency':
        return 0
      case 'checkbox':
      case 'toggle':
        return false
      case 'select':
      case 'radio':
        return ''
      case 'multiselect':
        return []
      default:
        return null
    }
  }

  return (
    <FieldContextMenu
      field={field}
      onUpdate={onUpdate}
      onDuplicate={onDuplicate}
      onRemove={onRemove}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "relative group",
          isDragging && "opacity-50 z-50"
        )}
      >
        <div
          onClick={onSelect}
          className={cn(
            "relative rounded-md transition-all cursor-pointer",
            isSelected && "ring-1 ring-primary ring-offset-1",
            !isSelected && "hover:bg-muted/30"
          )}
        >
        {/* Drag handle - subtle on the left */}
        <div className={cn(
          "absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity",
          "opacity-0 group-hover:opacity-50 hover:!opacity-100"
        )}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-move p-1 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        
        {/* Delete button - only when selected */}
        {isSelected && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -right-1 -top-1 h-5 w-5 shadow-sm bg-background hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        )}
        
        {/* Actual field preview */}
        <div className="p-1">
          <FieldRenderer
            field={field}
            value={testValue !== undefined ? testValue : getPreviewValue()}
            onChange={(value) => onTestValueChange?.(field.id, value)}
            disabled={false}
            required={field.required}
            isBuilder={true}
            onFieldUpdate={onUpdate}
          />
        </div>
      </div>
      </div>
    </FieldContextMenu>
  )
}

export function SortableFieldGroup({ 
  field, 
  isSelected, 
  onSelect, 
  onRemove,
  onUpdate,
  onDuplicate,
  testValues = {},
  onTestValueChange
}: SortableFieldGroupProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  // Helper function to get width value for calculations
  const getWidthValue = (width?: FieldWidth): number => {
    switch(width) {
      case 'quarter': return 0.25
      case 'third': return 0.333
      case 'half': return 0.5
      case 'two-thirds': return 0.667
      case 'three-quarters': return 0.75
      case 'full':
      default: return 1
    }
  }

  // Helper function to get Tailwind width classes
  const getWidthClass = (width?: FieldWidth): string => {
    switch(width) {
      case 'quarter': return 'w-1/4'
      case 'third': return 'w-1/3'
      case 'half': return 'w-1/2'
      case 'two-thirds': return 'w-2/3'
      case 'three-quarters': return 'w-3/4'
      case 'full':
      default: return 'w-full'
    }
  }

  // Group nested fields into rows based on their widths
  const fieldRows = useMemo(() => {
    const rows: FormField[][] = []
    let currentRow: FormField[] = []
    let currentRowWidth = 0

    field.fields.forEach(childField => {
      const fieldWidth = getWidthValue(childField.width)
      
      // If field is full width or adding it would exceed row capacity, start new row
      if (fieldWidth === 1 || currentRowWidth + fieldWidth > 1.01) { // 1.01 for floating point tolerance
        if (currentRow.length > 0) {
          rows.push(currentRow)
        }
        currentRow = [childField]
        currentRowWidth = fieldWidth
      } else {
        // Add to current row
        currentRow.push(childField)
        currentRowWidth += fieldWidth
      }
    })

    // Don't forget the last row
    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return rows
  }, [field.fields])
  
  // Make the field group itself sortable
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
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

  // Also make it droppable for accepting new fields
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `fieldgroup-${field.id}`,
    data: {
      type: 'fieldgroup',
      field: field,
      accepts: ['new-field', 'existing-field']
    }
  })

  // Combine both refs
  const setNodeRef = (element: HTMLElement | null) => {
    setSortableRef(element)
    setDroppableRef(element)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const removeChildField = (index: number) => {
    const newFields = field.fields.filter((_, i) => i !== index)
    onUpdate({ ...field, fields: newFields })
  }

  const updateChildField = (index: number, updatedField: FormField) => {
    const newFields = [...field.fields]
    newFields[index] = updatedField
    onUpdate({ ...field, fields: newFields })
  }

  const duplicateChildField = (index: number) => {
    const fieldToDuplicate = field.fields[index]
    const duplicatedField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      key: `${fieldToDuplicate.key}_copy`,
      label: fieldToDuplicate.label
    }
    const newFields = [...field.fields]
    newFields.splice(index + 1, 0, duplicatedField)
    onUpdate({ ...field, fields: newFields })
  }

  const selectChildField = (childId: string) => {
    setSelectedChildId(childId)
  }

  // Default duplicate handler if not provided
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate()
    }
  }

  return (
    <FieldContextMenu
      field={field}
      onUpdate={(updatedField) => onUpdate(updatedField as FieldGroupFieldType)}
      onDuplicate={handleDuplicate}
      onRemove={onRemove}
    >
      <div
        ref={setNodeRef}
        style={style}
        onClick={onSelect}
        className={cn(
          "relative rounded-lg transition-all",
          isDragging && "opacity-50 z-50",
          isSelected && "ring-2 ring-primary",
          !isSelected && "hover:ring-1 hover:ring-primary/50"
        )}
      >
        <Card className={cn(
        "border-2 border-dashed border-red-500 transition-all",
        isOver && "bg-red-50",
        !isOver && "bg-background"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Drag handle for the entire field group */}
              <button
                {...attributes}
                {...listeners}
                className="cursor-move touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <h4 className="font-semibold text-sm">
                  {field.title || field.label || 'Field Group'}
                </h4>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {field.fields.length > 0 && (
            <div className="space-y-2 mb-2">
              {fieldRows.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-2">
                  {row.map((childField) => {
                    const widthClass = getWidthClass(childField.width)
                    const fieldIndex = field.fields.findIndex(f => f.id === childField.id)
                    
                    return (
                      <div key={childField.id} className={cn(widthClass, "min-w-0")}>
                        <InternalSortableFieldItem
                          field={childField}
                          onRemove={() => removeChildField(fieldIndex)}
                          onUpdate={(updatedField) => updateChildField(fieldIndex, updatedField)}
                          onDuplicate={() => duplicateChildField(fieldIndex)}
                          onSelect={() => selectChildField(childField.id)}
                          isSelected={selectedChildId === childField.id}
                          testValue={testValues[childField.id]}
                          onTestValueChange={onTestValueChange}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          
          {/* Drop zone for adding new fields */}
          <div className={cn(
            "flex items-center justify-center py-8 px-4 rounded-md border-2 border-dashed transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20",
            field.fields.length === 0 ? "" : "mt-2"
          )}>
            <p className="text-sm text-muted-foreground text-center">
              {isOver ? "Drop field here" : field.fields.length === 0 ? "Drag fields here to group them" : "Drag more fields here"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </FieldContextMenu>
  )
}