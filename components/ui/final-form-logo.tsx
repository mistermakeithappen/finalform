'use client'

import { cn } from '@/lib/utils'

interface FinalFormLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FinalFormLogo({ 
  className, 
  showText = true,
  size = 'md'
}: FinalFormLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Using a stylized FF */}
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold',
        iconSizeClasses[size],
        size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : size === 'lg' ? 'p-2' : 'p-2.5'
      )}>
        <span className={cn(
          'font-mono',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg'
        )}>
          FF
        </span>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent',
            sizeClasses[size]
          )}>
            Final Form
          </span>
          {size !== 'sm' && (
            <span className={cn(
              'text-muted-foreground',
              size === 'md' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-base'
            )}>
              The Last Form Builder You'll Ever Need
            </span>
          )}
        </div>
      )}
    </div>
  )
}