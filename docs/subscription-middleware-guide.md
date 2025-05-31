# Subscription Validation Middleware Guide

## Overview

The subscription validation middleware system provides comprehensive access control for protected routes in the SaaS platform. It validates user authentication and subscription status before allowing access to specific tools, with flexible configuration options and detailed error handling.

## Architecture

### Core Components

1. **`subscription-middleware.ts`** - Main middleware factory and validation functions
2. **`subscriptions.ts`** - Utility functions for subscription checking and database operations
3. **`middleware.ts`** - Next.js middleware integration

### Key Features

- **Modular Design**: Composable middleware functions for different use cases
- **Flexible Configuration**: Customizable redirect URLs, error messages, and logging
- **Multi-Tool Support**: Validate access to single or multiple tools
- **Enhanced Error Handling**: Specific error types with detailed feedback
- **Development Logging**: Optional verbose logging for debugging

## Usage Patterns

### 1. Basic Route Protection

```typescript
import { createSubscriptionMiddleware } from '@/lib/auth/subscription-middleware'

// Create middleware with default configuration
const validateSubscription = createSubscriptionMiddleware()

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request)
  const result = await validateSubscription(request, sessionResponse)
  return result.response
}
```

### 2. Tool-Specific Validation

```typescript
import { validateToolAccess } from '@/lib/auth/subscription-middleware'

// Validate access to a specific tool
const result = await validateToolAccess(
  request,
  continueResponse,
  'invoice-reconciler'
)

if (result.hasAccess) {
  // User has access to the tool
  console.log('Subscription:', result.subscription)
} else {
  // Access denied
  console.log('Reason:', result.reason)
}
```

### 3. Custom Middleware Factory

```typescript
import { createToolMiddleware } from '@/lib/auth/subscription-middleware'

// Create tool-specific middleware
const invoiceReconcilerMiddleware = createToolMiddleware('invoice-reconciler', {
  unauthorizedRedirect: '/billing',
  errorMessages: {
    noSubscription: 'Please upgrade your plan to access the Invoice Reconciler'
  }
})

const result = await invoiceReconcilerMiddleware(request, continueResponse)
```

### 4. Multi-Tool Validation

```typescript
import { validateMultiToolAccess } from '@/lib/auth/subscription-middleware'

// Check access to multiple tools
const result = await validateMultiToolAccess(
  request,
  ['invoice-reconciler', 'expense-tracker'],
  false // Don't require all tools (OR logic)
)

console.log('Accessible tools:', result.accessibleTools)
console.log('Restricted tools:', result.inaccessibleTools)
```

## Configuration Options

### SubscriptionMiddlewareOptions

```typescript
interface SubscriptionMiddlewareOptions {
  // Redirect URLs
  unauthorizedRedirect?: string        // Default: '/app'
  loginRedirect?: string              // Default: '/auth/login'
  
  // Error handling
  includeErrorDetails?: boolean       // Default: true
  errorMessages?: {
    noSubscription?: string
    expired?: string
    toolInactive?: string
    accessDenied?: string
    systemError?: string
  }
  
  // Debugging
  enableLogging?: boolean            // Default: false
}
```

### Example Custom Configuration

```typescript
const customMiddleware = createSubscriptionMiddleware({
  unauthorizedRedirect: '/billing',
  loginRedirect: '/auth/signin',
  includeErrorDetails: true,
  errorMessages: {
    noSubscription: 'This feature requires a Pro subscription',
    expired: 'Your subscription has expired. Please renew to continue.',
    toolInactive: 'This tool is temporarily unavailable',
    accessDenied: 'You do not have permission to access this tool',
    systemError: 'Unable to verify access. Please try again.'
  },
  enableLogging: process.env.NODE_ENV === 'development'
})
```

## Error Types and Handling

### Error Types

1. **`authentication_required`** - User not logged in
2. **`no_subscription`** - No active subscription for the tool
3. **`subscription_expired`** - Subscription has expired
4. **`tool_inactive`** - Tool is currently inactive
5. **`access_denied`** - Generic access denial
6. **`system_error`** - Internal system error

### Error Parameters

When access is denied, the middleware redirects with query parameters:

```
/app?error=no_subscription&tool=invoice-reconciler&reason=No%20active%20subscription%20found&message=This%20tool%20requires%20an%20active%20subscription
```

### Handling Errors in Components

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function ErrorHandler() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const tool = searchParams.get('tool')
  const message = searchParams.get('message')
  
  useEffect(() => {
    if (error) {
      switch (error) {
        case 'no_subscription':
          // Show subscription upgrade dialog
          break
        case 'subscription_expired':
          // Show renewal prompt
          break
        case 'tool_inactive':
          // Show maintenance message
          break
        default:
          // Show generic error
      }
    }
  }, [error])
  
  return null
}
```

## Protected Routes Configuration

### Adding New Protected Routes

```typescript
// In subscriptions.ts
export const PROTECTED_ROUTES: Record<string, string> = {
  '/app/invoice-reconciler': 'invoice-reconciler',
  '/app/expense-tracker': 'expense-tracker',
  '/app/document-processor': 'document-processor',
  // Add new routes here
}
```

### Route Pattern Matching

The middleware supports:
- **Exact matches**: `/app/invoice-reconciler`
- **Nested paths**: `/app/invoice-reconciler/settings` (inherits protection)
- **Dynamic routes**: Automatically handled by pattern matching

## Integration with Components

### Dashboard Tool Cards

```typescript
import { validateToolAccess } from '@/lib/auth/subscription-middleware'

