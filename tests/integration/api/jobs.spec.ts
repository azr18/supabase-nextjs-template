import { test, expect } from '@playwright/test';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: async () => {},
  },
  from: (table: string) => mockSupabase.fromChain(table),
  fromChain: (table: string) => ({
    select: (columns = '*') => mockSupabase.selectChain(table, columns),
    insert: (values: any) => mockSupabase.insertChain(table, values),
    update: (values: any) => mockSupabase.updateChain(table, values),
    delete: () => mockSupabase.deleteChain(table),
  }),
  selectChain: (table: string, columns: string) => ({
    eq: (column: string, value: any) => mockSupabase.eqChain(table, columns, column, value),
    single: async () => {},
    order: (column: string, options: { ascending: boolean }) => mockSupabase.orderChain(table, columns, column, options),
  }),
  insertChain: async (table: string, values: any) => {},
  updateChain: (table: string, values: any) => ({
    eq: (column: string, value: any) => mockSupabase.updateEqChain(table, values, column, value),
  }),
  updateEqChain: async (table: string, values: any, column: string, value: any) => {},
  deleteChain: (table: string) => ({
    eq: (column: string, value: any) => mockSupabase.deleteEqChain(table, column, value),
  }),
  deleteEqChain: async (table: string, column: string, value: any) => {},
  eqChain: (table: string, columns: string, eqColumn: string, eqValue: any) => ({
    single: async () => {},
    order: (orderColumn: string, options: { ascending: boolean }) => mockSupabase.orderChain(table, columns, orderColumn, options, eqColumn, eqValue),
  }),
  orderChain: async (table: string, columns: string, orderColumn: string, options: { ascending: boolean }, eqColumn?: string, eqValue?: any) => {},
};

// Mock createRouteHandlerClient
let mockUser: any = null;
let mockJobData: any = null;
let mockJobsData: any[] = [];
let mockError: any = null;

// @ts-ignore

const mockUserUnauthenticated = {
  data: { user: null },
  error: { message: 'Unauthorized', status: 401 },
};

const mockUserAuthenticated = {
  data: { user: { id: 'test-user-id' } },
  error: null,
};

