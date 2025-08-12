'use client'

import React, { useState } from 'react'
import { FieldGroupField, FormField, FieldType, FieldWidth } from '@/lib/types/form'
import { sanitizeFieldKey } from '@/lib/utils/field-key-validator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface FieldGroupManagerProps {
  fieldGroup: FieldGroupField
  onUpdate: (field: FieldGroupField) => void
}

const availableFieldTypes: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text Input' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'number', label: 'Number' },
  { type: 'currency', label: 'Currency' },
  { type: 'select', label: 'Dropdown' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Date' },
  { type: 'file', label: 'File Upload' },
]

function SortableFieldItem({ 
  field, 
  onRemove, 
  onUpdate 
}: { 
  field: FormField
  onRemove: () => void
  onUpdate: (field: FormField) => void
}) {
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
        "bg-background border rounded-lg p-3",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
            <Input
              value={field.label || ''}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              placeholder="Field Label"
              className="h-7 text-sm"
            />
          </div>
          
          <Input
            value={field.key || ''}
            onChange={(e) => onUpdate({ ...field, key: sanitizeFieldKey(e.target.value) })}
            placeholder="Field Key (for data)"
            className="h-7 text-xs"
            title="Only lowercase letters, numbers, underscores, and hyphens allowed"
          />
          
          {/* Width selector */}
          <div className="space-y-1">
            <Label className="text-xs">Width</Label>
            <Select
              value={field.width || 'full'}
              onValueChange={(value) => onUpdate({ ...field, width: value as FieldWidth } as FormField)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="three-quarters">3/4 Width</SelectItem>
                <SelectItem value="two-thirds">2/3 Width</SelectItem>
                <SelectItem value="half">Half Width</SelectItem>
                <SelectItem value="third">1/3 Width</SelectItem>
                <SelectItem value="quarter">1/4 Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Quick settings based on field type */}
          {field.type === 'select' && (
            <div className="space-y-1">
              <Label className="text-xs">Options (comma separated)</Label>
              <Input
                value={field.options?.map(o => o.label).join(', ') || ''}
                onChange={(e) => {
                  const options = e.target.value.split(',').map(opt => ({
                    label: opt.trim(),
                    value: opt.trim().toLowerCase().replace(/\s+/g, '_')
                  }))
                  onUpdate({ ...field, options })
                }}
                placeholder="Option 1, Option 2, Option 3"
                className="h-7 text-xs"
              />
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export function FieldGroupManager({ fieldGroup, onUpdate }: FieldGroupManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = fieldGroup.fields.findIndex(f => f.id === active.id)
      const newIndex = fieldGroup.fields.findIndex(f => f.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fieldGroup.fields, oldIndex, newIndex)
        onUpdate({ ...fieldGroup, fields: newFields })
      }
    }

    setActiveId(null)
  }

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      key: `field_${fieldGroup.fields.length + 1}`,
      label: `New ${selectedFieldType} field`,
      type: selectedFieldType,
    } as FormField

    // Add type-specific defaults
    if (selectedFieldType === 'select') {
      (newField as any).options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ]
    }

    onUpdate({
      ...fieldGroup,
      fields: [...fieldGroup.fields, newField]
    })
  }

  const removeField = (index: number) => {
    const newFields = fieldGroup.fields.filter((_, i) => i !== index)
    onUpdate({ ...fieldGroup, fields: newFields })
  }

  const updateField = (index: number, field: FormField) => {
    const newFields = [...fieldGroup.fields]
    newFields[index] = field
    onUpdate({ ...fieldGroup, fields: newFields })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Fields in Group</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add and arrange fields that will be grouped together
        </p>
      </div>

      {fieldGroup.fields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fieldGroup.fields.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fieldGroup.fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onRemove={() => removeField(index)}
                  onUpdate={(f) => updateField(index, f)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="bg-background border rounded-lg p-3 shadow-lg opacity-80">
                Moving field...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No fields added yet. Add fields to group them together.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Select value={selectedFieldType} onValueChange={setSelectedFieldType as any}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableFieldTypes.map(type => (
              <SelectItem key={type.type} value={type.type}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  )
}

// Import Badge component
import { Badge } from '@/components/ui/badge'