export async function ToolCard({ toolSlug }: { toolSlug: string }) {
  const request = useServerRequest() // Custom hook to get request
  const continueResponse = NextResponse.next()
  
  const accessResult = await validateToolAccess(
    request,
    continueResponse,
    toolSlug
  )
  
  return (
    <div className="tool-card">
      <h3>{toolSlug}</h3>
      {accessResult.hasAccess ? (
        <Link href={`/app/${toolSlug}`}>Open Tool</Link>
      ) : (
        <Button disabled>
          {accessResult.reason}
        </Button>
      )}
    </div>
  )
}
```

### API Route Protection

```typescript
// In API routes
import { validateToolAccess } from '@/lib/auth/subscription-middleware'

export async function POST(request: NextRequest) {
  const continueResponse = NextResponse.json({ success: true })
  
  const accessResult = await validateToolAccess(
    request,
    continueResponse,
    'invoice-reconciler'
  )
  
  if (!accessResult.hasAccess) {
    return NextResponse.json(
      { error: 'Access denied', reason: accessResult.reason },
      { status: 403 }
    )
  }
  
  // Process the request
  return NextResponse.json({ success: true })
}
```

## Testing

### Unit Testing

```typescript
import { createSubscriptionMiddleware } from '@/lib/auth/subscription-middleware'

describe('Subscription Middleware', () => {
  it('should allow access with valid subscription', async () => {
    // Mock authenticated user with subscription
    const middleware = createSubscriptionMiddleware()
    const result = await middleware(mockRequest, mockResponse)
    
    expect(result.hasAccess).toBe(true)
  })
  
  it('should deny access without subscription', async () => {
    // Mock authenticated user without subscription
    const middleware = createSubscriptionMiddleware()
    const result = await middleware(mockRequest, mockResponse)
    
    expect(result.hasAccess).toBe(false)
    expect(result.reason).toContain('subscription')
  })
})
```

### End-to-End Testing

```typescript
// Playwright tests
test('should redirect to billing page when subscription required', async ({ page }) => {
  await page.goto('/app/invoice-reconciler')
  
  // Should redirect to unauthorized page
  await expect(page).toHaveURL(/\/app\?error=no_subscription/)
  
  // Should show appropriate error message
  await expect(page.locator('[data-testid="subscription-error"]')).toBeVisible()
})
```

## Performance Considerations

### Caching

- Subscription checks are performed on each request
- Consider implementing Redis caching for subscription status
- Use database connection pooling for better performance

### Optimization Tips

1. **Lazy Loading**: Only check subscriptions for protected routes
2. **Batch Validation**: Use `validateMultiToolAccess` for multiple tools
3. **Error Boundaries**: Implement proper error handling in components
4. **Monitoring**: Enable logging in development for debugging

## Security Best Practices

### Row Level Security (RLS)

The middleware works in conjunction with database RLS policies:

```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own subscriptions"
ON user_tool_subscriptions
FOR ALL
USING (auth.uid() = user_id);
```

### Token Validation

- Always validate JWT tokens server-side
- Use secure cookie settings for session management
- Implement proper CSRF protection

### Access Control

- Never trust client-side subscription checks
- Always validate on the server
- Use principle of least privilege

## Troubleshooting

### Common Issues

1. **Infinite Redirects**
   - Check that login/unauthorized routes are not protected
   - Verify middleware matcher patterns

2. **Subscription Not Found**
   - Ensure user has active subscription in database
   - Check tool slug matches exactly
   - Verify RLS policies allow access

3. **Performance Issues**
   - Enable logging to identify bottlenecks
   - Consider caching subscription status
   - Optimize database queries

### Debug Mode

```typescript
const middleware = createSubscriptionMiddleware({
  enableLogging: true
})
```

This will output detailed logs:
```
[SubscriptionMiddleware] Checking access for: /app/invoice-reconciler
[SubscriptionMiddleware] Access check for user user-123, tool invoice-reconciler: { hasAccess: true, reason: undefined }
[SubscriptionMiddleware] Access granted for user user-123 to tool invoice-reconciler
```

## Migration Guide

### From Basic Auth to Subscription Middleware

1. **Update Route Protection**:
   ```typescript
   // Before
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) redirect('/auth/login')
   
   // After
   // Handled automatically by middleware
   ```

2. **Update Error Handling**:
   ```typescript
   // Before
   if (!hasSubscription) {
     return <div>Access denied</div>
   }
   
   // After
   const error = searchParams.get('error')
   if (error === 'no_subscription') {
     return <SubscriptionRequiredMessage />
   }
   ```

3. **Update API Routes**:
   ```typescript
   // Before
   const subscription = await checkSubscription(userId, toolSlug)
   if (!subscription) return Response.json({ error: 'No access' }, { status: 403 })
   
   // After
   const result = await validateToolAccess(request, response, toolSlug)
   if (!result.hasAccess) return result.response
   ```

## Future Enhancements

### Planned Features

1. **Role-Based Access Control (RBAC)**
2. **Feature-Level Permissions**
3. **Usage Quotas and Limits**
4. **Subscription Analytics**
5. **Real-time Subscription Updates**

### Extensibility

The middleware system is designed to be extensible:

- Add new error types in `SubscriptionMiddlewareOptions`
- Implement custom validation logic in `checkUserToolAccess`
- Extend with additional metadata in `SubscriptionCheckResult`

## Support

For issues related to subscription middleware:

1. Check the debug logs with `enableLogging: true`
2. Verify database RLS policies
3. Test subscription status in Supabase Studio
4. Review the integration tests for examples 