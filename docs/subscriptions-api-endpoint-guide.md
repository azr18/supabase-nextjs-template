# Subscriptions API Endpoint Guide

## Overview

The `/api/subscriptions` endpoint provides authenticated access to user tool subscription information. This API endpoint allows frontend applications to check subscription status and retrieve subscription details for the current user.

## Endpoint Information

- **URL**: `GET /api/subscriptions`
- **Authentication**: Required (Bearer token)
- **Content Type**: `application/json`

## Authentication

All requests must include an `Authorization` header with a valid Bearer token:

```javascript
const response = await fetch('/api/subscriptions', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});
```

## Usage Patterns

### 1. Get All User Subscriptions

Retrieve all active subscriptions for the authenticated user:

```javascript
// Request
GET /api/subscriptions

// Response
{
  "subscriptions": [
    {
      "id": "sub_123",
      "user_id": "user_456",
      "tool_id": "tool_789",
      "status": "active",
      "started_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-12-31T23:59:59Z",
      "tool": {
        "id": "tool_789",
        "name": "Invoice Reconciler",
        "slug": "invoice-reconciler",
        "is_active": true
      }
    }
  ],
  "totalCount": 1
}
```

### 2. Check Specific Tool Access

Check if the user has access to a specific tool:

```javascript
// Request
GET /api/subscriptions?tool=invoice-reconciler

// Response (Has Access)
{
  "hasAccess": true,
  "subscription": {
    "id": "sub_123",
    "user_id": "user_456",
    "tool_id": "tool_789",
    "status": "active",
    "started_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z",
    "tool": {
      "id": "tool_789",
      "name": "Invoice Reconciler",
      "slug": "invoice-reconciler",
      "is_active": true
    }
  }
}

// Response (No Access)
{
  "hasAccess": false,
  "subscription": null,
  "reason": "No active subscription found"
}
```

## Response Formats

### Subscription Object Structure

```typescript
interface UserSubscription {
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
```

### All Subscriptions Response

```typescript
interface SubscriptionResponse {
  subscriptions: UserSubscription[]
  totalCount: number
}
```

### Tool Access Check Response

```typescript
interface ToolCheckResponse {
  hasAccess: boolean
  subscription: UserSubscription | null
  reason?: string
}
```

## Error Handling

### Authentication Errors

```javascript
// HTTP 401 Unauthorized
{
  "error": "Authentication required"
}
```

### Server Errors

```javascript
// HTTP 500 Internal Server Error
{
  "error": "Internal server error"
}
```

## Implementation Examples

### React Hook for Subscription Management

```javascript
import { useState, useEffect } from 'react';
import { createSSRClient } from '@/lib/supabase/server';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const supabase = await createSSRClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch('/api/subscriptions', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions');
        }

        const data = await response.json();
        setSubscriptions(data.subscriptions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  return { subscriptions, loading, error };
}
```

### Tool Access Verification

```javascript
export async function checkToolAccess(toolSlug) {
  try {
    const supabase = await createSSRClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { hasAccess: false, reason: 'Not authenticated' };
    }

    const response = await fetch(`/api/subscriptions?tool=${toolSlug}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check tool access');
    }

    return await response.json();
  } catch (error) {
    return { hasAccess: false, reason: error.message };
  }
}
```

### Dashboard Integration

```javascript
export default function Dashboard() {
  const { subscriptions, loading, error } = useSubscriptions();

  if (loading) return <div>Loading subscriptions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h2>My Tools</h2>
      {subscriptions.length === 0 ? (
        <p>No active subscriptions found.</p>
      ) : (
        <div className="tools-grid">
          {subscriptions.map((subscription) => (
            <ToolCard 
              key={subscription.id} 
              tool={subscription.tool}
              subscription={subscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## CORS Support

The endpoint supports CORS for web applications:

```javascript
// OPTIONS request returns appropriate CORS headers
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Security Features

- **Authentication Required**: All requests must include valid Bearer token
- **User Isolation**: Users can only access their own subscription data
- **RLS Integration**: Leverages Supabase Row Level Security policies
- **Input Validation**: Tool slug parameters are validated
- **Error Handling**: Secure error messages that don't expose system details

## Integration with Existing Systems

### Subscription Middleware Integration

The API endpoint leverages the existing subscription middleware utilities:

```javascript
import { 
  getUserActiveSubscriptions, 
  checkUserToolAccess 
} from '@/lib/auth/subscriptions';
```

### Database Schema Compatibility

Uses the existing database schema:
- `user_tool_subscriptions` table for subscription data
- `tools` table for tool information
- Proper foreign key relationships and RLS policies

## Performance Considerations

- **Efficient Queries**: Uses optimized Supabase queries with proper indexing
- **Caching**: Frontend can cache subscription data for improved UX
- **Rate Limiting**: Consider implementing rate limiting for production use

## Testing

The endpoint includes comprehensive integration tests covering:
- Authentication requirement enforcement
- All user subscriptions retrieval
- Specific tool access checking
- Non-existent tool handling
- CORS support verification
- Error response formatting

Run tests with:
```bash
node tests/integration/subscriptions-api.test.js
```

## Future Enhancements

Potential improvements for future versions:
- Subscription modification endpoints (POST/PUT/DELETE)
- Bulk subscription operations
- Subscription analytics and usage tracking
- WebSocket support for real-time subscription updates
- Advanced filtering and sorting options

## Related Documentation

- [Subscription Middleware Guide](subscription-middleware-guide.md)
- [Tool Access Control](../nextjs/src/lib/auth/README.md)
- [Database Schema](../supabase/migrations/)
- [Authentication Setup](../docs/google-oauth-setup.md) 