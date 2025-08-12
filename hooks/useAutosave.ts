'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { FormSchema } from '@/lib/types/form'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from './useDebounce'

interface UseAutosaveOptions {
  formId?: string
  enabled?: boolean
  debounceMs?: number
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave({
  formId,
  enabled = true,
  debounceMs = 1000,
  onSaveStart,
  onSaveSuccess,
  onSaveError
}: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  const save = useCallback(async (schema: FormSchema) => {
    if (!enabled || !formId) return

    try {
      setSaveStatus('saving')
      setError(null)
      onSaveStart?.()

      const { error: updateError } = await supabase
        .from('forms')
        .update({
          name: schema.name,
          description: schema.description,
          fields: schema.fields,
          settings: schema.settings,
          theme: schema.theme,
          logic: schema.logic,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)

      if (updateError) throw updateError

      setSaveStatus('saved')
      setLastSavedAt(new Date())
      onSaveSuccess?.()

      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (err) {
      const error = err as Error
      setSaveStatus('error')
      setError(error)
      onSaveError?.(error)
      console.error('Autosave failed:', error)
    }
  }, [enabled, formId, onSaveStart, onSaveSuccess, onSaveError, supabase])

  const triggerSave = useCallback((schema: FormSchema) => {
    if (!enabled || !formId) return

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      save(schema)
    }, debounceMs)
  }, [enabled, formId, debounceMs, save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    triggerSave,
    saveStatus,
    lastSavedAt,
    error,
    saveNow: save
  }
}