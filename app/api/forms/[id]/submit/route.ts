import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'
import { transformFormDataForWebhook, flattenFormData } from '@/lib/utils/form-data-transformer'

const submissionSchema = z.object({
  version: z.number(),
  utm: z.record(z.string()).optional(),
  answers: z.record(z.any()),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    const body = await request.json()
    
    // Validate submission data
    const validatedData = submissionSchema.parse(body)
    
    // Get client info
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      ua: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
    }
    
    // Get UTM parameters from query string
    const searchParams = new URL(request.url).searchParams
    const utmData: Record<string, string> = {}
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    
    utmKeys.forEach(key => {
      const value = searchParams.get(key)
      if (value) {
        utmData[key] = value
      }
    })
    
    // Merge with provided UTM data
    const finalUtmData = { ...utmData, ...validatedData.utm }
    
    const supabase = await createClient()
    
    // Get form and version
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*, form_versions!inner(*)')
      .eq('id', formId)
      .eq('status', 'published')
      .single()
    
    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found or not published' },
        { status: 404 }
      )
    }
    
    // Check if authentication is required
    let userData = null
    if (form.form_versions[0]?.schema?.settings?.requireAuth) {
      // Get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required to submit this form' },
          { status: 401 }
        )
      }
      
      // Capture user data
      userData = {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      }
    }
    
    // Create submission
    const submissionId = crypto.randomUUID()
    const { error: submissionError } = await supabase
      .from('submissions')
      .insert({
        id: submissionId,
        form_id: formId,
        form_version_id: form.current_version_id || form.form_versions[0].id,
        data: validatedData.answers,
        utm_data: Object.keys(finalUtmData).length > 0 ? finalUtmData : null,
        client_info: clientInfo,
        user_id: userData?.id || null,
        user_data: userData || null,
        status: 'submitted',
      })
    
    if (submissionError) {
      console.error('Submission error:', submissionError)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }
    
    // Create denormalized submission items for querying
    const submissionItems = Object.entries(validatedData.answers).map(([key, value]) => ({
      submission_id: submissionId,
      field_key: key,
      value: typeof value === 'object' ? value : { value },
    }))
    
    if (submissionItems.length > 0) {
      await supabase
        .from('submission_items')
        .insert(submissionItems)
    }
    
    // Get the form schema for data transformation
    const formSchema = form.form_versions[0]?.schema
    
    // Trigger webhooks (async) with transformed data
    triggerWebhooks(formId, submissionId, validatedData.answers, finalUtmData, userData, formSchema)
    
    return NextResponse.json({
      status: 'ok',
      submissionId,
      receivedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Invalid submission data' },
      { status: 400 }
    )
  }
}

async function triggerWebhooks(
  formId: string,
  submissionId: string,
  answers: Record<string, any>,
  utmData: Record<string, string>,
  userData: any,
  formSchema?: any
) {
  const supabase = await createClient()
  
  // Get active webhooks for this form
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('form_id', formId)
    .eq('is_active', true)
  
  if (!webhooks || webhooks.length === 0) return
  
  // Transform the data if we have the form schema
  let transformedData = null
  let flattenedData = null
  
  if (formSchema) {
    const transformation = transformFormDataForWebhook(formSchema, answers)
    transformedData = transformation
    flattenedData = flattenFormData(formSchema, answers)
  }
  
  const payload = {
    formId,
    submissionId,
    submittedAt: new Date().toISOString(),
    utm: utmData,
    user: userData,
    // Include both raw and structured data
    data: {
      raw: answers,
      structured: transformedData?.structured || answers,
      flattened: flattenedData || answers,
      metadata: transformedData?.metadata || {
        hasFieldGroups: false,
        fieldGroupKeys: [],
        timestamp: new Date().toISOString(),
        formId: formId,
        formName: formSchema?.name || 'Unknown Form',
        formVersion: formSchema?.version || 1
      }
    },
    // Legacy support - keep answers at top level too
    answers,
  }
  
  // Queue webhook deliveries
  for (const webhook of webhooks) {
    try {
      // Create HMAC signature
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex')
      
      // Log delivery attempt
      await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          submission_id: submissionId,
          status: 'pending',
        })
      
      // Send webhook (in production, use a queue service)
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Form-Id': formId,
          'X-Form-Signature': `sha256=${signature}`,
          ...webhook.headers,
        },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        // Update delivery status
        await supabase
          .from('webhook_deliveries')
          .update({
            status: response.ok ? 'success' : 'failed',
            response_status: response.status,
            attempted_at: new Date().toISOString(),
          })
          .eq('webhook_id', webhook.id)
          .eq('submission_id', submissionId)
      }).catch(async (error) => {
        // Log error
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: error.message,
            attempted_at: new Date().toISOString(),
          })
          .eq('webhook_id', webhook.id)
          .eq('submission_id', submissionId)
      })
    } catch (error) {
      console.error('Webhook error:', error)
    }
  }
}