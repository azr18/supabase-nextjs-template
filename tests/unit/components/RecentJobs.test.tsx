import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecentJobs } from '@/components/Dashboard/RecentJobs';
import * as jobsQueries from '@/lib/supabase/queries/jobs';
import { createSPAClient } from '@/lib/supabase/client';

// Mock the dependencies
jest.mock('@/lib/supabase/queries/jobs');
jest.mock('@/lib/supabase/client');
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockJobsQueries = jobsQueries as jest.Mocked<typeof jobsQueries>;
const mockSupabaseClient = {
  storage: {
    from: jest.fn().mockReturnThis(),
    createSignedUrl: jest.fn()
  }
};

(createSPAClient as jest.Mock).mockReturnValue(mockSupabaseClient);

// Sample test data
const mockJobs = [
  {
    id: 'job-1',
    user_id: 'user-1',
    tool_id: 'tool-1',
    airline_type: 'fly_dubai',
    status: 'completed',
    job_name: 'Fly Dubai Reconciliation',
    description: 'Test reconciliation job',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-01T10:30:00Z',
    actual_duration_minutes: 30,
    result_file_path: 'user-1/jobs/job-1/result.xlsx',
    progress_percentage: 100,
    started_at: '2023-12-01T10:00:00Z',
    completed_at: '2023-12-01T10:30:00Z',
    failed_at: null,
    error_message: null,
    error_details: null,
    estimated_duration_minutes: null,
    invoice_file_id: null,
    invoice_file_path: null,
    report_file_id: null,
    report_file_path: null,
    processing_metadata: null,
    result_summary: null,
    tool: {
      id: 'tool-1',
      name: 'Invoice Reconciler',
      slug: 'invoice-reconciler',
      description: 'Reconcile invoices',
      icon: '📊',
      status: 'active',
      order_index: 1,
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2023-11-01T00:00:00Z'
    }
  },
  {
    id: 'job-2',
    user_id: 'user-1',
    tool_id: 'tool-1',
    airline_type: 'tap',
    status: 'processing',
    job_name: 'TAP Reconciliation',
    description: 'Processing TAP data',
    created_at: '2023-12-01T11:00:00Z',
    updated_at: '2023-12-01T11:15:00Z',
    actual_duration_minutes: null,
    result_file_path: null,
    progress_percentage: 75,
    started_at: '2023-12-01T11:00:00Z',
    completed_at: null,
    failed_at: null,
    error_message: null,
    error_details: null,
    estimated_duration_minutes: 45,
    invoice_file_id: null,
    invoice_file_path: null,
    report_file_id: null,
    report_file_path: null,
    processing_metadata: null,
    result_summary: null,
    tool: {
      id: 'tool-1',
      name: 'Invoice Reconciler',
      slug: 'invoice-reconciler',
      description: 'Reconcile invoices',
      icon: '📊',
      status: 'active',
      order_index: 1,
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2023-11-01T00:00:00Z'
    }
  },
  {
    id: 'job-3',
    user_id: 'user-1',
    tool_id: 'tool-1',
    airline_type: 'air_india',
    status: 'failed',
    job_name: 'Air India Reconciliation',
    description: 'Failed reconciliation',
    created_at: '2023-12-01T09:00:00Z',
    updated_at: '2023-12-01T09:05:00Z',
    actual_duration_minutes: 5,
    result_file_path: null,
    progress_percentage: 0,
    started_at: '2023-12-01T09:00:00Z',
    completed_at: null,
    failed_at: '2023-12-01T09:05:00Z',
    error_message: 'Invalid file format',
    error_details: null,
    estimated_duration_minutes: null,
    invoice_file_id: null,
    invoice_file_path: null,
    report_file_id: null,
    report_file_path: null,
    processing_metadata: null,
    result_summary: null,
    tool: {
      id: 'tool-1',
      name: 'Invoice Reconciler',
      slug: 'invoice-reconciler',
      description: 'Reconcile invoices',
      icon: '📊',
      status: 'active',
      order_index: 1,
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2023-11-01T00:00:00Z'
    }
  }
];

