import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FormSubmissionWrapper } from '@/components/form-submission-wrapper'
import { Card } from '@/components/ui/card'

interface FormPageProps {
  params: {
    slug: string
  }
}

async function getForm(slug: string) {
  const supabase = await createClient()
  
  const { data: form, error } = await supabase
    .from('forms')
    .select(`
      *,
      form_versions!inner(*),
      organizations(settings)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  
  if (error || !form) {
    return null
  }
  
  // Check if form has fields directly (current saved state) or use version
  let schema
  if (form.fields) {
    // Use the current saved fields which include conditional logic
    // Transform field-level conditions into schema-level logic rules
    const logicRules: any[] = []
    
    // Extract conditions from each field and convert to logic rules
    const extractConditions = (fields: any[], parentPath = '') => {
      fields.forEach((field: any) => {
        // Handle field's own conditions (stored as 'conditions' in the field)
        if (field.conditions && Array.isArray(field.conditions)) {
          field.conditions.forEach((condition: any, index: number) => {
            // Each condition becomes a logic rule
            // The condition structure should match what LogicEngine expects
            const rule = {
              id: `rule_${field.key}_${index}_${Date.now()}`,
              name: `Rule for ${field.key}`,
              when: condition.when || condition,
              actions: condition.actions || [
                { type: 'show', target: field.key }
              ]
            }
            logicRules.push(rule)
          })
        }
        
        // Also handle legacy visibility conditions
        if (field.visibility && field.visibility.when) {
          const rule = {
            id: `visibility_${field.key}_${Date.now()}`,
            name: `Visibility for ${field.key}`,
            when: field.visibility.when,
            actions: [
              { type: 'show', target: field.key }
            ]
          }
          logicRules.push(rule)
        }
        
        // Recursively handle field groups
        if (field.type === 'fieldgroup' && field.fields) {
          extractConditions(field.fields, `${parentPath}${field.key}.`)
        }
        
        // Recursively handle sections
        if (field.type === 'section' && field.fields) {
          extractConditions(field.fields, parentPath)
        }
      })
    }
    
    if (Array.isArray(form.fields)) {
      extractConditions(form.fields)
    }
    
    schema = {
      id: form.id,
      name: form.name,
      description: form.description,
      fields: form.fields || [],
      settings: form.settings || {},
      theme: form.theme || {},
      logic: [...(form.logic || []), ...logicRules],
      calculations: form.calculations || [],
      version: form.version || 1
    }
  } else {
    // Fall back to version schema
    const version = form.form_versions.find((v: any) => v.id === form.current_version_id) 
      || form.form_versions[form.form_versions.length - 1]
    schema = version.schema
  }
  
  // Merge organization defaults with form settings
  const orgSettings = form.organizations?.settings || {}
  const formSettings = schema.settings || {}
  
  // If form doesn't have a logo but org does, use org logo
  if (!formSettings.logoUrl && orgSettings.branding?.logoUrl) {
    formSettings.logoUrl = orgSettings.branding.logoUrl
    if (!('showLogo' in formSettings)) {
      formSettings.showLogo = true
    }
  }
  
  return {
    ...form,
    schema: {
      ...schema,
      settings: formSettings
    }
  }
}

export default async function FormPage({ params, searchParams }: FormPageProps & { searchParams: { embed?: string } }) {
  const form = await getForm(params.slug)
  
  if (!form) {
    notFound()
  }
  
  const isEmbed = searchParams?.embed === 'true'
  
  if (isEmbed) {
    return (
      <div className="p-4">
        <FormSubmissionWrapper formId={form.id} schema={form.schema} isEmbed={true} />
      </div>
    )
  }
  
  // Use the same container width as the builder for consistency
  const maxWidth = form.schema?.settings?.maxWidth || '4xl'
  const maxWidthClass = maxWidth === '2xl' ? 'max-w-2xl' : 
                        maxWidth === '3xl' ? 'max-w-3xl' : 
                        maxWidth === '5xl' ? 'max-w-5xl' : 
                        maxWidth === '6xl' ? 'max-w-6xl' : 
                        maxWidth === '7xl' ? 'max-w-7xl' : 
                        maxWidth === 'full' ? 'max-w-full' : 
                        'max-w-4xl'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className={`container ${maxWidthClass} mx-auto px-4`}>
        <Card className="p-8">
          <FormSubmissionWrapper formId={form.id} schema={form.schema} isEmbed={false} />
        </Card>
      </div>
    </div>
  )
}