import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Key, Globe, Webhook, Users } from 'lucide-react'
import Link from 'next/link'
import { IntegrationsSettings } from './IntegrationsSettings'
import { OrganizationSettings } from './OrganizationSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization and role
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (!orgUser) {
    redirect('/auth/login')
  }

  const isAdmin = orgUser.role === 'owner' || orgUser.role === 'admin'

  // Get organization settings
  const { data: orgData } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgUser.org_id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your organization settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="grid gap-6">
          {/* Organization Branding */}
          {isAdmin && (
            <OrganizationSettings 
              orgId={orgUser.org_id} 
              initialSettings={orgData?.settings || {}}
            />
          )}

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{orgUser.organizations?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                <p className="text-lg capitalize">{orgUser.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                <p className="text-sm font-mono text-muted-foreground">{orgUser.org_id}</p>
              </div>
            </CardContent>
          </Card>

          {/* API Integrations */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <div>
                    <CardTitle>API Integrations</CardTitle>
                    <CardDescription>
                      Configure third-party API keys for enhanced features
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <IntegrationsSettings orgId={orgUser.org_id} />
              </CardContent>
            </Card>
          )}

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhooks for form submissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/settings/webhooks">
                <Button variant="outline">Manage Webhooks</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Custom Domains */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <div>
                    <CardTitle>Custom Domains</CardTitle>
                    <CardDescription>
                      Use your own domain for forms
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/settings/domains">
                  <Button variant="outline">Manage Domains</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage users in your organization
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/settings/team">
                  <Button variant="outline">Manage Team</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}