import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const url = request.nextUrl.clone()
  
  // Skip middleware for static files and API routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Check if this is a custom domain
  if (hostname && !hostname.includes('localhost') && !hostname.includes('vercel.app')) {
    try {
      const supabase = await createClient()
      
      // Check if this domain is registered and active
      const { data: domain } = await supabase
        .from('domains')
        .select('*, organizations(*)')
        .eq('hostname', hostname)
        .eq('status', 'active')
        .single()
      
      if (domain && domain.organizations) {
        // This is a valid custom domain
        // Rewrite to show forms from this organization
        if (url.pathname === '/') {
          // Show a landing page or redirect to a default form
          url.pathname = `/org/${domain.organizations.slug}`
          return NextResponse.rewrite(url)
        }
        
        // Handle form routes
        if (url.pathname.startsWith('/form/')) {
          // Add org context to the request
          const response = NextResponse.next()
          response.headers.set('x-org-id', domain.org_id)
          response.headers.set('x-org-slug', domain.organizations.slug)
          return response
        }
      }
    } catch (error) {
      console.error('Custom domain middleware error:', error)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}