import { createSPASassClient } from '@/lib/supabase/client';

type Tool = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  order_index: number | null;
};

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

export interface ToolWithSubscription {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  order_index: number | null;
  subscription?: UserToolSubscription | null;
}

// Enhanced error types for better error handling
export enum ToolsQueryError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ToolsError extends Error {
  constructor(
    public code: ToolsQueryError,
    message: string,
    public details?: any,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ToolsError';
  }
}

// Helper function to classify and wrap errors
const handleQueryError = (error: any, operation: string): never => {
  console.error(`Tools query error in ${operation}:`, error);

  // Network/connectivity errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('network') || 
      error.code === 'NETWORK_ERROR') {
    throw new ToolsError(
      ToolsQueryError.NETWORK_ERROR,
      'Network connection failed',
      error,
      true
    );
  }

  // Authentication errors
  if (error.code === 'UNAUTHORIZED' || 
      error.status === 401 || 
      error.message?.includes('JWT') ||
      error.message?.includes('auth')) {
    throw new ToolsError(
      ToolsQueryError.AUTH_ERROR,
      'Authentication required',
      error,
      false
    );
  }

  // Permission errors
  if (error.code === 'FORBIDDEN' || error.status === 403) {
    throw new ToolsError(
      ToolsQueryError.PERMISSION_ERROR,
      'Access not authorized',
      error,
      false
    );
  }

  // Not found errors
  if (error.code === 'PGRST116' || error.status === 404) {
    throw new ToolsError(
      ToolsQueryError.NOT_FOUND,
      'Resource not found',
      error,
      false
    );
  }

  // Server errors
  if (error.status >= 500 || 
      error.code?.includes('PGRST') ||
      error.message?.includes('server')) {
    throw new ToolsError(
      ToolsQueryError.SERVER_ERROR,
      'Server temporarily unavailable',
      error,
      true
    );
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    throw new ToolsError(
      ToolsQueryError.TIMEOUT,
      'Request timed out',
      error,
      true
    );
  }

  // Default to unknown error
  throw new ToolsError(
    ToolsQueryError.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    error,
    true
  );
};

// Helper function to add timeout to queries
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ]);
};

/**
 * Fetch all tools with user subscription information
 * Uses Supabase MCP for optimized database operations
 */
export async function getToolsWithSubscriptions(userId: string): Promise<ToolWithSubscription[]> {
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
  try {
    // First, get all active tools
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .eq('status', 'active')
      .order('order_index', { ascending: true });

    if (toolsError) {
      console.error('Error fetching tools:', toolsError);
      throw new Error('Failed to fetch tools');
    }

    if (!tools || tools.length === 0) {
      return [];
    }

    // Get user subscriptions for these tools
    const toolIds = tools.map((tool: Tool) => tool.id);
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_tool_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('tool_id', toolIds);

    if (subscriptionsError) {
      console.error('Error fetching user subscriptions:', subscriptionsError);
      // Continue with tools only instead of failing completely
      return tools.map((tool: Tool) => ({
        ...tool,
        subscription: null,
      }));
    }

    // Create a map of tool_id to subscription for efficient lookup
    const subscriptionMap = new Map<string, UserToolSubscription>();
    subscriptions?.forEach((sub: UserToolSubscription) => {
      subscriptionMap.set(sub.tool_id, sub);
    });

    // Combine tools with their subscription data
    const toolsWithSubscriptions: ToolWithSubscription[] = tools.map((tool: Tool) => ({
      ...tool,
      subscription: subscriptionMap.get(tool.id) || null,
    }));

    return toolsWithSubscriptions;
  } catch (error) {
    console.error('Error in getToolsWithSubscriptions:', error);
    throw error;
  }
}

/**
 * Get a specific tool with subscription information
 */
export async function getToolWithSubscription(
  toolSlug: string, 
  userId: string
): Promise<ToolWithSubscription | null> {
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
  try {
    // Get the tool by slug
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', toolSlug)
      .eq('status', 'active')
      .single();

    if (toolError) {
      if (toolError.code === 'PGRST116') {
        // Tool not found
        return null;
      }
      console.error('Error fetching tool:', toolError);
      throw new Error('Failed to fetch tool');
    }

    // Get user subscription for this tool
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_tool_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_id', tool.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Error fetching user subscription:', subscriptionError);
      // Continue with tool only instead of failing
      return {
        ...tool,
        subscription: null,
      };
    }

    return {
      ...tool,
      subscription: subscription || null,
    };
  } catch (error) {
    console.error('Error in getToolWithSubscription:', error);
    throw error;
  }
}

/**
 * Check if user has active access to a tool
 */
export async function hasToolAccess(toolSlug: string, userId: string): Promise<boolean> {
  try {
    const toolWithSubscription = await getToolWithSubscription(toolSlug, userId);
    
    if (!toolWithSubscription || !toolWithSubscription.subscription) {
      return false;
    }

    const subscription = toolWithSubscription.subscription;
    const now = new Date();

    // Check if subscription is active or in trial
    if (subscription.status === 'active') {
      // Check expiration if present
      if (subscription.expires_at) {
        return new Date(subscription.expires_at) > now;
      }
      return true;
    }

    if (subscription.status === 'trial') {
      // Check trial expiration
      if (subscription.trial_ends_at) {
        return new Date(subscription.trial_ends_at) > now;
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking tool access:', error);
    return false;
  }
}

/**
 * Get user's subscription status for a specific tool
 */
export async function getToolSubscriptionStatus(
  toolSlug: string, 
  userId: string
): Promise<{
  hasAccess: boolean;
  status: string | null;
  subscription: UserToolSubscription | null;
}> {
  try {
    const toolWithSubscription = await getToolWithSubscription(toolSlug, userId);
    
    if (!toolWithSubscription) {
      return {
        hasAccess: false,
        status: null,
        subscription: null,
      };
    }

    const subscription = toolWithSubscription.subscription;
    
    if (!subscription) {
      return {
        hasAccess: false,
        status: null,
        subscription: null,
      };
    }

    const hasAccess = await hasToolAccess(toolSlug, userId);

    return {
      hasAccess,
      status: subscription.status,
      subscription,
    };
  } catch (error) {
    console.error('Error getting tool subscription status:', error);
    return {
      hasAccess: false,
      status: null,
      subscription: null,
    };
  }
}

/**
 * Retry helper for failed queries
 * Implements exponential backoff for retryable errors
 */
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-retryable errors
      if (error instanceof ToolsError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Health check for tools service
 * Useful for monitoring and debugging connection issues
 */
export async function checkToolsServiceHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const sassClient = await createSPASassClient();
    const supabase = sassClient.getSupabaseClient();
    
    // Simple query to check if service is responsive
    const { error } = await supabase.from('tools').select('id').limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        healthy: false,
        responseTime,
        error: error.message
      };
    }
    
    return {
      healthy: true,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 