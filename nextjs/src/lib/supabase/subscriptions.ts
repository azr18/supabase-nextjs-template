import { createSPAClient } from './client'
import { createClient } from './server'
// import { Database, UserToolSubscription } from './types'
type UserToolSubscription = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tool_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  external_subscription_id: string | null;
  notes: string | null;
};
import { SupabaseClient } from '@supabase/supabase-js'

// Types for subscription checking results
export interface SubscriptionStatus {
  hasAccess: boolean
  status: 'active' | 'inactive' | 'trial' | 'suspended' | 'expired' | null
  subscription: UserToolSubscription | null
  timeRemaining?: {
    days: number
    isExpiring: boolean // true if expires within 7 days
    isTrialEnding: boolean // true if trial ends within 3 days
  } | null
  reason?: string
}

export interface ToolAccessSummary {
  toolId: string
  toolName: string
  toolSlug: string
  hasAccess: boolean
  subscriptionStatus: string | null
  expiresAt: string | null
  trialEndsAt: string | null
}

export interface UserSubscriptionSummary {
  totalTools: number
  activeSubscriptions: number
  trialSubscriptions: number
  expiredSubscriptions: number
  tools: ToolAccessSummary[]
}

/**
 * Core subscription checking utilities using Supabase MCP
 * Optimized for performance with minimal database queries
 */
export class SubscriptionManager {
  private supabase: SupabaseClient<any>

  constructor(supabase?: SupabaseClient<any>) {
    this.supabase = supabase || createSPAClient()
  }

  /**
   * Create instance for server-side operations
   */
  static async createServerInstance(): Promise<SubscriptionManager> {
    const serverClient = await createClient()
    return new SubscriptionManager(serverClient)
  }

  /**
   * Check if user has active access to a specific tool using database function
   * Utilizes the optimized user_has_active_tool_subscription function
   */
  async checkToolAccess(toolSlug: string, userId?: string): Promise<SubscriptionStatus> {
    try {
      // Use database function for optimized checking
      const { data, error } = await this.supabase.rpc('user_has_active_tool_subscription', {
        tool_slug: toolSlug
      })

      if (error) {
        console.error('Error checking tool access:', error)
        return {
          hasAccess: false,
          status: null,
          subscription: null,
          reason: 'Database error checking subscription'
        }
      }

      // If user has access, get detailed subscription info
      if (data) {
        const detailedStatus = await this.getDetailedSubscriptionStatus(toolSlug, userId)
        return detailedStatus
      }

      return {
        hasAccess: false,
        status: null,
        subscription: null,
        reason: 'No active subscription found'
      }
    } catch (error) {
      console.error('Error in checkToolAccess:', error)
      return {
        hasAccess: false,
        status: null,
        subscription: null,
        reason: 'Error checking tool access'
      }
    }
  }

