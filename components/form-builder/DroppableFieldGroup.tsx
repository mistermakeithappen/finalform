'use client'

import React, { useState } from 'react'
import { FieldGroupField as FieldGroupFieldType, FormField } from '@/lib/types/form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DroppableFieldGroupProps {
  field: FieldGroupFieldType
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onUpdate: (field: FieldGroupFieldType) => void
}

interface SortableFieldItemProps {
  field: FormField
  onRemove: () => void
  onSelect: () => void
  isSelected: boolean
}

function SortableFieldItem({ field, onRemove, onSelect, isSelected }: SortableFieldItemProps) {
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

  return (
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
          "flex items-center gap-2 p-3 rounded-md border bg-background transition-all cursor-pointer",
          isSelected && "ring-2 ring-primary border-primary",
          !isSelected && "hover:border-primary/50"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-move touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex-1">
          <div className="font-medium text-sm">{field.label || field.key}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export function DroppableFieldGroup({ 
  field, 
  isSelected, 
  onSelect, 
  onRemove,
  onUpdate 
}: DroppableFieldGroupProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )
  
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `fieldgroup-${field.id}`,
    data: {
      type: 'fieldgroup',
      field: field,
      accepts: ['new-field', 'existing-field']
    }
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Extract the actual field IDs (remove the 'group-field-' prefix)
    const activeId = active.id.toString().replace('group-field-', '')
    const overId = over.id.toString().replace('group-field-', '')

    if (activeId !== overId) {
      const oldIndex = field.fields.findIndex(f => f.id === activeId)
      const newIndex = field.fields.findIndex(f => f.id === overId)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(field.fields, oldIndex, newIndex)
        onUpdate({ ...field, fields: newFields })
      }
    }
  }

  const removeChildField = (index: number) => {
    const newFields = field.fields.filter((_, i) => i !== index)
    onUpdate({ ...field, fields: newFields })
  }

  const selectChildField = (childId: string) => {
    setSelectedChildId(childId)
  }

  return (
    <div
      ref={setDroppableRef}
      onClick={onSelect}
      className={cn(
        "relative rounded-lg transition-all",
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
            <div>
              <h4 className="font-semibold text-sm">
                {field.title || field.label || 'Field Group'}
              </h4>
              {field.description && (
                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
              )}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={field.fields.map(f => `group-field-${f.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {field.fields.map((childField, index) => (
                    <SortableFieldItem
                      key={childField.id}
                      field={childField}
                      onRemove={() => removeChildField(index)}
                      onSelect={() => selectChildField(childField.id)}
                      isSelected={selectedChildId === childField.id}
                    />
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeId && (
                  <div className="bg-background border rounded-md p-3 shadow-lg opacity-80">
                    <div className="text-sm font-medium">Moving field...</div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
          
          {/* Always show drop zone for adding more fields */}
          <div className={cn(
            "flex items-center justify-center py-8 px-4 rounded-md border-2 border-dashed transition-colors mt-2",
            isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20",
            field.fields.length === 0 && "mt-0"
          )}>
            <p className="text-sm text-muted-foreground text-center">
              {isOver ? "Drop field here" : field.fields.length === 0 ? "Drag fields here to group them" : "Drag more fields here"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}