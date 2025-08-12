'use client'

import React from 'react'
import { PageBreakField as PageBreakFieldType } from '@/lib/types/form'
import { cn } from '@/lib/utils'
import { ChevronRight, FileText } from 'lucide-react'

interface PageBreakFieldProps {
  field: PageBreakFieldType
  isDesignMode?: boolean
  currentPage?: number
  totalPages?: number
}

export function PageBreakField({ 
  field, 
  isDesignMode = false,
  currentPage = 1,
  totalPages = 1
}: PageBreakFieldProps) {
  
  if (isDesignMode) {
    // Design mode preview
    return (
      <div className="relative">
        <div className="flex items-center justify-center py-4">
          <div className="flex-1 border-t-2 border-dashed border-primary/50" />
          <div className="mx-4 flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Page Break</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-primary/50" />
        </div>
        
        {(field.pageTitle || field.pageDescription) && (
          <div className="text-center mt-2 mb-4">
            {field.pageTitle && (
              <h3 className="text-lg font-semibold">{field.pageTitle}</h3>
            )}
            {field.pageDescription && (
              <p className="text-sm text-muted-foreground mt-1">{field.pageDescription}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-4">
          {!field.hidePrevButton && (
            <div className="px-3 py-1.5 bg-muted rounded text-xs">
              ← {field.prevButtonText || 'Previous'}
            </div>
          )}
          {!field.hideNextButton && (
            <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs flex items-center gap-1">
              {field.nextButtonText || 'Next'}
              <ChevronRight className="h-3 w-3" />
            </div>
          )}
          {field.hideNextButton && field.hidePrevButton && (
            <div className="text-xs text-muted-foreground italic">
              Navigation buttons hidden - use button-select or other navigation
            </div>
          )}
        </div>

        {field.navigationRules && field.navigationRules.length > 0 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-muted-foreground">
              {field.navigationRules.length} conditional navigation rule{field.navigationRules.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Runtime mode - this would be handled by the FormRenderer
  // This is just a placeholder for the page break indicator
  return (
    <div className="hidden">
      {/* Page break marker for form renderer */}
      <input type="hidden" name={`pagebreak_${field.id}`} value="true" />
    </div>
  )
}