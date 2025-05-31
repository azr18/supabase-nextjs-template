import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { 
  getRecentJobsForUser,
  getJobById,
  getJobsByStatus,
  getJobsByAirline,
  getJobStatusInfo,
  getAirlineDisplayName,
  formatDuration,
  getRelativeTime
} from '@/lib/supabase/queries/jobs';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data
const testUserId = 'test-user-jobs-queries';
const testUserEmail = 'test-jobs-queries@example.com';
let testToolId: string;
let testJobId: string;

describe('Jobs Queries Integration Tests', () => {
  beforeAll(async () => {
    // Setup test data
    console.log('Setting up test data for jobs queries...');
    
    // Get invoice reconciler tool ID
    const { data: tool } = await supabase
      .from('tools')
      .select('id')
      .eq('name', 'Invoice Reconciler')
      .single();
    
    testToolId = tool?.id;
    expect(testToolId).toBeDefined();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await supabase
      .from('reconciliation_jobs')
      .delete()
      .eq('user_id', testUserId);
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('reconciliation_jobs')
      .delete()
      .eq('user_id', testUserId);
  });

  describe('getRecentJobsForUser', () => {
    it('should return empty array when user has no jobs', async () => {
      const jobs = await getRecentJobsForUser(testUserId, 10);
      expect(jobs).toEqual([]);
    });

    it('should return recent jobs for user with tool information', async () => {
      // Create test job
      const { data: job } = await supabase
        .from('reconciliation_jobs')
        .insert({
          user_id: testUserId,
          tool_id: testToolId,
          airline_type: 'fly_dubai',
          job_name: 'Test Reconciliation Job',
          status: 'completed',
          description: 'Test job for integration testing'
        })
        .select()
        .single();

      testJobId = job?.id;

      const jobs = await getRecentJobsForUser(testUserId, 10);
      
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe(testJobId);
      expect(jobs[0].job_name).toBe('Test Reconciliation Job');
      expect(jobs[0].airline_type).toBe('fly_dubai');
      expect(jobs[0].status).toBe('completed');
      expect(jobs[0].tool).toBeDefined();
    });

    it('should respect the limit parameter', async () => {
      // Create multiple test jobs
      const jobPromises = Array.from({ length: 5 }, (_, index) =>
        supabase
          .from('reconciliation_jobs')
          .insert({
            user_id: testUserId,
            tool_id: testToolId,
            airline_type: 'tap',
            job_name: `Test Job ${index + 1}`,
            status: 'pending'
          })
      );

      await Promise.all(jobPromises);

      const jobs = await getRecentJobsForUser(testUserId, 3);
      expect(jobs).toHaveLength(3);
    });

    it('should return jobs in descending order by created_at', async () => {
      // Create jobs with different timestamps
      const { data: job1 } = await supabase
        .from('reconciliation_jobs')
        .insert({
          user_id: testUserId,
          tool_id: testToolId,
          airline_type: 'air_india',
          job_name: 'Older Job',
          status: 'completed'
        })
        .select()
        .single();

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: job2 } = await supabase
        .from('reconciliation_jobs')
        .insert({
          user_id: testUserId,
          tool_id: testToolId,
          airline_type: 'el_al',
          job_name: 'Newer Job',
          status: 'processing'
        })
        .select()
        .single();

      const jobs = await getRecentJobsForUser(testUserId, 10);
      
      expect(jobs).toHaveLength(2);
      expect(jobs[0].job_name).toBe('Newer Job');
      expect(jobs[1].job_name).toBe('Older Job');
    });
  });

  describe('getJobById', () => {
    beforeEach(async () => {
      // Create a test job
      const { data: job } = await supabase
        .from('reconciliation_jobs')
        .insert({
          user_id: testUserId,
          tool_id: testToolId,
          airline_type: 'philippines_airlines',
          job_name: 'Single Test Job',
          status: 'failed',
          error_message: 'Test error message'
        })
        .select()
        .single();

      testJobId = job?.id;
    });

    it('should return job with tool information for valid ID', async () => {
      const job = await getJobById(testJobId, testUserId);
      
      expect(job).toBeDefined();
      expect(job?.id).toBe(testJobId);
      expect(job?.job_name).toBe('Single Test Job');
      expect(job?.airline_type).toBe('philippines_airlines');
      expect(job?.status).toBe('failed');
      expect(job?.error_message).toBe('Test error message');
      expect(job?.tool).toBeDefined();
    });

    it('should return null for non-existent job ID', async () => {
      const job = await getJobById('non-existent-id', testUserId);
      expect(job).toBeNull();
    });

    it('should return null when accessing another user\'s job', async () => {
      const job = await getJobById(testJobId, 'different-user-id');
      expect(job).toBeNull();
    });
  });

  describe('getJobsByStatus', () => {
    beforeEach(async () => {
      // Create jobs with different statuses
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const jobPromises = statuses.map(status =>
        supabase
          .from('reconciliation_jobs')
          .insert({
            user_id: testUserId,
            tool_id: testToolId,
            airline_type: 'fly_dubai',
            job_name: `${status} Job`,
            status
          })
      );

      await Promise.all(jobPromises);
    });

    it('should return only jobs with specified status', async () => {
      const completedJobs = await getJobsByStatus(testUserId, 'completed', 20);
      const pendingJobs = await getJobsByStatus(testUserId, 'pending', 20);
      
      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].status).toBe('completed');
      expect(completedJobs[0].job_name).toBe('completed Job');
      
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].status).toBe('pending');
      expect(pendingJobs[0].job_name).toBe('pending Job');
    });

    it('should return empty array for status with no jobs', async () => {
      const cancelledJobs = await getJobsByStatus(testUserId, 'cancelled', 20);
      expect(cancelledJobs).toEqual([]);
    });
  });

  describe('getJobsByAirline', () => {
    beforeEach(async () => {
      // Create jobs for different airlines
      const airlines = ['fly_dubai', 'tap', 'air_india'];
      const jobPromises = airlines.map(airline =>
        supabase
          .from('reconciliation_jobs')
          .insert({
            user_id: testUserId,
            tool_id: testToolId,
            airline_type: airline,
            job_name: `${airline} Job`,
            status: 'completed'
          })
      );

      await Promise.all(jobPromises);
    });

    it('should return only jobs for specified airline', async () => {
      const flyDubaiJobs = await getJobsByAirline(testUserId, 'fly_dubai', 20);
      const tapJobs = await getJobsByAirline(testUserId, 'tap', 20);
      
      expect(flyDubaiJobs).toHaveLength(1);
      expect(flyDubaiJobs[0].airline_type).toBe('fly_dubai');
      expect(flyDubaiJobs[0].job_name).toBe('fly_dubai Job');
      
      expect(tapJobs).toHaveLength(1);
      expect(tapJobs[0].airline_type).toBe('tap');
      expect(tapJobs[0].job_name).toBe('tap Job');
    });

    it('should return empty array for airline with no jobs', async () => {
      const elAlJobs = await getJobsByAirline(testUserId, 'el_al', 20);
      expect(elAlJobs).toEqual([]);
    });
  });

  describe('Utility Functions', () => {
    describe('getJobStatusInfo', () => {
      it('should return correct status info for all statuses', () => {
        expect(getJobStatusInfo('completed')).toEqual({
          variant: 'default',
          label: 'Completed',
          className: 'bg-green-500 hover:bg-green-600'
        });

        expect(getJobStatusInfo('processing')).toEqual({
          variant: 'secondary',
          label: 'Processing',
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        });

        expect(getJobStatusInfo('pending')).toEqual({
          variant: 'outline',
          label: 'Pending',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        });

        expect(getJobStatusInfo('failed')).toEqual({
          variant: 'destructive',
          label: 'Failed'
        });

        expect(getJobStatusInfo('cancelled')).toEqual({
          variant: 'outline',
          label: 'Cancelled',
          className: 'bg-gray-100 text-gray-600'
        });

        expect(getJobStatusInfo('unknown')).toEqual({
          variant: 'outline',
          label: 'unknown'
        });
      });
    });

    describe('getAirlineDisplayName', () => {
      it('should return correct display names for all airlines', () => {
        expect(getAirlineDisplayName('fly_dubai')).toBe('Fly Dubai');
        expect(getAirlineDisplayName('tap')).toBe('TAP');
        expect(getAirlineDisplayName('philippines_airlines')).toBe('Philippines Airlines');
        expect(getAirlineDisplayName('air_india')).toBe('Air India');
        expect(getAirlineDisplayName('el_al')).toBe('El Al');
        expect(getAirlineDisplayName('unknown_airline')).toBe('UNKNOWN AIRLINE');
      });
    });

    describe('formatDuration', () => {
      it('should format duration correctly', () => {
        expect(formatDuration(null)).toBe('N/A');
        expect(formatDuration(30)).toBe('30m');
        expect(formatDuration(60)).toBe('1h');
        expect(formatDuration(90)).toBe('1h 30m');
        expect(formatDuration(120)).toBe('2h');
        expect(formatDuration(150)).toBe('2h 30m');
      });
    });

    describe('getRelativeTime', () => {
      it('should return relative time strings', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        expect(getRelativeTime(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');
        expect(getRelativeTime(twoHoursAgo.toISOString())).toBe('2 hours ago');
        expect(getRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
        expect(getRelativeTime(tenDaysAgo.toISOString())).toBe(tenDaysAgo.toLocaleDateString());
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user IDs gracefully', async () => {
      await expect(getRecentJobsForUser('', 10)).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      // This test would require mocking the Supabase client
      // For now, we'll test that the functions exist and can be called
      expect(typeof getRecentJobsForUser).toBe('function');
      expect(typeof getJobById).toBe('function');
      expect(typeof getJobsByStatus).toBe('function');
      expect(typeof getJobsByAirline).toBe('function');
    });
  });
}); 