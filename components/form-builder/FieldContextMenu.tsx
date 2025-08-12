'use client'

import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { EyeOff, Eye, CheckSquare, Square, Copy, Columns, Trash2 } from 'lucide-react'
import { FormField, FieldWidth } from '@/lib/types/form'

interface FieldContextMenuProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onDuplicate: () => void
  onRemove: () => void
  children: React.ReactNode
}

export function FieldContextMenu({
  field,
  onUpdate,
  onDuplicate,
  onRemove,
  children
}: FieldContextMenuProps) {
  const handleToggleVisibility = () => {
    onUpdate({
      ...field,
      hidden: !field.hidden
    })
  }

  const handleToggleRequired = () => {
    // Don't allow required toggle for non-input fields
    const nonInputTypes = ['headline', 'image', 'html', 'pagebreak', 'section']
    if (nonInputTypes.includes(field.type)) return
    
    onUpdate({
      ...field,
      required: !field.required
    })
  }

  const handleSetWidth = (width: FieldWidth) => {
    onUpdate({
      ...field,
      width
    } as FormField)
  }

  const widthOptions: { value: FieldWidth; label: string }[] = [
    { value: 'full', label: 'Full Width (100%)' },
    { value: 'three-quarters', label: '3/4 Width (75%)' },
    { value: 'two-thirds', label: '2/3 Width (66%)' },
    { value: 'half', label: 'Half Width (50%)' },
    { value: 'third', label: '1/3 Width (33%)' },
    { value: 'quarter', label: '1/4 Width (25%)' },
  ]

  // Check if field type supports required
  const supportsRequired = !['headline', 'image', 'html', 'pagebreak', 'section'].includes(field.type)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem 
          onClick={handleToggleVisibility}
          className="flex items-center gap-2"
        >
          {field.hidden ? (
            <>
              <Eye className="h-4 w-4" />
              <span>Show Field</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span>Hide Field</span>
            </>
          )}
          <span className="ml-auto text-xs text-muted-foreground">H</span>
        </ContextMenuItem>

        {supportsRequired && (
          <ContextMenuItem 
            onClick={handleToggleRequired}
            className="flex items-center gap-2"
          >
            {field.required ? (
              <>
                <Square className="h-4 w-4" />
                <span>Make Optional</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                <span>Make Required</span>
              </>
            )}
            <span className="ml-auto text-xs text-muted-foreground">R</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem 
          onClick={onDuplicate}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate {field.type === 'fieldgroup' ? 'Field Group' : 'Field'}</span>
          <span className="ml-auto text-xs text-muted-foreground">D</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-2">
            <Columns className="h-4 w-4" />
            <span>Set Width</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {widthOptions.map((option) => (
              <ContextMenuItem
                key={option.value}
                onClick={() => handleSetWidth(option.value)}
                className={field.width === option.value ? 'bg-accent' : ''}
              >
                {option.label}
                {field.width === option.value && (
                  <span className="ml-auto">✓</span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem 
          onClick={onRemove}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Field</span>
          <span className="ml-auto text-xs">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}