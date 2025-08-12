import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Eye, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SubmissionsPageProps {
  params: {
    id: string
  }
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get form details
  const { data: form } = await supabase
    .from('forms')
    .select('*, form_versions(*)')
    .eq('id', params.id)
    .single()

  if (!form) {
    redirect('/forms')
  }

  // Get submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('form_id', params.id)
    .order('submitted_at', { ascending: false })

  // Get the current schema to know field labels
  const currentVersion = form.form_versions?.find((v: any) => v.id === form.current_version_id) 
    || form.form_versions?.[0]
  const schema = currentVersion?.schema as any

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/forms">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Submissions</h1>
                <p className="text-sm text-muted-foreground">
                  {form.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions?.filter(s => {
                  const date = new Date(s.submitted_at)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return date > weekAgo
                }).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions?.filter(s => {
                  const date = new Date(s.submitted_at)
                  const today = new Date()
                  return date.toDateString() === today.toDateString()
                }).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Form Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const data = submission.data as any
              return (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Submission #{submission.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(submission.submitted_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant={submission.status === 'completed' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Show first few fields as preview */}
                      {Object.entries(data).slice(0, 6).map(([key, value]) => {
                        // Find the field definition to get the label
                        const field = findFieldByKey(schema?.fields || [], key)
                        return (
                          <div key={key}>
                            <dt className="text-sm font-medium text-muted-foreground">
                              {field?.label || key}
                            </dt>
                            <dd className="text-sm mt-1">
                              {formatValue(value)}
                            </dd>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* UTM Data */}
                    {submission.utm_data && Object.keys(submission.utm_data).length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">UTM Parameters:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(submission.utm_data as any).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value as string}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Link href={`/forms/${params.id}/submissions/${submission.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {submission.pdf_export_id && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No submissions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function findFieldByKey(fields: any[], key: string): any {
  for (const field of fields) {
    if (field.key === key) return field
    if (field.type === 'section' && field.fields) {
      const found = findFieldByKey(field.fields, key)
      if (found) return found
    }
  }
  return null
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `${value.length} items`
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}