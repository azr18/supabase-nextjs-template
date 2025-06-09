// Note: This is a conceptual test structure. Actual implementation requires
// a test environment setup with Next.js API route testing utilities,
// Supabase client mocking, and potentially DB seeding/mocking.

import { createClient } from '@/lib/supabase/server'; // Path to server client for mocking
import { GET } from '@/app/api/download/[jobId]/route'; // The route handler
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Mock Supabase client and its methods
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(), // Allows chaining .select().eq().single()
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    storage: {
      from: jest.fn().mockReturnThis(),
      createSignedUrl: jest.fn(),
    },
  }),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    // Mock basic cookie store methods if needed by createClient or auth helpers
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

const mockSupabase = createClient(); // Get the mocked instance

describe('GET /api/download/[jobId]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockJobId = 'job-flydubai-789';
  const mockReportPath = `user-${mockUser.id}/invoice-reconciler/jobs/${mockJobId}/flydubai_report.xlsx`;
  const mockReportFilename = 'flydubai_report.xlsx';

  // Helper to simulate a NextRequest
  const createMockRequest = (jobId: string) => {
    const url = new URL(`http://localhost/api/download/${jobId}`);
    return new NextRequest(url);
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default to returning a valid user for most tests
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('should return a download URL for a completed and owned job', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: mockJobId,
        user_id: mockUser.id,
        status: 'completed',
        report_storage_path: mockReportPath,
        report_filename: mockReportFilename,
      },
      error: null,
    });
    (mockSupabase.storage.createSignedUrl as jest.Mock).mockResolvedValueOnce({
      data: { signedUrl: 'https://supabase-signed-url.com/mock-path' },
      error: null,
    });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.downloadUrl).toBe('https://supabase-signed-url.com/mock-path');
    expect(mockSupabase.from).toHaveBeenCalledWith('reconciliation_jobs');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockJobId);
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('reports');
    expect(mockSupabase.storage.createSignedUrl).toHaveBeenCalledWith(
      mockReportPath,
      60, // expiresIn
      { download: mockReportFilename }
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null }, error: { message: 'Unauthorized' } });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('should return 403 if job is not owned by the user', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: mockJobId,
        user_id: 'another-user-id', // Different user
        status: 'completed',
        report_storage_path: mockReportPath,
      },
      error: null,
    });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Forbidden');
  });

  it('should return 404 if job is not found', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });

    const request = createMockRequest('non-existent-job-id');
    const response = await GET(request, { params: { jobId: 'non-existent-job-id' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('Not Found');
  });

  it('should return 400 if job status is not completed', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: mockJobId,
        user_id: mockUser.id,
        status: 'processing', // Not completed
        report_storage_path: mockReportPath,
      },
      error: null,
    });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Report is not ready');
  });

  it('should return 500 if job is completed but report_storage_path is missing', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: mockJobId,
        user_id: mockUser.id,
        status: 'completed',
        report_storage_path: null, // Missing path
      },
      error: null,
    });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Report file path is missing');
  });

 it('should return 500 if createSignedUrl fails', async () => {
    (mockSupabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: mockJobId,
        user_id: mockUser.id,
        status: 'completed',
        report_storage_path: mockReportPath,
        report_filename: mockReportFilename,
      },
      error: null,
    });
    (mockSupabase.storage.createSignedUrl as jest.Mock).mockResolvedValueOnce({
      data: null, // Simulate missing signedUrl data
      error: { message: 'Failed to create signed URL' },
    });

    const request = createMockRequest(mockJobId);
    const response = await GET(request, { params: { jobId: mockJobId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Could not generate download link');
  });

  it('should return 400 if jobId is not provided in params', async () => {
    // This scenario is harder to test directly as Next.js routing handles param presence.
    // However, the code has a check for !jobId, though params.jobId itself would be undefined
    // if the route structure allowed it. For this unit-like test, we can simulate it.
    const request = createMockRequest(''); // Empty jobId in path for conceptual test
    // The route handler receives params.jobId from the file system based routing.
    // To test the internal !jobId check, we'd call GET with params.jobId as undefined or empty.
    // Since NextRequest requires a full URL, direct simulation of missing path param is tricky here.
    // We'll test the handler's internal logic by passing an empty string jobId.
    const response = await GET(request, { params: { jobId: '' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Job ID is required');
  });

}); 