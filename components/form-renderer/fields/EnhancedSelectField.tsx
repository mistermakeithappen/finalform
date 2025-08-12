'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FormField } from '@/lib/types/form'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface EnhancedSelectFieldProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function EnhancedSelectField({ 
  field, 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  error 
}: EnhancedSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [multiOpen, setMultiOpen] = useState(false)
  const [search, setSearch] = useState('')
  const fieldOptions = 'options' in field ? field.options : []
  const [options, setOptions] = useState(fieldOptions || [])
  const [loading, setLoading] = useState(false)

  // Update options when field.options changes
  useEffect(() => {
    if (!field.meta?.optionsUrl) {
      const opts = 'options' in field ? field.options : []
      setOptions(opts || [])
    }
  }, ['options' in field ? field.options : undefined, field.meta?.optionsUrl])

  // Load dynamic options if URL is provided
  useEffect(() => {
    if (field.meta?.optionsUrl) {
      loadDynamicOptions()
    }
  }, [field.meta?.optionsUrl])

  const loadDynamicOptions = async () => {
    if (!field.meta?.optionsUrl) return
    
    setLoading(true)
    try {
      const response = await fetch(field.meta.optionsUrl)
      const data = await response.json()
      
      // Transform data based on mapping configuration
      const transformedOptions = data.map((item: any) => ({
        label: field.meta?.labelKey ? item[field.meta.labelKey] : item.label || item.name || item,
        value: field.meta?.valueKey ? item[field.meta.valueKey] : item.value || item.id || item,
        disabled: field.meta?.disabledKey ? item[field.meta.disabledKey] : false,
        description: field.meta?.descriptionKey ? item[field.meta.descriptionKey] : undefined,
      }))
      
      setOptions(transformedOptions)
    } catch (err) {
      console.error('Failed to load options:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search) return options
    
    const searchLower = search.toLowerCase()
    return options.filter((option: any) => 
      option.label.toLowerCase().includes(searchLower) ||
      option.value?.toString().toLowerCase().includes(searchLower) ||
      (option.description && option.description.toLowerCase().includes(searchLower))
    )
  }, [options, search])

  // Group options if grouping is enabled
  const groupedOptions = useMemo(() => {
    if (!field.meta?.groupBy) return { '': filteredOptions }
    
    return filteredOptions.reduce((groups, option: any) => {
      const group = option[field.meta!.groupBy] || 'Other'
      if (!groups[group]) groups[group] = []
      groups[group].push(option)
      return groups
    }, {} as Record<string, typeof options>)
  }, [filteredOptions, field.meta?.groupBy])

  // Handle single select with dropdown
  if (field.type === 'select' && field.meta?.searchable !== false) {
    const selectedOption = options.find(opt => opt.value === value)
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              error && "border-destructive",
              !value && "text-muted-foreground"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options...
              </span>
            ) : (
              selectedOption?.label || field.placeholder || "Select an option"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {field.meta?.searchable !== false && (
              <CommandInput 
                placeholder={field.meta?.searchPlaceholder || "Search options..."} 
                value={search}
                onValueChange={setSearch}
              />
            )}
            <CommandList>
              <CommandEmpty>
                {field.meta?.noResultsText || "No options found"}
              </CommandEmpty>
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <CommandGroup key={group} heading={group || undefined}>
                  {groupOptions.map((option: any) => (
                    <CommandItem
                      key={option.value}
                      value={String(option.value)}
                      disabled={option.disabled}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue)
                        setOpen(false)
                        onBlur?.()
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {option.badge && (
                        <Badge variant="secondary" className="ml-2">
                          {option.badge}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Handle radio buttons
  if (field.type === 'radio') {
    return (
      <RadioGroup 
        value={value} 
        onValueChange={(v) => {
          onChange(v)
          onBlur?.()
        }}
        disabled={disabled}
        className={cn(
          field.meta?.inline ? "flex flex-row gap-4" : "space-y-2"
        )}
      >
        {options.map((option: any) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={String(option.value)} 
              id={`${field.key}-${option.value}`}
              disabled={option.disabled}
            />
            <Label 
              htmlFor={`${field.key}-${option.value}`}
              className={cn(
                "font-normal cursor-pointer",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.label}
              {option.description && (
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }

  // Handle multi-select
  if (field.type === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : []
    
    if (field.meta?.displayMode === 'chips') {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((val) => {
              const option = options.find(opt => opt.value === val)
              if (!option) return null
              
              return (
                <Badge key={val} variant="secondary" className="pr-1">
                  {option.label}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => {
                      onChange(selectedValues.filter(v => v !== val))
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}
          </div>
          
          <Popover open={multiOpen} onOpenChange={setMultiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start",
                  error && "border-destructive"
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading options...
                  </span>
                ) : (
                  field.placeholder || "Select options"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                {field.meta?.searchable !== false && (
                  <CommandInput 
                    placeholder={field.meta?.searchPlaceholder || "Search options..."} 
                    value={search}
                    onValueChange={setSearch}
                  />
                )}
                <CommandList>
                  <CommandEmpty>
                    {field.meta?.noResultsText || "No options found"}
                  </CommandEmpty>
                  {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                    <CommandGroup key={group} heading={group || undefined}>
                      {groupOptions.map((option: any) => (
                        <CommandItem
                          key={option.value}
                          value={String(option.value)}
                          disabled={option.disabled}
                          onSelect={(currentValue) => {
                            const newValues = selectedValues.includes(currentValue)
                              ? selectedValues.filter(v => v !== currentValue)
                              : [...selectedValues, currentValue]
                            
                            // Apply max selection limit
                            if (field.meta?.maxSelections && 
                                newValues.length > field.meta.maxSelections) {
                              return
                            }
                            
                            onChange(newValues)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedValues.includes(option.value) 
                                ? "opacity-100" 
                                : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div>{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {field.meta?.maxSelections && (
            <p className="text-xs text-muted-foreground">
              {selectedValues.length} / {field.meta.maxSelections} selected
            </p>
          )}
        </div>
      )
    }
    
    // Default checkbox list for multi-select
    return (
      <div className={cn(
        "space-y-2",
        field.meta?.inline && "flex flex-row gap-4 space-y-0"
      )}>
        {options.map((option: any) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${field.key}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={(checked) => {
                const newValues = checked
                  ? [...selectedValues, option.value]
                  : selectedValues.filter(v => v !== option.value)
                
                // Apply max selection limit
                if (field.meta?.maxSelections && 
                    checked && 
                    newValues.length > field.meta.maxSelections) {
                  return
                }
                
                onChange(newValues)
                onBlur?.()
              }}
              disabled={disabled || option.disabled}
            />
            <Label
              htmlFor={`${field.key}-${option.value}`}
              className={cn(
                "font-normal cursor-pointer",
                (disabled || option.disabled) && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.label}
              {option.description && (
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </Label>
          </div>
        ))}
        
        {field.meta?.maxSelections && (
          <p className="text-xs text-muted-foreground">
            {selectedValues.length} / {field.meta.maxSelections} selected
          </p>
        )}
      </div>
    )
  }

  return null
}