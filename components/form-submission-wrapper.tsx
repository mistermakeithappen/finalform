'use client'

import { FormRenderer } from '@/components/form-renderer/FormRenderer'

interface FormSubmissionWrapperProps {
  formId: string
  schema: any
  isEmbed?: boolean
}

export function FormSubmissionWrapper({ formId, schema, isEmbed = false }: FormSubmissionWrapperProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: schema.version || 1,
          answers: data,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Submission failed')
      }
      
      const result = await response.json()
      
      // Show success message based on settings
      if (schema.settings?.submitAction === 'redirect' && schema.settings?.submitRedirect) {
        window.location.href = schema.settings.submitRedirect
      } else {
        alert(schema.settings?.submitMessage || 'Thank you for your submission!')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting the form. Please try again.')
    }
  }
  
  return (
    <FormRenderer
      schema={schema}
      onSubmit={handleSubmit}
    />
  )
}