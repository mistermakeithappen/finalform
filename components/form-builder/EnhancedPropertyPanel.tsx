'use client'

import React from 'react'
import { FormField } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2 } from 'lucide-react'
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

interface EnhancedPropertyPanelProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export function EnhancedPropertyPanel({ field, onUpdate, onClose }: EnhancedPropertyPanelProps) {
  const handleChange = (key: string, value: any) => {
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
    } as FormField)
  }

  const handleOptionChange = (index: number, key: string, value: string) => {
    if (!('options' in field)) return
    
    const fieldWithOptions = field as any
    const options = [...(fieldWithOptions.options || [])]
    options[index] = { ...options[index], [key]: value }
    onUpdate({ ...field, options } as FormField)
  }

  const handleOptionRemove = (index: number) => {
    if (!('options' in field)) return
    
    const fieldWithOptions = field as any
    const options = [...(fieldWithOptions.options || [])]
    options.splice(index, 1)
    onUpdate({ ...field, options } as FormField)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Field Properties</h3>
          <p className="text-sm text-muted-foreground">{field.type} field</p>
        </div>
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
      <ScrollArea className="flex-1">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-transparent">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              General
            </TabsTrigger>
            <TabsTrigger value="validation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Validation
            </TabsTrigger>
            {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'checkbox') && (
              <TabsTrigger value="options" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Options
              </TabsTrigger>
            )}
            <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Advanced
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Preview
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
              <Textarea
                id="field-help"
                value={field.helpText || ''}
                onChange={(e) => handleChange('helpText', e.target.value)}
                placeholder="Help text for users"
                rows={2}
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

            {/* Text/Textarea specific settings */}
            {(field.type === 'text' || field.type === 'textarea') && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="recording-enabled">Enable Audio Recording</Label>
                  <Switch
                    id="recording-enabled"
                    checked={field.meta?.recordingEnabled || false}
                    onCheckedChange={(checked) => handleMetaChange('recordingEnabled', checked)}
                  />
                </div>

                {field.meta?.recordingEnabled && (
                  <div>
                    <Label htmlFor="recording-mode">Recording Mode</Label>
                    <Select
                      value={field.meta?.recordingMode || 'replace'}
                      onValueChange={(value) => handleMetaChange('recordingMode', value)}
                    >
                      <SelectTrigger id="recording-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Replace existing text</SelectItem>
                        <SelectItem value="append">Append to existing text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-char-count">Show Character Count</Label>
                  <Switch
                    id="show-char-count"
                    checked={field.meta?.showCharCount !== false}
                    onCheckedChange={(checked) => handleMetaChange('showCharCount', checked)}
                  />
                </div>

                {field.type === 'text' && (
                  <div>
                    <Label htmlFor="input-mask">Input Mask</Label>
                    <Select
                      value={field.mask || ''}
                      onValueChange={(value) => handleChange('mask', value)}
                    >
                      <SelectTrigger id="input-mask">
                        <SelectValue placeholder="No mask" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No mask</SelectItem>
                        <SelectItem value="(999) 999-9999">Phone: (999) 999-9999</SelectItem>
                        <SelectItem value="999-99-9999">SSN: 999-99-9999</SelectItem>
                        <SelectItem value="99/99/9999">Date: MM/DD/YYYY</SelectItem>
                        <SelectItem value="AA-999">License: AA-999</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Textarea specific settings */}
            {field.type === 'textarea' && (
              <>
                <div>
                  <Label htmlFor="textarea-rows">Default Rows</Label>
                  <Input
                    id="textarea-rows"
                    type="number"
                    value={field.meta?.rows || 4}
                    onChange={(e) => handleMetaChange('rows', parseInt(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="expandable">Expandable (Fullscreen)</Label>
                  <Switch
                    id="expandable"
                    checked={field.meta?.expandable || false}
                    onCheckedChange={(checked) => handleMetaChange('expandable', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-word-count">Show Word Count</Label>
                  <Switch
                    id="show-word-count"
                    checked={field.meta?.showWordCount || false}
                    onCheckedChange={(checked) => handleMetaChange('showWordCount', checked)}
                  />
                </div>
              </>
            )}

            {/* Number/Currency specific settings */}
            {(field.type === 'number' || field.type === 'currency') && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="input-mode">Input Mode</Label>
                  <Select
                    value={field.meta?.inputMode || 'default'}
                    onValueChange={(value) => handleMetaChange('inputMode', value)}
                  >
                    <SelectTrigger id="input-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Input</SelectItem>
                      <SelectItem value="stepper">Stepper Controls</SelectItem>
                      <SelectItem value="slider">Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="step-value">Step Value</Label>
                  <Input
                    id="step-value"
                    type="number"
                    value={field.meta?.step || 1}
                    onChange={(e) => handleMetaChange('step', parseFloat(e.target.value))}
                    step="any"
                  />
                </div>

                <div>
                  <Label htmlFor="decimal-places">Decimal Places</Label>
                  <Input
                    id="decimal-places"
                    type="number"
                    value={field.meta?.decimalPlaces ?? 2}
                    onChange={(e) => handleMetaChange('decimalPlaces', parseInt(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>

                {field.type === 'currency' && (
                  <div>
                    <Label htmlFor="currency-code">Currency</Label>
                    <Select
                      value={field.meta?.currency || 'USD'}
                      onValueChange={(value) => handleMetaChange('currency', value)}
                    >
                      <SelectTrigger id="currency-code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    value={field.meta?.prefix || ''}
                    onChange={(e) => handleMetaChange('prefix', e.target.value)}
                    placeholder="e.g., $"
                  />
                </div>

                <div>
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={field.meta?.suffix || ''}
                    onChange={(e) => handleMetaChange('suffix', e.target.value)}
                    placeholder="e.g., /hr"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="thousands-separator">Thousands Separator</Label>
                  <Switch
                    id="thousands-separator"
                    checked={field.meta?.thousandsSeparator || false}
                    onCheckedChange={(checked) => handleMetaChange('thousandsSeparator', checked)}
                  />
                </div>
              </>
            )}

            {/* Date/Time specific settings */}
            {(field.type === 'date' || field.type === 'datetime' || field.type === 'time') && (
              <>
                <Separator />
                {field.type !== 'time' && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-range">Date Range Selection</Label>
                      <Switch
                        id="enable-range"
                        checked={field.meta?.enableRange || false}
                        onCheckedChange={(checked) => handleMetaChange('enableRange', checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select
                        value={field.meta?.dateFormat || 'PP'}
                        onValueChange={(value) => handleMetaChange('dateFormat', value)}
                      >
                        <SelectTrigger id="date-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PP">Jan 1, 2024</SelectItem>
                          <SelectItem value="P">01/01/2024</SelectItem>
                          <SelectItem value="yyyy-MM-dd">2024-01-01</SelectItem>
                          <SelectItem value="dd/MM/yyyy">01/01/2024</SelectItem>
                          <SelectItem value="EEEE, MMMM do, yyyy">Monday, January 1st, 2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quick-selects">Quick Select Options</Label>
                      <div className="space-y-2 mt-2">
                        {['today', 'tomorrow', 'nextWeek', 'thisWeek', 'thisMonth'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`quick-${option}`}
                              checked={field.meta?.quickSelects?.includes(option) || false}
                              onChange={(e) => {
                                const current = field.meta?.quickSelects || []
                                const updated = e.target.checked
                                  ? [...current, option]
                                  : current.filter((o: any) => o !== option)
                                handleMetaChange('quickSelects', updated)
                              }}
                            />
                            <Label htmlFor={`quick-${option}`} className="font-normal">
                              {option === 'today' ? 'Today' :
                               option === 'tomorrow' ? 'Tomorrow' :
                               option === 'nextWeek' ? 'Next Week' :
                               option === 'thisWeek' ? 'This Week' :
                               'This Month'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Select/Multiselect specific settings */}
            {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="searchable">Searchable</Label>
                  <Switch
                    id="searchable"
                    checked={field.meta?.searchable !== false}
                    onCheckedChange={(checked) => handleMetaChange('searchable', checked)}
                  />
                </div>

                {field.type === 'multiselect' && (
                  <>
                    <div>
                      <Label htmlFor="max-selections">Max Selections</Label>
                      <Input
                        id="max-selections"
                        type="number"
                        value={field.meta?.maxSelections || ''}
                        onChange={(e) => handleMetaChange('maxSelections', parseInt(e.target.value) || undefined)}
                        placeholder="Unlimited"
                        min={1}
                      />
                    </div>

                    <div>
                      <Label htmlFor="display-mode">Display Mode</Label>
                      <Select
                        value={field.meta?.displayMode || 'checkboxes'}
                        onValueChange={(value) => handleMetaChange('displayMode', value)}
                      >
                        <SelectTrigger id="display-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkboxes">Checkboxes</SelectItem>
                          <SelectItem value="chips">Chips/Tags</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="inline-options">Inline Display</Label>
                  <Switch
                    id="inline-options"
                    checked={field.meta?.inline || false}
                    onCheckedChange={(checked) => handleMetaChange('inline', checked)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="validation" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="field-required">Required field</Label>
              <Switch
                id="field-required"
                checked={field.required || false}
                onCheckedChange={(checked) => handleChange('required', checked)}
              />
            </div>

            {(field.type === 'text' || field.type === 'textarea') && (
              <>
                <div>
                  <Label htmlFor="field-minlength">Min Length</Label>
                  <Input
                    id="field-minlength"
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || undefined)}
                    placeholder="No minimum"
                    min={0}
                  />
                </div>

                <div>
                  <Label htmlFor="field-maxlength">Max Length</Label>
                  <Input
                    id="field-maxlength"
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || undefined)}
                    placeholder="No limit"
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor="field-pattern">Regex Pattern</Label>
                  <Input
                    id="field-pattern"
                    value={field.validation?.pattern || ''}
                    onChange={(e) => handleValidationChange('pattern', e.target.value)}
                    placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Regular expression for validation
                  </p>
                </div>

                <div>
                  <Label htmlFor="field-error-message">Custom Error Message</Label>
                  <Input
                    id="field-error-message"
                    value={(field.validation as any)?.errorMessage || ''}
                    onChange={(e) => handleValidationChange('errorMessage', e.target.value)}
                    placeholder="Please enter a valid value"
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
                    value={field.validation?.min ?? ''}
                    onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
                    placeholder="No minimum"
                    step="any"
                  />
                </div>

                <div>
                  <Label htmlFor="field-max">Max Value</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={field.validation?.max ?? ''}
                    onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
                    placeholder="No maximum"
                    step="any"
                  />
                </div>
              </>
            )}

            {(field.type === 'date' || field.type === 'datetime') && (
              <>
                <div>
                  <Label htmlFor="field-min-date">Min Date</Label>
                  <Input
                    id="field-min-date"
                    type="date"
                    value={(field.validation as any)?.minDate || ''}
                    onChange={(e) => handleValidationChange('minDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="field-max-date">Max Date</Label>
                  <Input
                    id="field-max-date"
                    type="date"
                    value={(field.validation as any)?.maxDate || ''}
                    onChange={(e) => handleValidationChange('maxDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="disabled-weekdays">Disabled Weekdays</Label>
                  <div className="space-y-2 mt-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`weekday-${index}`}
                          checked={field.meta?.disabledWeekdays?.includes(index) || false}
                          onChange={(e) => {
                            const current = field.meta?.disabledWeekdays || []
                            const updated = e.target.checked
                              ? [...current, index]
                              : current.filter((d: any) => d !== index)
                            handleMetaChange('disabledWeekdays', updated)
                          }}
                        />
                        <Label htmlFor={`weekday-${index}`} className="font-normal">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {field.type === 'email' && (
              <div>
                <Label htmlFor="email-domains">Allowed Email Domains</Label>
                <Input
                  id="email-domains"
                  value={(field.validation as any)?.allowedDomains?.join(', ') || ''}
                  onChange={(e) => handleValidationChange('allowedDomains', 
                    e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                  )}
                  placeholder="gmail.com, company.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of allowed domains
                </p>
              </div>
            )}

            {field.type === 'file' && (
              <>
                <div>
                  <Label htmlFor="file-types">Allowed File Types</Label>
                  <Input
                    id="file-types"
                    value={(field.validation as any)?.fileTypes?.join(', ') || ''}
                    onChange={(e) => handleValidationChange('fileTypes', 
                      e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    )}
                    placeholder=".pdf, .doc, .docx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated list of file extensions
                  </p>
                </div>

                <div>
                  <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={(field.validation as any)?.maxFileSize || ''}
                    onChange={(e) => handleValidationChange('maxFileSize', parseInt(e.target.value) || undefined)}
                    placeholder="10"
                    min={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="multiple-files">Allow Multiple Files</Label>
                  <Switch
                    id="multiple-files"
                    checked={(field.validation as any)?.multiple || false}
                    onCheckedChange={(checked) => handleValidationChange('multiple', checked)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Options tab for select/radio/checkbox fields */}
          {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'checkbox') && (
            <TabsContent value="options" className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOptionAdd}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {'options' in field && (field as any).options?.map((option: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOptionRemove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="options-url">Dynamic Options URL</Label>
                <Input
                  id="options-url"
                  value={field.meta?.optionsUrl || ''}
                  onChange={(e) => handleMetaChange('optionsUrl', e.target.value)}
                  placeholder="https://api.example.com/options"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fetch options from an API endpoint
                </p>
              </div>

              {field.meta?.optionsUrl && (
                <>
                  <div>
                    <Label htmlFor="label-key">Label Field</Label>
                    <Input
                      id="label-key"
                      value={field.meta?.labelKey || ''}
                      onChange={(e) => handleMetaChange('labelKey', e.target.value)}
                      placeholder="label"
                    />
                  </div>

                  <div>
                    <Label htmlFor="value-key">Value Field</Label>
                    <Input
                      id="value-key"
                      value={field.meta?.valueKey || ''}
                      onChange={(e) => handleMetaChange('valueKey', e.target.value)}
                      placeholder="value"
                    />
                  </div>
                </>
              )}
            </TabsContent>
          )}

          <TabsContent value="appearance" className="p-4 space-y-4">
            <div>
              <Label htmlFor="field-columns">Column Span</Label>
              <Select
                value={field.grid?.col?.toString() || '12'}
                onValueChange={(value) => handleChange('grid', { ...field.grid, col: parseInt(value) })}
              >
                <SelectTrigger id="field-columns">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">Full Width (12/12)</SelectItem>
                  <SelectItem value="6">Half Width (6/12)</SelectItem>
                  <SelectItem value="4">One Third (4/12)</SelectItem>
                  <SelectItem value="3">One Quarter (3/12)</SelectItem>
                  <SelectItem value="8">Two Thirds (8/12)</SelectItem>
                  <SelectItem value="9">Three Quarters (9/12)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="field-hidden">Hidden Field</Label>
              <Switch
                id="field-hidden"
                checked={field.hidden || false}
                onCheckedChange={(checked) => handleChange('hidden', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="field-disabled">Disabled by Default</Label>
              <Switch
                id="field-disabled"
                checked={field.disabled || false}
                onCheckedChange={(checked) => handleChange('disabled', checked)}
              />
            </div>

            <div>
              <Label htmlFor="css-class">CSS Class</Label>
              <Input
                id="css-class"
                value={field.className || ''}
                onChange={(e) => handleChange('className', e.target.value)}
                placeholder="custom-class"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4">
            <div>
              <Label htmlFor="field-conditions">Conditional Logic</Label>
              <Textarea
                id="field-conditions"
                value={JSON.stringify(field.conditions || [], null, 2)}
                onChange={(e) => {
                  try {
                    const conditions = JSON.parse(e.target.value)
                    handleChange('conditions', conditions)
                  } catch {}
                }}
                placeholder="[]"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JSON array of conditions for showing/hiding this field
              </p>
            </div>

            <div>
              <Label htmlFor="field-calculations">Calculations</Label>
              <Input
                id="field-calculations"
                value={field.calculation || ''}
                onChange={(e) => handleChange('calculation', e.target.value)}
                placeholder="field1 + field2 * 0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formula using other field keys
              </p>
            </div>

            <div>
              <Label htmlFor="field-webhooks">Webhook on Change</Label>
              <Input
                id="field-webhooks"
                value={field.meta?.webhookUrl || ''}
                onChange={(e) => handleMetaChange('webhookUrl', e.target.value)}
                placeholder="https://api.example.com/webhook"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Send field value to webhook when changed
              </p>
            </div>

            <div>
              <Label htmlFor="field-tooltip">Tooltip</Label>
              <Textarea
                id="field-tooltip"
                value={field.meta?.tooltip || ''}
                onChange={(e) => handleMetaChange('tooltip', e.target.value)}
                placeholder="Additional information shown on hover"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="field-api-name">API Field Name</Label>
              <Input
                id="field-api-name"
                value={field.meta?.apiName || ''}
                onChange={(e) => handleMetaChange('apiName', e.target.value)}
                placeholder="custom_api_field"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Override field key for API submissions
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-4">
            <FieldPreview field={field} />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}