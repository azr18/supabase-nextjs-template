import { type NextRequest, NextResponse } from 'next/server'
import { 
  createMiddlewareSupabaseClient,
  checkUserToolAccess,
  isProtectedRoute,
  getRequiredToolSlug,
  type UserSubscription
} from './subscriptions'

export interface SubscriptionMiddlewareOptions {
  /**
   * Custom redirect URL for unauthorized access
   * @default '/app'
   */
  unauthorizedRedirect?: string
  
  /**
   * Custom redirect URL for authentication required
   * @default '/auth/login'
   */
  loginRedirect?: string
  
  /**
   * Whether to include detailed error information in redirect
   * @default true
   */
  includeErrorDetails?: boolean
  
  /**
   * Custom error messages for different scenarios
   */
  errorMessages?: {
    noSubscription?: string
    expired?: string
    toolInactive?: string
    accessDenied?: string
    systemError?: string
  }
  
  /**
   * Whether to log subscription check results for debugging
   * @default false
   */
  enableLogging?: boolean
}

export interface SubscriptionMiddlewareResult {
  /**
   * The response to return (either redirect or continue)
   */
  response: NextResponse
  
  /**
   * Whether access was granted
   */
  hasAccess: boolean
  
  /**
   * User subscription information if access was granted
   */
  subscription?: UserSubscription | null
  
  /**
   * Reason for denial if access was not granted
   */
  reason?: string
}

/**
 * Default configuration for subscription middleware
 */
const DEFAULT_OPTIONS: Required<SubscriptionMiddlewareOptions> = {
  unauthorizedRedirect: '/app',
  loginRedirect: '/auth/login',
  includeErrorDetails: true,
  errorMessages: {
    noSubscription: 'This tool requires an active subscription',
    expired: 'Your subscription has expired',
    toolInactive: 'This tool is currently unavailable',
    accessDenied: 'Access denied to this tool',
    systemError: 'Unable to verify subscription access'
  },
  enableLogging: false
}

/**
 * Creates a subscription validation middleware function
 */
export function createSubscriptionMiddleware(options: SubscriptionMiddlewareOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  return async function validateSubscription(
    request: NextRequest,
    continueResponse: NextResponse
  ): Promise<SubscriptionMiddlewareResult> {
    const pathname = request.nextUrl.pathname
    
    if (config.enableLogging) {
      console.log(`[SubscriptionMiddleware] Checking access for: ${pathname}`)
    }
    
    // Skip validation for non-protected routes
    if (!isProtectedRoute(pathname)) {
      return {
        response: continueResponse,
        hasAccess: true
      }
    }
    
    const requiredToolSlug = getRequiredToolSlug(pathname)
    if (!requiredToolSlug) {
      console.error(`[SubscriptionMiddleware] Protected route ${pathname} has no associated tool slug`)
      return {
        response: continueResponse,
        hasAccess: true // Allow access if configuration is incorrect
      }
    }
    
    try {
      // Create Supabase client for subscription checking
      const supabase = createMiddlewareSupabaseClient(request)
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        if (config.enableLogging) {
          console.log(`[SubscriptionMiddleware] User not authenticated for ${pathname}`)
        }
        
        // User not authenticated - redirect to login
        const redirectUrl = createRedirectUrl(
          request,
          config.loginRedirect,
          {
            redirectTo: pathname,
            error: 'authentication_required',
            ...(config.includeErrorDetails && { message: 'Please log in to access this tool' })
          }
        )
        
        return {
          response: NextResponse.redirect(redirectUrl),
          hasAccess: false,
          reason: 'Authentication required'
        }
      }
      
      // Check subscription access
      const accessCheck = await checkUserToolAccess(supabase, user.id, requiredToolSlug)
      
      if (config.enableLogging) {
        console.log(`[SubscriptionMiddleware] Access check for user ${user.id}, tool ${requiredToolSlug}:`, {
          hasAccess: accessCheck.hasAccess,
          reason: accessCheck.reason
        })
      }
      
      if (!accessCheck.hasAccess) {
        // Determine specific error message based on reason
        let errorMessage = config.errorMessages.accessDenied
        let errorType = 'access_denied'
        
        if (accessCheck.reason?.includes('No active subscription')) {
          errorMessage = config.errorMessages.noSubscription
          errorType = 'no_subscription'
        } else if (accessCheck.reason?.includes('expired')) {
          errorMessage = config.errorMessages.expired
          errorType = 'subscription_expired'
        } else if (accessCheck.reason?.includes('inactive')) {
          errorMessage = config.errorMessages.toolInactive
          errorType = 'tool_inactive'
        }
        
        // User doesn't have access - redirect to unauthorized page
        const redirectUrl = createRedirectUrl(
          request,
          config.unauthorizedRedirect,
          {
            error: errorType,
            tool: requiredToolSlug,
            ...(config.includeErrorDetails && { 
              reason: accessCheck.reason || 'Access denied',
              message: errorMessage
            })
          }
        )
        
        return {
          response: NextResponse.redirect(redirectUrl),
          hasAccess: false,
          subscription: accessCheck.subscription,
          reason: accessCheck.reason
        }
      }
      
      // Access granted
      if (config.enableLogging) {
        console.log(`[SubscriptionMiddleware] Access granted for user ${user.id} to tool ${requiredToolSlug}`)
      }
      
      return {
        response: continueResponse,
        hasAccess: true,
        subscription: accessCheck.subscription
      }
      
    } catch (error) {
      console.error('[SubscriptionMiddleware] Error during subscription validation:', error)
      
      // On error, redirect to unauthorized page with system error
      const redirectUrl = createRedirectUrl(
        request,
        config.unauthorizedRedirect,
        {
          error: 'system_error',
          tool: requiredToolSlug,
          ...(config.includeErrorDetails && { 
            message: config.errorMessages.systemError
          })
        }
      )
      
      return {
        response: NextResponse.redirect(redirectUrl),
        hasAccess: false,
        reason: 'System error during access validation'
      }
    }
  }
}

