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

// Type that matches what we actually get from the query
export interface JobWithToolInfo {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tool_id: string;
  airline_type: string;
  job_name: string;
  description: string | null;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  actual_duration_minutes: number | null;
  estimated_duration_minutes: number | null;
  error_message: string | null;
  error_details: unknown | null;
  result_summary: unknown | null;
  processing_metadata: unknown | null;
  invoice_file_id: string | null;
  invoice_file_path: string | null;
  report_file_id: string | null;
  report_file_path: string | null;
  result_file_path: string | null;
  // N8N fields - making them optional for now since they might not exist in current types
  webhook_payload?: unknown | null;
  webhook_triggered_at?: string | null;
  callback_url?: string | null;
  expires_at?: string | null;
  n8n_workflow_id?: string | null;
  n8n_execution_id?: string | null;
  n8n_response_received_at?: string | null;
  // Joined tool data
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
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
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
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
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
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
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
  const sassClient = await createSPASassClient();
  const supabase = sassClient.getSupabaseClient();
  
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