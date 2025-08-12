'use client'

import React, { useState, useEffect } from 'react'
import { FormField, AICalculation } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  MousePointer,
  Play,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIFormulaBuilderProps {
  value: AICalculation | undefined
  onChange: (value: AICalculation | undefined) => void
  fields: FormField[]
  currentField: FormField
  className?: string
  hasOpenAIKey?: boolean
  isInFieldGroup?: boolean
  fieldGroupKey?: string
}

const outputFormats = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'text', label: 'Text' },
  { value: 'fraction', label: 'Fraction' },
  { value: 'measurement', label: 'Measurement' }
]

const commonPrompts = [
  { 
    label: 'Add fraction to number',
    prompt: 'Add the fractional measurement to the numeric value',
    example: '1/4" + 5 = 5.25'
  },
  {
    label: 'Calculate area',
    prompt: 'Calculate the area by multiplying length times width',
    example: 'Length: 10ft, Width: 12ft = 120 sq ft'
  },
  {
    label: 'Convert units',
    prompt: 'Convert the measurement from inches to feet',
    example: '36 inches = 3 feet'
  },
  {
    label: 'Sum measurements',
    prompt: 'Add all the measurements together, handling mixed units',
    example: '2ft + 6in + 1/2ft = 3ft'
  },
  {
    label: 'Calculate percentage',
    prompt: 'Calculate what percentage the first value is of the second',
    example: '25 of 100 = 25%'
  }
]

