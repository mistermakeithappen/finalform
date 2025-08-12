'use client'

import React from 'react'
import { FormField } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PropertyPanelProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export function PropertyPanel({ field, onUpdate, onClose }: PropertyPanelProps) {
  const handleChange = (key: string, value: any) => {
    onUpdate({ ...field, [key]: value })
  }

  const handleValidationChange = (key: string, value: any) => {
    onUpdate({
      ...field,
      validation: { ...field.validation, [key]: value }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Field Properties</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              General
            </TabsTrigger>
            <TabsTrigger value="validation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Validation
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-4 space-y-4">
            <div>
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={field.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Field label"
              />
            </div>

            <div>
              <Label htmlFor="field-key">Field Key</Label>
              <Input
                id="field-key"
                value={field.key || ''}
                onChange={(e) => handleChange('key', e.target.value)}
                placeholder="field_key"
                pattern="[a-z0-9_]+"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in form data. Only lowercase letters, numbers, and underscores.
              </p>
            </div>

            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={field.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder="Placeholder text"
              />
            </div>

            <div>
              <Label htmlFor="field-help">Help Text</Label>
              <Input
                id="field-help"
                value={field.helpText || ''}
                onChange={(e) => handleChange('helpText', e.target.value)}
                placeholder="Help text for users"
              />
            </div>

            <div>
              <Label htmlFor="field-default">Default Value</Label>
              <Input
                id="field-default"
                value={field.default || ''}
                onChange={(e) => handleChange('default', e.target.value)}
                placeholder="Default value"
              />
            </div>
          </TabsContent>

          <TabsContent value="validation" className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={field.required || false}
                onChange={(e) => handleChange('required', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            {(field.type === 'text' || field.type === 'textarea') && (
              <>
                <div>
                  <Label htmlFor="field-minlength">Min Length</Label>
                  <Input
                    id="field-minlength"
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="field-maxlength">Max Length</Label>
                  <Input
                    id="field-maxlength"
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value))}
                    placeholder="No limit"
                  />
                </div>
              </>
            )}

            {(field.type === 'number' || field.type === 'currency') && (
              <>
                <div>
                  <Label htmlFor="field-min">Min Value</Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => handleValidationChange('min', parseFloat(e.target.value))}
                    placeholder="No minimum"
                  />
                </div>

                <div>
                  <Label htmlFor="field-max">Max Value</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => handleValidationChange('max', parseFloat(e.target.value))}
                    placeholder="No maximum"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="appearance" className="p-4 space-y-4">
            <div>
              <Label htmlFor="field-columns">Column Span</Label>
              <select
                id="field-columns"
                value={field.grid?.col || 12}
                onChange={(e) => handleChange('grid', { ...field.grid, col: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value={12}>Full Width</option>
                <option value={6}>Half Width</option>
                <option value={4}>One Third</option>
                <option value={3}>One Quarter</option>
              </select>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}