describe('RecentJobs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching jobs', () => {
      mockJobsQueries.getRecentJobsForUser.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<RecentJobs userId="user-1" />);

      expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
      
      // Check for loading skeleton animation
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when job fetching fails', async () => {
      mockJobsQueries.getRecentJobsForUser.mockRejectedValue(
        new Error('Failed to fetch jobs')
      );

      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load recent jobs')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should reload page when retry button is clicked', async () => {
      mockJobsQueries.getRecentJobsForUser.mockRejectedValue(
        new Error('Failed to fetch jobs')
      );

      // Mock window.location.reload
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      });

      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no jobs are found', async () => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue([]);

      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('No recent jobs found')).toBeInTheDocument();
      });

      expect(screen.getByText('Start using our tools to see your job history here')).toBeInTheDocument();
    });
  });

  describe('Jobs Display', () => {
    beforeEach(() => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);
    });

    it('should display jobs with correct information', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Fly Dubai Reconciliation')).toBeInTheDocument();
        expect(screen.getByText('TAP Reconciliation')).toBeInTheDocument();
        expect(screen.getByText('Air India Reconciliation')).toBeInTheDocument();
      });

      // Check airline names
      expect(screen.getByText('Fly Dubai')).toBeInTheDocument();
      expect(screen.getByText('TAP')).toBeInTheDocument();
      expect(screen.getByText('Air India')).toBeInTheDocument();
    });

    it('should display correct status badges', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });

    it('should display duration for completed jobs', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Duration: 30m')).toBeInTheDocument();
        expect(screen.getByText('Duration: 5m')).toBeInTheDocument();
      });
    });

    it('should show download button only for completed jobs with result files', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        const downloadButtons = screen.getAllByRole('button', { name: /download/i });
        expect(downloadButtons).toHaveLength(1);
      });
    });

    it('should show "Open Tool" links for all jobs', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        const openToolLinks = screen.getAllByText('Open Tool');
        expect(openToolLinks).toHaveLength(3);
      });
    });
  });

  describe('Download Functionality', () => {
    beforeEach(() => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);
      
      // Mock successful download URL creation
      mockSupabaseClient.storage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/download-url' },
        error: null
      });

      // Mock document.createElement and appendChild/removeChild
      const mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      jest.spyOn(mockLink, 'click').mockImplementation();
    });

    it('should handle download click and create signed URL', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download/i });
        fireEvent.click(downloadButton);
      });

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('invoice-reconciler');
      expect(mockSupabaseClient.storage.createSignedUrl).toHaveBeenCalledWith(
        'user-1/jobs/job-1/result.xlsx',
        60
      );
    });

    it('should handle download error gracefully', async () => {
      mockSupabaseClient.storage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'File not found' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download/i });
        fireEvent.click(downloadButton);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating download URL:',
        { message: 'File not found' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('View All Jobs Link', () => {
    it('should show "View All Jobs" link when jobs count equals limit', async () => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);

      render(<RecentJobs userId="user-1" limit={3} />);

      await waitFor(() => {
        expect(screen.getByText('View All Jobs')).toBeInTheDocument();
      });

      const viewAllLink = screen.getByText('View All Jobs').closest('a');
      expect(viewAllLink).toHaveAttribute('href', '/app/jobs');
    });

    it('should not show "View All Jobs" link when jobs count is less than limit', async () => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs.slice(0, 2));

      render(<RecentJobs userId="user-1" limit={5} />);

      await waitFor(() => {
        expect(screen.getByText('TAP Reconciliation')).toBeInTheDocument();
      });

      expect(screen.queryByText('View All Jobs')).not.toBeInTheDocument();
    });
  });

  describe('Responsive and Accessibility', () => {
    beforeEach(() => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);
    });

    it('should have proper accessibility attributes', async () => {
      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        const card = screen.getByText('Recent Jobs').closest('[role="region"], .card');
        expect(card).toBeInTheDocument();
      });

      // Check for download button accessibility
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
    });

    it('should handle custom className prop', async () => {
      const { container } = render(
        <RecentJobs userId="user-1" className="custom-class" />
      );

      await waitFor(() => {
        const cardElement = container.querySelector('.custom-class');
        expect(cardElement).toBeInTheDocument();
      });
    });
  });

  describe('Props and Configuration', () => {
    it('should use default limit when not specified', async () => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);

      render(<RecentJobs userId="user-1" />);

      await waitFor(() => {
        expect(mockJobsQueries.getRecentJobsForUser).toHaveBeenCalledWith('user-1', 5);
      });
    });

    it('should use custom limit when specified', async () => {
      mockJobsQueries.getRecentJobsForUser.mockResolvedValue(mockJobs);

      render(<RecentJobs userId="user-1" limit={10} />);

      await waitFor(() => {
        expect(mockJobsQueries.getRecentJobsForUser).toHaveBeenCalledWith('user-1', 10);
      });
    });

    it('should not fetch jobs when userId is empty', () => {
      render(<RecentJobs userId="" />);

      expect(mockJobsQueries.getRecentJobsForUser).not.toHaveBeenCalled();
    });
  });
}); 