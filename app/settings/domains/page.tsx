import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AddDomainForm } from './AddDomainForm'

export default async function DomainsPage() {
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

  if (!orgUser || (orgUser.role !== 'owner' && orgUser.role !== 'admin')) {
    redirect('/settings')
  }

  // Get existing domains
  const { data: domains } = await supabase
    .from('domains')
    .select('*')
    .eq('org_id', orgUser.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Custom Domains</h1>
              <p className="text-sm text-muted-foreground">
                Use your own domain for forms
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="grid gap-6">
          {/* Add Domain */}
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Domain</CardTitle>
              <CardDescription>
                Connect your own domain to serve forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddDomainForm orgId={orgUser.org_id} />
            </CardContent>
          </Card>

          {/* Existing Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Your Domains</CardTitle>
              <CardDescription>
                Manage your connected domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains && domains.length > 0 ? (
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div key={domain.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{domain.hostname}</span>
                            <Badge variant={
                              domain.status === 'active' ? 'default' : 
                              domain.status === 'pending' ? 'secondary' : 
                              domain.status === 'verifying' ? 'outline' : 'destructive'
                            }>
                              {domain.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {domain.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {domain.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {domain.status}
                            </Badge>
                          </div>
                          
                          {domain.status === 'pending' && (
                            <div className="bg-muted p-3 rounded-md space-y-2">
                              <p className="text-sm font-medium">DNS Configuration Required:</p>
                              <div className="space-y-1 text-xs font-mono">
                                <p>1. Add CNAME record:</p>
                                <p className="pl-4">Name: {domain.hostname}</p>
                                <p className="pl-4">Value: cname.vercel-dns.com</p>
                                <p className="mt-2">2. Add TXT record for verification:</p>
                                <p className="pl-4">Name: _vercel</p>
                                <p className="pl-4">Value: {domain.verification_token}</p>
                              </div>
                            </div>
                          )}
                          
                          {domain.status === 'active' && (
                            <p className="text-sm text-muted-foreground">
                              Your forms are available at: https://{domain.hostname}/form/[slug]
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {domain.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              Verify DNS
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-destructive">
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No custom domains configured yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Add Your Domain</h4>
                <p className="text-sm text-muted-foreground">
                  Enter your custom domain (e.g., forms.yourcompany.com)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Configure DNS</h4>
                <p className="text-sm text-muted-foreground">
                  Add the provided CNAME and TXT records to your domain's DNS settings
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Verify & Activate</h4>
                <p className="text-sm text-muted-foreground">
                  Once DNS propagates (usually within 24 hours), click verify to activate your domain
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">4. Share Forms</h4>
                <p className="text-sm text-muted-foreground">
                  Your forms will be accessible at your custom domain instead of the default URL
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}