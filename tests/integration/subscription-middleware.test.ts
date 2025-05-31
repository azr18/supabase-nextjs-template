import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { 
  createSubscriptionMiddleware,
  validateToolAccess,
  createToolMiddleware,
  validateMultiToolAccess,
  type SubscriptionMiddlewareOptions
} from '@/lib/auth/subscription-middleware'

// Mock the subscription utilities
jest.mock('@/lib/auth/subscriptions', () => ({
  createMiddlewareSupabaseClient: jest.fn(),
  checkUserToolAccess: jest.fn(),
  isProtectedRoute: jest.fn(),
  getRequiredToolSlug: jest.fn(),
}))

// Import mocked functions
import {
  createMiddlewareSupabaseClient,
  checkUserToolAccess,
  isProtectedRoute,
  getRequiredToolSlug,
} from '@/lib/auth/subscriptions'

const mockCreateMiddlewareSupabaseClient = createMiddlewareSupabaseClient as jest.MockedFunction<typeof createMiddlewareSupabaseClient>
const mockCheckUserToolAccess = checkUserToolAccess as jest.MockedFunction<typeof checkUserToolAccess>
const mockIsProtectedRoute = isProtectedRoute as jest.MockedFunction<typeof isProtectedRoute>
const mockGetRequiredToolSlug = getRequiredToolSlug as jest.MockedFunction<typeof getRequiredToolSlug>