  /**
   * Get detailed subscription status with time remaining calculations
   */
  async getDetailedSubscriptionStatus(toolSlug: string, userId?: string): Promise<SubscriptionStatus> {
    try {
      // Get user ID from auth if not provided
      if (!userId) {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser()
        if (authError || !user) {
          return {
            hasAccess: false,
            status: null,
            subscription: null,
            reason: 'User not authenticated'
          }
        }
        userId = user.id
      }

      // Get detailed subscription data with tool information
      const { data: subscriptionData, error } = await this.supabase
        .from('user_tool_subscriptions')
        .select(`
          *,
          tools (
            id,
            name,
            slug,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('tools.slug', toolSlug)
        .single()

      if (error || !subscriptionData) {
        return {
          hasAccess: false,
          status: null,
          subscription: null,
          reason: 'No subscription found'
        }
      }

      // Calculate time remaining and access status
      const now = new Date()
      const subscription = subscriptionData as UserToolSubscription
      let hasAccess = false
      let timeRemaining = null

      // Check different subscription statuses
      if (subscription.status === 'active') {
        if (subscription.expires_at) {
          const expiresAt = new Date(subscription.expires_at)
          hasAccess = expiresAt > now
          
          if (hasAccess) {
            const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            timeRemaining = {
              days: daysRemaining,
              isExpiring: daysRemaining <= 7,
              isTrialEnding: false
            }
          }
        } else {
          // No expiration date means lifetime subscription
          hasAccess = true
        }
      } else if (subscription.status === 'trial') {
        if (subscription.trial_ends_at) {
          const trialEndsAt = new Date(subscription.trial_ends_at)
          hasAccess = trialEndsAt > now
          
          if (hasAccess) {
            const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            timeRemaining = {
              days: daysRemaining,
              isExpiring: false,
              isTrialEnding: daysRemaining <= 3
            }
          }
        } else {
          hasAccess = true
        }
      }

      return {
        hasAccess,
        status: subscription.status as SubscriptionStatus['status'],
        subscription,
        timeRemaining,
        reason: hasAccess ? undefined : 'Subscription expired or inactive'
      }
    } catch (error) {
      console.error('Error getting detailed subscription status:', error)
      return {
        hasAccess: false,
        status: null,
        subscription: null,
        reason: 'Error retrieving subscription details'
      }
    }
  }

  /**
   * Get all user subscriptions with access status using database function
   * Optimized query using the get_user_active_tools function
   */
  async getUserSubscriptionSummary(userId?: string): Promise<UserSubscriptionSummary> {
    try {
      // Get user ID from auth if not provided
      if (!userId) {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser()
        if (authError || !user) {
          return {
            totalTools: 0,
            activeSubscriptions: 0,
            trialSubscriptions: 0,
            expiredSubscriptions: 0,
            tools: []
          }
        }
        userId = user.id
      }

      // Use database function to get active tools efficiently
      const { data: activeTools, error: activeError } = await this.supabase.rpc('get_user_active_tools')

      // Get all user subscriptions for comprehensive summary
      const { data: allSubscriptions, error: allError } = await this.supabase
        .from('user_tool_subscriptions')
        .select(`
          *,
          tools (
            id,
            name,
            slug,
            status
          )
        `)
        .eq('user_id', userId)

      if (activeError && allError) {
        console.error('Error fetching subscription summary:', { activeError, allError })
        return {
          totalTools: 0,
          activeSubscriptions: 0,
          trialSubscriptions: 0,
          expiredSubscriptions: 0,
          tools: []
        }
      }

      const subscriptions = allSubscriptions || []
      const now = new Date()

      // Process all subscriptions to create summary
      let activeCount = 0
      let trialCount = 0
      let expiredCount = 0

      const tools: ToolAccessSummary[] = subscriptions.map((sub: any) => {
        let hasAccess = false
        
        if (sub.status === 'active') {
          if (sub.expires_at) {
            hasAccess = new Date(sub.expires_at) > now
          } else {
            hasAccess = true
          }
          if (hasAccess) activeCount++
        } else if (sub.status === 'trial') {
          if (sub.trial_ends_at) {
            hasAccess = new Date(sub.trial_ends_at) > now
          } else {
            hasAccess = true
          }
          if (hasAccess) trialCount++
        }

        if (!hasAccess && (sub.status === 'expired' || sub.status === 'inactive')) {
          expiredCount++
        }

        return {
          toolId: sub.tool_id,
          toolName: sub.tools?.name || 'Unknown Tool',
          toolSlug: sub.tools?.slug || '',
          hasAccess,
          subscriptionStatus: sub.status,
          expiresAt: sub.expires_at,
          trialEndsAt: sub.trial_ends_at
        }
      })

      return {
        totalTools: subscriptions.length,
        activeSubscriptions: activeCount,
        trialSubscriptions: trialCount,
        expiredSubscriptions: expiredCount,
        tools
      }
    } catch (error) {
      console.error('Error getting user subscription summary:', error)
      return {
        totalTools: 0,
        activeSubscriptions: 0,
        trialSubscriptions: 0,
        expiredSubscriptions: 0,
        tools: []
      }
    }
  }

  /**
   * Check if user has any active subscriptions using database function
   */
  async hasAnyActiveSubscription(userId?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('user_has_any_active_subscription')

      if (error) {
        console.error('Error checking active subscriptions:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in hasAnyActiveSubscription:', error)
      return false
    }
  }

  /**
   * Batch check multiple tools for user access
   * Optimized for dashboard and navigation components
   */
  async batchCheckToolAccess(toolSlugs: string[], userId?: string): Promise<Record<string, SubscriptionStatus>> {
    const results: Record<string, SubscriptionStatus> = {}

    // Use Promise.all for concurrent checking
    const checks = toolSlugs.map(async (slug) => {
      const status = await this.checkToolAccess(slug, userId)
      return { slug, status }
    })

    const checkResults = await Promise.all(checks)
    
    checkResults.forEach(({ slug, status }) => {
      results[slug] = status
    })

    return results
  }

  /**
   * Validate subscription for middleware and route protection
   * Returns boolean for quick route protection decisions
   */
  async validateToolAccessForRoute(toolSlug: string, userId?: string): Promise<boolean> {
    try {
      const status = await this.checkToolAccess(toolSlug, userId)
      return status.hasAccess
    } catch (error) {
      console.error('Error validating tool access for route:', error)
      return false
    }
  }

  /**
   * Get subscription expiration warnings
   * Useful for dashboard notifications
   */
  async getSubscriptionWarnings(userId?: string): Promise<{
    expiring: ToolAccessSummary[]
    trialEnding: ToolAccessSummary[]
  }> {
    try {
      const summary = await this.getUserSubscriptionSummary(userId)
      const now = new Date()
      
      const expiring: ToolAccessSummary[] = []
      const trialEnding: ToolAccessSummary[] = []

      summary.tools.forEach(tool => {
        if (tool.hasAccess) {
          // Check for expiring subscriptions (within 7 days)
          if (tool.expiresAt) {
            const expiresAt = new Date(tool.expiresAt)
            const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              expiring.push(tool)
            }
          }

          // Check for ending trials (within 3 days)
          if (tool.trialEndsAt) {
            const trialEndsAt = new Date(tool.trialEndsAt)
            const daysUntilTrialEnd = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (daysUntilTrialEnd <= 3 && daysUntilTrialEnd > 0) {
              trialEnding.push(tool)
            }
          }
        }
      })

      return { expiring, trialEnding }
    } catch (error) {
      console.error('Error getting subscription warnings:', error)
      return { expiring: [], trialEnding: [] }
    }
  }
}

/**
 * Convenience functions for common use cases
 */

// Create default instance for client-side use
export const subscriptionManager = new SubscriptionManager()

// Quick access functions
export const checkToolAccess = (toolSlug: string, userId?: string) => 
  subscriptionManager.checkToolAccess(toolSlug, userId)

export const hasAnyActiveSubscription = (userId?: string) => 
  subscriptionManager.hasAnyActiveSubscription(userId)

export const getUserSubscriptionSummary = (userId?: string) => 
  subscriptionManager.getUserSubscriptionSummary(userId)

export const validateToolAccessForRoute = (toolSlug: string, userId?: string) => 
  subscriptionManager.validateToolAccessForRoute(toolSlug, userId)

export const batchCheckToolAccess = (toolSlugs: string[], userId?: string) => 
  subscriptionManager.batchCheckToolAccess(toolSlugs, userId)

export const getSubscriptionWarnings = (userId?: string) => 
  subscriptionManager.getSubscriptionWarnings(userId)

/**
 * Server-side utility functions for middleware and API routes
 */
export const createServerSubscriptionManager = async () => await SubscriptionManager.createServerInstance() 