import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserActiveSubscriptions, checkUserToolAccess, UserSubscription, SubscriptionCheckResult } from '@/lib/auth/subscriptions';

interface SubscriptionResponse {
  subscriptions: UserSubscription[];
  totalCount: number;
}

interface ToolCheckResponse {
  hasAccess: boolean;
  subscription: UserSubscription | null;
  reason?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const toolSlug = searchParams.get('tool');

    // If specific tool is requested, check access for that tool
    if (toolSlug) {
      const accessResult: SubscriptionCheckResult = await checkUserToolAccess(
        supabase as any, // Type assertion for middleware client compatibility
        user.id,
        toolSlug
      );

      const response: ToolCheckResponse = {
        hasAccess: accessResult.hasAccess,
        subscription: accessResult.subscription,
        reason: accessResult.reason
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Otherwise, return all active subscriptions
    const subscriptions: UserSubscription[] = await getUserActiveSubscriptions(
      supabase as any, // Type assertion for middleware client compatibility
      user.id
    );

    const response: SubscriptionResponse = {
      subscriptions,
      totalCount: subscriptions.length
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('API error in subscriptions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 