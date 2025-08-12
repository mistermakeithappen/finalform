'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ClientOnly } from '../ClientOnly'
import { 
  Type, 
  Hash, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  ToggleLeft,
  List,
  Grid3x3,
  MapPin,
  DollarSign,
  Clock,
  Image,
  Upload,
  Edit3,
  CheckSquare,
  Radio,
  Sliders,
  Star,
  Layers,
  Package,
  Heading,
  Split,
  Video,
  MousePointerClick
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldType } from '@/lib/types/form'

interface FieldItem {
  type: FieldType
  label: string
  icon: React.ReactNode
  category: 'basic' | 'advanced' | 'construction'
}

const fieldItems: FieldItem[] = [
  // Basic Fields
  { type: 'headline', label: 'Headline', icon: <Heading className="h-4 w-4" />, category: 'basic' },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" />, category: 'basic' },
  { type: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" />, category: 'basic' },
  { type: 'textarea', label: 'Text Area', icon: <FileText className="h-4 w-4" />, category: 'basic' },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" />, category: 'basic' },
  { type: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" />, category: 'basic' },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, category: 'basic' },
  { type: 'select', label: 'Dropdown', icon: <List className="h-4 w-4" />, category: 'basic' },
  { type: 'radio', label: 'Radio', icon: <Radio className="h-4 w-4" />, category: 'basic' },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" />, category: 'basic' },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, category: 'basic' },
  { type: 'button-select', label: 'Button Select', icon: <MousePointerClick className="h-4 w-4" />, category: 'basic' },
  
  // Advanced Fields
  { type: 'time', label: 'Time', icon: <Clock className="h-4 w-4" />, category: 'advanced' },
  { type: 'file', label: 'File Upload', icon: <Upload className="h-4 w-4" />, category: 'advanced' },
  { type: 'video', label: 'Video Recording', icon: <Video className="h-4 w-4" />, category: 'advanced' },
  { type: 'signature', label: 'Signature', icon: <Edit3 className="h-4 w-4" />, category: 'advanced' },
  { type: 'rating', label: 'Rating', icon: <Star className="h-4 w-4" />, category: 'advanced' },
  { type: 'toggle', label: 'Toggle', icon: <ToggleLeft className="h-4 w-4" />, category: 'advanced' },
  { type: 'slider', label: 'Slider', icon: <Sliders className="h-4 w-4" />, category: 'advanced' },
  { type: 'pagebreak', label: 'Page Break', icon: <Split className="h-4 w-4" />, category: 'advanced' },
  { type: 'fieldgroup', label: 'Field Group', icon: <Package className="h-4 w-4" />, category: 'advanced' },
  
  // Construction Specific
  { type: 'matrix', label: 'Line Items', icon: <Grid3x3 className="h-4 w-4" />, category: 'construction' },
  { type: 'currency', label: 'Currency', icon: <DollarSign className="h-4 w-4" />, category: 'construction' },
  { type: 'address', label: 'Address', icon: <MapPin className="h-4 w-4" />, category: 'construction' },
  { type: 'section', label: 'Section', icon: <FileText className="h-4 w-4" />, category: 'construction' },
]

function DraggableFieldItem({ item }: { item: FieldItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: 'new-field',
      fieldType: item.type
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <ClientOnly>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-move hover:bg-accent transition-colors",
          isDragging && "opacity-50"
        )}
      >
        <div className="text-muted-foreground">{item.icon}</div>
        <span className="text-sm">{item.label}</span>
      </div>
    </ClientOnly>
  )
}

export function FieldPalette() {
  const categories = [
    { key: 'basic', label: 'Basic Fields' },
    { key: 'advanced', label: 'Advanced' },
    { key: 'construction', label: 'Construction' }
  ]

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Field Types</h3>
      
      {categories.map(category => {
        const items = fieldItems.filter(item => item.category === category.key)
        
        return (
          <div key={category.key} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {category.label}
            </h4>
            <div className="space-y-1">
              {items.map(item => (
                <DraggableFieldItem key={item.type} item={item} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}