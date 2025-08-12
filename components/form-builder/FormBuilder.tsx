'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { customSortableKeyboardCoordinates } from '@/lib/utils/keyboard-coordinates'
import { FormSchema, FormField, FieldType, FieldGroupField } from '@/lib/types/form'
import { FieldPalette } from './FieldPalette'
import { Canvas } from './Canvas'
import { EnhancedPropertyPanelV2 } from './EnhancedPropertyPanelV2'
import { FormPreview } from './FormPreview'
import { FormSettings } from './FormSettings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Save, Rocket, Edit2, Check, X, CheckCircle, Settings as SettingsIcon, Wand2, ArrowLeft, ExternalLink, Globe, Copy, Link2, ChevronDown } from 'lucide-react'
import { useFormBuilderStore } from '@/lib/stores/form-builder'
import { useAutosave } from '@/hooks/useAutosave'
import { SaveIndicator, SaveIndicatorMini } from './SaveIndicator'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { sanitizeFieldKey, generateFieldKey } from '@/lib/utils/field-utils'

interface FormBuilderProps {
  formId?: string
  formSlug?: string
  formStatus?: 'draft' | 'published' | 'archived'
  initialSchema?: FormSchema
  onSave?: (schema: FormSchema) => void
  onPublish?: (schema: FormSchema) => void
  enableAutosave?: boolean
  orgSettings?: any
  customDomain?: string
}

