'use client'

import React, { useState } from 'react'
import { FormField } from '@/lib/types/form'
import { FieldRenderer } from '../form-renderer/FieldRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { validateField } from '@/lib/validation/field-validators'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FieldPreviewProps {
  field: FormField
  className?: string
}

export function FieldPreview({ field, className }: FieldPreviewProps) {
  const [value, setValue] = useState<any>(field.default || getDefaultValue(field))
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  function getDefaultValue(field: FormField) {
    switch (field.type) {
      case 'checkbox':
      case 'toggle':
        return false
      case 'multiselect':
        return []
      case 'number':
      case 'currency':
      case 'rating':
      case 'slider':
        return field.validation?.min ?? 0
      case 'matrix':
        return [{}]
      case 'repeater':
        return []
      case 'address':
        return {}
      default:
        return ''
    }
  }

  const handleChange = (newValue: any) => {
    setValue(newValue)
    
    // Validate in real-time if validation is shown
    if (showValidation) {
      const validationError = validateField(field, newValue)
      setError(validationError)
    }
  }

  const handleValidate = () => {
    const validationError = validateField(field, value)
    setError(validationError)
    setShowValidation(true)
  }

  const handleReset = () => {
    setValue(field.default || getDefaultValue(field))
    setError(null)
    setShowValidation(false)
  }

  const getSampleData = () => {
    switch (field.type) {
      case 'text':
        return 'John Doe'
      case 'email':
        return 'john@example.com'
      case 'phone':
        return '(555) 123-4567'
      case 'number':
        return 42
      case 'currency':
        return 99.99
      case 'date':
        return new Date().toISOString()
      case 'textarea':
        return 'This is a sample text that demonstrates how the textarea field will look with actual content.'
      case 'select':
      case 'radio':
        return field.options?.[0]?.value || ''
      case 'multiselect':
        return field.options?.slice(0, 2).map(o => o.value) || []
      case 'checkbox':
      case 'toggle':
        return true
      case 'rating':
        return 4
      case 'slider':
        return 75
      case 'address':
        return {
          street1: '123 Main St',
          street2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        }
      case 'matrix':
        return [
          { item: 'Product A', qty: 2, price: 50, total: 100 },
          { item: 'Product B', qty: 1, price: 75, total: 75 }
        ]
      default:
        return value
    }
  }

  const handleLoadSample = () => {
    const sampleValue = getSampleData()
    setValue(sampleValue)
    if (showValidation) {
      const validationError = validateField(field, sampleValue)
      setError(validationError)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Field Preview</CardTitle>
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleReset}
              title="Reset to default"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showPreview && (
        <CardContent className="space-y-4">
          {/* Preview Controls */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadSample}
            >
              Load Sample Data
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidate}
            >
              Test Validation
            </Button>
          </div>

          {/* Field Preview */}
          <div className="p-4 border rounded-lg bg-background">
            <FieldRenderer
              field={field}
              value={value}
              onChange={handleChange}
              error={showValidation ? error || undefined : undefined}
              disabled={false}
              required={field.required}
            />
          </div>

          {/* Validation Result */}
          {showValidation && (
            <Alert variant={error ? "destructive" : "default"}>
              <AlertDescription>
                {error ? (
                  <>
                    <strong>Validation Failed:</strong> {error}
                  </>
                ) : (
                  <>
                    <strong>Validation Passed!</strong> The field value is valid.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Value Display */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Value:</p>
            <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>

          {/* Field Settings Summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Active Settings:</p>
            <div className="flex flex-wrap gap-1">
              {field.required && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
              {field.disabled && (
                <Badge variant="secondary" className="text-xs">Disabled</Badge>
              )}
              {field.hidden && (
                <Badge variant="secondary" className="text-xs">Hidden</Badge>
              )}
              {field.validation?.minLength && (
                <Badge variant="secondary" className="text-xs">
                  Min Length: {field.validation.minLength}
                </Badge>
              )}
              {field.validation?.maxLength && (
                <Badge variant="secondary" className="text-xs">
                  Max Length: {field.validation.maxLength}
                </Badge>
              )}
              {field.validation?.min !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  Min: {field.validation.min}
                </Badge>
              )}
              {field.validation?.max !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  Max: {field.validation.max}
                </Badge>
              )}
              {field.validation?.pattern && (
                <Badge variant="secondary" className="text-xs">Pattern Validation</Badge>
              )}
              {field.meta?.recordingEnabled && (
                <Badge variant="secondary" className="text-xs">Audio Recording</Badge>
              )}
              {field.meta?.searchable && (
                <Badge variant="secondary" className="text-xs">Searchable</Badge>
              )}
              {field.meta?.expandable && (
                <Badge variant="secondary" className="text-xs">Expandable</Badge>
              )}
              {field.conditions?.length && (
                <Badge variant="secondary" className="text-xs">
                  {field.conditions.length} Condition(s)
                </Badge>
              )}
              {field.calculation && (
                <Badge variant="secondary" className="text-xs">Calculated</Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}