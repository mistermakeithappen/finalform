'use client'

import React from 'react'
import { FileField as FileFieldType } from '@/lib/types/form'
import { Input } from '@/components/ui/input'

interface FileFieldProps {
  field: FileFieldType
  value: any
  onChange: (value: any) => void
  disabled?: boolean
}

export function FileField({ field, value, onChange, disabled }: FileFieldProps) {
  return (
    <Input
      type="file"
      accept={field.accept}
      multiple={field.multiple}
      onChange={(e) => onChange(e.target.files)}
      disabled={disabled}
    />
  )
}