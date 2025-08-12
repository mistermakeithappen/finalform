'use client'

import { useEffect, useState } from 'react'
import { FormBuilder } from '@/components/form-builder/FormBuilder'
import { useRouter } from 'next/navigation'
import { FormSchema } from '@/lib/types/form'
import { createClient } from '@/lib/supabase/client'

interface EditFormPageProps {
  params: {
    id: string
  }
}

export default function EditFormPage({ params }: EditFormPageProps) {
  const router = useRouter()
  const [initialSchema, setInitialSchema] = useState<FormSchema | null>(null)
  const [formSlug, setFormSlug] = useState<string | null>(null)
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgSettings, setOrgSettings] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadForm()
  }, [params.id])

  const loadForm = async () => {
    try {
      const { data: form, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_versions(*)
        `)
        .eq('id', params.id)
        .single()

      if (error || !form) {
        console.error('Error loading form:', error)
        router.push('/forms')
        return
      }

      // Set the form slug and status
      setFormSlug(form.slug)
      setFormStatus(form.status || 'draft')

      // Get organization settings and custom domain
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: orgUser } = await supabase
          .from('org_users')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (orgUser) {
          const { data: org } = await supabase
            .from('organizations')
            .select('settings, custom_domain')
            .eq('id', orgUser.org_id)
            .single()

          if (org?.settings) {
            setOrgSettings(org.settings)
          }
          
          // Check for custom domain
          if (org?.custom_domain) {
            setCustomDomain(org.custom_domain)
          }
        }
      }

      // If form has fields directly (after migration), use those
      if (form.fields) {
        setInitialSchema({
          id: form.id,
          name: form.name,
          description: form.description,
          fields: form.fields || [],
          settings: form.settings || {},
          theme: form.theme || {},
          logic: form.logic || [],
          version: form.version || 1
        })
      } else {
        // Otherwise fall back to version schema
        const currentVersion = form.form_versions.find((v: any) => v.id === form.current_version_id) 
          || form.form_versions[form.form_versions.length - 1]

        if (currentVersion) {
          setInitialSchema({
            ...currentVersion.schema,
            id: form.id,
            name: form.name,
            description: form.description,
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (schema: FormSchema) => {
    try {
      // Update form metadata
      const { error: formError } = await supabase
        .from('forms')
        .update({
          name: schema.name,
          description: schema.description,
          theme: schema.theme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (formError) throw formError

      // Success is now handled visually in the FormBuilder component
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving form')
    }
  }

  const handlePublish = async (schema: FormSchema) => {
    try {
      // Create a new version
      const { data: form } = await supabase
        .from('forms')
        .select('form_versions(version_number)')
        .eq('id', params.id)
        .single()

      const maxVersion = Math.max(...(form?.form_versions?.map((v: any) => v.version_number) || [0]))
      
      // Insert new version
      const { data: newVersion, error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: params.id,
          version_number: maxVersion + 1,
          schema: schema,
          published_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (versionError) throw versionError

      // Update form to published status and set current version
      const { error: updateError } = await supabase
        .from('forms')
        .update({
          status: 'published',
          current_version_id: newVersion.id,
          name: schema.name,
          description: schema.description,
          theme: schema.theme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      alert('Form published successfully!')
      router.push('/forms')
    } catch (error) {
      console.error('Publish error:', error)
      alert('Error publishing form')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading form...</p>
      </div>
    )
  }

  if (!initialSchema) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Form not found</p>
      </div>
    )
  }

  return (
    <FormBuilder
      formId={params.id}
      formSlug={formSlug || undefined}
      formStatus={formStatus}
      initialSchema={initialSchema}
      onSave={handleSave}
      onPublish={handlePublish}
      enableAutosave={true}
      orgSettings={orgSettings}
      customDomain={customDomain || undefined}
    />
  )
}