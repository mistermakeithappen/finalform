'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Image, Palette, FileText } from 'lucide-react'

interface OrganizationSettingsProps {
  orgId: string
  initialSettings?: any
}

export function OrganizationSettings({ orgId, initialSettings }: OrganizationSettingsProps) {
  const [settings, setSettings] = useState({
    branding: {
      logoUrl: '',
      primaryColor: '',
      secondaryColor: ''
    },
    defaults: {
      formLogoUrl: '',
      formTheme: 'light',
      requireAuth: false
    },
    ...initialSettings
  })
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (settings.branding?.logoUrl) {
      setLogoPreview(settings.branding.logoUrl)
    }
  }, [settings.branding?.logoUrl])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Update organization settings
      const { error } = await supabase
        .from('organizations')
        .update({ settings })
        .eq('id', orgId)

      if (error) throw error

      toast.success('Organization settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUrlChange = (url: string) => {
    setSettings((prev: any) => ({
      ...prev,
      branding: {
        ...prev.branding,
        logoUrl: url
      },
      defaults: {
        ...prev.defaults,
        formLogoUrl: url // Auto-populate form default
      }
    }))
    setLogoPreview(url)
  }

  return (
    <div className="space-y-6">
      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            <div>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Configure your organization's branding
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-url">Organization Logo URL</Label>
            <Input
              id="logo-url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={settings.branding?.logoUrl || ''}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This logo will be used as the default for all new forms
            </p>
          </div>

          {logoPreview && (
            <div className="space-y-2">
              <Label>Logo Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-20 object-contain"
                  onError={() => setLogoPreview('')}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  className="w-16 h-9 p-1"
                  value={settings.branding?.primaryColor || '#000000'}
                  onChange={(e) => setSettings((prev: any) => ({
                    ...prev,
                    branding: { ...prev.branding, primaryColor: e.target.value }
                  }))}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  value={settings.branding?.primaryColor || ''}
                  onChange={(e) => setSettings((prev: any) => ({
                    ...prev,
                    branding: { ...prev.branding, primaryColor: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  className="w-16 h-9 p-1"
                  value={settings.branding?.secondaryColor || '#666666'}
                  onChange={(e) => setSettings((prev: any) => ({
                    ...prev,
                    branding: { ...prev.branding, secondaryColor: e.target.value }
                  }))}
                />
                <Input
                  type="text"
                  placeholder="#666666"
                  value={settings.branding?.secondaryColor || ''}
                  onChange={(e) => setSettings((prev: any) => ({
                    ...prev,
                    branding: { ...prev.branding, secondaryColor: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Form Defaults</CardTitle>
              <CardDescription>
                Default settings for new forms
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-logo-url">Default Form Logo URL</Label>
            <Input
              id="form-logo-url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={settings.defaults?.formLogoUrl || ''}
              onChange={(e) => setSettings((prev: any) => ({
                ...prev,
                defaults: { ...prev.defaults, formLogoUrl: e.target.value }
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Can be overridden per form if needed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}