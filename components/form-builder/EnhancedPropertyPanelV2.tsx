'use client'

import React from 'react'
import { FormField, FieldWidth } from '@/lib/types/form'
import { sanitizeFieldKey } from '@/lib/utils/field-key-validator'
import { generateFieldKey } from '@/lib/utils/field-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FieldPreview } from './FieldPreview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder'
import { FormulaBuilder } from './FormulaBuilder'
import { AIFormulaBuilder } from './AIFormulaBuilder'
import { FieldGroupManager } from './FieldGroupManager'
import { PageNavigationBuilder } from '../form-builder/PageNavigationBuilder'

interface EnhancedPropertyPanelV2Props {
  field: FormField
  fields: FormField[]
  onUpdate: (field: FormField) => void
  onClose: () => void
}

// Helper function to get appropriate default value for field type
function getDefaultValueForFieldType(fieldType: string): any {
  switch (fieldType) {
    case 'text':
    case 'email':
    case 'phone':
    case 'textarea':
      return ''
    case 'number':
    case 'currency':
      return 0
    case 'checkbox':
    case 'toggle':
      return false
    case 'date':
      return new Date().toISOString().split('T')[0]
    case 'time':
      return '00:00'
    case 'datetime':
      return new Date().toISOString()
    case 'select':
    case 'radio':
    case 'button-select':
      return undefined
    case 'multiselect':
      return []
    case 'slider':
    case 'rating':
      return 0
    default:
      return ''
  }
}