export function AIFormulaBuilder({
  value,
  onChange,
  fields,
  currentField,
  className,
  hasOpenAIKey = false,
  isInFieldGroup = false,
  fieldGroupKey
}: AIFormulaBuilderProps) {
  const [isActive, setIsActive] = useState(false)
  const [prompt, setPrompt] = useState(value?.prompt || '')
  const [instructions, setInstructions] = useState(value?.instructions || '')
  const [selectedFields, setSelectedFields] = useState<string[]>(value?.fieldReferences || [])
  const [outputFormat, setOutputFormat] = useState<string>(value?.outputFormat || 'number')
  const [fallbackValue, setFallbackValue] = useState(value?.fallbackValue || '')
  const [examples, setExamples] = useState(value?.examples || [])
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  // Get available fields based on scope
  const availableFields = React.useMemo(() => {
    if (isInFieldGroup) {
      // When in a field group, only show fields from the same group
      // The fields prop should already be filtered to the group's fields
      return fields.filter(f => f.key !== currentField.key)
    } else {
      // For global scope, show all fields except current
      return fields.filter(f => f.key !== currentField.key)
    }
  }, [fields, currentField.key, isInFieldGroup])

  const handleActivate = () => {
    setIsActive(true)
  }

  const handleSave = () => {
    const aiCalc: AICalculation = {
      id: value?.id || `ai_calc_${Date.now()}`,
      name: value?.name || `AI Calculation for ${currentField.label || currentField.key}`,
      prompt,
      fieldReferences: selectedFields,
      targetField: currentField.key, // Set the current field as the target
      instructions,
      outputFormat: outputFormat as 'number' | 'currency' | 'percentage' | 'text' | 'fraction' | 'measurement',
      fallbackValue,
      examples: examples.filter(e => e.inputs && Object.keys(e.inputs).length > 0),
      cacheResults: true,
      // Add scope information if this is within a field group
      scope: isInFieldGroup ? 'fieldgroup' : 'global',
      fieldGroupKey: isInFieldGroup ? fieldGroupKey : undefined
    }
    
    onChange(aiCalc)
    setIsActive(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setPrompt(value?.prompt || '')
    setInstructions(value?.instructions || '')
    setSelectedFields(value?.fieldReferences || [])
    setOutputFormat(value?.outputFormat || 'number')
    setFallbackValue(value?.fallbackValue || '')
    setExamples(value?.examples || [])
    setIsActive(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setPrompt('')
    setInstructions('')
    setSelectedFields([])
    setOutputFormat('number')
    setFallbackValue('')
    setExamples([])
    setIsActive(false)
  }

  const toggleFieldSelection = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const addExample = () => {
    setExamples(prev => [...prev, { inputs: {}, expectedOutput: '' }])
  }

  const removeExample = (index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index))
  }

  const updateExample = (index: number, field: 'inputs' | 'expectedOutput', value: any) => {
    setExamples(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ))
  }

  const applyPromptTemplate = (template: typeof commonPrompts[0]) => {
    setPrompt(template.prompt)
    setInstructions(`Example: ${template.example}`)
  }

  const testCalculation = async () => {
    if (!hasOpenAIKey) {
      setTestError('OpenAI API key not configured. Please add it in settings.')
      return
    }

    setTesting(true)
    setTestError(null)
    setTestResult(null)

    try {
      // Create mock field values for testing
      const mockValues: Record<string, any> = {}
      selectedFields.forEach(fieldKey => {
        const field = fields.find(f => f.key === fieldKey)
        if (field) {
          // Generate appropriate test values based on field type
          switch (field.type) {
            case 'number':
            case 'currency':
              mockValues[fieldKey] = 10
              break
            case 'select':
              if (fieldKey.includes('fraction') || fieldKey.includes('measurement')) {
                mockValues[fieldKey] = '1/4'
              } else {
                mockValues[fieldKey] = 'Test Value'
              }
              break
            default:
              mockValues[fieldKey] = 'Test Value'
          }
        }
      })

      const response = await fetch('/api/calculate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fieldValues: mockValues,
          instructions: `${prompt}\n${instructions}`,
          outputFormat: outputFormat as 'number' | 'currency' | 'percentage' | 'text' | 'fraction' | 'measurement',
          examples,
          fallbackValue
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setTestError(data.error || 'Test failed')
      } else {
        setTestResult(data.result)
      }
    } catch (error) {
      setTestError('Failed to test calculation')
    } finally {
      setTesting(false)
    }
  }

  if (!isActive && !value) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={handleActivate}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Enable AI Calculation
        </Button>
        {!hasOpenAIKey && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              OpenAI API key required. Add it in Settings → Integrations.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  if (!isActive && value) {
    return (
      <div className={cn('space-y-2', className)}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Calculation Active</span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleActivate}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Prompt:</span>
              <p className="mt-1">{value.prompt}</p>
            </div>
            {value.fieldReferences.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.fieldReferences.map(fieldKey => (
                  <Badge key={fieldKey} variant="secondary" className="text-xs">
                    {fields.find(f => f.key === fieldKey)?.label || fieldKey}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Output: {value.outputFormat}
              {value.fallbackValue && ` • Fallback: ${value.fallbackValue}`}
              {value.scope === 'fieldgroup' && ` • Scoped to each instance`}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Calculation Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasOpenAIKey && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              OpenAI API key required. Add it in Settings → Integrations to enable AI calculations.
            </AlertDescription>
          </Alert>
        )}

        {isInFieldGroup && (
          <Alert>
            <AlertDescription>
              This calculation will run independently for each instance of the field group. 
              Each "Add Another" will have its own isolated calculation.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2">
            {commonPrompts.map((template, i) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => applyPromptTemplate(template)}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Calculation Prompt</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what calculation to perform..."
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Referenced Fields</Label>
          <div className="flex flex-wrap gap-2">
            {availableFields.map(field => (
              <Badge
                key={field.key}
                variant={selectedFields.includes(field.key) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleFieldSelection(field.key)}
              >
                <MousePointer className="mr-1 h-3 w-3" />
                {field.label || field.key}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-instructions">Additional Instructions (Optional)</Label>
          <Textarea
            id="ai-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Any specific instructions or rules..."
            className="min-h-[60px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="output-format">Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger id="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outputFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback">Fallback Value</Label>
            <Input
              id="fallback"
              value={fallbackValue}
              onChange={(e) => setFallbackValue(e.target.value)}
              placeholder="Default if AI fails"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Examples (Optional)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addExample}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {examples.map((example, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                placeholder="Input values (JSON)"
                value={JSON.stringify(example.inputs)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    updateExample(i, 'inputs', parsed)
                  } catch {}
                }}
                className="flex-1"
              />
              <Input
                placeholder="Expected output"
                value={example.expectedOutput}
                onChange={(e) => updateExample(i, 'expectedOutput', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExample(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={testCalculation}
            disabled={testing || !prompt || selectedFields.length === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            {testing ? 'Testing...' : 'Test Calculation'}
          </Button>
          
          {testResult !== null && (
            <Alert>
              <AlertDescription>
                Test Result: <strong>{JSON.stringify(testResult)}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          {testError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleSave}
            disabled={!prompt || selectedFields.length === 0}
          >
            Save AI Calculation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}