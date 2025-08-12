'use client'

import React from 'react'
import { AddressField as AddressFieldType } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressFieldProps {
  field: AddressFieldType
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  disabled?: boolean
  error?: boolean
}

export function AddressField({ field, value = {}, onChange, onBlur, disabled }: AddressFieldProps) {
  const components = field.components || {
    street1: true,
    street2: true,
    city: true,
    state: true,
    zip: true,
    country: false
  }

  const updateComponent = (key: string, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">
      {components.street1 && (
        <div>
          <Label className="text-xs">Street Address</Label>
          <Input
            value={value.street1 || ''}
            onChange={(e) => updateComponent('street1', e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="123 Main St"
          />
        </div>
      )}
      
      {components.street2 && (
        <Input
          value={value.street2 || ''}
          onChange={(e) => updateComponent('street2', e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="Apt, Suite, Unit, etc."
        />
      )}
      
      <div className="grid grid-cols-6 gap-3">
        {components.city && (
          <div className="col-span-3">
            <Label className="text-xs">City</Label>
            <Input
              value={value.city || ''}
              onChange={(e) => updateComponent('city', e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
            />
          </div>
        )}
        
        {components.state && (
          <div className="col-span-1">
            <Label className="text-xs">State</Label>
            <Input
              value={value.state || ''}
              onChange={(e) => updateComponent('state', e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              maxLength={2}
            />
          </div>
        )}
        
        {components.zip && (
          <div className="col-span-2">
            <Label className="text-xs">ZIP</Label>
            <Input
              value={value.zip || ''}
              onChange={(e) => updateComponent('zip', e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      
      {components.country && (
        <div>
          <Label className="text-xs">Country</Label>
          <Input
            value={value.country || field.defaultCountry || ''}
            onChange={(e) => updateComponent('country', e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}