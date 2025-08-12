import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get submission data
    const { data: submission, error } = await supabase
      .from('submissions')
      .select(`
        *,
        forms(*, form_versions(*))
      `)
      .eq('id', submissionId)
      .single()
    
    if (error || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    // Get form schema
    const form = submission.forms
    const version = form.form_versions.find((v: any) => v.id === submission.form_version_id)
    const schema = version?.schema as any
    
    // Generate PDF
    const pdf = new jsPDF()
    let yPosition = 20
    
    // Header
    pdf.setFontSize(20)
    pdf.text(form.name, 20, yPosition)
    yPosition += 10
    
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    pdf.text(`Submission ID: ${submission.id}`, 20, yPosition)
    yPosition += 5
    pdf.text(`Submitted: ${new Date(submission.submitted_at).toLocaleString()}`, 20, yPosition)
    yPosition += 15
    
    // Reset text color
    pdf.setTextColor(0)
    pdf.setFontSize(11)
    
    // Form data
    const data = submission.data as any
    
    const renderField = (field: any) => {
      if (field.type === 'section') {
        // Section header
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(field.title || '', 20, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        yPosition += 10
        
        // Render section fields
        field.fields?.forEach(renderField)
        return
      }
      
      const value = data[field.key]
      if (value === undefined || value === null) return
      
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Field label
      pdf.setFont('helvetica', 'bold')
      pdf.text(field.label || field.key, 20, yPosition)
      pdf.setFont('helvetica', 'normal')
      yPosition += 5
      
      // Field value
      let displayValue = ''
      
      if (field.type === 'matrix' && Array.isArray(value)) {
        // Handle matrix fields specially
        value.forEach((row: any, index: number) => {
          Object.entries(row).forEach(([key, val]) => {
            if (key !== '_id') {
              pdf.text(`  ${key}: ${val}`, 25, yPosition)
              yPosition += 5
            }
          })
          if (index < value.length - 1) {
            yPosition += 3
          }
        })
      } else if (field.type === 'address' && typeof value === 'object') {
        // Handle address fields
        if (value.street1) pdf.text(`  ${value.street1}`, 25, yPosition), yPosition += 5
        if (value.street2) pdf.text(`  ${value.street2}`, 25, yPosition), yPosition += 5
        if (value.city || value.state || value.zip) {
          pdf.text(`  ${value.city || ''}, ${value.state || ''} ${value.zip || ''}`, 25, yPosition)
          yPosition += 5
        }
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No'
        pdf.text(`  ${displayValue}`, 25, yPosition)
        yPosition += 5
      } else if (Array.isArray(value)) {
        displayValue = value.join(', ')
        pdf.text(`  ${displayValue}`, 25, yPosition)
        yPosition += 5
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2)
        const lines = displayValue.split('\n')
        lines.forEach(line => {
          pdf.text(`  ${line}`, 25, yPosition)
          yPosition += 5
        })
      } else {
        displayValue = String(value)
        // Wrap long text
        const lines = pdf.splitTextToSize(displayValue, 160)
        lines.forEach((line: string) => {
          pdf.text(`  ${line}`, 25, yPosition)
          yPosition += 5
        })
      }
      
      yPosition += 5
    }
    
    // Render all fields
    schema.fields.forEach(renderField)
    
    // UTM Data
    if (submission.utm_data && Object.keys(submission.utm_data).length > 0) {
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Campaign Information', 20, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      yPosition += 10
      
      Object.entries(submission.utm_data).forEach(([key, value]) => {
        pdf.text(`${key}: ${value}`, 25, yPosition)
        yPosition += 5
      })
    }
    
    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(9)
      pdf.setTextColor(150)
      pdf.text(
        `Page ${i} of ${pageCount} - Generated by Form Builder`,
        pdf.internal.pageSize.width / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
    
    // Generate blob
    const pdfBlob = pdf.output('blob')
    
    // Upload to Supabase Storage
    const fileName = `${submission.form_id}/${submission.id}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      )
    }
    
    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(fileName, 3600) // 1 hour expiry
    
    // Store PDF export record
    const { data: pdfExport } = await supabase
      .from('pdf_exports')
      .insert({
        submission_id: submissionId,
        storage_path: uploadData.path,
        signed_url: signedUrlData?.signedUrl,
        signed_url_expires_at: new Date(Date.now() + 3600000).toISOString()
      })
      .select()
      .single()
    
    // Update submission with PDF export ID
    if (pdfExport) {
      await supabase
        .from('submissions')
        .update({ pdf_export_id: pdfExport.id })
        .eq('id', submissionId)
    }
    
    return NextResponse.json({
      url: signedUrlData?.signedUrl,
      exportId: pdfExport?.id
    })
    
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}