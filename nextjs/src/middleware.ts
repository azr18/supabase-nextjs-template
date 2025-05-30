import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { 
  isProtectedRoute, 
  getRequiredToolSlug, 
  createMiddlewareSupabaseClient,
  checkUserToolAccess 
} from '@/lib/auth/subscriptions'

export async function middleware(request: NextRequest) {
  // First, handle session management
  const sessionResponse = await updateSession(request)
  
  // If the session response is a redirect (e.g., to login), return it immediately
  if (sessionResponse.status === 307 || sessionResponse.status === 308) {
    return sessionResponse
  }

  const pathname = request.nextUrl.pathname

  // Skip subscription checks for non-protected routes
  if (!isProtectedRoute(pathname)) {
    return sessionResponse
  }

  // For protected routes, check subscription access
  const requiredToolSlug = getRequiredToolSlug(pathname)
  if (!requiredToolSlug) {
    // This shouldn't happen if isProtectedRoute is correctly implemented
    console.error(`Protected route ${pathname} has no associated tool slug`)
    return sessionResponse
  }

  try {
    // Create a fresh Supabase client for subscription checking
    const supabase = createMiddlewareSupabaseClient(request)
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // User not authenticated - redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user has access to the required tool
    const accessCheck = await checkUserToolAccess(supabase, user.id, requiredToolSlug)
    
    if (!accessCheck.hasAccess) {
      // User doesn't have access - redirect to dashboard with error message
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      url.searchParams.set('error', 'subscription_required')
      url.searchParams.set('tool', requiredToolSlug)
      url.searchParams.set('reason', accessCheck.reason || 'Access denied')
      return NextResponse.redirect(url)
    }

    // User has access, proceed with the original response
    return sessionResponse

  } catch (error) {
    console.error('Error in subscription middleware:', error)
    
    // On error, redirect to dashboard with generic error
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    url.searchParams.set('error', 'access_check_failed')
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}