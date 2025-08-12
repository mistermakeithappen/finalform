'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface AddDomainFormProps {
  orgId: string
}

export function AddDomainForm({ orgId }: AddDomainFormProps) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!domain.trim()) {
      setError('Please enter a domain')
      return
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      setError('Please enter a valid domain (e.g., forms.example.com)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Generate verification token
      const verificationToken = `vc-${crypto.randomUUID()}`

      // Add domain to database
      const { error: dbError } = await supabase
        .from('domains')
        .insert({
          org_id: orgId,
          hostname: domain.toLowerCase(),
          status: 'pending',
          verification_token: verificationToken
        })

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('This domain is already in use')
        }
        throw dbError
      }

      // In production, you would call Vercel API here to add the domain
      // For now, we'll just show the DNS instructions
      
      router.refresh()
      setDomain('')
    } catch (err: any) {
      setError(err.message || 'Failed to add domain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="domain">Domain</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="forms.yourcompany.com"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Domain'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use a subdomain like forms.yourcompany.com for best results
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </form>
  )
}