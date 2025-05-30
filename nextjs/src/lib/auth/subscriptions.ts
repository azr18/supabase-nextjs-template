import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

export interface UserSubscription {
  id: string
  user_id: string
  tool_id: string
  status: 'active' | 'inactive' | 'trial'
  started_at: string
  expires_at: string | null
  tool: {
    id: string
    name: string
    slug: string
    is_active: boolean
  }
}

export interface SubscriptionCheckResult {
  hasAccess: boolean
  subscription: UserSubscription | null
  reason?: string
}

/**
 * Creates a Supabase client for server-side operations in middleware
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for middleware - cookies are handled by the main middleware
        },
      },
    }
  )
}

/**
 * Checks if a user has an active subscription for a specific tool
 */
export async function checkUserToolAccess(
  supabase: ReturnType<typeof createMiddlewareSupabaseClient>,
  userId: string,
  toolSlug: string
): Promise<SubscriptionCheckResult> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_tool_subscriptions')
      .select(`
        id,
        user_id,
        tool_id,
        status,
        started_at,
        expires_at,
        tools(
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('tools.slug', toolSlug)
      .eq('status', 'active')
      .single()

    if (error || !subscription) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      }
    }

    // Type assertion with proper checking
    const subscriptionData = subscription as any
    if (!subscriptionData.tools || !subscriptionData.tools.is_active) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'Tool is currently inactive'
      }
    }

    // Check if subscription has expired (if it has an expiry date)
    if (subscription.expires_at) {
      const expiryDate = new Date(subscription.expires_at)
      const now = new Date()
      
      if (expiryDate < now) {
        return {
          hasAccess: false,
          subscription: {
            ...subscription,
            tool: subscriptionData.tools
          } as UserSubscription,
          reason: 'Subscription has expired'
        }
      }
    }

    return {
      hasAccess: true,
      subscription: {
        ...subscription,
        tool: subscriptionData.tools
      } as UserSubscription
    }
  } catch (error) {
    console.error('Error checking user tool access:', error)
    return {
      hasAccess: false,
      subscription: null,
      reason: 'Error checking subscription'
    }
  }
}

/**
 * Gets all active subscriptions for a user
 */
export async function getUserActiveSubscriptions(
  supabase: ReturnType<typeof createMiddlewareSupabaseClient>,
  userId: string
): Promise<UserSubscription[]> {
  try {
    const { data: subscriptions, error } = await supabase
      .from('user_tool_subscriptions')
      .select(`
        id,
        user_id,
        tool_id,
        status,
        started_at,
        expires_at,
        tools(
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error || !subscriptions) {
      console.error('Error fetching user subscriptions:', error)
      return []
    }

    // Filter out expired subscriptions and inactive tools
    const now = new Date()
    return subscriptions
      .map((sub: any) => ({
        ...sub,
        tool: sub.tools
      }))
      .filter((sub: any) => {
        if (!sub.tool || !sub.tool.is_active) return false
        
        if (sub.expires_at) {
          const expiryDate = new Date(sub.expires_at)
          return expiryDate >= now
        }
        
        return true
      }) as UserSubscription[]
  } catch (error) {
    console.error('Error fetching user subscriptions:', error)
    return []
  }
}

/**
 * Route patterns that require specific tool subscriptions
 */
export const PROTECTED_ROUTES: Record<string, string> = {
  '/app/invoice-reconciler': 'invoice-reconciler',
  // Add more routes and their required tool slugs here as needed
}

/**
 * Determines if a route requires subscription validation
 */
export function isProtectedRoute(pathname: string): boolean {
  // Check if it's a specific protected route
  if (PROTECTED_ROUTES[pathname]) {
    return true
  }
  
  // Check if it's a nested route under a protected path
  for (const protectedPath of Object.keys(PROTECTED_ROUTES)) {
    if (pathname.startsWith(protectedPath + '/')) {
      return true
    }
  }
  
  return false
}

/**
 * Gets the required tool slug for a protected route
 */
export function getRequiredToolSlug(pathname: string): string | null {
  // Direct match
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname]
  }
  
  // Find parent route for nested paths
  for (const [protectedPath, toolSlug] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(protectedPath + '/')) {
      return toolSlug
    }
  }
  
  return null
} 