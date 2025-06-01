import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database, UserInvoicesByAirlineResult, SavedInvoice } from '@/lib/supabase/types';

// Enhanced error types for better error handling
export enum InvoicesQueryError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class InvoicesError extends Error {
  constructor(
    public code: InvoicesQueryError,
    message: string,
    public details?: any,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'InvoicesError';
  }
}

// Helper function to classify and wrap errors
const handleQueryError = (error: any, operation: string): never => {
  console.error(`Invoices query error in ${operation}:`, error);

  // Network/connectivity errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('network') || 
      error.code === 'NETWORK_ERROR') {
    throw new InvoicesError(
      InvoicesQueryError.NETWORK_ERROR,
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
    throw new InvoicesError(
      InvoicesQueryError.AUTH_ERROR,
      'Authentication required',
      error,
      false
    );
  }

  // Permission errors
  if (error.code === 'FORBIDDEN' || error.status === 403) {
    throw new InvoicesError(
      InvoicesQueryError.PERMISSION_ERROR,
      'Access not authorized',
      error,
      false
    );
  }

  // Not found errors
  if (error.code === 'PGRST116' || error.status === 404) {
    throw new InvoicesError(
      InvoicesQueryError.NOT_FOUND,
      'Resource not found',
      error,
      false
    );
  }

  // Server errors
  if (error.status >= 500 || 
      error.code?.includes('PGRST') ||
      error.message?.includes('server')) {
    throw new InvoicesError(
      InvoicesQueryError.SERVER_ERROR,
      'Server temporarily unavailable',
      error,
      true
    );
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    throw new InvoicesError(
      InvoicesQueryError.TIMEOUT,
      'Request timed out',
      error,
      true
    );
  }

  // Default to unknown error
  throw new InvoicesError(
    InvoicesQueryError.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    error,
    true
  );
};

/**
 * Fetch user invoices by airline type using Supabase MCP
 * Uses the database function get_user_invoices_by_airline for optimized queries with RLS
 */
export async function getUserInvoicesByAirline(
  airlineType?: string
): Promise<UserInvoicesByAirlineResult[]> {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_invoices_by_airline', {
      p_airline_type: airlineType || undefined
    });

    if (error) {
      handleQueryError(error, 'getUserInvoicesByAirline');
    }

    return data || [];
  } catch (error: any) {
    if (error instanceof InvoicesError) {
      throw error;
    }
    handleQueryError(error, 'getUserInvoicesByAirline');
    return [];
  }
}

/**
 * Fetch all user invoices across all airlines
 */
export async function getAllUserInvoices(): Promise<UserInvoicesByAirlineResult[]> {
  return getUserInvoicesByAirline();
}

/**
 * Get a specific saved invoice by ID (with ownership validation via RLS)
 */
export async function getSavedInvoiceById(invoiceId: string): Promise<SavedInvoice | null> {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { data: invoice, error } = await supabase
      .from('saved_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Invoice not found or user doesn't have access
        return null;
      }
      handleQueryError(error, 'getSavedInvoiceById');
    }

    return invoice;
  } catch (error: any) {
    if (error instanceof InvoicesError) {
      throw error;
    }
    handleQueryError(error, 'getSavedInvoiceById');
    return null;
  }
}

/**
 * Get invoices count by airline type for the current user
 */
export async function getInvoicesCountByAirline(): Promise<Record<string, number>> {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { data, error } = await supabase
      .from('saved_invoices')
      .select('airline_type')
      .eq('is_active', true);

    if (error) {
      handleQueryError(error, 'getInvoicesCountByAirline');
    }

    // Count invoices by airline type
    const counts: Record<string, number> = {};
    data?.forEach((invoice) => {
      counts[invoice.airline_type] = (counts[invoice.airline_type] || 0) + 1;
    });

    return counts;
  } catch (error: any) {
    if (error instanceof InvoicesError) {
      throw error;
    }
    handleQueryError(error, 'getInvoicesCountByAirline');
    return {};
  }
}

/**
 * Utility function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Utility function to format airline type for display
 */
export function getAirlineDisplayName(airlineType: string): string {
  switch (airlineType) {
    case 'fly_dubai':
      return 'Fly Dubai';
    case 'tap':
      return 'TAP';
    case 'philippines_airlines':
      return 'Philippines Airlines';
    case 'air_india':
      return 'Air India';
    case 'el_al':
      return 'El Al';
    default:
      return airlineType.replace(/_/g, ' ').toUpperCase();
  }
}

/**
 * Get relative time string for invoice timestamps
 */
export function getRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

/**
 * Check if an invoice filename appears to be a duplicate based on patterns
 * This is a client-side helper for UX, actual duplicate detection happens server-side
 */
export function isPotentialDuplicate(
  filename: string, 
  existingInvoices: UserInvoicesByAirlineResult[]
): boolean {
  const normalizedFilename = filename.toLowerCase();
  
  return existingInvoices.some(invoice => 
    invoice.original_filename.toLowerCase() === normalizedFilename
  );
}

/**
 * Get invoice usage statistics for display
 */
export function getInvoiceUsageInfo(invoice: UserInvoicesByAirlineResult): {
  label: string;
  className: string;
} {
  if (invoice.usage_count === 0) {
    return {
      label: 'Unused',
      className: 'bg-gray-100 text-gray-600'
    };
  } else if (invoice.usage_count === 1) {
    return {
      label: 'Used once',
      className: 'bg-blue-100 text-blue-700'
    };
  } else {
    return {
      label: `Used ${invoice.usage_count} times`,
      className: 'bg-green-100 text-green-700'
    };
  }
}

/**
 * Retry mechanism for query operations
 */
export async function retryInvoicesQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (error instanceof InvoicesError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
} 