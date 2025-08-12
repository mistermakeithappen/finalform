'use client'

import React from 'react'
import { FormSchema } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, Palette, Settings, Send, Heart, Code } from 'lucide-react'

interface FormSettingsProps {
  schema: FormSchema
  onUpdate: (updates: Partial<FormSchema>) => void
  orgSettings?: any
}

export function FormSettings({ schema, onUpdate, orgSettings }: FormSettingsProps) {
  const settings = schema.settings || {}

  const handleSettingChange = (key: string, value: any) => {
    onUpdate({
      settings: {
        ...settings,
        [key]: value
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Form Settings</h2>
        <p className="text-muted-foreground mt-1">
          Customize how your form looks and behaves when published
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['display', 'branding']} className="space-y-4">
        {/* Display Settings */}
        <AccordionItem value="display" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="font-semibold">Display Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* Form Title & Description */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Form Title</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the form name at the top of the form
                    </p>
                  </div>
                  <Switch
                    checked={settings.showFormTitle !== false}
                    onCheckedChange={(checked) => handleSettingChange('showFormTitle', checked)}
                  />
                </div>

                {settings.showFormTitle !== false && (
                  <div className="pl-4 border-l-2 border-muted space-y-4">
                    <div className="space-y-2">
                      <Label>Title Alignment</Label>
                      <Select
                        value={settings.formTitleAlignment || 'left'}
                        onValueChange={(value) => handleSettingChange('formTitleAlignment', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Form Description</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the form description below the title
                    </p>
                  </div>
                  <Switch
                    checked={settings.showFormDescription !== false}
                    onCheckedChange={(checked) => handleSettingChange('showFormDescription', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Container Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Layout</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Container Width</Label>
                    <Select
                      value={settings.containerWidth || 'lg'}
                      onValueChange={(value) => handleSettingChange('containerWidth', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small (640px)</SelectItem>
                        <SelectItem value="md">Medium (768px)</SelectItem>
                        <SelectItem value="lg">Large (1024px)</SelectItem>
                        <SelectItem value="xl">Extra Large (1280px)</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Container Padding</Label>
                    <Select
                      value={settings.containerPadding || 'md'}
                      onValueChange={(value) => handleSettingChange('containerPadding', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Required Field Indicator */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Required Indicator</Label>
                    <p className="text-sm text-muted-foreground">
                      Show asterisk (*) for required fields
                    </p>
                  </div>
                  <Switch
                    checked={settings.showRequiredIndicator !== false}
                    onCheckedChange={(checked) => handleSettingChange('showRequiredIndicator', checked)}
                  />
                </div>

                {settings.showRequiredIndicator !== false && (
                  <div className="pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Required Indicator Text</Label>
                      <Input
                        value={settings.requiredIndicatorText || '* indicates required field'}
                        onChange={(e) => handleSettingChange('requiredIndicatorText', e.target.value)}
                        placeholder="* indicates required field"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Branding & Appearance */}
        <AccordionItem value="branding" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="font-semibold">Branding & Appearance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* Logo Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your logo on the form
                    </p>
                  </div>
                  <Switch
                    checked={settings.showLogo === true}
                    onCheckedChange={(checked) => handleSettingChange('showLogo', checked)}
                  />
                </div>

                {settings.showLogo && (
                  <div className="pl-4 border-l-2 border-muted space-y-4">
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={settings.logoUrl || ''}
                        onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                        placeholder={orgSettings?.branding?.logoUrl || orgSettings?.defaults?.formLogoUrl || "https://example.com/logo.png"}
                      />
                      {(orgSettings?.branding?.logoUrl || orgSettings?.defaults?.formLogoUrl) && !settings.logoUrl && (
                        <p className="text-xs text-muted-foreground">
                          Using organization default logo
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Logo Position</Label>
                      <Select
                        value={settings.logoPosition || 'top-left'}
                        onValueChange={(value) => handleSettingChange('logoPosition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-center">Top Center</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Custom CSS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <Label>Custom CSS</Label>
                </div>
                <Textarea
                  value={settings.customCSS || ''}
                  onChange={(e) => handleSettingChange('customCSS', e.target.value)}
                  placeholder=".form-container { background: #f5f5f5; }"
                  className="font-mono text-sm"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Add custom CSS to further customize the form appearance
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Submit Settings */}
        <AccordionItem value="submit" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="font-semibold">Submit Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Submit Button Text</Label>
                <Input
                  value={settings.submitText || 'Submit'}
                  onChange={(e) => handleSettingChange('submitText', e.target.value)}
                  placeholder="Submit"
                />
              </div>

              <div className="space-y-2">
                <Label>Submit Button Alignment</Label>
                <Select
                  value={settings.submitButtonAlignment || 'left'}
                  onValueChange={(value) => handleSettingChange('submitButtonAlignment', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="justify">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>After Submit Action</Label>
                <Select
                  value={settings.submitAction || 'message'}
                  onValueChange={(value) => handleSettingChange('submitAction', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Show Message</SelectItem>
                    <SelectItem value="redirect">Redirect to URL</SelectItem>
                    <SelectItem value="callback">Custom Callback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.submitAction === 'message' && (
                <div className="space-y-2">
                  <Label>Success Message</Label>
                  <Textarea
                    value={settings.submitMessage || 'Thank you for your submission!'}
                    onChange={(e) => handleSettingChange('submitMessage', e.target.value)}
                    placeholder="Thank you for your submission!"
                    rows={3}
                  />
                </div>
              )}

              {settings.submitAction === 'redirect' && (
                <div className="space-y-2">
                  <Label>Redirect URL</Label>
                  <Input
                    value={settings.submitRedirect || ''}
                    onChange={(e) => handleSettingChange('submitRedirect', e.target.value)}
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Form Behavior */}
        <AccordionItem value="behavior" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="font-semibold">Form Behavior</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Save Draft</Label>
                  <p className="text-sm text-muted-foreground">
                    Let users save their progress and return later
                  </p>
                </div>
                <Switch
                  checked={settings.allowSave === true}
                  onCheckedChange={(checked) => handleSettingChange('allowSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Validation Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Display all validation errors at the top of the form
                  </p>
                </div>
                <Switch
                  checked={settings.showValidationSummary === true}
                  onCheckedChange={(checked) => handleSettingChange('showValidationSummary', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scroll to Error</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scroll to the first error field
                  </p>
                </div>
                <Switch
                  checked={settings.scrollToError !== false}
                  onCheckedChange={(checked) => handleSettingChange('scrollToError', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must be logged in to submit the form
                  </p>
                </div>
                <Switch
                  checked={settings.requireAuth === true}
                  onCheckedChange={(checked) => handleSettingChange('requireAuth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable CAPTCHA</Label>
                  <p className="text-sm text-muted-foreground">
                    Add CAPTCHA to prevent spam submissions
                  </p>
                </div>
                <Switch
                  checked={settings.captcha === true}
                  onCheckedChange={(checked) => handleSettingChange('captcha', checked)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Thank You Page */}
        <AccordionItem value="thankyou" className="border rounded-lg">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="font-semibold">Thank You Page</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Thank You Page</Label>
                  <p className="text-sm text-muted-foreground">
                    Display a custom thank you page after submission
                  </p>
                </div>
                <Switch
                  checked={settings.showThankYouPage === true}
                  onCheckedChange={(checked) => handleSettingChange('showThankYouPage', checked)}
                />
              </div>

              {settings.showThankYouPage && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>Thank You Title</Label>
                    <Input
                      value={settings.thankYouTitle || 'Thank You!'}
                      onChange={(e) => handleSettingChange('thankYouTitle', e.target.value)}
                      placeholder="Thank You!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thank You Message</Label>
                    <Textarea
                      value={settings.thankYouMessage || 'Your submission has been received.'}
                      onChange={(e) => handleSettingChange('thankYouMessage', e.target.value)}
                      placeholder="Your submission has been received."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={settings.thankYouButtonText || 'Close'}
                      onChange={(e) => handleSettingChange('thankYouButtonText', e.target.value)}
                      placeholder="Close"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Action</Label>
                    <Select
                      value={settings.thankYouButtonAction || 'close'}
                      onValueChange={(value) => handleSettingChange('thankYouButtonAction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="close">Close Form</SelectItem>
                        <SelectItem value="redirect">Redirect to URL</SelectItem>
                        <SelectItem value="reset">Reset Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.thankYouButtonAction === 'redirect' && (
                    <div className="space-y-2">
                      <Label>Redirect URL</Label>
                      <Input
                        value={settings.thankYouRedirectUrl || ''}
                        onChange={(e) => handleSettingChange('thankYouRedirectUrl', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}