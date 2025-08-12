'use client'

import { FormBuilder } from '@/components/form-builder/FormBuilder'
import { useRouter } from 'next/navigation'
import { FormSchema } from '@/lib/types/form'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function NewFormPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orgSettings, setOrgSettings] = useState<any>(null)
  const [initialSchema, setInitialSchema] = useState<FormSchema | undefined>(undefined)

  // Fetch organization settings on mount
  useEffect(() => {
    const fetchOrgSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's org
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (!orgUser) return

      // Get organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgUser.org_id)
        .single()

      if (org?.settings) {
        setOrgSettings(org.settings)
        
        // Create initial schema with org defaults
        const defaultLogoUrl = org.settings.branding?.logoUrl || org.settings.defaults?.formLogoUrl || ''
        setInitialSchema({
          id: `form_${Date.now()}`,
          name: 'Untitled Form',
          description: '',
          fields: [],
          settings: {
            logoUrl: defaultLogoUrl,
            showLogo: !!defaultLogoUrl
          },
          theme: {},
          logic: [],
          version: 1
        })
      }
    }
    
    fetchOrgSettings()
  }, [supabase])

  const handleSave = async (schema: FormSchema) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login to save forms')
        router.push('/auth/login')
        return
      }

      // Get user's org
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (!orgUser) {
        alert('Organization not found')
        return
      }

      // Create slug from name
      const slug = schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      // Create the form
      const { data: form, error } = await supabase
        .from('forms')
        .insert({
          org_id: orgUser.org_id,
          name: schema.name,
          slug: slug + '-' + Date.now(),
          description: schema.description,
          status: 'draft',
          fields: schema.fields || [],
          settings: schema.settings || {},
          theme: schema.theme || {},
          logic: schema.logic || [],
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Create initial version
      const { error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: form.id,
          version_number: 1,
          schema: schema,
          published_by: user.id,
        })

      if (versionError) throw versionError

      // Navigate to the form builder
      router.push(`/builder/${form.id}`)
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving form')
    }
  }

  const handlePublish = async (schema: FormSchema) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login to publish forms')
        router.push('/auth/login')
        return
      }

      // Get user's org
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (!orgUser) {
        alert('Organization not found')
        return
      }

      // Create slug from name
      const slug = schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      // Create the form
      const { data: form, error } = await supabase
        .from('forms')
        .insert({
          org_id: orgUser.org_id,
          name: schema.name,
          slug: slug + '-' + Date.now(),
          description: schema.description,
          status: 'published',
          fields: schema.fields || [],
          settings: schema.settings || {},
          theme: schema.theme || {},
          logic: schema.logic || [],
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Create initial version
      const { data: version, error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: form.id,
          version_number: 1,
          schema: schema,
          published_by: user.id,
        })
        .select()
        .single()

      if (versionError) throw versionError

      // Update form with current version
      await supabase
        .from('forms')
        .update({ current_version_id: version.id })
        .eq('id', form.id)

      alert('Form published successfully!')
      router.push('/forms')
    } catch (error) {
      console.error('Publish error:', error)
      alert('Error publishing form')
    }
  }

  return (
    <FormBuilder
      initialSchema={initialSchema}
      onSave={handleSave}
      onPublish={handlePublish}
      orgSettings={orgSettings}
    />
  )
}