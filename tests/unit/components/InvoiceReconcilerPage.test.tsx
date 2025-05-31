import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import InvoiceReconcilerPage from '@/app/app/invoice-reconciler/page';
import { useGlobal } from '@/lib/context/GlobalContext';
import { hasToolAccess } from '@/lib/supabase/queries/tools';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/context/GlobalContext', () => ({
  useGlobal: jest.fn(),
}));

jest.mock('@/lib/supabase/queries/tools', () => ({
  hasToolAccess: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

describe('InvoiceReconcilerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders loading state when user is loading', () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<InvoiceReconcilerPage />);

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders access checking state when validating subscription', () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<InvoiceReconcilerPage />);

    // Should show loading skeleton during access check
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders access denied state when user lacks subscription', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(false);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText('Access Required')).toBeInTheDocument();
      expect(screen.getByText(/You need an active subscription/)).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('renders access denied state when user is not logged in', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText('Access Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access this tool')).toBeInTheDocument();
    });
  });

  it('renders main interface when user has access', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(true);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      // Check for main heading
      expect(screen.getByText('Invoice Reconciler')).toBeInTheDocument();
      
      // Check for main description
      expect(screen.getByText(/Streamline your invoice reconciliation process/)).toBeInTheDocument();
      
      // Check for tool active status
      expect(screen.getByText('Tool Active')).toBeInTheDocument();
      
      // Check for main sections
      expect(screen.getByText('Select Airline')).toBeInTheDocument();
      expect(screen.getByText('Upload Files')).toBeInTheDocument();
      expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
      expect(screen.getByText('Quick Guide')).toBeInTheDocument();
    });
  });

  it('displays airline support information', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(true);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Supporting: Fly Dubai, TAP, Philippines Airlines, Air India, El Al/)).toBeInTheDocument();
    });
  });

  it('displays file format information', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(true);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText(/PDF invoices \(airline-specific\) \+ Excel reports \(standardized format\)/)).toBeInTheDocument();
    });
  });

  it('displays step-by-step guide', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(true);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText('How it works:')).toBeInTheDocument();
      expect(screen.getByText('Select your airline type')).toBeInTheDocument();
      expect(screen.getByText('Choose or upload invoice')).toBeInTheDocument();
      expect(screen.getByText('Upload Excel report')).toBeInTheDocument();
      expect(screen.getByText('Start reconciliation')).toBeInTheDocument();
      expect(screen.getByText('Download results')).toBeInTheDocument();
    });
  });

  it('handles subscription check errors gracefully', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(screen.getByText('Access Required')).toBeInTheDocument();
      expect(screen.getByText('Unable to verify access. Please try again.')).toBeInTheDocument();
    });
  });

  it('calls hasToolAccess with correct parameters', async () => {
    (useGlobal as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (hasToolAccess as jest.Mock).mockResolvedValue(true);

    render(<InvoiceReconcilerPage />);

    await waitFor(() => {
      expect(hasToolAccess).toHaveBeenCalledWith('invoice-reconciler', 'test-user-id');
    });
  });
}); 