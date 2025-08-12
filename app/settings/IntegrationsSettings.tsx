'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react'

interface IntegrationsSettingsProps {
  orgId: string
}

export function IntegrationsSettings({ orgId }: IntegrationsSettingsProps) {
  const [openaiKey, setOpenaiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    checkExistingKey()
  }, [orgId])

  const checkExistingKey = async () => {
    const { data } = await supabase
      .from('org_integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('provider', 'openai')
      .single()
    
    setHasExistingKey(!!data)
  }

  const saveOpenAIKey = async () => {
    if (!openaiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    setLoading(true)
    setError(null)
    setSaved(false)

    try {
      if (hasExistingKey) {
        // Update existing key
        const { error } = await supabase
          .from('org_integrations')
          .update({
            api_key_cipher: openaiKey,
            updated_at: new Date().toISOString()
          })
          .eq('org_id', orgId)
          .eq('provider', 'openai')

        if (error) throw error
      } else {
        // Insert new key
        const { error } = await supabase
          .from('org_integrations')
          .insert({
            org_id: orgId,
            provider: 'openai',
            api_key_cipher: openaiKey,
            settings: {}
          })

        if (error) throw error
      }

      setSaved(true)
      setHasExistingKey(true)
      setOpenaiKey('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save API key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          {hasExistingKey && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3" />
              Key configured
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="openai-key"
              type={showKey ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={hasExistingKey ? 'Enter new key to update' : 'sk-...'}
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={saveOpenAIKey} disabled={loading}>
            {loading ? 'Saving...' : hasExistingKey ? 'Update' : 'Save'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Required for audio transcription features. Get your API key from{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
            OpenAI Platform
          </a>
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          API key saved successfully
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-2">Features Enabled with OpenAI:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Voice-to-text transcription for form fields</li>
          <li>• Meeting recorder with full transcription</li>
          <li>• Multi-language support for transcription</li>
        </ul>
      </div>
    </div>
  )
}