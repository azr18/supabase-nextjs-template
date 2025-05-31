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
    status: string
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
    // First, get the tool by slug
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('id, name, slug, status')
      .eq('slug', toolSlug)
      .eq('status', 'active')
      .single()

    if (toolError || !tool) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'Tool not found or inactive'
      }
    }

    // Then, check for user subscription to this tool
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_tool_subscriptions')
      .select('id, user_id, tool_id, status, started_at, expires_at')
      .eq('user_id', userId)
      .eq('tool_id', tool.id)
      .eq('status', 'active')
      .single()

    if (subscriptionError || !subscription) {
      return {
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
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
            tool: tool
          } as UserSubscription,
          reason: 'Subscription has expired'
        }
      }
    }

    return {
      hasAccess: true,
      subscription: {
        ...subscription,
        tool: tool
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
          status
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((sub: any) => ({
        ...sub,
        tool: sub.tools
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((sub: any) => {
        if (!sub.tool || sub.tool.status !== 'active') return false
        
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

  // Check if it's a dynamic tool route pattern
  const toolRoutePattern = /^\/app\/[^\/]+$/
  return toolRoutePattern.test(pathname)
}

/**
 * Gets the required tool slug for a protected route
 */
export function getRequiredToolSlug(pathname: string): string | null {
  // Check specific routes first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname]
  }

  // For dynamic routes like /app/tool-name, extract the tool slug
  const match = pathname.match(/^\/app\/([^\/]+)$/)
  if (match) {
    return match[1]
  }

  return null
} 