export function FormBuilder({ 
  formId,
  formSlug,
  formStatus = 'draft',
  initialSchema, 
  onSave, 
  onPublish,
  enableAutosave = true,
  orgSettings,
  customDomain
}: FormBuilderProps) {
  const router = useRouter()
  const {
    schema,
    selectedField,
    setSchema,
    addField,
    updateField,
    removeField,
    selectField,
    moveField
  } = useFormBuilderStore()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [previousSelectedId, setPreviousSelectedId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showLogic, setShowLogic] = useState(false)
  const [testValues, setTestValues] = useState<Record<string, any>>({})
  const [showTestBanner, setShowTestBanner] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(schema.name || 'Untitled Form')
  const [tempDescription, setTempDescription] = useState(schema.description || '')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  
  // Autosave hook
  const { 
    triggerSave, 
    saveStatus, 
    lastSavedAt, 
    error: saveError,
    saveNow 
  } = useAutosave({
    formId,
    enabled: enableAutosave && !!formId,
    debounceMs: 2000,
    onSaveStart: () => {
      console.log('Autosaving...')
    },
    onSaveSuccess: () => {
      console.log('Autosaved successfully')
    },
    onSaveError: (error) => {
      toast.error('Failed to save changes', {
        description: error.message
      })
    }
  })

  // Trigger autosave when field selection changes
  useEffect(() => {
    if (enableAutosave && formId && selectedField?.id !== previousSelectedId) {
      if (previousSelectedId) {
        // User switched from one field to another
        triggerSave(schema)
      }
      setPreviousSelectedId(selectedField?.id || null)
    }
  }, [selectedField?.id, enableAutosave, formId, triggerSave, schema]) // Remove previousSelectedId from deps to avoid loop

  // Trigger autosave when fields are modified
  useEffect(() => {
    if (enableAutosave && formId && schema.fields.length > 0) {
      // Debounced save will happen automatically
      triggerSave(schema)
    }
  }, [schema.fields, enableAutosave, formId, triggerSave])
  const [isDraggingNew, setIsDraggingNew] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: customSortableKeyboardCoordinates,
    })
  )

  React.useEffect(() => {
    if (initialSchema) {
      setSchema(initialSchema)
      setTempTitle(initialSchema.name || 'Untitled Form')
      setTempDescription(initialSchema.description || '')
    }
  }, [initialSchema, setSchema])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Check if dragging from palette
    if (active.data.current?.type === 'new-field') {
      setIsDraggingNew(true)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      setIsDraggingNew(false)
      return
    }
    
    // Get more precise drop information from the event
    const dropData = over.data.current
    const activeData = active.data.current

    // Check if we're dealing with field group operations
    const activeIsGroupField = active.id.toString().startsWith('group-field-')
    const overIsGroupField = over.id.toString().startsWith('group-field-')
    const isFieldGroupTarget = over.id.toString().startsWith('fieldgroup-')
    
    // Handle reordering fields within a field group
    if (activeIsGroupField && overIsGroupField) {
      // Extract field IDs and find parent field group
      const activeFieldId = active.id.toString().replace('group-field-', '')
      const overFieldId = over.id.toString().replace('group-field-', '')
      
      // Find the field group that contains these fields
      for (let i = 0; i < schema.fields.length; i++) {
        const field = schema.fields[i]
        if (field.type === 'fieldgroup') {
          const fieldGroup = field as FieldGroupField
          const activeIndex = fieldGroup.fields.findIndex(f => f.id === activeFieldId)
          const overIndex = fieldGroup.fields.findIndex(f => f.id === overFieldId)
          
          if (activeIndex !== -1 && overIndex !== -1) {
            // Reorder within this field group
            const newGroupFields = arrayMove(fieldGroup.fields, activeIndex, overIndex)
            const updatedFieldGroup = { ...fieldGroup, fields: newGroupFields }
            const newFields = [...schema.fields]
            newFields[i] = updatedFieldGroup
            setSchema({ ...schema, fields: newFields })
            
            // Trigger autosave
            if (enableAutosave && formId) {
              triggerSave({ ...schema, fields: newFields })
            }
            break
          }
        }
      }
    }
    // Handle new field from palette
    else if (isDraggingNew && active.data.current?.fieldType) {
      const fieldType = active.data.current.fieldType as FieldType
      const newField = createFieldFromType(fieldType)
      
      if (isFieldGroupTarget) {
        // Extract the field group ID
        const fieldGroupId = over.id.toString().replace('fieldgroup-', '')
        const fieldGroupIndex = schema.fields.findIndex(f => f.id === fieldGroupId)
        
        if (fieldGroupIndex !== -1) {
          const fieldGroup = schema.fields[fieldGroupIndex] as FieldGroupField
          const updatedFieldGroup = {
            ...fieldGroup,
            fields: [...(fieldGroup.fields || []), newField]
          }
          
          const newFields = [...schema.fields]
          newFields[fieldGroupIndex] = updatedFieldGroup
          setSchema({ ...schema, fields: newFields })
          
          // Trigger autosave
          if (enableAutosave && formId) {
            triggerSave({ ...schema, fields: newFields })
          }
        }
      } else if (over.id === 'canvas') {
        // If dropping on the canvas itself (empty area), add to the end
        addField(newField)
        selectField(newField)
        // Trigger autosave after adding new field
        if (enableAutosave && formId) {
          triggerSave(schema)
        }
      } else {
        // Insert at specific position based on the field being hovered over
        const overIndex = schema.fields.findIndex(f => f.id === over.id)
        
        if (overIndex !== -1) {
          // Determine whether to insert before or after based on drop position
          // For now, we'll insert after the target field
          const fields = [...schema.fields]
          fields.splice(overIndex + 1, 0, newField)
          setSchema({ ...schema, fields })
          
          // Select the newly added field
          selectField(newField)
          
          // Trigger autosave after adding new field
          if (enableAutosave && formId) {
            triggerSave({ ...schema, fields })
          }
        } else {
          // Fallback: add to the end if we can't find the target
          addField(newField)
          selectField(newField)
          
          if (enableAutosave && formId) {
            triggerSave(schema)
          }
        }
      }
    } 
    // Handle reordering existing top-level fields
    else if (active.id !== over.id && !activeIsGroupField && !overIsGroupField) {
      const oldIndex = schema.fields.findIndex(f => f.id === active.id)
      const newIndex = schema.fields.findIndex(f => f.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(schema.fields, oldIndex, newIndex)
        setSchema({ ...schema, fields: newFields })
      }
    }
    
    setActiveId(null)
    setIsDraggingNew(false)
  }

  const createFieldFromType = (type: FieldType): FormField => {
    const id = `field_${Date.now()}`
    const existingKeys = schema.fields.map(f => f.key)
    
    // Count existing page breaks to determine the page number
    const pageBreakCount = schema.fields.filter(f => f.type === 'pagebreak').length
    const pageNumber = pageBreakCount + 2 // +2 because page 1 is implicit, and we're adding a new break
    
    // Generate appropriate default label and key based on field type
    const getDefaultLabelAndKey = (fieldType: FieldType) => {
      const typeLabels: Record<string, string> = {
        text: 'Text Field',
        email: 'Email',
        phone: 'Phone',
        number: 'Number',
        currency: 'Amount',
        textarea: 'Text Area',
        select: 'Select Option',
        multiselect: 'Multiple Choice',
        radio: 'Radio Choice',
        checkbox: 'Checkbox',
        toggle: 'Toggle',
        date: 'Date',
        time: 'Time',
        datetime: 'Date & Time',
        file: 'File Upload',
        signature: 'Signature',
        rating: 'Rating',
        slider: 'Slider',
        hidden: 'Hidden Field',
        address: 'Address',
      }
      
      const label = typeLabels[fieldType] || `New ${fieldType} field`
      const key = generateFieldKey(label, existingKeys)
      return { label, key }
    }
    
    const { label: defaultLabel, key: defaultKey } = getDefaultLabelAndKey(type)
    
    const baseField = {
      id,
      key: defaultKey,
      label: defaultLabel,
      type,
    }

    switch (type) {
      case 'text':
      case 'email':
      case 'phone':
        return { ...baseField, type, placeholder: '' } as FormField
      
      case 'textarea':
        return { ...baseField, type: 'textarea', rows: 4 } as FormField
      
      case 'number':
      case 'currency':
        return { ...baseField, type, precision: 2 } as FormField
      
      case 'select':
      case 'radio':
      case 'multiselect':
        return {
          ...baseField,
          type,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
          ]
        } as FormField
      
      case 'button-select':
        return {
          ...baseField,
          type: 'button-select',
          label: 'Choose an option',
          options: [
            { label: 'Option A', value: 'option_a', description: 'Description for option A' },
            { label: 'Option B', value: 'option_b', description: 'Description for option B' },
            { label: 'Option C', value: 'option_c', description: 'Description for option C' }
          ],
          layout: 'vertical',
          buttonSize: 'large',
          showDescription: true
        } as FormField
      
      case 'checkbox':
      case 'toggle':
        return { ...baseField, type, text: 'Check this box' } as FormField
      
      case 'date':
      case 'time':
      case 'datetime':
        return { ...baseField, type } as FormField
      
      case 'video':
        return {
          ...baseField,
          type: 'video',
          label: 'Video Recording',
          maxDuration: 60, // 60 seconds default
          maxSize: 50, // 50MB default
          compressionQuality: 'medium',
          preferredCamera: 'environment', // Back camera by default on mobile
          resolution: 'auto',
          showPreview: true,
          allowUpload: true,
          allowNativeCamera: true,
          includeAudio: true
        } as FormField
      
      case 'matrix':
        return {
          ...baseField,
          type: 'matrix',
          columns: [
            { key: 'item', label: 'Item', type: 'text', width: 4 },
            { key: 'qty', label: 'Qty', type: 'number', width: 2 },
            { key: 'price', label: 'Price', type: 'currency', width: 2 },
            { key: 'total', label: 'Total', type: 'currency', width: 2, readonly: true }
          ],
          allowAddRow: true,
          rowCalc: 'total = qty * price',
          footer: { showTotals: true, sum: ['total'] }
        } as FormField
      
      case 'headline':
        const headlineText = 'New Headline'
        return {
          id,
          type: 'headline',
          key: generateFieldKey(headlineText, existingKeys),
          label: headlineText, // Use the text as the label
          text: headlineText,
          level: 'h2',
          alignment: 'left'
        } as FormField
      
      case 'image':
        const imageAltText = 'Image'
        return {
          id,
          type: 'image',
          key: generateFieldKey('image', existingKeys),
          label: imageAltText, // Use the alt text as the label initially
          imageUrl: '',
          altText: imageAltText,
          imageWidth: 'auto',
          imageHeight: 'auto',
          alignment: 'center',
          caption: ''
        } as FormField
      
      case 'html':
        const htmlContent = '<p>HTML Content</p>'
        const htmlLabel = 'HTML Content'
        return {
          id,
          type: 'html',
          key: generateFieldKey(htmlLabel, existingKeys),
          label: htmlLabel, // Use a descriptive label
          content: htmlContent
        } as FormField
      
      case 'section':
        return {
          ...baseField,
          type: 'section',
          title: 'New Section',
          fields: []
        } as FormField
      
      case 'address':
        return {
          ...baseField,
          type: 'address',
          components: {
            street1: true,
            street2: true,
            city: true,
            state: true,
            zip: true,
            country: true
          }
        } as FormField
      
      case 'fieldgroup':
        return {
          ...baseField,
          type: 'fieldgroup',
          title: 'New Field Group',
          description: 'Group related fields together',
          fields: [],
          repeatable: true,
          minInstances: 1,
          maxInstances: 10,
          addButtonText: 'Add Another',
          collapsible: true,
          collapsed: false
        } as FormField
      
      case 'pagebreak':
        return {
          ...baseField,
          type: 'pagebreak',
          label: 'Page Break',
          pageTitle: `Page ${pageNumber}`,
          pageDescription: '',
          nextButtonText: 'Next',
          prevButtonText: 'Previous',
          showProgressBar: true,
          navigationRules: [],
          defaultNextPage: undefined
        } as FormField
      
      default:
        return baseField as FormField
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(schema)
      // Show success state
      setShowSaveSuccess(true)
      // Reset after 3 seconds
      setTimeout(() => {
        setShowSaveSuccess(false)
      }, 3000)
    }
  }

  const handlePublish = () => {
    if (onPublish) {
      onPublish(schema)
    }
  }

  const handleTitleEdit = () => {
    setIsEditingTitle(true)
    setTempTitle(schema.name || 'Untitled Form')
    setTempDescription(schema.description || '')
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 0)
  }

  const handleTitleSave = () => {
    const updatedSchema = {
      ...schema,
      name: tempTitle || 'Untitled Form',
      description: tempDescription
    }
    setSchema(updatedSchema)
    setIsEditingTitle(false)
    // Trigger autosave
    if (enableAutosave && formId) {
      triggerSave(updatedSchema)
    }
  }

  const handleTitleCancel = () => {
    setTempTitle(schema.name || 'Untitled Form')
    setTempDescription(schema.description || '')
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        // Move to description field
        descriptionInputRef.current?.focus()
      } else {
        handleTitleSave()
      }
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleTestValueChange = (fieldId: string, value: any) => {
    setTestValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
    // Show test banner when user starts entering data
    if (!showTestBanner && value !== '' && value !== false && value !== null) {
      setShowTestBanner(true)
    }
  }

  const clearTestValues = () => {
    setTestValues({})
    setShowTestBanner(false)
  }

  // Get the live form URL
  const getFormUrl = () => {
    if (!formSlug) return null
    
    // Use custom domain if available, otherwise use the default domain
    const baseUrl = customDomain 
      ? `https://${customDomain}` 
      : typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://finalform.io' // Default production domain
    
    return `${baseUrl}/form/${formSlug}`
  }

  const handleViewLiveForm = () => {
    const url = getFormUrl()
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.error('Form needs to be saved first to get a live URL')
    }
  }

  const handleCopyFormUrl = async () => {
    const url = getFormUrl()
    if (url) {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Form URL copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy URL')
      }
    } else {
      toast.error('Form needs to be saved first to get a URL')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Test Mode Banner */}
      {showTestBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-sm font-medium text-amber-900">
                Test Mode - Data entered here is for testing only and won't be saved
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearTestValues}
              className="text-amber-900 hover:text-amber-950 hover:bg-amber-100 h-7"
            >
              Clear Test Data
            </Button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back to Dashboard Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-xl font-semibold bg-transparent border-b-2 border-primary outline-none px-1"
                  placeholder="Form Title"
                />
                <input
                  ref={descriptionInputRef}
                  type="text"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-sm text-muted-foreground bg-transparent border-b border-muted-foreground/30 outline-none px-1 w-full"
                  placeholder="Add a description (optional)"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleTitleSave}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleTitleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleTitleEdit}
              className="group flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 transition-colors"
            >
              <div className="text-left">
                <h1 className="text-xl font-semibold">{schema.name || 'Untitled Form'}</h1>
                <p className="text-sm text-muted-foreground">{schema.description || 'Click to add description'}</p>
              </div>
              <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          {enableAutosave && formId && (
            <SaveIndicator 
              status={saveStatus} 
              lastSavedAt={lastSavedAt} 
              error={saveError}
              className="ml-4"
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              showSettings && "bg-muted"
            )}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogic(!showLogic)}
            className={cn(
              showLogic && "bg-muted"
            )}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Logic
          </Button>
          <div className="w-px bg-border" />
          {formSlug && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  type="button"
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Live Form</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={handleViewLiveForm} 
                  className="gap-2"
                  disabled={formStatus !== 'published'}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Form
                  {formStatus !== 'published' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Draft
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyFormUrl} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Form URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  <span className="text-xs truncate flex-1">
                    {getFormUrl()?.replace(/^https?:\/\//, '') || 'URL not available'}
                  </span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            variant={showSaveSuccess ? "default" : "outline"} 
            size="sm" 
            onClick={handleSave}
            className={cn(
              "transition-all duration-300",
              showSaveSuccess && "bg-green-600 hover:bg-green-700 text-white border-green-600"
            )}
          >
            {showSaveSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button size="sm" onClick={handlePublish}>
            <Rocket className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Panel - Field Palette */}
          <div className="w-64 border-r bg-muted/10 overflow-y-auto">
            <FieldPalette />
          </div>

          {/* Center - Unified Canvas with Live Preview */}
          <div className="flex-1 overflow-y-auto bg-muted/5">
            {showSettings ? (
              <div className="p-6 max-w-4xl mx-auto">
                <FormSettings 
                  schema={schema} 
                  onUpdate={(updates) => {
                    setSchema({ ...schema, ...updates })
                    // Trigger autosave
                    if (enableAutosave && formId) {
                      triggerSave({ ...schema, ...updates })
                    }
                  }}
                  orgSettings={orgSettings}
                />
              </div>
            ) : showLogic ? (
              <div className="p-6 max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Conditional Logic</CardTitle>
                    <CardDescription>
                      Configure conditional rules to show/hide fields based on user input
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Logic rules coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  {/* Form Header Preview */}
                  {(schema.settings?.showFormTitle !== false || schema.settings?.showFormDescription !== false) && (
                    <div className="mb-6">
                      {schema.settings?.showFormTitle !== false && (
                        <h1 className={cn(
                          "text-2xl font-bold mb-2",
                          schema.settings?.formTitleAlignment === 'center' && 'text-center',
                          schema.settings?.formTitleAlignment === 'right' && 'text-right'
                        )}>
                          {schema.name || 'Untitled Form'}
                        </h1>
                      )}
                      {schema.settings?.showFormDescription !== false && schema.description && (
                        <p className={cn(
                          "text-muted-foreground",
                          schema.settings?.formDescriptionAlignment === 'center' && 'text-center',
                          schema.settings?.formDescriptionAlignment === 'right' && 'text-right'
                        )}>
                          {schema.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Live Editable Canvas */}
                  <Canvas
                    fields={schema.fields}
                    selectedField={selectedField}
                    onSelectField={selectField}
                    onRemoveField={removeField}
                    onUpdateField={updateField}
                    onDuplicateField={addField}
                    testValues={testValues}
                    onTestValueChange={handleTestValueChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Properties */}
          {selectedField && !showSettings && !showLogic && (
            <div className="border-l bg-background overflow-hidden flex-shrink-0">
              <EnhancedPropertyPanelV2
                field={selectedField}
                fields={schema.fields}
                onUpdate={updateField}
                onClose={() => selectField(null)}
              />
            </div>
          )}

          <DragOverlay>
            {activeId && isDraggingNew ? (
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded shadow-lg">
                New Field
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}