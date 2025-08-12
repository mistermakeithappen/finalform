'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { MatrixField as MatrixFieldType } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Virtuoso } from 'react-virtuoso'
import { Parser } from 'expr-eval'

interface MatrixFieldProps {
  field: MatrixFieldType
  value: any[]
  onChange: (value: any[]) => void
  disabled?: boolean
}

export function MatrixField({ field, value = [], onChange, disabled }: MatrixFieldProps) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null)
  const parser = useMemo(() => new Parser(), [])

  // Initialize with at least one empty row if no value is provided
  React.useEffect(() => {
    if (!value || value.length === 0) {
      const initialRow: any = { _id: Date.now().toString() }
      field.columns.forEach(col => {
        initialRow[col.key] = col.type === 'number' || col.type === 'currency' ? 0 : ''
      })
      onChange([initialRow])
    }
  }, [])

  const addRow = useCallback(() => {
    const newRow: any = { _id: Date.now().toString() }
    field.columns.forEach(col => {
      newRow[col.key] = col.type === 'number' || col.type === 'currency' ? 0 : ''
    })
    onChange([...value, newRow])
  }, [value, onChange, field.columns])

  const removeRow = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }, [value, onChange])

  const updateCell = useCallback((rowIndex: number, colKey: string, cellValue: any) => {
    const newValue = [...value]
    newValue[rowIndex] = { ...newValue[rowIndex], [colKey]: cellValue }
    
    // Apply row calculations if defined (e.g., "total = qty * price")
    if (field.rowCalc) {
      try {
        // Parse the calculation formula
        const [targetCol, formula] = field.rowCalc.split('=').map(s => s.trim())
        
        if (targetCol && formula) {
          const expr = parser.parse(formula)
          const variables: Record<string, any> = {}
          
          // Add all row values as variables
          Object.entries(newValue[rowIndex]).forEach(([key, val]) => {
            if (key !== '_id') {
              variables[key] = typeof val === 'number' ? val : parseFloat(val as string) || 0
            }
          })
          
          // Evaluate the formula
          const result = expr.evaluate(variables)
          
          // Update the target column if it exists
          if (field.columns.find(col => col.key === targetCol)) {
            newValue[rowIndex][targetCol] = result
          }
        }
      } catch (error) {
        console.error('Row calculation error:', error)
      }
    }
    
    onChange(newValue)
  }, [value, onChange, field.rowCalc, field.columns, parser])

  const calculateFooter = useCallback((colKey: string, operation: 'sum' | 'average') => {
    const values = value.map(row => {
      const val = row[colKey]
      return typeof val === 'number' ? val : parseFloat(val) || 0
    })
    
    if (operation === 'sum') {
      return values.reduce((acc, val) => acc + val, 0)
    } else if (operation === 'average') {
      return values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0
    }
    
    return 0
  }, [value])

  const renderCell = useCallback((row: any, rowIndex: number, col: any) => {
    const cellValue = row[col.key]
    const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === col.key
    
    switch (col.type) {
      case 'text':
        return (
          <Input
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
            onFocus={() => setFocusedCell({ row: rowIndex, col: col.key })}
            onBlur={() => setFocusedCell(null)}
            disabled={disabled || col.readonly}
            className={cn(
              'h-8 rounded-none border-0 focus:ring-1',
              isFocused && 'ring-1 ring-primary'
            )}
            placeholder={col.placeholder}
          />
        )
      
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            step={col.precision ? `0.${'0'.repeat(col.precision - 1)}1` : '1'}
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, col.key, parseFloat(e.target.value) || 0)}
            onFocus={() => setFocusedCell({ row: rowIndex, col: col.key })}
            onBlur={() => setFocusedCell(null)}
            disabled={disabled || col.readonly}
            className={cn(
              'h-8 rounded-none border-0 focus:ring-1',
              isFocused && 'ring-1 ring-primary'
            )}
            placeholder={col.placeholder}
          />
        )
      
      case 'select':
        return (
          <select
            value={cellValue || ''}
            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
            onFocus={() => setFocusedCell({ row: rowIndex, col: col.key })}
            onBlur={() => setFocusedCell(null)}
            disabled={disabled || col.readonly}
            className={cn(
              'h-8 w-full rounded-none border-0 bg-transparent focus:ring-1 px-2',
              isFocused && 'ring-1 ring-primary'
            )}
          >
            <option value="">-</option>
            {col.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={cellValue || false}
              onChange={(e) => updateCell(rowIndex, col.key, e.target.checked)}
              disabled={disabled || col.readonly}
              className="h-4 w-4"
            />
          </div>
        )
      
      default:
        return <span className="px-2">{cellValue}</span>
    }
  }, [focusedCell, updateCell, disabled])

  const rowRenderer = useCallback((index: number) => {
    const row = value[index]
    
    return (
      <div className="flex border-b hover:bg-muted/50" key={row._id || index}>
        {field.columns.map((col) => (
          <div
            key={col.key}
            className="border-r last:border-r-0"
            style={{ width: `${col.width || 1}fr`, flex: col.width || 1 }}
          >
            {renderCell(row, index, col)}
          </div>
        ))}
        {field.allowDeleteRow !== false && !disabled && (
          <div className="w-10 flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeRow(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }, [value, field.columns, field.allowDeleteRow, disabled, renderCell, removeRow])

  const shouldVirtualize = value.length > 50

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex bg-muted font-medium text-sm">
          {field.columns.map((col) => (
            <div
              key={col.key}
              className="px-2 py-2 border-r last:border-r-0"
              style={{ width: `${col.width || 1}fr`, flex: col.width || 1 }}
            >
              {col.label}
              {col.required && <span className="text-destructive ml-1">*</span>}
            </div>
          ))}
          {field.allowDeleteRow !== false && !disabled && (
            <div className="w-10"></div>
          )}
        </div>
        
        {/* Body */}
        {shouldVirtualize ? (
          <Virtuoso
            style={{ height: '400px' }}
            totalCount={value.length}
            itemContent={rowRenderer}
          />
        ) : (
          <div>
            {value.map((_, index) => rowRenderer(index))}
          </div>
        )}
        
        {/* Footer with totals */}
        {field.footer?.showTotals && (
          <div className="flex bg-muted/50 font-medium text-sm border-t">
            {field.columns.map((col) => {
              const showSum = field.footer?.sum?.includes(col.key)
              const showAvg = field.footer?.average?.includes(col.key)
              
              return (
                <div
                  key={col.key}
                  className="px-2 py-2 border-r last:border-r-0"
                  style={{ width: `${col.width || 1}fr`, flex: col.width || 1 }}
                >
                  {showSum && (
                    <span>
                      {col.type === 'currency' 
                        ? `$${calculateFooter(col.key, 'sum').toFixed(2)}`
                        : calculateFooter(col.key, 'sum')
                      }
                    </span>
                  )}
                  {showAvg && (
                    <span>
                      {col.type === 'currency'
                        ? `$${calculateFooter(col.key, 'average').toFixed(2)}`
                        : calculateFooter(col.key, 'average').toFixed(2)
                      }
                    </span>
                  )}
                </div>
              )
            })}
            {field.allowDeleteRow !== false && !disabled && (
              <div className="w-10"></div>
            )}
          </div>
        )}
      </div>
      
      {/* Add row button */}
      {field.allowAddRow !== false && !disabled && (
        (!field.maxRows || value.length < field.maxRows) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        )
      )}
    </div>
  )
}