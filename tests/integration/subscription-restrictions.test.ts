/**
 * Comprehensive test suite for subscription restrictions and access control
 * Tests the core subscription validation logic, middleware behavior, and API responses
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock the subscription utilities and middleware
const mockCreateMiddlewareSupabaseClient = jest.fn()
const mockCheckUserToolAccess = jest.fn()
const mockIsProtectedRoute = jest.fn()
const mockGetRequiredToolSlug = jest.fn()
const mockGetUserActiveSubscriptions = jest.fn()

jest.mock('../../nextjs/src/lib/auth/subscriptions', () => ({
  createMiddlewareSupabaseClient: mockCreateMiddlewareSupabaseClient,
  checkUserToolAccess: mockCheckUserToolAccess,
  isProtectedRoute: mockIsProtectedRoute,
  getRequiredToolSlug: mockGetRequiredToolSlug,
  getUserActiveSubscriptions: mockGetUserActiveSubscriptions,
  PROTECTED_ROUTES: {
    '/app/invoice-reconciler': 'invoice-reconciler'
  }
}))

import { 
  createSubscriptionMiddleware,
  validateToolAccess,
  createToolMiddleware
} from '../../nextjs/src/lib/auth/subscription-middleware'

import type { SubscriptionMiddlewareOptions } from '../../nextjs/src/lib/auth/subscription-middleware'

// Test data interfaces
interface MockUser {
  id: string
  email: string
}

interface MockSubscription {
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

// Mock data
const mockUsers: MockUser[] = [
  { id: 'user-active-123', email: 'active@test.com' },
  { id: 'user-inactive-123', email: 'inactive@test.com' },
  { id: 'user-trial-123', email: 'trial@test.com' },
  { id: 'user-expired-123', email: 'expired@test.com' },
  { id: 'user-no-sub-123', email: 'nosub@test.com' }
]

const mockTools = [
  {
    id: 'tool-invoice-reconciler',
    name: 'Invoice Reconciler',
    slug: 'invoice-reconciler',
    is_active: true
  },
  {
    id: 'tool-inactive',
    name: 'Inactive Tool',
    slug: 'inactive-tool',
    is_active: false
  }
]

const mockActiveSubscription: MockSubscription = {
  id: 'sub-active-123',
  user_id: 'user-active-123',
  tool_id: 'tool-invoice-reconciler',
  status: 'active',
  started_at: '2024-01-01T00:00:00Z',
  expires_at: null,
  tool: mockTools[0]
}

const mockTrialSubscription: MockSubscription = {
  id: 'sub-trial-123',
  user_id: 'user-trial-123',
  tool_id: 'tool-invoice-reconciler',
  status: 'trial',
  started_at: '2024-01-01T00:00:00Z',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  tool: mockTools[0]
}

const mockExpiredSubscription: MockSubscription = {
  id: 'sub-expired-123',
  user_id: 'user-expired-123',
  tool_id: 'tool-invoice-reconciler',
  status: 'active',
  started_at: '2024-01-01T00:00:00Z',
  expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  tool: mockTools[0]
}

describe('Subscription Restrictions and Access Control', () => {
  let mockRequest: any
  let mockContinueResponse: any
  let mockSupabaseClient: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Create mock request and response
    mockRequest = {
      nextUrl: { pathname: '/app/invoice-reconciler' },
      cookies: { getAll: jest.fn(() => []) }
    }
    
    mockContinueResponse = {
      status: 200,
      headers: new Map()
    }
    
    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      }
    }
    
    mockCreateMiddlewareSupabaseClient.mockReturnValue(mockSupabaseClient)
  })

  describe('Authentication Requirements', () => {
    it('should deny access to unauthenticated users', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Authentication required')
      expect(result.response.status).toBe(307) // Redirect
    })

    it('should handle authentication errors', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Authentication required')
    })
  })

  describe('Active Subscription Access Control', () => {
    it('should grant access to users with active subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[0] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: mockActiveSubscription
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.subscription).toEqual(mockActiveSubscription)
      expect(result.response).toBe(mockContinueResponse)
    })

    it('should handle trial subscriptions correctly', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[2] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: mockTrialSubscription
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.subscription?.status).toBe('trial')
    })
  })

  describe('Subscription Denial Scenarios', () => {
    it('should deny access to users with no subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[4] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('No active subscription found')
      expect(result.response.status).toBe(307)
    })

    it('should deny access to users with inactive subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[1] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('No active subscription found')
    })

    it('should deny access to users with expired subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[3] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: mockExpiredSubscription,
        reason: 'Subscription has expired'
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Subscription has expired')
    })

    it('should deny access to inactive tools even with active subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('inactive-tool')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[0] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'Tool is currently inactive'
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Tool is currently inactive')
    })
  })

  describe('Error Message Customization', () => {
    it('should use custom error messages when provided', async () => {
      const customOptions: SubscriptionMiddlewareOptions = {
        errorMessages: {
          noSubscription: 'Custom: Subscription required',
          expired: 'Custom: Subscription expired',
          toolInactive: 'Custom: Tool unavailable',
          accessDenied: 'Custom: Access denied'
        }
      }
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[4] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware(customOptions)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.response.status).toBe(307)
      
      // Check that redirect URL contains custom error message
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('error')).toBe('no_subscription')
    })

    it('should handle different error types with appropriate messages', async () => {
      const testCases = [
        {
          reason: 'No active subscription found',
          expectedErrorType: 'no_subscription'
        },
        {
          reason: 'Subscription has expired',
          expectedErrorType: 'subscription_expired'
        },
        {
          reason: 'Tool is currently inactive',
          expectedErrorType: 'tool_inactive'
        }
      ]

      for (const testCase of testCases) {
        mockIsProtectedRoute.mockReturnValue(true)
        mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUsers[0] },
          error: null
        })
        mockCheckUserToolAccess.mockResolvedValue({
          hasAccess: false,
          subscription: null,
          reason: testCase.reason
        })
        
        const middleware = createSubscriptionMiddleware()
        const result = await middleware(mockRequest, mockContinueResponse)
        
        expect(result.hasAccess).toBe(false)
        
        const redirectUrl = new URL(result.response.headers.get('location') || '')
        expect(redirectUrl.searchParams.get('error')).toBe(testCase.expectedErrorType)
      }
    })
  })

  describe('Tool-Specific Middleware', () => {
    it('should create tool-specific middleware correctly', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[0] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: mockActiveSubscription
      })
      
      const toolMiddleware = createToolMiddleware('invoice-reconciler')
      const result = await toolMiddleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(mockCheckUserToolAccess).toHaveBeenCalledWith(
        mockSupabaseClient,
        mockUsers[0].id,
        'invoice-reconciler'
      )
    })
  })

  describe('Non-Protected Routes', () => {
    it('should allow access to non-protected routes without checks', async () => {
      mockIsProtectedRoute.mockReturnValue(false)
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.response).toBe(mockContinueResponse)
      expect(mockCheckUserToolAccess).not.toHaveBeenCalled()
    })

    it('should handle routes with missing tool slugs gracefully', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue(null)
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.response).toBe(mockContinueResponse)
      expect(mockCheckUserToolAccess).not.toHaveBeenCalled()
    })
  })

  describe('Redirect URL Configuration', () => {
    it('should use custom redirect URLs when provided', async () => {
      const customOptions: SubscriptionMiddlewareOptions = {
        loginRedirect: '/custom-login',
        unauthorizedRedirect: '/custom-unauthorized'
      }
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      const middleware = createSubscriptionMiddleware(customOptions)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.pathname).toBe('/custom-login')
    })

    it('should include error details in redirect when enabled', async () => {
      const options: SubscriptionMiddlewareOptions = {
        includeErrorDetails: true
      }
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[4] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware(options)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('reason')).toBe('No active subscription found')
      expect(redirectUrl.searchParams.get('message')).toBeTruthy()
    })

    it('should exclude error details when disabled', async () => {
      const options: SubscriptionMiddlewareOptions = {
        includeErrorDetails: false
      }
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[4] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware(options)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('reason')).toBeNull()
      expect(redirectUrl.searchParams.get('message')).toBeNull()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle Supabase client creation errors', async () => {
      mockCreateMiddlewareSupabaseClient.mockImplementation(() => {
        throw new Error('Supabase client creation failed')
      })
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      
      const middleware = createSubscriptionMiddleware()
      
      // Should not throw error, should handle gracefully
      await expect(middleware(mockRequest, mockContinueResponse)).resolves.toBeDefined()
    })

    it('should handle subscription check errors gracefully', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[0] },
        error: null
      })
      mockCheckUserToolAccess.mockRejectedValue(new Error('Database connection failed'))
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.response.status).toBe(307)
    })
  })

  describe('Logging and Debugging', () => {
    it('should log subscription checks when enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const options: SubscriptionMiddlewareOptions = {
        enableLogging: true
      }
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUsers[0] },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: mockActiveSubscription
      })
      
      const middleware = createSubscriptionMiddleware(options)
      await middleware(mockRequest, mockContinueResponse)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SubscriptionMiddleware] Checking access for: /app/invoice-reconciler')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SubscriptionMiddleware] Access granted')
      )
      
      consoleSpy.mockRestore()
    })

    it('should not log when logging is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const options: SubscriptionMiddlewareOptions = {
        enableLogging: false
      }
      
      mockIsProtectedRoute.mockReturnValue(false)
      
      const middleware = createSubscriptionMiddleware(options)
      await middleware(mockRequest, mockContinueResponse)
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[SubscriptionMiddleware]')
      )
      
      consoleSpy.mockRestore()
    })
  })
}) 