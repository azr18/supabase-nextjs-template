import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createSubscriptionMiddleware } from '@/lib/auth/subscription-middleware'

// Create subscription validation middleware with default configuration
const validateSubscription = createSubscriptionMiddleware({
  unauthorizedRedirect: '/app',
  loginRedirect: '/auth/login',
  includeErrorDetails: true,
  enableLogging: process.env.NODE_ENV === 'development'
})

export async function middleware(request: NextRequest) {
  // First, handle session management
  const sessionResponse = await updateSession(request)
  
  // If the session response is a redirect (e.g., to login), return it immediately
  if (sessionResponse.status === 307 || sessionResponse.status === 308) {
    return sessionResponse
  }

  // Apply subscription validation middleware
  const subscriptionResult = await validateSubscription(request, sessionResponse)
  
  // Return the subscription middleware result
  return subscriptionResult.response
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