import { createSPAClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type ReconciliationJob = Database['public']['Tables']['reconciliation_jobs']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

export interface JobWithToolInfo extends ReconciliationJob {
  tool?: Tool | null;
}

/**
 * Fetch recent reconciliation jobs for a user with tool information
 * Uses Supabase MCP for optimized database operations
 */
export async function getRecentJobsForUser(
  userId: string, 
  limit: number = 10
): Promise<JobWithToolInfo[]> {
  const supabase = createSPAClient();
  
  try {
    // Get recent jobs for the user
    const { data: jobs, error: jobsError } = await supabase
      .from('reconciliation_jobs')
      .select(`
        *,
        tool:tools(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('Error fetching recent jobs:', jobsError);
      throw new Error('Failed to fetch recent jobs');
    }

    return jobs || [];
  } catch (error) {
    console.error('Error in getRecentJobsForUser:', error);
    throw error;
  }
}

/**
 * Get a specific job by ID for the authenticated user
 */
export async function getJobById(jobId: string, userId: string): Promise<JobWithToolInfo | null> {
  const supabase = createSPAClient();
  
  try {
    const { data: job, error: jobError } = await supabase
      .from('reconciliation_jobs')
      .select(`
        *,
        tool:tools(*)
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        // Job not found
        return null;
      }
      console.error('Error fetching job:', jobError);
      throw new Error('Failed to fetch job');
    }

    return job;
  } catch (error) {
    console.error('Error in getJobById:', error);
    throw error;
  }
}

/**
 * Get jobs by status for a user
 */
export async function getJobsByStatus(
  userId: string,
  status: string,
  limit: number = 20
): Promise<JobWithToolInfo[]> {
  const supabase = createSPAClient();
  
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from('reconciliation_jobs')
      .select(`
        *,
        tool:tools(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('Error fetching jobs by status:', jobsError);
      throw new Error('Failed to fetch jobs by status');
    }

    return jobs || [];
  } catch (error) {
    console.error('Error in getJobsByStatus:', error);
    throw error;
  }
}

/**
 * Get jobs by airline type for a user
 */
export async function getJobsByAirline(
  userId: string,
  airlineType: string,
  limit: number = 20
): Promise<JobWithToolInfo[]> {
  const supabase = createSPAClient();
  
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from('reconciliation_jobs')
      .select(`
        *,
        tool:tools(*)
      `)
      .eq('user_id', userId)
      .eq('airline_type', airlineType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('Error fetching jobs by airline:', jobsError);
      throw new Error('Failed to fetch jobs by airline');
    }

    return jobs || [];
  } catch (error) {
    console.error('Error in getJobsByAirline:', error);
    throw error;
  }
}

/**
 * Utility function to format job status for UI display
 */
export function getJobStatusInfo(status: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
  className?: string;
} {
  switch (status) {
    case 'completed':
      return {
        variant: 'default',
        label: 'Completed',
        className: 'bg-green-500 hover:bg-green-600'
      };
    case 'processing':
      return {
        variant: 'secondary',
        label: 'Processing',
        className: 'bg-blue-500 hover:bg-blue-600 text-white'
      };
    case 'pending':
      return {
        variant: 'outline',
        label: 'Pending',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      };
    case 'failed':
      return {
        variant: 'destructive',
        label: 'Failed'
      };
    case 'cancelled':
      return {
        variant: 'outline',
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-600'
      };
    default:
      return {
        variant: 'outline',
        label: status
      };
  }
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
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A';
  
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get relative time string for job timestamps
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
    return `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  // For older dates, show the actual date
  return date.toLocaleDateString();
} 