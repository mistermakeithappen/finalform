'use client'

import React from 'react'
import { RepeaterField as RepeaterFieldType } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface RepeaterFieldProps {
  field: RepeaterFieldType
  value: any[]
  onChange: (value: any[]) => void
  disabled?: boolean
}

export function RepeaterField({ field, value = [], onChange, disabled }: RepeaterFieldProps) {
  const addItem = () => {
    onChange([...value, {}])
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => removeItem(index)}
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
          <h4 className="font-medium text-sm mb-3">
            {typeof field.itemLabel === 'function' 
              ? field.itemLabel(index + 1)
              : `${field.itemLabel || 'Item'} ${index + 1}`
            }
          </h4>
          
          <div className="text-sm text-muted-foreground">
            Repeater fields will be rendered here
          </div>
        </div>
      ))}
      
      {(!field.maxItems || value.length < field.maxItems) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {typeof field.itemLabel === 'function' ? field.itemLabel(1) : (field.itemLabel || 'Item')}
        </Button>
      )}
    </div>
  )
}