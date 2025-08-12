'use client'

import React, { useState } from 'react'
import { FormField } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, parse, isValid, isAfter, isBefore, isWithinInterval, addDays } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EnhancedDateFieldProps {
  field: FormField
  value: string | Date | { from: Date; to: Date }
  onChange: (value: any) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function EnhancedDateField({ 
  field, 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  error 
}: EnhancedDateFieldProps) {
  const [open, setOpen] = useState(false)

  // Parse value based on field type
  const parseValue = () => {
    if (!value) return undefined
    
    if (field.meta?.enableRange) {
      if (typeof value === 'object' && 'from' in value && 'to' in value) {
        return {
          from: value.from instanceof Date ? value.from : new Date(value.from),
          to: value.to instanceof Date ? value.to : new Date(value.to)
        }
      }
      return undefined
    }
    
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = new Date(value)
      return isValid(parsed) ? parsed : undefined
    }
    return undefined
  }

  const dateValue = parseValue()

  // Format display value
  const formatDisplayValue = () => {
    if (!dateValue) return ''
    
    if (field.meta?.enableRange && typeof dateValue === 'object' && 'from' in dateValue) {
      const formatStr = field.meta?.dateFormat || 'PP'
      return `${format(dateValue.from, formatStr)} - ${format(dateValue.to, formatStr)}`
    }
    
    if (dateValue instanceof Date) {
      if (field.type === 'datetime') {
        return format(dateValue, field.meta?.dateFormat || "PPP HH:mm")
      }
      if (field.type === 'time') {
        return format(dateValue, field.meta?.timeFormat || "HH:mm")
      }
      return format(dateValue, field.meta?.dateFormat || "PPP")
    }
    
    return ''
  }

  // Get disabled dates
  const getDisabledDates = () => {
    const disabled: Date[] = []
    
    // Add specific disabled dates
    if (field.meta?.disabledDates) {
      field.meta.disabledDates.forEach((dateStr: string) => {
        const date = new Date(dateStr)
        if (isValid(date)) disabled.push(date)
      })
    }
    
    return disabled
  }

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    const validation = field.validation as any
    // Check min date
    if (validation?.minDate) {
      const min = new Date(validation.minDate)
      if (isValid(min) && isBefore(date, min)) return true
    }
    
    // Check max date
    if (validation?.maxDate) {
      const max = new Date(validation.maxDate)
      if (isValid(max) && isAfter(date, max)) return true
    }
    
    // Check disabled weekdays
    if (field.meta?.disabledWeekdays) {
      const dayOfWeek = date.getDay()
      if (field.meta.disabledWeekdays.includes(dayOfWeek)) return true
    }
    
    // Check specific disabled dates
    const disabledDates = getDisabledDates()
    return disabledDates.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    )
  }

  // Handle date selection
  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) {
      onChange('')
      return
    }
    
    if (field.type === 'datetime') {
      // Preserve time if already set
      const currentTime = dateValue instanceof Date ? dateValue : new Date()
      selected.setHours(currentTime.getHours())
      selected.setMinutes(currentTime.getMinutes())
    }
    
    onChange(selected.toISOString())
    
    if (field.type === 'date') {
      setOpen(false)
    }
  }

  // Handle range selection
  const handleRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range?.from) {
      onChange(null)
      return
    }
    
    if (range.to) {
      onChange({
        from: range.from.toISOString(),
        to: range.to.toISOString()
      })
      setOpen(false)
    } else {
      onChange({
        from: range.from.toISOString(),
        to: range.from.toISOString()
      })
    }
  }

  // Handle time change
  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    const current = dateValue instanceof Date ? dateValue : new Date()
    
    if (type === 'hour') {
      current.setHours(parseInt(value))
    } else {
      current.setMinutes(parseInt(value))
    }
    
    onChange(current.toISOString())
  }

  // Quick select options
  const quickSelectOptions = field.meta?.quickSelects || []
  
  const handleQuickSelect = (option: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (option) {
      case 'today':
        onChange(today.toISOString())
        break
      case 'tomorrow':
        onChange(addDays(today, 1).toISOString())
        break
      case 'nextWeek':
        onChange(addDays(today, 7).toISOString())
        break
      case 'nextMonth':
        const nextMonth = new Date(today)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        onChange(nextMonth.toISOString())
        break
      case 'thisWeek':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        onChange({
          from: weekStart.toISOString(),
          to: weekEnd.toISOString()
        })
        break
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        onChange({
          from: monthStart.toISOString(),
          to: monthEnd.toISOString()
        })
        break
    }
    setOpen(false)
  }

  // Time only field
  if (field.type === 'time') {
    const timeValue = dateValue instanceof Date ? dateValue : new Date()
    
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select
          value={timeValue.getHours().toString().padStart(2, '0')}
          onValueChange={(v) => handleTimeChange('hour', v)}
          disabled={disabled}
        >
          <SelectTrigger className={cn("w-20", error && "border-destructive")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={timeValue.getMinutes().toString().padStart(2, '0')}
          onValueChange={(v) => handleTimeChange('minute', v)}
          disabled={disabled}
        >
          <SelectTrigger className={cn("w-20", error && "border-destructive")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => (
              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? formatDisplayValue() : (field.placeholder || "Pick a date")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Quick select buttons */}
          {quickSelectOptions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {quickSelectOptions.includes('today') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('today')}
                >
                  Today
                </Button>
              )}
              {quickSelectOptions.includes('tomorrow') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('tomorrow')}
                >
                  Tomorrow
                </Button>
              )}
              {quickSelectOptions.includes('nextWeek') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('nextWeek')}
                >
                  Next Week
                </Button>
              )}
              {field.meta?.enableRange && quickSelectOptions.includes('thisWeek') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('thisWeek')}
                >
                  This Week
                </Button>
              )}
              {field.meta?.enableRange && quickSelectOptions.includes('thisMonth') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('thisMonth')}
                >
                  This Month
                </Button>
              )}
            </div>
          )}
          
          {/* Calendar */}
          {field.meta?.enableRange ? (
            <Calendar
              mode="range"
              selected={dateValue as any}
              onSelect={handleRangeSelect as any}
              disabled={isDateDisabled}
              initialFocus
              numberOfMonths={field.meta?.numberOfMonths || 1}
            />
          ) : (
            <Calendar
              mode="single"
              selected={dateValue as Date}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              numberOfMonths={field.meta?.numberOfMonths || 1}
            />
          )}
          
          {/* Time picker for datetime */}
          {field.type === 'datetime' && dateValue instanceof Date && (
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={dateValue.getHours().toString().padStart(2, '0')}
                  onValueChange={(v) => handleTimeChange('hour', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select
                  value={dateValue.getMinutes().toString().padStart(2, '0')}
                  onValueChange={(v) => handleTimeChange('minute', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {/* Clear button */}
          {dateValue && !field.validation?.required && (
            <div className="border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}