import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Settings, BarChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinalFormLogo } from '@/components/ui/final-form-logo'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <FinalFormLogo size="xl" />
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Handle any and every situation or business need with the most powerful, flexible form builder ever created. 
            From simple contact forms to complex multi-page applications with conditional logic, calculations, and integrations.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center mb-12">
          <Link href="/auth/signup">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>

        {/* Demo Form */}
        <Card className="max-w-2xl mx-auto mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>See Final Form In Action</CardTitle>
            <CardDescription>
              Experience the power and flexibility with our advanced demo form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/form/roofing-quote" target="_blank">
              <Button variant="outline">Try Live Demo</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Built for Every Industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Line-Item Matrix</h3>
              <p className="text-muted-foreground">
                Create detailed quotes with materials, labor, and automatic calculations
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-2">Smart Logic</h3>
              <p className="text-muted-foreground">
                Show/hide fields based on project type and conditional rules
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-semibold mb-2">Webhook Integration</h3>
              <p className="text-muted-foreground">
                Send submissions to your CRM, email, or other systems automatically
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold mb-2">Mobile Optimized</h3>
              <p className="text-muted-foreground">
                Forms work perfectly on phones and tablets for field use
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="font-semibold mb-2">Voice Input</h3>
              <p className="text-muted-foreground">
                Record notes with voice-to-text transcription powered by AI
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold mb-2">PDF Export</h3>
              <p className="text-muted-foreground">
                Generate professional PDFs of submissions for clients and records
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-primary/5 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready for the Final Form?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands who've found their last form builder
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8">
              Start Building with Final Form
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}