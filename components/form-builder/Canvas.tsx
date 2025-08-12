'use client'

import React, { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FormField, FieldGroupField, FieldWidth } from '@/lib/types/form'
import { SortableFieldItem } from './SortableFieldItem'
import { SortableFieldPreview } from './SortableFieldPreview'
import { SortableFieldGroup } from './SortableFieldGroup'
import { cn } from '@/lib/utils'

interface CanvasProps {
  fields: FormField[]
  selectedField: FormField | null
  onSelectField: (field: FormField | null) => void
  onRemoveField: (fieldId: string) => void
  onUpdateField?: (field: FormField) => void
  onDuplicateField?: (field: FormField) => void
  testValues?: Record<string, any>
  onTestValueChange?: (fieldId: string, value: any) => void
}

export function Canvas({ 
  fields, 
  selectedField, 
  onSelectField, 
  onRemoveField, 
  onUpdateField,
  onDuplicateField,
  testValues = {},
  onTestValueChange
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      type: 'canvas',
      accepts: ['new-field', 'existing-field']
    }
  })

  // Get all field IDs including nested ones for the sortable context
  const getAllFieldIds = useMemo(() => {
    const ids: string[] = []
    fields.forEach(field => {
      ids.push(field.id)
      if (field.type === 'fieldgroup') {
        const fieldGroup = field as FieldGroupField
        fieldGroup.fields?.forEach(nestedField => {
          ids.push(`group-field-${nestedField.id}`)
        })
      }
    })
    return ids
  }, [fields])

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

  // Group fields into rows based on their widths
  const fieldRows = useMemo(() => {
    const rows: FormField[][] = []
    let currentRow: FormField[] = []
    let currentRowWidth = 0

    fields.forEach(field => {
      const fieldWidth = getWidthValue(field.width)
      
      // If field is full width or adding it would exceed row capacity, start new row
      if (fieldWidth === 1 || currentRowWidth + fieldWidth > 1.01) { // 1.01 for floating point tolerance
        if (currentRow.length > 0) {
          rows.push(currentRow)
        }
        currentRow = [field]
        currentRowWidth = fieldWidth
      } else {
        // Add to current row
        currentRow.push(field)
        currentRowWidth += fieldWidth
      }
    })

    // Don't forget the last row
    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return rows
  }, [fields])

  if (fields.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[400px] bg-background rounded-lg border shadow-sm p-8 flex items-center justify-center transition-all",
          isOver && "border-primary shadow-lg bg-primary/5"
        )}
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No fields yet</p>
          <p className="text-sm text-muted-foreground">
            Drag fields from the left panel to get started
          </p>
        </div>
      </div>
    )
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[400px] bg-background rounded-lg border shadow-sm p-8 space-y-4 transition-all",
        isOver && "border-primary shadow-lg bg-primary/5"
      )}
    >
      <SortableContext
        items={getAllFieldIds}
        strategy={verticalListSortingStrategy}
      >
        {fieldRows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4">
            {row.map((field) => {
              const widthClass = getWidthClass(field.width)
              
              // Render field groups with drop zone capability and sortability
              if (field.type === 'fieldgroup') {
                return (
                  <div key={field.id} className={cn(widthClass, "min-w-0")}>
                    <SortableFieldGroup
                      field={field as FieldGroupField}
                      isSelected={selectedField?.id === field.id}
                      onSelect={() => onSelectField(field)}
                      onRemove={() => onRemoveField(field.id)}
                      onUpdate={(updatedField) => onUpdateField?.(updatedField)}
                      onDuplicate={() => {
                        // Deep clone the field group with all its nested fields
                        const duplicatedFieldGroup = {
                          ...field,
                          id: `field_${Date.now()}`,
                          key: `${field.key}_copy`,
                          label: field.label,
                          title: (field as FieldGroupField).title,
                          fields: (field as FieldGroupField).fields.map(nestedField => ({
                            ...nestedField,
                            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            key: `${nestedField.key}_copy`
                          }))
                        }
                        onDuplicateField?.(duplicatedFieldGroup)
                      }}
                      testValues={testValues}
                      onTestValueChange={onTestValueChange}
                    />
                  </div>
                )
              }
              
              // Render regular fields with live preview
              return (
                <div key={field.id} className={cn(widthClass, "min-w-0")}>
                  <SortableFieldPreview
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onSelect={() => onSelectField(field)}
                    onRemove={() => onRemoveField(field.id)}
                    testValue={testValues[field.id]}
                    onTestValueChange={onTestValueChange}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </SortableContext>
    </div>
  )
}