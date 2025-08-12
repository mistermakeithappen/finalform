'use client'

import React from 'react'
import { FormSchema } from '@/lib/types/form'
import { FormRenderer } from '../form-renderer/FormRenderer'
import { Card } from '@/components/ui/card'

interface FormPreviewProps {
  schema: FormSchema
}

export function FormPreview({ schema }: FormPreviewProps) {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Preview submission:', data)
    alert('Form submitted! (Preview mode - data not saved)')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <FormRenderer
          schema={schema}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  )
}