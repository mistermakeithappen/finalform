'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FormField } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calculator, 
  Plus, 
  Minus, 
  X as Times, 
  Divide, 
  Percent,
  Hash,
  MousePointer,
  Check,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormulaSyntaxHighlighter } from './FormulaSyntaxHighlighter'

interface FormulaBuilderProps {
  value: string
  onChange: (value: string) => void
  fields: FormField[]
  currentField: FormField
  className?: string
}

const operators = [
  { symbol: '+', label: 'Add', icon: <Plus className="h-3 w-3" /> },
  { symbol: '-', label: 'Subtract', icon: <Minus className="h-3 w-3" /> },
  { symbol: '*', label: 'Multiply', icon: <Times className="h-3 w-3" /> },
  { symbol: '/', label: 'Divide', icon: <Divide className="h-3 w-3" /> },
  { symbol: '%', label: 'Modulo', icon: <Percent className="h-3 w-3" /> },
  { symbol: '(', label: 'Open Paren', icon: '(' },
  { symbol: ')', label: 'Close Paren', icon: ')' },
]

const functions = [
  { name: 'SUM', description: 'Sum of values', example: 'SUM(field1, field2)' },
  { name: 'AVG', description: 'Average of values', example: 'AVG(field1, field2, field3)' },
  { name: 'MIN', description: 'Minimum value', example: 'MIN(field1, field2)' },
  { name: 'MAX', description: 'Maximum value', example: 'MAX(field1, field2)' },
  { name: 'COUNT', description: 'Count non-empty values', example: 'COUNT(field1, field2)' },
  { name: 'IF', description: 'Conditional value', example: 'IF(field1 > 10, field2, field3)' },
  { name: 'ROUND', description: 'Round to decimal places', example: 'ROUND(field1, 2)' },
  { name: 'ABS', description: 'Absolute value', example: 'ABS(field1)' },
]

