import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Eye, Edit, BarChart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CopyLinkButton } from '@/components/forms/copy-link-button'

export default async function FormsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .single()

  // Get all forms for the organization
  const { data: forms } = await supabase
    .from('forms')
    .select(`
      *,
      submissions(count)
    `)
    .eq('org_id', orgUser?.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Forms</h1>
              <p className="text-sm text-muted-foreground">
                Manage your forms and view submissions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/builder/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {forms && forms.length > 0 ? (
          <div className="grid gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{form.name}</CardTitle>
                      {form.description && (
                        <CardDescription>{form.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant={form.status === 'published' ? 'default' : form.status === 'draft' ? 'secondary' : 'outline'}>
                          {form.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {new Date(form.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <BarChart className="h-3 w-3" />
                        {form.submissions?.[0]?.count || 0} submissions
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/builder/${form.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    
                    {form.status === 'published' && (
                      <>
                        <Link href={`/form/${form.slug}`} target="_blank">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </Link>
                        
                        <CopyLinkButton formSlug={form.slug} />
                      </>
                    )}
                    
                    <Link href={`/forms/${form.id}/submissions`}>
                      <Button size="sm" variant="outline">
                        <BarChart className="h-4 w-4 mr-2" />
                        Submissions
                      </Button>
                    </Link>
                    
                    <Link href={`/forms/${form.id}/settings`}>
                      <Button size="sm" variant="outline">
                        Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first form to start collecting submissions
              </p>
              <Link href="/builder/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}