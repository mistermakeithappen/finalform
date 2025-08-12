'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FormSchema, FormField, FormState, PageBreakField, FieldWidth } from '@/lib/types/form'
import { FieldRenderer } from './FieldRenderer'
import { LogicEngine } from '@/lib/engines/logic'
import { CalcEngine } from '@/lib/engines/calc'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FormRendererProps {
  schema: FormSchema
  initialValues?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  onSave?: (data: Record<string, any>) => void
  onFieldChange?: (key: string, value: any) => void
  className?: string
  readOnly?: boolean
  isAuthenticated?: boolean
  onAuthRequired?: () => void
}

export function FormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  onSave,
  onFieldChange,
  className,
  readOnly = false,
  isAuthenticated = false,
  onAuthRequired
}: FormRendererProps) {
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    visible: {},
    disabled: {},
    required: {},
    isDirty: false,
    isSubmitting: false,
    isValid: true
  })
  
  const [currentPage, setCurrentPage] = useState(0)

  // Extract all field keys from schema (including nested fields)
  const getAllFieldKeys = (fields: FormField[]): string[] => {
    const keys: string[] = []
    fields.forEach(field => {
      keys.push(field.key)
      if (field.type === 'fieldgroup' && field.fields) {
        keys.push(...getAllFieldKeys(field.fields))
      }
      if (field.type === 'section' && field.fields) {
        keys.push(...getAllFieldKeys(field.fields))
      }
    })
    return keys
  }
  
  // Merge field-level conditions into logic rules
  const mergedLogic = useMemo(() => {
    const rules = [...(schema.logic || [])]
    
    // Extract conditions from fields if not already in logic
    const extractFieldConditions = (fields: FormField[]) => {
      fields.forEach(field => {
        if (field.conditions && Array.isArray(field.conditions)) {
          field.conditions.forEach((condition: any, idx: number) => {
            const rule = {
              id: `field_${field.key}_${idx}`,
              name: `Field condition for ${field.key}`,
              when: condition.when || condition,
              actions: condition.actions || [
                { type: 'show', target: field.key }
              ]
            }
            rules.push(rule)
          })
        }
        
        // Handle nested fields
        if (field.type === 'fieldgroup' && field.fields) {
          extractFieldConditions(field.fields)
        }
        if (field.type === 'section' && field.fields) {
          extractFieldConditions(field.fields)
        }
      })
    }
    
    extractFieldConditions(schema.fields)
    return rules
  }, [schema.fields, schema.logic])
  
  const [logicEngine] = useState(() => {
    // Get all hidden field keys
    const hiddenFields: string[] = []
    const extractHiddenFields = (fields: FormField[]) => {
      fields.forEach(field => {
        if (field.hidden === true && field.key) {
          hiddenFields.push(field.key)
        }
        // Check nested fields
        if (field.type === 'fieldgroup' && field.fields) {
          extractHiddenFields(field.fields)
        }
        if (field.type === 'section' && field.fields) {
          extractHiddenFields(field.fields)
        }
      })
    }
    extractHiddenFields(schema.fields)
    
    return new LogicEngine(mergedLogic, getAllFieldKeys(schema.fields), hiddenFields)
  })
  const [calcEngine] = useState(() => new CalcEngine(schema.calculations || [], schema.aiCalculations || []))
  
  // Split fields into pages based on page breaks
  const pages = useMemo(() => {
    const pageList: FormField[][] = [[]]
    let currentPageIndex = 0
    
    schema.fields.forEach((field) => {
      if (field.type === 'pagebreak') {
        // Add the page break to current page for navigation
        pageList[currentPageIndex].push(field)
        // Start a new page
        currentPageIndex++
        pageList[currentPageIndex] = []
      } else {
        pageList[currentPageIndex].push(field)
      }
    })
    
    // Remove empty last page if it exists
    if (pageList[pageList.length - 1].length === 0) {
      pageList.pop()
    }
    
    return pageList
  }, [schema.fields])
  
  const totalPages = pages.length
  const hasPageBreaks = totalPages > 1

  // Build validation schema from fields
  const buildValidationSchema = useCallback(() => {
    const schemaShape: Record<string, any> = {}
    
    const processField = (field: FormField) => {
      // Skip hidden fields from validation
      if (field.hidden === true) {
        return
      }
      
      let fieldSchema: any = z.any()
      
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
          fieldSchema = z.string()
          if (field.validation?.minLength) {
            fieldSchema = fieldSchema.min(field.validation.minLength)
          }
          if (field.validation?.maxLength) {
            fieldSchema = fieldSchema.max(field.validation.maxLength)
          }
          if (field.type === 'email') {
            fieldSchema = fieldSchema.email()
          }
          break
        
        case 'number':
        case 'currency':
          fieldSchema = z.number()
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min)
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max)
          }
          break
        
        case 'select':
        case 'radio':
          fieldSchema = z.string()
          break
        
        case 'multiselect':
          fieldSchema = z.array(z.string())
          break
        
        case 'checkbox':
        case 'toggle':
          fieldSchema = z.boolean()
          break
        
        case 'date':
        case 'time':
        case 'datetime':
          fieldSchema = z.string()
          break
        
        case 'file':
          fieldSchema = z.any()
          break
        
        case 'matrix':
          fieldSchema = z.array(z.record(z.any()))
          break
        
        case 'section':
          if (field.fields) {
            field.fields.forEach(processField)
          }
          return
        
        case 'repeater':
          fieldSchema = z.array(z.record(z.any()))
          break
      }
      
      if (field.required && formState.required[field.key] !== false) {
        if (field.type === 'checkbox' || field.type === 'toggle') {
          fieldSchema = fieldSchema.refine((val: boolean) => val === true, {
            message: `${field.label || field.key} is required`
          })
        } else {
          schemaShape[field.key] = fieldSchema
        }
      } else {
        schemaShape[field.key] = fieldSchema.optional()
      }
    }
    
    schema.fields.forEach(processField)
    
    return z.object(schemaShape)
  }, [schema.fields, formState.required])

  const validationSchema = buildValidationSchema()

  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: { ...getDefaultValues(schema.fields), ...initialValues }
  })

  const { control, handleSubmit, watch, setValue, formState: rhfFormState } = methods

  // Watch all form values
  const watchedValues = watch()
  const isUpdatingRef = useRef(false)
  const lastProcessedValuesRef = useRef<string>('')

  // Apply prefill from URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    const prefillData: Record<string, any> = {}
    
    // UTM parameters
    if (schema.prefill?.utm) {
      Object.entries(schema.prefill.utm).forEach(([utmKey, fieldKey]) => {
        const value = params.get(utmKey)
        if (value && fieldKey) {
          prefillData[fieldKey] = value
        }
      })
    }
    
    // Custom query parameters
    if (schema.prefill?.query) {
      Object.entries(schema.prefill.query).forEach(([paramKey, fieldKey]) => {
        const value = params.get(paramKey)
        if (value && fieldKey) {
          prefillData[fieldKey] = value
        }
      })
    }
    
    // Apply prefill data
    Object.entries(prefillData).forEach(([key, value]) => {
      setValue(key, value)
    })
  }, [schema.prefill, setValue])

  // Run logic engine on mount and value changes
  useEffect(() => {
    // Always run on mount (when lastProcessedValuesRef is empty)
    const valuesStr = JSON.stringify(watchedValues)
    if (isUpdatingRef.current || (valuesStr === lastProcessedValuesRef.current && lastProcessedValuesRef.current !== '')) {
      return
    }
    
    isUpdatingRef.current = true
    lastProcessedValuesRef.current = valuesStr
    
    const results = logicEngine.evaluate(watchedValues)
    
    setFormState(prev => ({
      ...prev,
      visible: results.visible,
      disabled: results.disabled,
      required: results.required,
      values: { ...watchedValues, ...results.values }
    }))
    
    // Apply setValue actions from logic
    const updates: Array<[string, any]> = []
    Object.entries(results.values).forEach(([key, value]) => {
      if (watchedValues[key] !== value) {
        updates.push([key, value])
      }
    })
    
    // Batch updates
    if (updates.length > 0) {
      Promise.resolve().then(() => {
        updates.forEach(([key, value]) => {
          setValue(key, value, { shouldValidate: false })
        })
        isUpdatingRef.current = false
      })
    } else {
      isUpdatingRef.current = false
    }
  }, [watchedValues, logicEngine, setValue])

  // Run calculation engine on value changes
  useEffect(() => {
    // Skip if we're already updating from logic engine
    if (isUpdatingRef.current) {
      return
    }
    
    // Use async evaluation if there are AI calculations
    if (schema.aiCalculations && schema.aiCalculations.length > 0) {
      calcEngine.evaluate(watchedValues).then(results => {
        const updates: Array<[string, any]> = []
        Object.entries(results).forEach(([key, value]) => {
          if (watchedValues[key] !== value) {
            updates.push([key, value])
          }
        })
        
        // Batch updates
        if (updates.length > 0) {
          isUpdatingRef.current = true
          Promise.resolve().then(() => {
            updates.forEach(([key, value]) => {
              setValue(key, value, { shouldValidate: false })
            })
            isUpdatingRef.current = false
          })
        }
      })
    } else {
      // Use synchronous evaluation for regular calculations only
      const results = calcEngine.evaluateSync(watchedValues)
      
      const updates: Array<[string, any]> = []
      Object.entries(results).forEach(([key, value]) => {
        if (watchedValues[key] !== value) {
          updates.push([key, value])
        }
      })
      
      // Batch updates
      if (updates.length > 0) {
        isUpdatingRef.current = true
        Promise.resolve().then(() => {
          updates.forEach(([key, value]) => {
            setValue(key, value, { shouldValidate: false })
          })
          isUpdatingRef.current = false
        })
      }
    }
  }, [watchedValues, calcEngine, setValue, schema.aiCalculations])

  // Handle field change callback
  useEffect(() => {
    if (onFieldChange) {
      Object.entries(watchedValues).forEach(([key, value]) => {
        if (formState.values[key] !== value) {
          onFieldChange(key, value)
        }
      })
    }
  }, [watchedValues, onFieldChange, formState.values])

  const handleFormSubmit = async (data: Record<string, any>) => {
    setFormState(prev => ({ ...prev, isSubmitting: true }))
    
    try {
      await onSubmit(data)
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(watchedValues)
    }
  }

  // Navigate to next page with conditional logic
  const navigateToNextPage = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (currentPage >= totalPages - 1) return
    
    // Check if current page has a page break with navigation rules
    const currentPageFields = pages[currentPage]
    const pageBreak = currentPageFields.find(f => f.type === 'pagebreak') as PageBreakField | undefined
    
    if (pageBreak?.navigationRules && pageBreak.navigationRules.length > 0) {
      // Evaluate navigation rules
      for (const rule of pageBreak.navigationRules) {
        if (evaluateCondition(rule.condition, watchedValues)) {
          // Navigate to specific page (0-indexed)
          const targetPage = rule.targetPage - 1
          if (targetPage >= 0 && targetPage < totalPages) {
            setCurrentPage(targetPage)
            return
          }
        }
      }
    }
    
    // Default: go to next sequential page
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
  }
  
  const navigateToPreviousPage = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }
  
  // Helper function to evaluate conditions
  const evaluateCondition = (condition: any, values: Record<string, any>): boolean => {
    if (!condition || !condition.field) return false
    
    const fieldValue = values[condition.field]
    const compareValue = condition.value
    
    switch (condition.op) {
      case '=':
        return fieldValue == compareValue
      case '!=':
        return fieldValue != compareValue
      case '>':
        return Number(fieldValue) > Number(compareValue)
      case '<':
        return Number(fieldValue) < Number(compareValue)
      case '>=':
        return Number(fieldValue) >= Number(compareValue)
      case '<=':
        return Number(fieldValue) <= Number(compareValue)
      case 'contains':
        return String(fieldValue).includes(String(compareValue))
      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue))
      case 'empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'not_empty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        return false
    }
  }
  
  // Helper function to get column span class based on field width
  const getColSpanClass = (width?: FieldWidth): string => {
    switch(width) {
      case 'quarter': return 'col-span-12 md:col-span-3'
      case 'third': return 'col-span-12 md:col-span-4'
      case 'half': return 'col-span-12 md:col-span-6'
      case 'two-thirds': return 'col-span-12 md:col-span-8'
      case 'three-quarters': return 'col-span-12 md:col-span-9'
      case 'full':
      default: return 'col-span-12'
    }
  }

  const renderField = (field: FormField) => {
    // Skip page break fields in rendering
    if (field.type === 'pagebreak') {
      return null
    }
    
    // Check visibility from logic conditions first (takes precedence over static hidden)
    // If logic explicitly sets visibility, use that
    if (field.key && formState.visible.hasOwnProperty(field.key)) {
      if (formState.visible[field.key] === false) {
        return null
      }
      // If logic says to show it, show it even if field.hidden is true
    } else {
      // No logic rules for this field, check static hidden property
      if (field.hidden === true) {
        return null
      }
    }
    
    // Handle section fields
    if (field.type === 'section') {
      return (
        <div key={field.id} className="col-span-full">
          {field.title && (
            <h3 className="text-lg font-semibold mb-2">{field.title}</h3>
          )}
          {field.description && (
            <p className="text-sm text-muted-foreground mb-4">{field.description}</p>
          )}
          <div className="grid grid-cols-12 gap-4">
            {field.fields.map(renderField)}
          </div>
        </div>
      )
    }
    
    // Use width property or fallback to grid config
    const columnClass = field.width 
      ? getColSpanClass(field.width)
      : field.grid?.colSpan 
        ? `col-span-12 md:col-span-${field.grid.colSpan}`
        : field.grid?.col
          ? `col-span-12 md:col-span-${field.grid.col}`
          : 'col-span-12'
    
    return (
      <div
        key={field.id}
        className={cn(columnClass)}
      >
        <Controller
          name={field.key}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <FieldRenderer
              field={field}
              value={controllerField.value}
              onChange={controllerField.onChange}
              onBlur={controllerField.onBlur}
              error={fieldState.error?.message}
              disabled={formState.disabled[field.key] || readOnly}
              required={formState.required[field.key]}
              onNavigate={field.type === 'button-select' ? (targetPage: number) => setCurrentPage(targetPage - 1) : undefined}
            />
          )}
        />
      </div>
    )
  }

  // Get current page fields and page break info
  const currentPageFields = hasPageBreaks ? pages[currentPage] : schema.fields
  const currentPageBreak = currentPageFields.find(f => f.type === 'pagebreak') as PageBreakField | undefined
  
  // Show progress bar if any page break has it enabled
  const showProgressBar = hasPageBreaks && schema.fields.some(
    f => f.type === 'pagebreak' && (f as PageBreakField).showProgressBar
  )
  
  // Container width classes
  const containerWidthClass = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md', 
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  }[schema.settings?.containerWidth || 'lg']
  
  // Container padding classes
  const containerPaddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[schema.settings?.containerPadding || 'md']
  
  // Title alignment classes
  const titleAlignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[schema.settings?.formTitleAlignment || 'left']
  
  // Button alignment classes
  const buttonAlignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-between'
  }[schema.settings?.submitButtonAlignment || 'left']
  
  return (
    <FormProvider {...methods}>
      <div className={cn(containerWidthClass, 'mx-auto', containerPaddingClass)}>
        {/* Custom CSS */}
        {schema.settings?.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: schema.settings.customCSS }} />
        )}
        
        {/* Logo */}
        {schema.settings?.showLogo && schema.settings?.logoUrl && (
          <div className={cn('mb-6', {
            'text-left': schema.settings.logoPosition === 'top-left',
            'text-center': schema.settings.logoPosition === 'top-center',
            'text-right': schema.settings.logoPosition === 'top-right'
          })}>
            <img 
              src={schema.settings.logoUrl} 
              alt="Logo" 
              className="inline-block max-h-20"
            />
          </div>
        )}
        
        {/* Form Title and Description */}
        {(schema.settings?.showFormTitle === false && schema.settings?.showFormDescription === false) ? null : 
         (schema.settings?.showFormTitle !== false && schema.name) || (schema.settings?.showFormDescription !== false && schema.description) ? (
          <div className={cn('mb-6', titleAlignmentClass)}>
            {schema.settings?.showFormTitle !== false && schema.name && (
              <h1 className="text-3xl font-bold">{schema.name}</h1>
            )}
            {schema.settings?.showFormDescription !== false && schema.description && (
              <p className="text-muted-foreground mt-2">{schema.description}</p>
            )}
          </div>
        ) : null}
        
        {/* Required Field Indicator */}
        {schema.settings?.showRequiredIndicator !== false && (
          <p className="text-sm text-muted-foreground mb-4">
            {schema.settings?.requiredIndicatorText || '* indicates required field'}
          </p>
        )}
        
        {/* Authentication Required Alert */}
        {schema.settings?.requireAuth && !isAuthenticated && (
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You must be logged in to submit this form.</span>
              {onAuthRequired && (
                <Button onClick={onAuthRequired} variant="outline" size="sm">
                  Sign In
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <form
          onSubmit={(e) => {
            // Only allow submission from the last page
            if (hasPageBreaks && currentPage < totalPages - 1) {
              e.preventDefault()
              return
            }
            handleSubmit(handleFormSubmit)(e)
          }}
          className={cn('space-y-6', className)}
        >
          {/* Progress Bar */}
          {showProgressBar && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Page {currentPage + 1} of {totalPages}</span>
                <span>{Math.round(((currentPage + 1) / totalPages) * 100)}% Complete</span>
              </div>
              <Progress value={((currentPage + 1) / totalPages) * 100} className="h-2" />
            </div>
          )}
          
          {/* Page Title and Description */}
          {currentPageBreak && (
            <div className="space-y-2">
              {currentPageBreak.pageTitle && (
                <h2 className="text-2xl font-semibold">{currentPageBreak.pageTitle}</h2>
              )}
              {currentPageBreak.pageDescription && (
                <p className="text-muted-foreground">{currentPageBreak.pageDescription}</p>
              )}
            </div>
          )}
        
        {/* Form Fields for Current Page */}
        <div className="grid grid-cols-12 gap-4">
          {currentPageFields.map(renderField)}
        </div>
        
        {/* Navigation and Submit Buttons */}
        <div className={cn('flex gap-4', 
          buttonAlignmentClass === 'justify-between' ? 'justify-between' :
          buttonAlignmentClass === 'justify-center' ? 'justify-center' :
          buttonAlignmentClass === 'justify-end' ? 'justify-end' :
          'justify-start'
        )}>
          {/* Previous/Save Button */}
          <div className="flex gap-4">
            {hasPageBreaks && currentPage > 0 && !currentPageBreak?.hidePrevButton && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigateToPreviousPage(e)
                }}
                disabled={formState.isSubmitting || readOnly}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentPageBreak?.prevButtonText || 'Previous'}
              </Button>
            )}
            
            {schema.settings?.allowSave && onSave && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={formState.isSubmitting || readOnly}
              >
                Save Draft
              </Button>
            )}
          </div>
          
          {/* Next/Submit Button */}
          <div>
            {hasPageBreaks && currentPage < totalPages - 1 ? (
              !currentPageBreak?.hideNextButton && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigateToNextPage(e)
                  }}
                  disabled={formState.isSubmitting || readOnly}
                  className="min-w-[120px]"
                >
                  {currentPageBreak?.nextButtonText || 'Next'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )
            ) : (
              <Button
                type="submit"
                disabled={formState.isSubmitting || readOnly || (schema.settings?.requireAuth && !isAuthenticated)}
                className="min-w-[120px]"
              >
                {schema.settings?.requireAuth && !isAuthenticated ? (
                  <>
                    <Lock className="h-4 w-4 mr-1" />
                    Login Required
                  </>
                ) : formState.isSubmitting ? 'Submitting...' : (schema.settings?.submitText || 'Submit')}
              </Button>
            )}
          </div>
        </div>
      </form>
      </div>
    </FormProvider>
  )
}