export function FormulaBuilder({
  value,
  onChange,
  fields,
  currentField,
  className
}: FormulaBuilderProps) {
  const [isActive, setIsActive] = useState(false)
  const [formula, setFormula] = useState(value || '')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Get only numeric and calculated fields
  const availableFields = fields.filter(f => 
    f.key !== currentField.key && 
    (f.type === 'number' || f.type === 'currency' || f.type === 'slider' || f.calculation)
  )

  useEffect(() => {
    // Parse existing formula to highlight used fields
    const usedFields = new Set<string>()
    availableFields.forEach(field => {
      if (formula.includes(field.key)) {
        usedFields.add(field.key)
      }
    })
    setSelectedFields(usedFields)
  }, [formula, availableFields])

  const handleActivate = () => {
    setIsActive(true)
    setTimeout(() => {
      inputRef.current?.focus()
      const pos = inputRef.current?.selectionStart || 0
      setCursorPosition(pos)
    }, 0)
  }

  const handleDeactivate = () => {
    setIsActive(false)
    onChange(formula)
  }

  const handleCancel = () => {
    setFormula(value || '')
    setIsActive(false)
  }

  const insertAtCursor = (text: string) => {
    if (!inputRef.current) return

    const start = inputRef.current.selectionStart || 0
    const end = inputRef.current.selectionEnd || 0
    const newFormula = formula.slice(0, start) + text + formula.slice(end)
    
    setFormula(newFormula)
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = start + text.length
        inputRef.current.setSelectionRange(newPos, newPos)
        inputRef.current.focus()
        setCursorPosition(newPos)
      }
    }, 0)
  }

  const [lastClickedField, setLastClickedField] = useState<string | null>(null)

  const handleFieldClick = (field: FormField) => {
    if (!isActive) return
    insertAtCursor(field.key)
    
    // Show visual feedback
    setLastClickedField(field.key)
    setTimeout(() => setLastClickedField(null), 300)
  }

  const handleOperatorClick = (operator: string) => {
    if (!isActive) return
    // Add spaces around operators for readability
    const text = operator === '(' || operator === ')' ? operator : ` ${operator} `
    insertAtCursor(text)
  }

  const handleFunctionClick = (func: string) => {
    if (!isActive) return
    insertAtCursor(`${func}()`)
    // Move cursor inside parentheses
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = cursorPosition + func.length + 1
        inputRef.current.setSelectionRange(newPos, newPos)
        inputRef.current.focus()
      }
    }, 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const oldValue = formula
    
    // Get what was typed/changed
    const start = e.target.selectionStart || 0
    const lengthDiff = newValue.length - oldValue.length
    
    if (lengthDiff > 0) {
      // Something was added - check if it's allowed
      const addedText = newValue.slice(start - lengthDiff, start)
      
      // Allow numbers, operators, spaces, and parentheses
      const allowedChars = /^[0-9+\-*/%().\s]+$/
      
      // Check if user is trying to type a field name
      const fieldNamePattern = /[a-zA-Z_]/
      if (fieldNamePattern.test(addedText)) {
        // Don't allow typing field names directly
        e.preventDefault()
        return
      }
      
      if (!allowedChars.test(addedText)) {
        // Don't allow invalid characters
        e.preventDefault()
        return
      }
    }
    
    setFormula(newValue)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDeactivate()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      // Allow deletion
      return
    } else if (e.key.length === 1) {
      // Single character key pressed
      const allowedChars = /^[0-9+\-*/%().\s]$/
      const functionChars = /^[A-Z]$/
      
      // Allow function names only if they're part of our function list
      if (functionChars.test(e.key.toUpperCase())) {
        // Check if we're at the start of a known function
        const pos = inputRef.current?.selectionStart || 0
        const textBefore = formula.slice(0, pos)
        const textAfter = formula.slice(pos)
        const potentialFunc = (textBefore + e.key.toUpperCase() + textAfter).match(/[A-Z]+/g)
        
        if (potentialFunc) {
          const isValidFunction = functions.some(f => 
            f.name.startsWith(potentialFunc[potentialFunc.length - 1])
          )
          if (!isValidFunction && e.key.match(/[a-zA-Z]/)) {
            e.preventDefault()
            return
          }
        }
      } else if (!allowedChars.test(e.key) && !e.ctrlKey && !e.metaKey) {
        // Prevent invalid characters (unless it's a control key combo)
        e.preventDefault()
        return
      }
    }
  }

  const validateFormula = () => {
    if (!formula) return { valid: true, error: null }
    
    try {
      // Basic validation - check for balanced parentheses
      let parenCount = 0
      for (const char of formula) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) return { valid: false, error: 'Unmatched closing parenthesis' }
      }
      if (parenCount > 0) return { valid: false, error: 'Unmatched opening parenthesis' }
      
      // Check that all field references exist
      const fieldKeys = availableFields.map(f => f.key)
      const words = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
      const unknownFields = words.filter(word => 
        !fieldKeys.includes(word) && 
        !functions.some(f => f.name === word.toUpperCase()) &&
        !['if', 'then', 'else', 'and', 'or', 'not'].includes(word.toLowerCase())
      )
      
      if (unknownFields.length > 0) {
        return { valid: false, error: `Unknown field: ${unknownFields[0]}` }
      }
      
      return { valid: true, error: null }
    } catch {
      return { valid: false, error: 'Invalid formula syntax' }
    }
  }

  const validation = validateFormula()

  if (!isActive) {
    return (
      <div className={cn("space-y-2", className)}>
        <div 
          className="relative group cursor-text"
          onClick={handleActivate}
        >
          <div
            className={cn(
              "h-9 px-3 py-2 rounded-md border cursor-text flex items-center",
              "hover:border-primary/50 hover:bg-muted/50 transition-colors",
              !validation.valid && formula && "border-destructive",
              !formula && "text-muted-foreground"
            )}
          >
            {formula ? (
              <FormulaSyntaxHighlighter
                formula={formula}
                validFieldKeys={availableFields.map(f => f.key)}
                validFunctions={functions.map(f => f.name)}
                className="flex-1"
              />
            ) : (
              <span className="font-mono text-sm flex-1">Click to build formula (e.g., field1 + field2 * 0.1)</span>
            )}
            <div className="ml-2">
              <Calculator className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
          </div>
        </div>
        {!validation.valid && formula && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {validation.error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Active Formula Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-primary animate-pulse" />
            Formula Editor Active
          </Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeactivate}
              className="h-7 px-2"
            >
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 px-2"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Input
            ref={inputRef}
            value={formula}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={(e) => setCursorPosition(e.target.selectionStart || 0)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
            placeholder=" "
            className={cn(
              "h-10 font-mono text-sm ring-2 ring-primary pl-3 pr-3",
              "text-transparent caret-black dark:caret-white",
              !validation.valid && formula && "ring-destructive"
            )}
            autoFocus
          />
          
          {/* Syntax highlighted overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center px-3">
            {formula ? (
              <FormulaSyntaxHighlighter
                formula={formula}
                validFieldKeys={availableFields.map(f => f.key)}
                validFunctions={functions.map(f => f.name)}
              />
            ) : (
              <span className="text-muted-foreground font-mono text-sm">
                Click fields below to add them • Type numbers and operators
              </span>
            )}
          </div>
        </div>
        
        {!validation.valid && formula && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {validation.error}
          </p>
        )}
      </div>

      <Alert className="py-2 border-primary/20 bg-primary/5">
        <Calculator className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="text-xs">
            <strong>Fields must be clicked</strong> to add them. You can type numbers (0-9), decimals (.), and operators (+, -, *, /, %).
          </p>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-600 rounded-sm"></span>
              Valid field/number
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
              Invalid field
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-600 rounded-sm"></span>
              Operator
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
              Function
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Available Fields */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Available Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {availableFields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No numeric fields available. Add number or currency fields to use in calculations.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableFields.map(field => (
                <Badge
                  key={field.key}
                  variant={selectedFields.has(field.key) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all relative",
                    "hover:scale-105 hover:shadow-sm",
                    selectedFields.has(field.key) && "ring-2 ring-primary/20",
                    lastClickedField === field.key && "animate-pulse bg-primary text-primary-foreground scale-110"
                  )}
                  onClick={() => handleFieldClick(field)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {field.label || field.key}
                  <span className="ml-1 text-xs opacity-60">({field.key})</span>
                  {lastClickedField === field.key && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operators */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm">Operators</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-1">
            {operators.map(op => (
              <Button
                key={op.symbol}
                size="sm"
                variant="outline"
                className="h-8 w-10"
                onClick={() => handleOperatorClick(op.symbol)}
                title={op.label}
              >
                {typeof op.icon === 'string' ? op.icon : op.icon}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Functions */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm">Functions</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-2">
            {functions.map(func => (
              <div
                key={func.name}
                className={cn(
                  "p-2 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-muted hover:border-primary/50"
                )}
                onClick={() => handleFunctionClick(func.name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{func.name}</p>
                    <p className="text-xs text-muted-foreground">{func.description}</p>
                  </div>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {func.example}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}