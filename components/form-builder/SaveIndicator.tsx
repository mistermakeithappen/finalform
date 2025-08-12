'use client'

import React from 'react'
import { SaveStatus } from '@/hooks/useAutosave'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Cloud,
  CloudOff,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SaveIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
  error?: Error | null
  className?: string
}

export function SaveIndicator({ 
  status, 
  lastSavedAt, 
  error,
  className 
}: SaveIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return 'Save failed'
      default:
        if (lastSavedAt) {
          const now = new Date()
          const diff = now.getTime() - lastSavedAt.getTime()
          
          if (diff < 60000) { // Less than 1 minute
            return 'Saved just now'
          } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000)
            return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`
          } else {
            return `Saved at ${format(lastSavedAt, 'h:mm a')}`
          }
        }
        return 'Not saved'
    }
  }

  const getTooltipContent = () => {
    if (error) {
      return `Error: ${error.message}`
    }
    if (lastSavedAt) {
      return `Last saved: ${format(lastSavedAt, 'PPpp')}`
    }
    return 'No changes to save'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-2 text-sm transition-all",
              status === 'saving' && "text-muted-foreground",
              status === 'saved' && "text-green-600",
              status === 'error' && "text-destructive",
              status === 'idle' && "text-muted-foreground",
              className
            )}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium">
              {getStatusText()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Mini version for tight spaces
export function SaveIndicatorMini({ status }: { status: SaveStatus }) {
  return (
    <div className={cn(
      "transition-all duration-300",
      status === 'saving' && "opacity-100",
      status === 'saved' && "opacity-100",
      status === 'error' && "opacity-100",
      status === 'idle' && "opacity-0"
    )}>
      {status === 'saving' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving</span>
        </div>
      )}
      {status === 'saved' && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 animate-in fade-in slide-in-from-top-1">
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <CloudOff className="h-3 w-3" />
          <span>Failed</span>
        </div>
      )}
    </div>
  )
}