function getDefaultValues(fields: FormField[]): Record<string, any> {
  const defaults: Record<string, any> = {}
  
  const processField = (field: FormField) => {
    // Skip hidden fields that don't have a default value
    if (field.hidden === true && !field.default) {
      return
    }
    
    if (field.type === 'section') {
      field.fields.forEach(processField)
      return
    }
    
    if (field.type === 'fieldgroup' && field.fields) {
      // Process nested fields in fieldgroup
      field.fields.forEach(processField)
      // Don't return here as fieldgroup itself might have default value
    }
    
    // Use default value if it's defined
    // Check hasDefault flag or if default value is explicitly set
    if ((field.hasDefault && field.default !== undefined) || 
        (field.default !== undefined && field.default !== null)) {
      defaults[field.key] = field.default
    } else {
      switch (field.type) {
        case 'checkbox':
        case 'toggle':
          defaults[field.key] = false
          break
        case 'multiselect':
          defaults[field.key] = []
          break
        case 'matrix':
        case 'repeater':
        case 'fieldgroup':
          defaults[field.key] = []
          break
        case 'number':
        case 'currency':
          defaults[field.key] = 0
          break
        default:
          defaults[field.key] = ''
      }
    }
  }
  
  fields.forEach(processField)
  
  return defaults
}