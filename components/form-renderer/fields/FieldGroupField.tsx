'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { FieldGroupField as FieldGroupFieldType, FormField, FieldWidth } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldRenderer } from '../FieldRenderer'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface FieldGroupProps {
  field: FieldGroupFieldType
  value: any[]
  onChange: (value: any[]) => void
  disabled?: boolean
  error?: string
}

export function FieldGroupField({ 
  field, 
  value, 
  onChange, 
  disabled,
  error 
}: FieldGroupProps) {
  const [collapsedInstances, setCollapsedInstances] = useState<Set<number>>(new Set())

  // Ensure value is always an array
  const safeValue = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    return [value]
  }, [value])

  // Initialize with at least one instance if not repeatable
  React.useEffect(() => {
    if (!field.repeatable && (!safeValue || safeValue.length === 0)) {
      onChange([{}])
    } else if (field.repeatable && field.minInstances && safeValue.length < field.minInstances) {
      const newInstances = Array(field.minInstances - safeValue.length).fill({})
      onChange([...safeValue, ...newInstances])
    }
  }, [field.repeatable, field.minInstances, safeValue.length])

  const addInstance = useCallback(() => {
    const newInstance: Record<string, any> = {}
    // Initialize with default values
    field.fields.forEach(subField => {
      if (subField.default !== undefined) {
        newInstance[subField.key] = subField.default
      }
    })
    onChange([...safeValue, newInstance])
  }, [safeValue, onChange, field.fields])

  const removeInstance = useCallback((index: number) => {
    const newValue = safeValue.filter((_, i) => i !== index)
    onChange(newValue)
  }, [safeValue, onChange])

  const updateInstance = useCallback((index: number, instanceData: Record<string, any>) => {
    const newValue = [...safeValue]
    newValue[index] = instanceData
    onChange(newValue)
  }, [safeValue, onChange])

  const updateFieldInInstance = useCallback((instanceIndex: number, fieldKey: string, fieldValue: any) => {
    const newValue = [...safeValue]
    newValue[instanceIndex] = {
      ...newValue[instanceIndex],
      [fieldKey]: fieldValue
    }
    onChange(newValue)
  }, [safeValue, onChange])

  const toggleCollapse = useCallback((index: number) => {
    setCollapsedInstances(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

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
      case 'quarter': return 'w-full md:w-1/4'
      case 'third': return 'w-full md:w-1/3'
      case 'half': return 'w-full md:w-1/2'
      case 'two-thirds': return 'w-full md:w-2/3'
      case 'three-quarters': return 'w-full md:w-3/4'
      case 'full':
      default: return 'w-full'
    }
  }

  // Group fields into rows based on their widths
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

  const renderFieldsForInstance = (instance: Record<string, any>, instanceIndex: number) => {
    return (
      <div className="space-y-4">
        {fieldRows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex flex-wrap gap-4">
            {row.map((subField) => {
              const widthClass = getWidthClass(subField.width)
              return (
                <div key={subField.id} className={cn(widthClass, "min-w-0")}>
                  <FieldRenderer
                    field={subField}
                    value={instance[subField.key]}
                    onChange={(val) => updateFieldInInstance(instanceIndex, subField.key, val)}
                    disabled={disabled}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const canAddMore = !field.maxInstances || safeValue.length < field.maxInstances
  const canRemove = !field.minInstances || safeValue.length > field.minInstances

  // Non-repeatable single instance
  if (!field.repeatable) {
    return (
      <Card className={cn("border-l-4 border-l-primary/30", error && "border-destructive")}>
        {(field.title || field.description) && (
          <CardHeader className="pb-4">
            {field.title && <CardTitle className="text-base">{field.title}</CardTitle>}
            {field.description && (
              <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>
          {safeValue[0] && renderFieldsForInstance(safeValue[0], 0)}
        </CardContent>
      </Card>
    )
  }

  // Repeatable instances
  return (
    <div className="space-y-4">
      {(field.title || field.description) && (
        <div>
          {field.title && <h3 className="text-base font-semibold">{field.title}</h3>}
          {field.description && (
            <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
          )}
        </div>
      )}

      {safeValue.map((instance, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative transition-all",
            "border-l-4 border-l-primary/30",
            error && "border-destructive"
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {field.title || 'Group'} #{index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {field.collapsible && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCollapse(index)}
                  >
                    {collapsedInstances.has(index) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {field.repeatable && canRemove && !disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstance(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <Collapsible open={!collapsedInstances.has(index)}>
            <CollapsibleContent>
              <CardContent>
                {renderFieldsForInstance(instance, index)}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {field.repeatable && canAddMore && !disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={addInstance}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {field.addButtonText || `Add Another ${field.title || 'Group'}`}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}