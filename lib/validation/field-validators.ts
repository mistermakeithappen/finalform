import { z } from 'zod'
import { FormField } from '@/lib/types/form'

export function getFieldValidator(field: FormField) {
  let schema: z.ZodSchema<any> = z.any()
  const validation = field.validation as any

  // Base validation based on field type
  switch (field.type) {
    case 'text':
    case 'textarea':
      schema = z.string()
      
      if (validation?.minLength) {
        schema = (schema as z.ZodString).min(validation.minLength, {
          message: validation.errorMessage || 
            `Minimum ${validation.minLength} characters required`
        })
      }
      
      if (validation?.maxLength) {
        schema = (schema as z.ZodString).max(validation.maxLength, {
          message: validation.errorMessage || 
            `Maximum ${validation.maxLength} characters allowed`
        })
      }
      
      if (validation?.pattern) {
        const regex = new RegExp(validation.pattern)
        schema = (schema as z.ZodString).regex(regex, {
          message: validation.errorMessage || 'Invalid format'
        })
      }
      break

    case 'email':
      schema = z.string().email({
        message: validation?.errorMessage || 'Please enter a valid email address'
      })
      
      if (validation?.allowedDomains?.length) {
        schema = schema.refine(
          (email) => {
            const domain = email.split('@')[1]
            return validation?.allowedDomains?.includes(domain)
          },
          {
            message: `Email must be from: ${validation.allowedDomains.join(', ')}`
          }
        )
      }
      break

    case 'phone':
      schema = z.string()
      
      // Phone number validation patterns for different regions
      const phonePatterns: Record<string, RegExp> = {
        US: /^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
        UK: /^\+?44?[-.\s]?[1-9]\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/,
        EU: /^\+?[1-9]\d{0,3}[-.\s]?\d{1,14}$/,
        ANY: /^\+?[1-9]\d{4,14}$/
      }
      
      const region = field.meta?.phoneRegion || 'ANY'
      const pattern = phonePatterns[region] || phonePatterns.ANY
      
      schema = (schema as z.ZodString).regex(pattern, {
        message: validation?.errorMessage || 'Please enter a valid phone number'
      })
      break

    case 'number':
    case 'currency':
      schema = z.number({
        invalid_type_error: 'Please enter a valid number',
        required_error: 'This field is required'
      })
      
      if (validation?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(validation.min, {
          message: validation.errorMessage || 
            `Minimum value is ${validation.min}`
        })
      }
      
      if (validation?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(validation.max, {
          message: validation.errorMessage || 
            `Maximum value is ${validation.max}`
        })
      }
      
      if (field.meta?.step) {
        schema = schema.refine(
          (val) => {
            const step = field.meta?.step || 1
            return Number.isInteger(val / step)
          },
          {
            message: `Value must be a multiple of ${field.meta.step}`
          }
        )
      }
      break

    case 'date':
    case 'datetime':
      schema = z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: 'Please enter a valid date' }
      )
      
      if (validation?.minDate) {
        const minDate = new Date(validation.minDate)
        schema = schema.refine(
          (val) => new Date(val) >= minDate,
          {
            message: `Date must be after ${minDate.toLocaleDateString()}`
          }
        )
      }
      
      if (validation?.maxDate) {
        const maxDate = new Date(validation.maxDate)
        schema = schema.refine(
          (val) => new Date(val) <= maxDate,
          {
            message: `Date must be before ${maxDate.toLocaleDateString()}`
          }
        )
      }
      
      if (field.meta?.disabledWeekdays?.length) {
        schema = schema.refine(
          (val) => {
            const day = new Date(val).getDay()
            return !field.meta?.disabledWeekdays?.includes(day)
          },
          {
            message: 'Selected date is not available'
          }
        )
      }
      break

    case 'time':
      schema = z.string().regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Please enter a valid time (HH:MM)' }
      )
      break

    case 'select':
    case 'radio':
      schema = z.string()
      
      if (field.options?.length) {
        const validValues = field.options.map(opt => opt.value)
        schema = z.enum(validValues as [string, ...string[]], {
          errorMap: () => ({ message: 'Please select a valid option' })
        })
      }
      break

    case 'multiselect':
      schema = z.array(z.string())
      
      if (field.meta?.maxSelections) {
        schema = (schema as z.ZodArray<any>).max(field.meta.maxSelections, {
          message: `Maximum ${field.meta.maxSelections} selections allowed`
        })
      }
      
      if (validation?.minSelections) {
        schema = (schema as z.ZodArray<any>).min(validation.minSelections, {
          message: `Minimum ${validation.minSelections} selections required`
        })
      }
      
      if (field.options?.length) {
        const validValues = field.options.map(opt => opt.value)
        schema = z.array(
          z.enum(validValues as [string, ...string[]])
        )
      }
      break

    case 'checkbox':
    case 'toggle':
      schema = z.boolean()
      
      if (field.required) {
        schema = z.literal(true, {
          errorMap: () => ({ message: validation?.errorMessage || 'This must be checked' })
        })
      }
      break

    case 'file':
      schema = z.any() // File validation is handled differently
      
      // Custom file validation
      if (validation?.fileTypes || validation?.maxFileSize) {
        schema = schema.refine(
          (files) => {
            if (!files || (Array.isArray(files) && files.length === 0)) {
              return !field.required
            }
            
            const fileList = Array.isArray(files) ? files : [files]
            
            for (const file of fileList) {
              // Check file type
              if (validation?.fileTypes?.length) {
                const ext = '.' + file.name.split('.').pop()?.toLowerCase()
                if (!validation.fileTypes.includes(ext)) {
                  return false
                }
              }
              
              // Check file size
              if (validation?.maxFileSize) {
                const maxBytes = validation.maxFileSize * 1024 * 1024
                if (file.size > maxBytes) {
                  return false
                }
              }
            }
            
            return true
          },
          {
            message: validation?.errorMessage || 
              'Invalid file. Please check type and size requirements.'
          }
        )
      }
      break

    case 'signature':
      schema = z.string().min(1, {
        message: validation?.errorMessage || 'Signature is required'
      })
      break

    case 'rating':
      schema = z.number().int()
      
      const maxRating = field.meta?.maxRating || 5
      schema = (schema as z.ZodNumber).min(1).max(maxRating, {
        message: `Please select a rating between 1 and ${maxRating}`
      })
      break

    case 'slider':
      schema = z.number()
      
      const min = validation?.min ?? 0
      const max = validation?.max ?? 100
      
      schema = (schema as z.ZodNumber).min(min).max(max, {
        message: `Value must be between ${min} and ${max}`
      })
      break

    case 'matrix':
      // Matrix validation for each row
      schema = z.array(
        z.object({}).passthrough() // Allow any structure for matrix rows
      )
      
      if (validation?.minRows) {
        schema = (schema as z.ZodArray<any>).min(validation.minRows, {
          message: `Minimum ${validation.minRows} rows required`
        })
      }
      
      if (validation?.maxRows) {
        schema = (schema as z.ZodArray<any>).max(validation.maxRows, {
          message: `Maximum ${validation.maxRows} rows allowed`
        })
      }
      break

    case 'repeater':
      schema = z.array(z.object({}).passthrough())
      
      if (validation?.minItems) {
        schema = (schema as z.ZodArray<any>).min(validation.minItems, {
          message: `Minimum ${validation.minItems} items required`
        })
      }
      
      if (validation?.maxItems) {
        schema = (schema as z.ZodArray<any>).max(validation.maxItems, {
          message: `Maximum ${validation.maxItems} items allowed`
        })
      }
      break

    case 'address':
      const addressShape: Record<string, z.ZodSchema> = {}
      
      if (field.components?.street1) {
        addressShape.street1 = z.string().min(1, 'Street address is required')
      }
      if (field.components?.street2) {
        addressShape.street2 = z.string().optional()
      }
      if (field.components?.city) {
        addressShape.city = z.string().min(1, 'City is required')
      }
      if (field.components?.state) {
        addressShape.state = z.string().min(1, 'State is required')
      }
      if (field.components?.zip) {
        addressShape.zip = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
      }
      if (field.components?.country) {
        addressShape.country = z.string().min(1, 'Country is required')
      }
      
      schema = z.object(addressShape)
      break


    case 'html':
    case 'section':
      // No validation for display-only fields
      schema = z.any().optional()
      break

    default:
      schema = z.any()
  }

  // Apply required validation
  if (field.required && field.type !== 'checkbox' && field.type !== 'toggle') {
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, {
        message: validation?.errorMessage || `${field.label || 'This field'} is required`
      })
    } else if (schema instanceof z.ZodArray) {
      schema = schema.min(1, {
        message: validation?.errorMessage || `${field.label || 'This field'} is required`
      })
    } else if (!(schema instanceof z.ZodOptional)) {
      schema = schema.refine(
        (val) => val !== null && val !== undefined && val !== '',
        {
          message: validation?.errorMessage || `${field.label || 'This field'} is required`
        }
      )
    }
  } else if (!field.required) {
    // Make non-required fields optional
    if (!(schema instanceof z.ZodOptional)) {
      schema = schema.optional()
    }
  }

  return schema
}

// Create a dynamic form validator from field definitions
export function createFormValidator(fields: FormField[]) {
  const shape: Record<string, z.ZodSchema> = {}
  
  for (const field of fields) {
    if (field.key && field.type !== 'html' && field.type !== 'section') {
      shape[field.key] = getFieldValidator(field)
    }
  }
  
  return z.object(shape)
}

// Validate a single field value
export function validateField(field: FormField, value: any): string | null {
  try {
    const validator = getFieldValidator(field)
    validator.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value'
    }
    return 'Validation error'
  }
}

// Validate entire form data
export function validateForm(fields: FormField[], data: Record<string, any>) {
  const errors: Record<string, string> = {}
  
  for (const field of fields) {
    if (field.key && field.type !== 'html' && field.type !== 'section') {
      const error = validateField(field, data[field.key])
      if (error) {
        errors[field.key] = error
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}