import { create } from 'zustand'
import { FormSchema, FormField } from '@/lib/types/form'

interface FormBuilderState {
  schema: FormSchema
  selectedField: FormField | null
  isDirty: boolean
  
  setSchema: (schema: FormSchema) => void
  addField: (field: FormField) => void
  updateField: (field: FormField) => void
  removeField: (fieldId: string) => void
  selectField: (field: FormField | null) => void
  moveField: (fromIndex: number, toIndex: number) => void
  setIsDirty: (isDirty: boolean) => void
}

const defaultSchema: FormSchema = {
  id: '',
  version: 1,
  name: 'New Form',
  description: '',
  fields: [],
  logic: [],
  calculations: [],
  theme: {},
  prefill: {},
  settings: {
    submitText: 'Submit',
    submitAction: 'message',
    submitMessage: 'Thank you for your submission!',
    allowSave: false,
    allowPrint: false,
    requireAuth: false,
    captcha: false,
    recordingEnabled: false
  }
}

export const useFormBuilderStore = create<FormBuilderState>((set) => ({
  schema: defaultSchema,
  selectedField: null,
  isDirty: false,
  
  setSchema: (schema) => set({ schema, isDirty: true }),
  
  addField: (field) => set((state) => ({
    schema: {
      ...state.schema,
      fields: [...state.schema.fields, field]
    },
    isDirty: true
  })),
  
  updateField: (field) => set((state) => {
    // Deep update for nested fields in field groups
    const updateFieldRecursive = (fields: FormField[]): FormField[] => {
      return fields.map(f => {
        if (f.id === field.id) {
          return field
        }
        if (f.type === 'fieldgroup' && 'fields' in f && f.fields) {
          return {
            ...f,
            fields: updateFieldRecursive(f.fields)
          }
        }
        return f
      })
    }

    return {
      schema: {
        ...state.schema,
        fields: updateFieldRecursive(state.schema.fields)
      },
      selectedField: field,
      isDirty: true
    }
  }),
  
  removeField: (fieldId) => set((state) => ({
    schema: {
      ...state.schema,
      fields: state.schema.fields.filter(f => f.id !== fieldId)
    },
    selectedField: state.selectedField?.id === fieldId ? null : state.selectedField,
    isDirty: true
  })),
  
  selectField: (field) => set({ selectedField: field }),
  
  moveField: (fromIndex, toIndex) => set((state) => {
    const fields = [...state.schema.fields]
    const [movedField] = fields.splice(fromIndex, 1)
    fields.splice(toIndex, 0, movedField)
    
    return {
      schema: {
        ...state.schema,
        fields
      },
      isDirty: true
    }
  }),
  
  setIsDirty: (isDirty) => set({ isDirty })
}))