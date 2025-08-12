import { FormSchema, FormField, FieldGroupField } from '@/lib/types/form'

/**
 * Transforms form submission data to properly structure fieldgroup data
 * for webhook payloads, making the grouping clear in the data structure
 */
export function transformFormDataForWebhook(
  schema: FormSchema,
  rawData: Record<string, any>
): {
  raw: Record<string, any>
  structured: Record<string, any>
  metadata: {
    hasFieldGroups: boolean
    fieldGroupKeys: string[]
    timestamp: string
    formId: string
    formName: string
    formVersion: number
  }
} {
  const structured: Record<string, any> = {}
  const fieldGroupKeys: string[] = []
  let hasFieldGroups = false

  // Process each field in the schema
  schema.fields.forEach((field) => {
    const fieldValue = rawData[field.key]

    if (field.type === 'fieldgroup') {
      hasFieldGroups = true
      fieldGroupKeys.push(field.key)
      
      const fieldGroup = field as FieldGroupField
      
      // Structure fieldgroup data
      if (fieldGroup.repeatable) {
        // For repeatable field groups, structure as an array of grouped objects
        structured[field.key] = {
          _type: 'fieldgroup_repeatable',
          _title: fieldGroup.title || fieldGroup.label,
          _description: fieldGroup.description,
          _count: Array.isArray(fieldValue) ? fieldValue.length : 0,
          instances: Array.isArray(fieldValue) ? fieldValue.map((instance, index) => ({
            _index: index + 1,
            _instanceId: `${field.key}_${index + 1}`,
            ...transformFieldGroupInstance(instance, fieldGroup.fields)
          })) : []
        }
      } else {
        // For non-repeatable field groups, structure as a single grouped object
        const instanceData = Array.isArray(fieldValue) ? fieldValue[0] : fieldValue
        structured[field.key] = {
          _type: 'fieldgroup_single',
          _title: fieldGroup.title || fieldGroup.label,
          _description: fieldGroup.description,
          data: transformFieldGroupInstance(instanceData || {}, fieldGroup.fields)
        }
      }
    } else {
      // Regular fields remain as-is
      structured[field.key] = fieldValue
    }
  })

  return {
    raw: rawData,
    structured,
    metadata: {
      hasFieldGroups,
      fieldGroupKeys,
      timestamp: new Date().toISOString(),
      formId: schema.id,
      formName: schema.name,
      formVersion: schema.version
    }
  }
}

/**
 * Transform a single fieldgroup instance, adding metadata to nested fields
 */
function transformFieldGroupInstance(
  instance: Record<string, any>,
  fields: FormField[]
): Record<string, any> {
  const transformed: Record<string, any> = {}

  fields.forEach((field) => {
    const value = instance[field.key]
    
    // Add field metadata for better webhook processing
    transformed[field.key] = {
      value: value,
      label: field.label,
      type: field.type,
      // Include additional metadata if the value is present
      ...(value !== undefined && value !== null && value !== '' && {
        _metadata: {
          fieldType: field.type,
          fieldLabel: field.label,
          isRequired: field.required || false,
          hasValue: true
        }
      })
    }

    // For certain field types, include additional context
    if (field.type === 'select' || field.type === 'radio' || field.type === 'multiselect') {
      const option = field.options?.find(opt => opt.value === value)
      if (option) {
        transformed[field.key].displayValue = option.label
      }
    }
  })

  return transformed
}

/**
 * Flattens fieldgroup data for CSV export or simple webhook formats
 */
export function flattenFormData(
  schema: FormSchema,
  rawData: Record<string, any>
): Record<string, any> {
  const flattened: Record<string, any> = {}

  schema.fields.forEach((field) => {
    const fieldValue = rawData[field.key]

    if (field.type === 'fieldgroup') {
      const fieldGroup = field as FieldGroupField
      
      if (fieldGroup.repeatable && Array.isArray(fieldValue)) {
        // For repeatable groups, flatten each instance with index
        fieldValue.forEach((instance, index) => {
          fieldGroup.fields.forEach((subField) => {
            const flatKey = `${field.key}[${index + 1}].${subField.key}`
            flattened[flatKey] = instance[subField.key]
          })
        })
      } else {
        // For non-repeatable groups, flatten without index
        const instanceData = Array.isArray(fieldValue) ? fieldValue[0] : fieldValue
        if (instanceData) {
          fieldGroup.fields.forEach((subField) => {
            const flatKey = `${field.key}.${subField.key}`
            flattened[flatKey] = instanceData[subField.key]
          })
        }
      }
    } else {
      // Regular fields
      flattened[field.key] = fieldValue
    }
  })

  return flattened
}

/**
 * Creates a human-readable summary of fieldgroup data
 */
export function summarizeFieldGroupData(
  fieldGroup: FieldGroupField,
  data: any[]
): string {
  if (!Array.isArray(data) || data.length === 0) {
    return 'No data'
  }

  if (fieldGroup.repeatable) {
    const summaries = data.map((instance, index) => {
      const summary = fieldGroup.fields
        .filter(f => instance[f.key] !== undefined && instance[f.key] !== '')
        .map(f => `${f.label}: ${instance[f.key]}`)
        .join(', ')
      return `Instance ${index + 1}: ${summary || 'Empty'}`
    })
    return summaries.join('\n')
  } else {
    const instance = data[0]
    return fieldGroup.fields
      .filter(f => instance[f.key] !== undefined && instance[f.key] !== '')
      .map(f => `${f.label}: ${instance[f.key]}`)
      .join(', ')
  }
}