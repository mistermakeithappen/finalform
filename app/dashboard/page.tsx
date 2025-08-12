import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, BarChart, Settings, LogOut } from 'lucide-react'
import { FinalFormLogo } from '@/components/ui/final-form-logo'

export default async function DashboardPage() {
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

  // Get forms count
  const { count: formsCount } = await supabase
    .from('forms')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgUser?.org_id)

  // Get submissions count
  const { count: submissionsCount } = await supabase
    .from('submissions')
    .select('submissions.*, forms!inner(*)', { count: 'exact', head: true })
    .eq('forms.org_id', orgUser?.org_id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FinalFormLogo size="sm" showText={false} />
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {orgUser?.organizations?.name || 'Your Organization'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Active forms in your account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissionsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Form responses received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Role</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{orgUser?.role || 'Member'}</div>
              <p className="text-xs text-muted-foreground">Your organization role</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Create Form</CardTitle>
              <CardDescription>Build a new form from scratch</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/builder/new">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>My Forms</CardTitle>
              <CardDescription>View and manage your forms</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/forms">
                <Button variant="outline" className="w-full">View Forms</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <BarChart className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Submissions</CardTitle>
              <CardDescription>View form responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/submissions">
                <Button variant="outline" className="w-full">View Data</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Settings className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button variant="outline" className="w-full">Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Demo Form Notice */}
        {formsCount === 0 && (
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Welcome to Form Builder!</CardTitle>
              <CardDescription>
                A demo form has been created for you to explore. Check out the "Roofing Quote Request" form to see what's possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/form/roofing-quote" target="_blank">
                <Button variant="outline">View Demo Form</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}