/**
 * Test suite for enhanced subscription validation in Invoice Reconciler
 * Tests the improved error handling, retry logic, and user feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { hasToolAccess, getToolSubscriptionStatus } from '@/lib/supabase/queries/tools';
import { useToast } from '@/hooks/useToast';
import InvoiceReconcilerPage from '@/app/app/invoice-reconciler/page';

// Mock dependencies
vi.mock('@/lib/context/GlobalContext');
vi.mock('@/lib/supabase/queries/tools');
vi.mock('@/hooks/useToast');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockUseGlobal = vi.mocked(useGlobal);
const mockHasToolAccess = vi.mocked(hasToolAccess);
const mockGetToolSubscriptionStatus = vi.mocked(getToolSubscriptionStatus);
const mockUseToast = vi.mocked(useToast);

const mockToast = vi.fn();

describe('Enhanced Subscription Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading States', () => {
    it('should show enhanced loading state during subscription validation', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      // Mock slow subscription check
      mockGetToolSubscriptionStatus.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          hasAccess: true,
          status: 'active',
          subscription: { id: 'sub-1', status: 'active' } as any
        }), 1000))
      );
      mockHasToolAccess.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(true), 1000))
      );

      render(<InvoiceReconcilerPage />);

      // Should show enhanced loading state
      expect(screen.getByText('Verifying Access...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we verify your subscription status')).toBeInTheDocument();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.getByText('Verifying subscription status...')).toBeInTheDocument();
      expect(screen.getByText('Loading tool interface...')).toBeInTheDocument();
    });

    it('should show retry loading state during retry attempts', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      // Mock initial failure then success
      mockGetToolSubscriptionStatus
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          hasAccess: true,
          status: 'active',
          subscription: { id: 'sub-1', status: 'active' } as any
        });
      
      mockHasToolAccess
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      render(<InvoiceReconcilerPage />);

      // Wait for initial failure and retry
      await waitFor(() => {
        expect(screen.getByText('Retrying Connection...')).toBeInTheDocument();
      });

      expect(screen.getByText(/Attempting to verify subscription status \(1\/3\)/)).toBeInTheDocument();
      expect(screen.getByText('Retry Attempt 1')).toBeInTheDocument();
    });
  });

  describe('Error Classification and Handling', () => {
    it('should show NO_SUBSCRIPTION error with appropriate UI', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockResolvedValue({
        hasAccess: false,
        status: null,
        subscription: null,
      });
      mockHasToolAccess.mockResolvedValue(false);

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Subscription Required')).toBeInTheDocument();
      });

      expect(screen.getByText('No active subscription found for this tool')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText('Need a Subscription?')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Subscription Required",
        description: "You need an active subscription to use the Invoice Reconciler tool.",
        variant: "destructive",
      });
    });

    it('should show EXPIRED error with appropriate UI', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockResolvedValue({
        hasAccess: false,
        status: 'expired',
        subscription: { id: 'sub-1', status: 'expired' } as any,
      });
      mockHasToolAccess.mockResolvedValue(false);

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Subscription Expired')).toBeInTheDocument();
      });

      expect(screen.getByText('Your subscription has expired')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Subscription Expired",
        description: "Your subscription has expired. Please contact support to renew.",
        variant: "destructive",
      });
    });

    it('should show INACTIVE error with appropriate UI', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockResolvedValue({
        hasAccess: false,
        status: 'inactive',
        subscription: { id: 'sub-1', status: 'inactive' } as any,
      });
      mockHasToolAccess.mockResolvedValue(false);

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Subscription Inactive')).toBeInTheDocument();
      });

      expect(screen.getByText('Your subscription is currently inactive')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Subscription Inactive",
        description: "Your subscription is inactive. Please contact support.",
        variant: "destructive",
      });
    });

    it('should show NETWORK_ERROR with retry functionality', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockRejectedValue(new Error('Network error'));
      mockHasToolAccess.mockRejectedValue(new Error('Network error'));

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Unable to verify your subscription status due to a connection issue')).toBeInTheDocument();
      expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Connection Error",
        description: "Unable to verify subscription status. Please check your connection and try again.",
        variant: "destructive",
      });
    });

    it('should show AUTH_ERROR for unauthenticated users', async () => {
      mockUseGlobal.mockReturnValue({
        user: null,
        loading: false,
      });

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      });

      expect(screen.getByText('Please log in to your account to access this tool')).toBeInTheDocument();
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff retry logic', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      // Mock network errors for first few attempts
      mockGetToolSubscriptionStatus
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          hasAccess: true,
          status: 'active',
          subscription: { id: 'sub-1', status: 'active' } as any
        });

      mockHasToolAccess
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      render(<InvoiceReconcilerPage />);

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('Retry Connection');
      fireEvent.click(retryButton);

      // Should show retry attempt
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Retrying...",
          description: "Attempting to verify subscription (1/3)",
          variant: "default",
        });
      });
    });

    it('should stop retrying after maximum attempts', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      // Mock persistent network errors
      mockGetToolSubscriptionStatus.mockRejectedValue(new Error('Network error'));
      mockHasToolAccess.mockRejectedValue(new Error('Network error'));

      render(<InvoiceReconcilerPage />);

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });

      // Retry multiple times
      const retryButton = screen.getByText('Retry Connection');
      
      // First retry
      fireEvent.click(retryButton);
      await waitFor(() => {
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });

      // Second retry
      fireEvent.click(retryButton);
      await waitFor(() => {
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });

      // Third retry
      fireEvent.click(retryButton);
      await waitFor(() => {
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      });

      // Should show max retry message
      expect(mockToast).toHaveBeenCalledWith({
        title: "Unable to Connect",
        description: "Unable to verify subscription after multiple attempts. Please refresh the page.",
        variant: "destructive",
      });
    });
  });

  describe('Status Information Display', () => {
    it('should display subscription status information', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockResolvedValue({
        hasAccess: false,
        status: 'expired',
        subscription: { id: 'sub-1', status: 'expired' } as any,
      });
      mockHasToolAccess.mockResolvedValue(false);

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Subscription Status')).toBeInTheDocument();
      });

      expect(screen.getByText('expired')).toBeInTheDocument();
      expect(screen.getByText('Last Checked')).toBeInTheDocument();
      expect(screen.getByText('Retry Count')).toBeInTheDocument();
      expect(screen.getByText('0/3')).toBeInTheDocument();
    });
  });

  describe('Successful Access', () => {
    it('should show tool interface when user has valid subscription', async () => {
      mockUseGlobal.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
      });

      mockGetToolSubscriptionStatus.mockResolvedValue({
        hasAccess: true,
        status: 'active',
        subscription: { id: 'sub-1', status: 'active' } as any,
      });
      mockHasToolAccess.mockResolvedValue(true);

      render(<InvoiceReconcilerPage />);

      await waitFor(() => {
        expect(screen.getByText('Invoice Reconciler')).toBeInTheDocument();
      });

      expect(screen.getByText('Multi-airline invoice reconciliation tool')).toBeInTheDocument();
      expect(screen.getByText('Select Airline')).toBeInTheDocument();
      expect(screen.getByText('Tool Active')).toBeInTheDocument();
    });
  });
}); 