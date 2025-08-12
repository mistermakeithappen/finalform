'use client'

import React from 'react'
import { FormField } from '@/lib/types/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MatrixField } from './fields/MatrixField'
import { SelectField } from './fields/SelectField'
import { CheckboxField } from './fields/CheckboxField'
import { TextareaField } from './fields/TextareaField'
import { NumberField } from './fields/NumberField'
import { DateField } from './fields/DateField'
import { FileField } from './fields/FileField'
import { SignatureField } from './fields/SignatureField'
import { RatingField } from './fields/RatingField'
import { SliderField } from './fields/SliderField'
import { AddressField } from './fields/AddressField'
import { RepeaterField } from './fields/RepeaterField'
import { FieldGroupField } from './fields/FieldGroupField'
import { HeadlineField } from './fields/HeadlineField'
import { ImageField } from './fields/ImageField'
import { PageBreakField } from './fields/PageBreakField'
import { VideoRecordingField } from './fields/VideoRecordingField'
import { InlineEditableLabel } from '../form-builder/InlineEditableLabel'
import { TextFieldWithRecording } from './fields/TextFieldWithRecording'
import { TextareaFieldWithRecording } from './fields/TextareaFieldWithRecording'
import { EnhancedSelectField } from './fields/EnhancedSelectField'
import { EnhancedNumberField } from './fields/EnhancedNumberField'
import { EnhancedDateField } from './fields/EnhancedDateField'
import { ButtonSelectField } from './fields/ButtonSelectField'

interface FieldRendererProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  required?: boolean
  isBuilder?: boolean
  onFieldUpdate?: (field: FormField) => void
  onNavigate?: (targetPage: number) => void
}

export function FieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  isBuilder = false,
  onFieldUpdate,
  onNavigate
}: FieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextFieldWithRecording
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'textarea':
        return (
          <TextareaFieldWithRecording
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'number':
      case 'currency':
        return (
          <EnhancedNumberField
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'select':
      case 'multiselect':
      case 'radio':
        return (
          <EnhancedSelectField
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'checkbox':
      case 'toggle':
        return (
          <CheckboxField
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
          />
        )
      
      case 'button-select':
        return (
          <ButtonSelectField
            field={field}
            value={value}
            onChange={onChange}
            onNavigate={onNavigate}
            error={error}
            preview={isBuilder}
          />
        )
      
      case 'date':
      case 'time':
      case 'datetime':
        return (
          <EnhancedDateField
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'file':
        return (
          <FileField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'video':
        return (
          <VideoRecordingField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'signature':
        return (
          <SignatureField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'rating':
        return (
          <RatingField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'slider':
        return (
          <SliderField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'matrix':
        return (
          <MatrixField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'repeater':
        return (
          <RepeaterField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )
      
      case 'fieldgroup':
        return (
          <FieldGroupField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            error={error}
          />
        )
      
      case 'address':
        return (
          <AddressField
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={!!error}
          />
        )
      
      case 'html':
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: field.content }}
          />
        )
      
      case 'headline':
        return (
          <HeadlineField field={field} />
        )
      
      case 'image':
        return (
          <ImageField field={field} />
        )
      
      case 'pagebreak':
        return (
          <PageBreakField field={field} isDesignMode={true} />
        )
      
      default:
        return null
    }
  }

  if (field.type === 'headline' || field.type === 'pagebreak') {
    return renderField()
  }

  return (
    <div className="space-y-2">
      {field.label && (
        isBuilder && onFieldUpdate ? (
          <InlineEditableLabel
            value={field.label}
            onChange={(newLabel) => onFieldUpdate({ ...field, label: newLabel })}
            required={required}
          />
        ) : (
          <Label htmlFor={field.id}>
            {field.label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )
      )}
      
      {renderField()}
      
      {field.helpText && !error && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}