/**
 * Middleware specifically for tool routes
 */
export async function validateToolAccess(
  request: NextRequest,
  continueResponse: NextResponse,
  toolSlug: string,
  options: SubscriptionMiddlewareOptions = {}
): Promise<SubscriptionMiddlewareResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  if (config.enableLogging) {
    console.log(`[ToolAccessMiddleware] Validating access to tool: ${toolSlug}`)
  }
  
  try {
    // Create Supabase client
    const supabase = createMiddlewareSupabaseClient(request)
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      const redirectUrl = createRedirectUrl(
        request,
        config.loginRedirect,
        {
          redirectTo: request.nextUrl.pathname,
          error: 'authentication_required',
          tool: toolSlug
        }
      )
      
      return {
        response: NextResponse.redirect(redirectUrl),
        hasAccess: false,
        reason: 'Authentication required'
      }
    }
    
    // Check tool access
    const accessCheck = await checkUserToolAccess(supabase, user.id, toolSlug)
    
    if (!accessCheck.hasAccess) {
      let errorMessage = config.errorMessages.accessDenied
      let errorType = 'access_denied'
      
      if (accessCheck.reason?.includes('No active subscription')) {
        errorMessage = config.errorMessages.noSubscription
        errorType = 'no_subscription'
      } else if (accessCheck.reason?.includes('expired')) {
        errorMessage = config.errorMessages.expired
        errorType = 'subscription_expired'
      } else if (accessCheck.reason?.includes('inactive')) {
        errorMessage = config.errorMessages.toolInactive
        errorType = 'tool_inactive'
      }
      
      const redirectUrl = createRedirectUrl(
        request,
        config.unauthorizedRedirect,
        {
          error: errorType,
          tool: toolSlug,
          ...(config.includeErrorDetails && { 
            reason: accessCheck.reason || 'Access denied',
            message: errorMessage
          })
        }
      )
      
      return {
        response: NextResponse.redirect(redirectUrl),
        hasAccess: false,
        subscription: accessCheck.subscription,
        reason: accessCheck.reason
      }
    }
    
    return {
      response: continueResponse,
      hasAccess: true,
      subscription: accessCheck.subscription
    }
    
  } catch (error) {
    console.error('[ToolAccessMiddleware] Error validating tool access:', error)
    
    const redirectUrl = createRedirectUrl(
      request,
      config.unauthorizedRedirect,
      {
        error: 'system_error',
        tool: toolSlug,
        ...(config.includeErrorDetails && { 
          message: config.errorMessages.systemError
        })
      }
    )
    
    return {
      response: NextResponse.redirect(redirectUrl),
      hasAccess: false,
      reason: 'System error during tool access validation'
    }
  }
}

/**
 * Helper function to create redirect URLs with query parameters
 */
function createRedirectUrl(
  request: NextRequest,
  basePath: string,
  params: Record<string, string>
): URL {
  const url = request.nextUrl.clone()
  url.pathname = basePath
  url.search = '' // Clear existing search params
  
  // Add new parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })
  
  return url
}

/**
 * Higher-order function to create route-specific middleware
 */
export function createToolMiddleware(
  toolSlug: string,
  options: SubscriptionMiddlewareOptions = {}
) {
  return async function(request: NextRequest, continueResponse: NextResponse) {
    return validateToolAccess(request, continueResponse, toolSlug, options)
  }
}

/**
 * Utility function to check if a user has access to multiple tools
 */
export async function validateMultiToolAccess(
  request: NextRequest,
  toolSlugs: string[],
  requireAll: boolean = false
): Promise<{
  hasAccess: boolean
  accessibleTools: string[]
  inaccessibleTools: string[]
  subscriptions: UserSubscription[]
}> {
  try {
    const supabase = createMiddlewareSupabaseClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        hasAccess: false,
        accessibleTools: [],
        inaccessibleTools: toolSlugs,
        subscriptions: []
      }
    }
    
    const results = await Promise.all(
      toolSlugs.map(async (toolSlug) => {
        const accessCheck = await checkUserToolAccess(supabase, user.id, toolSlug)
        return {
          toolSlug,
          ...accessCheck
        }
      })
    )
    
    const accessibleTools = results
      .filter(result => result.hasAccess)
      .map(result => result.toolSlug)
    
    const inaccessibleTools = results
      .filter(result => !result.hasAccess)
      .map(result => result.toolSlug)
    
    const subscriptions = results
      .filter(result => result.subscription)
      .map(result => result.subscription!)
    
    const hasAccess = requireAll 
      ? accessibleTools.length === toolSlugs.length
      : accessibleTools.length > 0
    
    return {
      hasAccess,
      accessibleTools,
      inaccessibleTools,
      subscriptions
    }
    
  } catch (error) {
    console.error('Error validating multi-tool access:', error)
    return {
      hasAccess: false,
      accessibleTools: [],
      inaccessibleTools: toolSlugs,
      subscriptions: []
    }
  }
} 