// Helper function to render appropriate default value input based on field type
function renderDefaultValueInput(field: FormField, handleChange: (key: string, value: any) => void) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          value={field.default || ''}
          onChange={(e) => handleChange('default', e.target.value)}
          placeholder={`Enter default ${field.type}`}
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          className="h-9"
        />
      )
    
    case 'textarea':
      return (
        <Textarea
          value={field.default || ''}
          onChange={(e) => handleChange('default', e.target.value)}
          placeholder="Enter default text"
          rows={3}
          className="resize-none"
        />
      )
    
    case 'number':
    case 'currency':
      return (
        <Input
          type="number"
          value={field.default || 0}
          onChange={(e) => handleChange('default', parseFloat(e.target.value) || 0)}
          placeholder="0"
          step={field.type === 'currency' ? '0.01' : '1'}
          className="h-9"
        />
      )
    
    case 'checkbox':
    case 'toggle':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={field.default === true}
            onCheckedChange={(checked) => handleChange('default', checked === true)}
          />
          <Label className="text-sm">Default to checked</Label>
        </div>
      )
    
    case 'date':
      return (
        <Input
          type="date"
          value={field.default || ''}
          onChange={(e) => handleChange('default', e.target.value)}
          className="h-9"
        />
      )
    
    case 'time':
      return (
        <Input
          type="time"
          value={field.default || ''}
          onChange={(e) => handleChange('default', e.target.value)}
          className="h-9"
        />
      )
    
    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={field.default ? field.default.slice(0, 16) : ''}
          onChange={(e) => handleChange('default', e.target.value)}
          className="h-9"
        />
      )
    
    case 'select':
    case 'radio':
      // Ensure we have valid options
      if (!field.options || field.options.length === 0) {
        return (
          <div className="text-sm text-muted-foreground">
            Please add options to this field first
          </div>
        )
      }
      
      const currentValue = field.default !== undefined && field.default !== null ? String(field.default) : '__none__'
      
      return (
        <Select
          key={`${field.id}-default-select`}
          value={currentValue}
          onValueChange={(value) => {
            console.log('Default value changing from', currentValue, 'to', value)
            handleChange('default', value === '__none__' ? undefined : value)
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select default option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No default</SelectItem>
            {field.options.map((option) => {
              const optionValue = String(option.value)
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  {option.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )
    
    case 'multiselect':
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Select default options</Label>
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                checked={Array.isArray(field.default) && field.default.includes(option.value)}
                onCheckedChange={(checked) => {
                  const currentDefaults = Array.isArray(field.default) ? field.default : []
                  if (checked) {
                    handleChange('default', [...currentDefaults, option.value])
                  } else {
                    handleChange('default', currentDefaults.filter((v: string) => v !== option.value))
                  }
                }}
              />
              <Label className="text-sm font-normal">{option.label}</Label>
            </div>
          ))}
        </div>
      )
    
    case 'slider':
      return (
        <div className="space-y-2">
          <Input
            type="number"
            value={field.default || field.validation?.min || 0}
            onChange={(e) => handleChange('default', parseFloat(e.target.value) || 0)}
            min={field.validation?.min}
            max={field.validation?.max}
            step={(field.validation as any)?.step || 1}
            className="h-9"
          />
          <div className="text-xs text-muted-foreground">
            Range: {field.validation?.min || 0} - {field.validation?.max || 100}
          </div>
        </div>
      )
    
    case 'rating':
      return (
        <div className="space-y-2">
          <Input
            type="number"
            value={field.default || 0}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0
              const max = field.meta?.maxRating || 5
              handleChange('default', Math.min(Math.max(0, val), max))
            }}
            min={0}
            max={field.meta?.maxRating || 5}
            className="h-9"
          />
          <div className="text-xs text-muted-foreground">
            0 = No rating, Max: {field.meta?.maxRating || 5}
          </div>
        </div>
      )
    
    case 'button-select':
      // Ensure we have valid options
      if (!field.options || field.options.length === 0) {
        return (
          <div className="text-sm text-muted-foreground">
            Please add options to this field first
          </div>
        )
      }
      
      const buttonSelectValue = field.default !== undefined && field.default !== null ? String(field.default) : '__none__'
      
      return (
        <Select
          key={`${field.id}-default-select`}
          value={buttonSelectValue}
          onValueChange={(value) => {
            console.log('Button-select default value changing from', buttonSelectValue, 'to', value)
            handleChange('default', value === '__none__' ? undefined : value)
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select default option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No default</SelectItem>
            {field.options.map((option: any) => {
              const optionValue = String(option.value)
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  {option.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )
    
    default:
      return (
        <Input
          value={field.default || ''}
          onChange={(e) => handleChange('default', e.target.value)}
          placeholder="Enter default value"
          className="h-9"
        />
      )
  }
}

export function EnhancedPropertyPanelV2({ field, fields, onUpdate, onClose }: EnhancedPropertyPanelV2Props) {
  const [isEditingKey, setIsEditingKey] = React.useState(false)
  
  const handleChange = (key: string, value: any) => {
    // Sanitize field key to only allow valid characters
    if (key === 'key' && typeof value === 'string') {
      value = sanitizeFieldKey(value)
    }
    onUpdate({ ...field, [key]: value })
  }

  const handleValidationChange = (key: string, value: any) => {
    onUpdate({
      ...field,
      validation: { ...field.validation, [key]: value }
    })
  }

  const handleMetaChange = (key: string, value: any) => {
    onUpdate({
      ...field,
      meta: { ...field.meta, [key]: value }
    })
  }

  const handleOptionAdd = () => {
    if (!('options' in field)) return
    
    const fieldWithOptions = field as any
    const newOption = { 
      label: `Option ${(fieldWithOptions.options?.length || 0) + 1}`, 
      value: `option_${(fieldWithOptions.options?.length || 0) + 1}` 
    }
    onUpdate({
      ...field,
      options: [...(fieldWithOptions.options || []), newOption]
    })
  }

  const handleOptionChange = (index: number, key: string, value: string) => {
    if (!('options' in field)) return
    
    const fieldWithOptions = field as any
    const options = [...(fieldWithOptions.options || [])]
    // Ensure we preserve the exact input value including spaces
    options[index] = { ...options[index], [key]: value }
    onUpdate({ ...field, options })
  }

  const handleOptionRemove = (index: number) => {
    if (!('options' in field)) return
    
    const fieldWithOptions = field as any
    const options = [...(fieldWithOptions.options || [])]
    options.splice(index, 1)
    onUpdate({ ...field, options })
  }

  return (
    <div className="h-full flex flex-col bg-background" style={{ width: '480px' }}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Field Properties</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {field.type}
              </Badge>
              {field.required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="general" className="w-full">
          <div className="px-6 pt-4 pb-2 border-b bg-muted/30">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-0 space-y-0">
            <Accordion type="single" collapsible defaultValue="basic" className="w-full">
              
              {/* Basic Settings */}
              <AccordionItem value="basic" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <span className="text-sm font-medium">Basic Settings</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-width" className="text-sm">Field Width</Label>
                    <Select
                      value={field.width || 'full'}
                      onValueChange={(value) => handleChange('width', value as FieldWidth)}
                    >
                      <SelectTrigger id="field-width" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width (100%)</SelectItem>
                        <SelectItem value="three-quarters">Three Quarters (75%)</SelectItem>
                        <SelectItem value="two-thirds">Two Thirds (66%)</SelectItem>
                        <SelectItem value="half">Half Width (50%)</SelectItem>
                        <SelectItem value="third">One Third (33%)</SelectItem>
                        <SelectItem value="quarter">Quarter Width (25%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Fields will automatically stack side-by-side when their widths allow
                    </p>
                  </div>

                  {/* Hide label field for display-only field types */}
                  {!['headline', 'html', 'image', 'pagebreak'].includes(field.type) && (
                    <div className="space-y-2">
                      <Label htmlFor="field-label" className="text-sm">Label</Label>
                      <Input
                        id="field-label"
                        value={field.label || ''}
                        onChange={(e) => {
                          handleChange('label', e.target.value)
                          // Also update the key based on the new label
                          const existingKeys = fields.filter(f => f.id !== field.id).map(f => f.key)
                          const newKey = generateFieldKey(e.target.value || field.type, existingKeys)
                          handleChange('key', newKey)
                        }}
                        placeholder="Enter field label"
                        className="h-9"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="field-key" className="text-sm">
                      Field Key
                      <span className="text-xs text-muted-foreground ml-2">
                        (Auto-generated for webhooks & UTM params)
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="field-key"
                        value={field.key || ''}
                        readOnly={!isEditingKey}
                        onChange={(e) => {
                          if (isEditingKey) {
                            const sanitized = sanitizeFieldKey(e.target.value)
                            handleChange('key', sanitized)
                          }
                        }}
                        className={cn(
                          "h-9 font-mono text-sm",
                          isEditingKey ? "" : "bg-muted/50"
                        )}
                        title={isEditingKey 
                          ? "Edit the field key manually" 
                          : "Field key is automatically generated from the field label/content"
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => setIsEditingKey(!isEditingKey)}
                        title={isEditingKey ? "Lock field key" : "Edit field key manually"}
                      >
                        {isEditingKey ? "Lock" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          navigator.clipboard.writeText(field.key || '')
                        }}
                        title="Copy field key to clipboard"
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isEditingKey 
                        ? "You are manually editing the field key. Click 'Lock' to return to auto-generation."
                        : "This key is automatically generated from the field label and updates when the label changes."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-placeholder" className="text-sm">Placeholder</Label>
                    <Input
                      id="field-placeholder"
                      value={field.placeholder || ''}
                      onChange={(e) => handleChange('placeholder', e.target.value)}
                      placeholder="Placeholder text"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-help" className="text-sm">Help Text</Label>
                    <Textarea
                      id="field-help"
                      value={field.helpText || ''}
                      onChange={(e) => handleChange('helpText', e.target.value)}
                      placeholder="Helpful instructions for users"
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>

                  {/* Default Value Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Default Value</Label>
                      <Switch
                        checked={field.hasDefault === true}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Enable default value
                            handleChange('hasDefault', true)
                            // Set an appropriate default based on field type
                            if (field.default === undefined || field.default === null) {
                              const defaultValue = getDefaultValueForFieldType(field.type)
                              handleChange('default', defaultValue)
                            }
                          } else {
                            // Disable default value
                            handleChange('hasDefault', false)
                            handleChange('default', undefined)
                          }
                        }}
                      />
                    </div>
                    
                    {field.hasDefault && (
                      <div className="space-y-2">
                        {renderDefaultValueInput(field, handleChange)}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Field-Specific Settings */}
              {/* Page Break Settings */}
              {field.type === 'pagebreak' && (
                <AccordionItem value="pagebreak-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Page Break Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-title" className="text-sm">Page Title</Label>
                      <Input
                        id="page-title"
                        value={field.pageTitle || ''}
                        onChange={(e) => handleChange('pageTitle', e.target.value)}
                        placeholder="Enter page title"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="page-description" className="text-sm">Page Description</Label>
                      <Textarea
                        id="page-description"
                        value={field.pageDescription || ''}
                        onChange={(e) => handleChange('pageDescription', e.target.value)}
                        placeholder="Describe what this page is about"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prev-button" className="text-sm">Previous Button Text</Label>
                      <Input
                        id="prev-button"
                        value={field.prevButtonText || 'Previous'}
                        onChange={(e) => handleChange('prevButtonText', e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next-button" className="text-sm">Next Button Text</Label>
                      <Input
                        id="next-button"
                        value={field.nextButtonText || 'Next'}
                        onChange={(e) => handleChange('nextButtonText', e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="progress-bar" className="text-sm">Show Progress Bar</Label>
                        <p className="text-xs text-muted-foreground">Display form completion progress</p>
                      </div>
                      <Switch
                        id="progress-bar"
                        checked={field.showProgressBar !== false}
                        onCheckedChange={(checked) => handleChange('showProgressBar', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="hide-next" className="text-sm">Hide Next Button</Label>
                        <p className="text-xs text-muted-foreground">Hide the next button (use button-select for navigation)</p>
                      </div>
                      <Switch
                        id="hide-next"
                        checked={field.hideNextButton || false}
                        onCheckedChange={(checked) => handleChange('hideNextButton', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="hide-prev" className="text-sm">Hide Previous Button</Label>
                        <p className="text-xs text-muted-foreground">Hide the previous button</p>
                      </div>
                      <Switch
                        id="hide-prev"
                        checked={field.hidePrevButton || false}
                        onCheckedChange={(checked) => handleChange('hidePrevButton', checked)}
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Conditional Navigation Rules */}
                    <div>
                      <PageNavigationBuilder
                        fields={fields.filter(f => fields.indexOf(f) < fields.indexOf(field))}
                        rules={field.navigationRules || []}
                        onChange={(rules) => handleChange('navigationRules', rules)}
                        totalPages={fields.filter(f => f.type === 'pagebreak').length + 1}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Image Settings */}
              {field.type === 'image' && (
                <AccordionItem value="image-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Image Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-url" className="text-sm">Image URL</Label>
                      <div className="space-y-2">
                        <Input
                          id="image-url"
                          value={(field as any).imageUrl || ''}
                          onChange={(e) => handleChange('imageUrl', e.target.value)}
                          placeholder="Enter image URL or upload below"
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a URL or upload an image to your preferred hosting service
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alt-text" className="text-sm">Alt Text</Label>
                      <Input
                        id="alt-text"
                        value={(field as any).altText || ''}
                        onChange={(e) => {
                          handleChange('altText', e.target.value)
                          // Also update the label to match the alt text
                          handleChange('label', e.target.value)
                          // Generate a sanitized key from the alt text
                          const existingKeys = fields.filter(f => f.id !== field.id).map(f => f.key)
                          const newKey = generateFieldKey(e.target.value || 'image', existingKeys)
                          handleChange('key', newKey)
                        }}
                        placeholder="Describe the image for accessibility"
                        className="h-9"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="image-width" className="text-sm">Width</Label>
                        <Select
                          value={(field as any).width?.toString() || 'auto'}
                          onValueChange={(value) => {
                            const width = value === 'auto' || value === 'full' ? value : parseInt(value)
                            handleChange('width', width)
                          }}
                        >
                          <SelectTrigger id="image-width" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                            <SelectItem value="200">200px</SelectItem>
                            <SelectItem value="300">300px</SelectItem>
                            <SelectItem value="400">400px</SelectItem>
                            <SelectItem value="500">500px</SelectItem>
                            <SelectItem value="600">600px</SelectItem>
                            <SelectItem value="800">800px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="image-height" className="text-sm">Height</Label>
                        <Select
                          value={(field as any).height?.toString() || 'auto'}
                          onValueChange={(value) => {
                            const height = value === 'auto' ? value : parseInt(value)
                            handleChange('height', height)
                          }}
                        >
                          <SelectTrigger id="image-height" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="100">100px</SelectItem>
                            <SelectItem value="200">200px</SelectItem>
                            <SelectItem value="300">300px</SelectItem>
                            <SelectItem value="400">400px</SelectItem>
                            <SelectItem value="500">500px</SelectItem>
                            <SelectItem value="600">600px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-alignment" className="text-sm">Alignment</Label>
                      <Select
                        value={(field as any).alignment || 'center'}
                        onValueChange={(value) => handleChange('alignment', value)}
                      >
                        <SelectTrigger id="image-alignment" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-caption" className="text-sm">Caption</Label>
                      <Input
                        id="image-caption"
                        value={(field as any).caption || ''}
                        onChange={(e) => handleChange('caption', e.target.value)}
                        placeholder="Optional caption text"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-link" className="text-sm">Link URL</Label>
                      <Input
                        id="image-link"
                        value={(field as any).link || ''}
                        onChange={(e) => handleChange('link', e.target.value)}
                        placeholder="Optional link when image is clicked"
                        className="h-9"
                      />
                    </div>

                    {(field as any).link && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="open-new-tab"
                          checked={(field as any).openInNewTab || false}
                          onCheckedChange={(checked) => handleChange('openInNewTab', checked)}
                        />
                        <Label htmlFor="open-new-tab" className="text-sm">
                          Open link in new tab
                        </Label>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* HTML Settings */}
              {field.type === 'html' && (
                <AccordionItem value="html-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">HTML Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="html-content" className="text-sm">HTML Content</Label>
                      <Textarea
                        id="html-content"
                        value={(field as any).content || ''}
                        onChange={(e) => {
                          handleChange('content', e.target.value)
                          // Extract text content for label (strip HTML tags)
                          const textContent = e.target.value.replace(/<[^>]*>/g, '').slice(0, 50)
                          const label = textContent || 'HTML Content'
                          handleChange('label', label)
                          // Generate a sanitized key from the content
                          const existingKeys = fields.filter(f => f.id !== field.id).map(f => f.key)
                          const newKey = generateFieldKey(label, existingKeys)
                          handleChange('key', newKey)
                        }}
                        placeholder="Enter your HTML content"
                        rows={6}
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter valid HTML. Be careful with scripts and styles.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Headline Settings */}
              {field.type === 'headline' && (
                <AccordionItem value="headline-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Headline Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headline-text" className="text-sm">Headline Text</Label>
                      <Input
                        id="headline-text"
                        value={field.text || ''}
                        onChange={(e) => {
                          handleChange('text', e.target.value)
                          // Also update the label to match the text
                          handleChange('label', e.target.value)
                          // Generate a sanitized key from the text
                          const existingKeys = fields.filter(f => f.id !== field.id).map(f => f.key)
                          const newKey = generateFieldKey(e.target.value || 'headline', existingKeys)
                          handleChange('key', newKey)
                        }}
                        placeholder="Enter your headline"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline-level" className="text-sm">Heading Level</Label>
                      <Select
                        value={field.level || 'h2'}
                        onValueChange={(value) => handleChange('level', value)}
                      >
                        <SelectTrigger id="headline-level" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h1">H1 - Largest</SelectItem>
                          <SelectItem value="h2">H2 - Large</SelectItem>
                          <SelectItem value="h3">H3 - Medium</SelectItem>
                          <SelectItem value="h4">H4 - Small</SelectItem>
                          <SelectItem value="h5">H5 - Smaller</SelectItem>
                          <SelectItem value="h6">H6 - Smallest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline-align" className="text-sm">Alignment</Label>
                      <Select
                        value={field.alignment || 'left'}
                        onValueChange={(value) => handleChange('alignment', value)}
                      >
                        <SelectTrigger id="headline-align" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline-subtext" className="text-sm">Subtext (Optional)</Label>
                      <Textarea
                        id="headline-subtext"
                        value={field.helpText || ''}
                        onChange={(e) => handleChange('helpText', e.target.value)}
                        placeholder="Add supporting text below the headline"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {(field.type === 'text' || field.type === 'textarea') && (
                <AccordionItem value="text-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Text Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="recording-enabled" className="text-sm">Audio Recording</Label>
                        <p className="text-xs text-muted-foreground">Allow voice input</p>
                      </div>
                      <Switch
                        id="recording-enabled"
                        checked={field.meta?.recordingEnabled || false}
                        onCheckedChange={(checked) => handleMetaChange('recordingEnabled', checked)}
                      />
                    </div>

                    {field.meta?.recordingEnabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        <Label htmlFor="recording-mode" className="text-sm">Recording Mode</Label>
                        <Select
                          value={field.meta?.recordingMode || 'replace'}
                          onValueChange={(value) => handleMetaChange('recordingMode', value)}
                        >
                          <SelectTrigger id="recording-mode" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="replace">Replace existing text</SelectItem>
                            <SelectItem value="append">Append to existing text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-char-count" className="text-sm">Character Count</Label>
                        <p className="text-xs text-muted-foreground">Show remaining characters</p>
                      </div>
                      <Switch
                        id="show-char-count"
                        checked={field.meta?.showCharCount !== false}
                        onCheckedChange={(checked) => handleMetaChange('showCharCount', checked)}
                      />
                    </div>

                    {field.type === 'textarea' && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label htmlFor="textarea-rows" className="text-sm">Default Rows</Label>
                          <Input
                            id="textarea-rows"
                            type="number"
                            value={field.meta?.rows || 4}
                            onChange={(e) => handleMetaChange('rows', parseInt(e.target.value))}
                            min={1}
                            max={20}
                            className="h-9"
                          />
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="expandable" className="text-sm">Expandable</Label>
                            <p className="text-xs text-muted-foreground">Allow fullscreen editing</p>
                          </div>
                          <Switch
                            id="expandable"
                            checked={field.meta?.expandable || false}
                            onCheckedChange={(checked) => handleMetaChange('expandable', checked)}
                          />
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Number/Currency Settings */}
              {(field.type === 'number' || field.type === 'currency') && (
                <AccordionItem value="number-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Number Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="input-mode" className="text-sm">Input Mode</Label>
                      <Select
                        value={field.meta?.inputMode || 'default'}
                        onValueChange={(value) => handleMetaChange('inputMode', value)}
                      >
                        <SelectTrigger id="input-mode" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Input</SelectItem>
                          <SelectItem value="stepper">Stepper Controls</SelectItem>
                          <SelectItem value="slider">Slider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="step-value" className="text-sm">Step</Label>
                        <Input
                          id="step-value"
                          type="number"
                          value={field.meta?.step || 1}
                          onChange={(e) => handleMetaChange('step', parseFloat(e.target.value))}
                          step="any"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="decimal-places" className="text-sm">Decimals</Label>
                        <Input
                          id="decimal-places"
                          type="number"
                          value={field.meta?.decimalPlaces ?? 2}
                          onChange={(e) => handleMetaChange('decimalPlaces', parseInt(e.target.value))}
                          min={0}
                          max={10}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {field.type === 'currency' && (
                      <div className="space-y-2">
                        <Label htmlFor="currency-code" className="text-sm">Currency</Label>
                        <Select
                          value={field.meta?.currency || 'USD'}
                          onValueChange={(value) => handleMetaChange('currency', value)}
                        >
                          <SelectTrigger id="currency-code" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="prefix" className="text-sm">Prefix</Label>
                        <Input
                          id="prefix"
                          value={field.meta?.prefix || ''}
                          onChange={(e) => handleMetaChange('prefix', e.target.value)}
                          placeholder="$"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="suffix" className="text-sm">Suffix</Label>
                        <Input
                          id="suffix"
                          value={field.meta?.suffix || ''}
                          onChange={(e) => handleMetaChange('suffix', e.target.value)}
                          placeholder="/hr"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Options for Select/Radio/Checkbox/Button-Select */}
              {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'button-select') && (
                <AccordionItem value="options" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Options</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Choice Options</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOptionAdd}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {'options' in field && (field as any).options?.map((option: any, index: number) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                              onKeyDown={(e) => {
                                // Prevent any default behavior that might block spaces
                                if (e.key === ' ') {
                                  e.stopPropagation()
                                }
                              }}
                              placeholder="Label"
                              className="flex-1 h-9"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                              onKeyDown={(e) => {
                                // Prevent any default behavior that might block spaces
                                if (e.key === ' ') {
                                  e.stopPropagation()
                                }
                              }}
                              placeholder="Value"
                              className="flex-1 h-9"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOptionRemove(index)}
                              className="h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {field.type === 'button-select' && (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={option.icon || ''}
                                  onChange={(e) => handleOptionChange(index, 'icon', e.target.value)}
                                  placeholder="Icon/Emoji (e.g., 🏠)"
                                  className="h-9"
                                />
                                <Input
                                  value={option.color || ''}
                                  onChange={(e) => handleOptionChange(index, 'color', e.target.value)}
                                  placeholder="Color (e.g., #3B82F6)"
                                  className="h-9"
                                />
                              </div>
                              <Input
                                value={option.description || ''}
                                onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                className="h-9"
                              />
                              <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1">
                                  Navigate to Page
                                  <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={option.targetPage || ''}
                                    onChange={(e) => handleOptionChange(index, 'targetPage', e.target.value)}
                                    placeholder="Page #"
                                    className="h-8 w-20"
                                    min="1"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {option.targetPage ? `Jumps to page ${option.targetPage} when selected` : 'No navigation - acts as regular selection'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {(!('options' in field) || !(field as any).options || (field as any).options.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No options yet. Click "Add" to create options.
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="searchable" className="text-sm">Searchable</Label>
                        <p className="text-xs text-muted-foreground">Enable search in dropdown</p>
                      </div>
                      <Switch
                        id="searchable"
                        checked={field.meta?.searchable !== false}
                        onCheckedChange={(checked) => handleMetaChange('searchable', checked)}
                      />
                    </div>

                    {field.type === 'multiselect' && (
                      <div className="space-y-2">
                        <Label htmlFor="max-selections" className="text-sm">Max Selections</Label>
                        <Input
                          id="max-selections"
                          type="number"
                          value={field.meta?.maxSelections || ''}
                          onChange={(e) => handleMetaChange('maxSelections', parseInt(e.target.value) || undefined)}
                          placeholder="Unlimited"
                          min={1}
                          className="h-9"
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Button Select Settings */}
              {field.type === 'button-select' && (
                <AccordionItem value="button-select-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Button Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="button-layout" className="text-sm">Layout</Label>
                      <Select
                        value={field.layout || 'vertical'}
                        onValueChange={(value) => handleChange('layout', value)}
                      >
                        <SelectTrigger id="button-layout" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vertical">Vertical Stack</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {field.layout === 'grid' && (
                      <div className="space-y-2">
                        <Label htmlFor="button-columns" className="text-sm">Columns</Label>
                        <Select
                          value={field.columns?.toString() || '2'}
                          onValueChange={(value) => handleChange('columns', parseInt(value))}
                        >
                          <SelectTrigger id="button-columns" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Column</SelectItem>
                            <SelectItem value="2">2 Columns</SelectItem>
                            <SelectItem value="3">3 Columns</SelectItem>
                            <SelectItem value="4">4 Columns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="button-size" className="text-sm">Button Size</Label>
                      <Select
                        value={field.buttonSize || 'large'}
                        onValueChange={(value) => handleChange('buttonSize', value)}
                      >
                        <SelectTrigger id="button-size" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="allow-multiple" className="text-sm">Allow Multiple Selection</Label>
                        <p className="text-xs text-muted-foreground">Users can select multiple options</p>
                      </div>
                      <Switch
                        id="allow-multiple"
                        checked={field.allowMultiple || false}
                        onCheckedChange={(checked) => handleChange('allowMultiple', checked)}
                      />
                    </div>


                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-description" className="text-sm">Show Descriptions</Label>
                        <p className="text-xs text-muted-foreground">Display option descriptions</p>
                      </div>
                      <Switch
                        id="show-description"
                        checked={field.showDescription || false}
                        onCheckedChange={(checked) => handleChange('showDescription', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-icon" className="text-sm">Show Icons</Label>
                        <p className="text-xs text-muted-foreground">Display option icons/emojis</p>
                      </div>
                      <Switch
                        id="show-icon"
                        checked={field.showIcon || false}
                        onCheckedChange={(checked) => handleChange('showIcon', checked)}
                      />
                    </div>

                    <Separator className="my-3" />
                    
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <h4 className="text-xs font-medium flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Navigation Tips
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Each button can navigate to a specific page when clicked</li>
                        <li>• Set page numbers in the options above to enable navigation</li>
                        <li>• Leave page number blank for regular selection without navigation</li>
                        <li>• Combine with "Hide Next Button" on page breaks for button-only navigation</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Field Group Settings */}
              {field.type === 'fieldgroup' && (
                <AccordionItem value="fieldgroup-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Group Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-title" className="text-sm">Group Title</Label>
                      <Input
                        id="group-title"
                        value={field.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter group title"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-description" className="text-sm">Description</Label>
                      <Textarea
                        id="group-description"
                        value={field.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe this group of fields"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="repeatable" className="text-sm">Repeatable</Label>
                        <p className="text-xs text-muted-foreground">Allow multiple instances</p>
                      </div>
                      <Switch
                        id="repeatable"
                        checked={field.repeatable || false}
                        onCheckedChange={(checked) => handleChange('repeatable', checked)}
                      />
                    </div>

                    {field.repeatable && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="min-instances" className="text-sm">Min Instances</Label>
                            <Input
                              id="min-instances"
                              type="number"
                              value={field.minInstances || 1}
                              onChange={(e) => handleChange('minInstances', parseInt(e.target.value) || 1)}
                              min={0}
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="max-instances" className="text-sm">Max Instances</Label>
                            <Input
                              id="max-instances"
                              type="number"
                              value={field.maxInstances || 10}
                              onChange={(e) => handleChange('maxInstances', parseInt(e.target.value) || 10)}
                              min={1}
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="add-button-text" className="text-sm">Add Button Text</Label>
                          <Input
                            id="add-button-text"
                            value={field.addButtonText || ''}
                            onChange={(e) => handleChange('addButtonText', e.target.value)}
                            placeholder="Add Another"
                            className="h-9"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="collapsible" className="text-sm">Collapsible</Label>
                        <p className="text-xs text-muted-foreground">Allow collapsing groups</p>
                      </div>
                      <Switch
                        id="collapsible"
                        checked={field.collapsible || false}
                        onCheckedChange={(checked) => handleChange('collapsible', checked)}
                      />
                    </div>

                    <Separator />

                    <FieldGroupManager
                      fieldGroup={field}
                      onUpdate={onUpdate}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Date/Time Settings */}
              {(field.type === 'date' || field.type === 'datetime') && (
                <AccordionItem value="date-settings" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Date Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-range" className="text-sm">Date Range</Label>
                        <p className="text-xs text-muted-foreground">Allow selecting date ranges</p>
                      </div>
                      <Switch
                        id="enable-range"
                        checked={field.meta?.enableRange || false}
                        onCheckedChange={(checked) => handleMetaChange('enableRange', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-format" className="text-sm">Date Format</Label>
                      <Select
                        value={field.meta?.dateFormat || 'PP'}
                        onValueChange={(value) => handleMetaChange('dateFormat', value)}
                      >
                        <SelectTrigger id="date-format" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PP">Jan 1, 2024</SelectItem>
                          <SelectItem value="P">01/01/2024</SelectItem>
                          <SelectItem value="yyyy-MM-dd">2024-01-01</SelectItem>
                          <SelectItem value="dd/MM/yyyy">01/01/2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Layout & Appearance */}
              <AccordionItem value="appearance" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <span className="text-sm font-medium">Layout & Appearance</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-columns" className="text-sm">Column Width</Label>
                    <Select
                      value={field.grid?.col?.toString() || '12'}
                      onValueChange={(value) => handleChange('grid', { ...field.grid, col: parseInt(value) })}
                    >
                      <SelectTrigger id="field-columns" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">Full Width</SelectItem>
                        <SelectItem value="6">Half Width</SelectItem>
                        <SelectItem value="4">One Third</SelectItem>
                        <SelectItem value="3">One Quarter</SelectItem>
                        <SelectItem value="8">Two Thirds</SelectItem>
                        <SelectItem value="9">Three Quarters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="field-hidden" className="text-sm">Hidden Field</Label>
                      <p className="text-xs text-muted-foreground">Hide from form display</p>
                    </div>
                    <Switch
                      id="field-hidden"
                      checked={field.hidden || false}
                      onCheckedChange={(checked) => handleChange('hidden', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="field-disabled" className="text-sm">Disabled</Label>
                      <p className="text-xs text-muted-foreground">Prevent user input</p>
                    </div>
                    <Switch
                      id="field-disabled"
                      checked={field.disabled || false}
                      onCheckedChange={(checked) => handleChange('disabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="css-class" className="text-sm">CSS Class</Label>
                    <Input
                      id="css-class"
                      value={field.className || ''}
                      onChange={(e) => handleChange('className', e.target.value)}
                      placeholder="custom-class"
                      className="h-9"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Conditional Logic - Not shown for page breaks */}
              {field.type !== 'pagebreak' && (
                <AccordionItem value="logic" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Conditional Logic</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <ConditionalLogicBuilder
                      fields={fields}
                      currentField={field}
                      rules={field.conditions || []}
                      onChange={(rules) => handleChange('conditions', rules)}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Calculations */}
              {(field.type === 'number' || field.type === 'currency' || field.type === 'text') && (
                <AccordionItem value="calculations" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium">Calculations</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <FormulaBuilder
                      value={field.calculation || ''}
                      onChange={(value) => handleChange('calculation', value)}
                      fields={fields}
                      currentField={field}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* AI Calculations */}
              {(field.type === 'number' || field.type === 'currency' || field.type === 'text' || field.type === 'textarea') && (
                <AccordionItem value="ai-calculations" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <span className="text-sm font-medium flex items-center gap-2">
                      AI Calculations
                      <Badge variant="secondary" className="text-xs">Beta</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <AIFormulaBuilder
                      value={field.aiCalculation}
                      onChange={(value) => handleChange('aiCalculation', value)}
                      fields={fields}
                      currentField={field}
                      hasOpenAIKey={true} // This should be checked from org integrations
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>

          <TabsContent value="validation" className="mt-0 p-6 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Required Field</CardTitle>
                <CardDescription className="text-xs">
                  Make this field mandatory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Switch
                  checked={field.required || false}
                  onCheckedChange={(checked) => handleChange('required', checked)}
                />
              </CardContent>
            </Card>

            {(field.type === 'text' || field.type === 'textarea') && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm">Text Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="field-minlength" className="text-sm">Min Length</Label>
                      <Input
                        id="field-minlength"
                        type="number"
                        value={field.validation?.minLength || ''}
                        onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || undefined)}
                        placeholder="0"
                        min={0}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-maxlength" className="text-sm">Max Length</Label>
                      <Input
                        id="field-maxlength"
                        type="number"
                        value={field.validation?.maxLength || ''}
                        onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || undefined)}
                        placeholder="∞"
                        min={1}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-pattern" className="text-sm">Regex Pattern</Label>
                    <Input
                      id="field-pattern"
                      value={field.validation?.pattern || ''}
                      onChange={(e) => handleValidationChange('pattern', e.target.value)}
                      placeholder="^[A-Z]{2}[0-9]{4}$"
                      className="h-9 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-error-message" className="text-sm">Error Message</Label>
                    <Input
                      id="field-error-message"
                      value={(field.validation as any)?.errorMessage || ''}
                      onChange={(e) => handleValidationChange('errorMessage', e.target.value)}
                      placeholder="Custom validation message"
                      className="h-9"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {(field.type === 'number' || field.type === 'currency') && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm">Number Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="field-min" className="text-sm">Min Value</Label>
                      <Input
                        id="field-min"
                        type="number"
                        value={field.validation?.min ?? ''}
                        onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
                        placeholder="-∞"
                        step="any"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-max" className="text-sm">Max Value</Label>
                      <Input
                        id="field-max"
                        type="number"
                        value={field.validation?.max ?? ''}
                        onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
                        placeholder="∞"
                        step="any"
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(field.type === 'date' || field.type === 'datetime') && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm">Date Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="field-min-date" className="text-sm">Min Date</Label>
                      <Input
                        id="field-min-date"
                        type="date"
                        value={(field as any).minDate || ''}
                        onChange={(e) => handleValidationChange('minDate', e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-max-date" className="text-sm">Max Date</Label>
                      <Input
                        id="field-max-date"
                        type="date"
                        value={(field as any).maxDate || ''}
                        onChange={(e) => handleValidationChange('maxDate', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-0 p-6">
            <FieldPreview field={field} />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}