describe('Subscription Validation Middleware', () => {
  let mockRequest: NextRequest
  let mockContinueResponse: NextResponse
  let mockSupabaseClient: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Create mock request
    mockRequest = new NextRequest(new URL('http://localhost:3000/app/invoice-reconciler'))
    
    // Create mock continue response
    mockContinueResponse = NextResponse.next()
    
    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      }
    }
    
    mockCreateMiddlewareSupabaseClient.mockReturnValue(mockSupabaseClient)
  })

  describe('createSubscriptionMiddleware', () => {
    it('should allow access to non-protected routes', async () => {
      mockIsProtectedRoute.mockReturnValue(false)
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.response).toBe(mockContinueResponse)
      expect(mockCheckUserToolAccess).not.toHaveBeenCalled()
    })

    it('should redirect unauthenticated users to login', async () => {
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
      expect(result.response.status).toBe(307) // Redirect status
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.pathname).toBe('/auth/login')
      expect(redirectUrl.searchParams.get('redirectTo')).toBe('/app/invoice-reconciler')
    })

    it('should allow access for users with active subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: {
          id: 'sub-123',
          user_id: 'user-123',
          tool_id: 'tool-123',
          status: 'active',
          started_at: '2024-01-01',
          expires_at: null,
          tool: {
            id: 'tool-123',
            name: 'Invoice Reconciler',
            slug: 'invoice-reconciler',
            is_active: true
          }
        }
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
      expect(result.response).toBe(mockContinueResponse)
      expect(result.subscription).toBeDefined()
    })

    it('should redirect users without active subscriptions', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
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
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.pathname).toBe('/app')
      expect(redirectUrl.searchParams.get('error')).toBe('no_subscription')
      expect(redirectUrl.searchParams.get('tool')).toBe('invoice-reconciler')
    })

    it('should handle expired subscriptions with specific error', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'Subscription has expired'
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('error')).toBe('subscription_expired')
    })

    it('should handle inactive tools with specific error', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
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
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('error')).toBe('tool_inactive')
    })

    it('should use custom redirect URLs when provided', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      const options: SubscriptionMiddlewareOptions = {
        loginRedirect: '/custom-login',
        unauthorizedRedirect: '/custom-unauthorized'
      }
      
      const middleware = createSubscriptionMiddleware(options)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.pathname).toBe('/custom-login')
    })

    it('should handle system errors gracefully', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Database connection failed'))
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('System error during access validation')
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.pathname).toBe('/app')
      expect(redirectUrl.searchParams.get('error')).toBe('system_error')
    })

    it('should respect includeErrorDetails option', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const middleware = createSubscriptionMiddleware({
        includeErrorDetails: false
      })
      const result = await middleware(mockRequest, mockContinueResponse)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('reason')).toBeNull()
      expect(redirectUrl.searchParams.get('message')).toBeNull()
    })
  })

  describe('validateToolAccess', () => {
    it('should validate access to specific tool directly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: {
          id: 'sub-123',
          user_id: 'user-123',
          tool_id: 'tool-123',
          status: 'active',
          started_at: '2024-01-01',
          expires_at: null,
          tool: {
            id: 'tool-123',
            name: 'Invoice Reconciler',
            slug: 'invoice-reconciler',
            is_active: true
          }
        }
      })
      
      const result = await validateToolAccess(
        mockRequest,
        mockContinueResponse,
        'invoice-reconciler'
      )
      
      expect(result.hasAccess).toBe(true)
      expect(result.subscription).toBeDefined()
      expect(mockCheckUserToolAccess).toHaveBeenCalledWith(
        mockSupabaseClient,
        'user-123',
        'invoice-reconciler'
      )
    })
  })

  describe('createToolMiddleware', () => {
    it('should create tool-specific middleware function', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: null
      })
      
      const toolMiddleware = createToolMiddleware('invoice-reconciler')
      const result = await toolMiddleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true)
    })
  })

  describe('validateMultiToolAccess', () => {
    it('should validate access to multiple tools', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      // Mock different access results for different tools
      mockCheckUserToolAccess
        .mockResolvedValueOnce({
          hasAccess: true,
          subscription: {
            id: 'sub-123',
            user_id: 'user-123',
            tool_id: 'tool-123',
            status: 'active',
            started_at: '2024-01-01',
            expires_at: null,
            tool: {
              id: 'tool-123',
              name: 'Invoice Reconciler',
              slug: 'invoice-reconciler',
              is_active: true
            }
          }
        })
        .mockResolvedValueOnce({
          hasAccess: false,
          subscription: null,
          reason: 'No active subscription found'
        })
      
      const result = await validateMultiToolAccess(
        mockRequest,
        ['invoice-reconciler', 'other-tool'],
        false // Don't require all tools
      )
      
      expect(result.hasAccess).toBe(true) // At least one tool is accessible
      expect(result.accessibleTools).toEqual(['invoice-reconciler'])
      expect(result.inaccessibleTools).toEqual(['other-tool'])
      expect(result.subscriptions).toHaveLength(1)
    })

    it('should require all tools when requireAll is true', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockCheckUserToolAccess
        .mockResolvedValueOnce({
          hasAccess: true,
          subscription: null
        })
        .mockResolvedValueOnce({
          hasAccess: false,
          subscription: null,
          reason: 'No active subscription found'
        })
      
      const result = await validateMultiToolAccess(
        mockRequest,
        ['invoice-reconciler', 'other-tool'],
        true // Require all tools
      )
      
      expect(result.hasAccess).toBe(false) // Not all tools are accessible
      expect(result.accessibleTools).toEqual(['invoice-reconciler'])
      expect(result.inaccessibleTools).toEqual(['other-tool'])
    })

    it('should handle unauthenticated users in multi-tool validation', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      const result = await validateMultiToolAccess(
        mockRequest,
        ['invoice-reconciler', 'other-tool']
      )
      
      expect(result.hasAccess).toBe(false)
      expect(result.accessibleTools).toEqual([])
      expect(result.inaccessibleTools).toEqual(['invoice-reconciler', 'other-tool'])
      expect(result.subscriptions).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('should handle missing tool slug gracefully', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue(null)
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(true) // Allow access if configuration is incorrect
      expect(result.response).toBe(mockContinueResponse)
    })

    it('should handle Supabase auth errors', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' }
      })
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Authentication required')
    })

    it('should handle subscription check errors', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockRejectedValue(new Error('Database error'))
      
      const middleware = createSubscriptionMiddleware()
      const result = await middleware(mockRequest, mockContinueResponse)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('System error during access validation')
    })
  })

  describe('Custom Configuration', () => {
    it('should use custom error messages', async () => {
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
      
      const customOptions: SubscriptionMiddlewareOptions = {
        errorMessages: {
          noSubscription: 'Custom subscription required message'
        }
      }
      
      const middleware = createSubscriptionMiddleware(customOptions)
      const result = await middleware(mockRequest, mockContinueResponse)
      
      const redirectUrl = new URL(result.response.headers.get('location') || '')
      expect(redirectUrl.searchParams.get('message')).toBe('Custom subscription required message')
    })

    it('should enable logging when configured', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      mockIsProtectedRoute.mockReturnValue(true)
      mockGetRequiredToolSlug.mockReturnValue('invoice-reconciler')
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      mockCheckUserToolAccess.mockResolvedValue({
        hasAccess: true,
        subscription: null
      })
      
      const middleware = createSubscriptionMiddleware({
        enableLogging: true
      })
      await middleware(mockRequest, mockContinueResponse)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SubscriptionMiddleware] Checking access for:')
      )
      
      consoleSpy.mockRestore()
    })
  })
}) 