'use client'

import React from 'react'
import { ImageField as ImageFieldType } from '@/lib/types/form'
import { cn } from '@/lib/utils'

interface ImageFieldProps {
  field: ImageFieldType
}

export function ImageField({ field }: ImageFieldProps) {
  if (!field.imageUrl) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
        <p className="text-sm text-muted-foreground">No image uploaded</p>
      </div>
    )
  }

  const getAlignmentClass = () => {
    switch (field.alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center': 
      default: return 'text-center'
    }
  }

  const getImageWidth = () => {
    if (field.imageWidth === 'full') return '100%'
    if (field.imageWidth === 'auto') return 'auto'
    if (typeof field.imageWidth === 'number') return `${field.imageWidth}px`
    return 'auto'
  }

  const getImageHeight = () => {
    if (field.imageHeight === 'auto') return 'auto'
    if (typeof field.imageHeight === 'number') return `${field.imageHeight}px`
    return 'auto'
  }

  const imageElement = (
    <img
      src={field.imageUrl}
      alt={field.altText || ''}
      style={{
        width: getImageWidth(),
        height: getImageHeight(),
        maxWidth: '100%',
        objectFit: 'contain'
      }}
      className={cn(
        "rounded-lg",
        field.alignment === 'center' && 'mx-auto',
        field.alignment === 'right' && 'ml-auto'
      )}
    />
  )

  return (
    <div className={cn("space-y-2", getAlignmentClass())}>
      {field.link ? (
        <a 
          href={field.link} 
          target={field.openInNewTab ? '_blank' : '_self'}
          rel={field.openInNewTab ? 'noopener noreferrer' : undefined}
          className="inline-block"
        >
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
      
      {field.caption && (
        <p className="text-sm text-muted-foreground mt-2">
          {field.caption}
        </p>
      )}
    </div>
  )
}