test.describe('API /api/jobs', () => {
  test.beforeEach(() => {
    // Reset mocks before each test
    mockUser = { ...mockUserAuthenticated }; // Default to authenticated
    mockJobData = null;
    mockJobsData = [];
    mockError = null;

    // @ts-ignore
    mockSupabase.auth.getUser = async () => mockUser;

    // @ts-ignore
    mockSupabase.fromChain = (table: string) => ({
      // @ts-ignore
      select: (columns = '*') => ({
        // @ts-ignore
        eq: (column: string, value: any) => ({
          // @ts-ignore
          single: async () => {
            if (mockError) return { data: null, error: mockError };
            if (table === 'reconciliation_jobs' && column === 'id' && value === mockJobData?.id && mockUser?.data?.user?.id === mockJobData?.user_id) {
              return { data: mockJobData, error: null };
            }
            if (table === 'reconciliation_jobs' && column === 'id' && value !== mockJobData?.id) {
              return { data: null, error: { code: 'PGRST116', message: 'Job not found'} }; // Simulate not found
            }
            return { data: null, error: { code: 'PGRST116', message: 'Job not found or access denied' } };
          },
          // @ts-ignore
          order: async (orderColumn: string, options: { ascending: boolean }) => {
            if (mockError) return { data: null, error: mockError };
            if (table === 'reconciliation_jobs' && column === 'user_id' && value === mockUser?.data?.user?.id) {
              return { data: mockJobsData, error: null };
            }
            return { data: [], error: null };
          },
        }),
      }),
    });

    // Mock the createRouteHandlerClient globally for these tests if possible, or pass mockSupabase to route handlers
    // This might require adjusting route handler to accept a Supabase client instance for testing.
    // For now, we assume the route handlers use a globally available or importable Supabase client that can be replaced.
    // Option: Use a library like `jest.mock` or `sinon` if available and configured for Playwright tests.
  });

  test.describe('GET /api/jobs/[jobId]', () => {
    test('should return 401 if user is not authenticated', async ({ request }) => {
      mockUser = { ...mockUserUnauthenticated };
      const response = await request.get('/api/jobs/some-job-id');
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return job details if found and user is authorized', async ({ request }) => {
      const jobId = 'job-123';
      mockJobData = { id: jobId, user_id: 'test-user-id', status: 'completed', file_name: 'report.xlsx' };
      const response = await request.get(`/api/jobs/${jobId}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(jobId);
      expect(body.status).toBe('completed');
    });

    test('should return 404 if job not found', async ({ request }) => {
      const response = await request.get('/api/jobs/non-existent-job-id');
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Job not found or access denied');
    });

    test('should return 404 if job belongs to another user', async ({ request }) => {
      mockJobData = { id: 'job-owned-by-another', user_id: 'another-user-id', status: 'processing' };
      // The mock is set up to return job not found if user_id doesn't match mockUser.data.user.id
      const response = await request.get('/api/jobs/job-owned-by-another');
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Job not found or access denied');
    });

    test('should return 500 if there is a database error fetching specific job', async ({ request }) => {
      mockError = { message: 'Database connection error', code: 'DB500' };
      const response = await request.get('/api/jobs/any-job-id');
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Error fetching job details');
      expect(body.details).toBe('Database connection error');
    });
  });

  test.describe('GET /api/jobs', () => {
    test('should return 401 if user is not authenticated', async ({ request }) => {
        mockUser = { ...mockUserUnauthenticated };
        const response = await request.get('/api/jobs');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('Unauthorized');
      });

    test('should return a list of jobs for the authenticated user', async ({ request }) => {
      mockJobsData = [
        { id: 'job-1', user_id: 'test-user-id', status: 'completed', created_at: '2023-01-01T12:00:00Z' },
        { id: 'job-2', user_id: 'test-user-id', status: 'processing', created_at: '2023-01-02T12:00:00Z' },
      ];
      const response = await request.get('/api/jobs');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('job-1'); // Assuming the mock returns them in the order provided for simplicity
      expect(body[1].id).toBe('job-2'); // Actual API should order by created_at desc
    });

    test('should return an empty list if the user has no jobs', async ({ request }) => {
      mockJobsData = [];
      const response = await request.get('/api/jobs');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(0);
    });

    test('should return 500 if there is a database error fetching all jobs', async ({ request }) => {
      mockError = { message: 'Failed to query database', code: 'DB501' };
      // Ensure the eq chain for user_id returns the error
       // @ts-ignore
      mockSupabase.fromChain = (table: string) => ({
         // @ts-ignore
        select: (columns = '*') => ({
           // @ts-ignore
          eq: (column: string, value: any) => ({
            // @ts-ignore
            single: async () => { /* ... as before ... */ },
            // @ts-ignore
            order: async (orderColumn: string, options: { ascending: boolean }) => {
              if (mockError && table === 'reconciliation_jobs' && column === 'user_id') {
                return { data: null, error: mockError };
              }
              return { data: mockJobsData, error: null };
            },
          }),
        }),
      });

      const response = await request.get('/api/jobs');
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Error fetching jobs');
      expect(body.details).toBe('Failed to query database');
    });
  });
});

// Note: Proper mocking of createRouteHandlerClient and its cookies dependency
// would typically involve using jest.mock or a similar mechanism if this were a Jest environment.
// For Playwright, if the Next.js server is run and APIs are hit directly, 
// you might need to use MSW (Mock Service Worker) or intercept network requests 
// to mock the Supabase client behavior at the network level, or ensure your test setup allows 
// for dependency injection into the route handlers.
// The current mock approach assumes that the `createRouteHandlerClient` can be influenced
// by replacing the `supabaseJs.createClient` it likely uses internally, or that route handlers
// can be modified to accept a Supabase client instance.
// The provided mockSupabase is a simplified in-memory mock. 