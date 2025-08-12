'use client'

import React from 'react'
import { SignatureField as SignatureFieldType } from '@/lib/types/form'
import { Button } from '@/components/ui/button'

interface SignatureFieldProps {
  field: SignatureFieldType
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SignatureField({ field, value, onChange, disabled }: SignatureFieldProps) {
  return (
    <div className="border rounded-md p-4 bg-muted/10">
      <p className="text-sm text-muted-foreground mb-2">Signature pad will be implemented</p>
      <Button variant="outline" size="sm" disabled={disabled}>
        Sign Here
      </Button>
    </div>
  )
}