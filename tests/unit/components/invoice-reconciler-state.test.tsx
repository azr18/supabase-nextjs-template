import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/context/GlobalContext', () => ({
  useGlobal: () => ({
    user: { id: 'test-user-123' },
    loading: false
  })
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock('@/lib/supabase/queries/tools', () => ({
  hasToolAccess: jest.fn().mockResolvedValue(true)
}));

// Mock AirlineSelector component for isolated testing
jest.mock('@/components/InvoiceReconciler/AirlineSelector', () => {
  return {
    __esModule: true,
    default: ({ selectedAirline, onAirlineChange, disabled }: any) => (
      <div data-testid="airline-selector">
        <select
          data-testid="airline-select"
          value={selectedAirline || ''}
          onChange={(e) => onAirlineChange(e.target.value || null)}
          disabled={disabled}
        >
          <option value="">Select airline...</option>
          <option value="fly-dubai">Fly Dubai</option>
          <option value="tap">TAP Air Portugal</option>
          <option value="philippines">Philippines Airlines</option>
          <option value="air-india">Air India</option>
          <option value="el-al">El Al</option>
        </select>
      </div>
    ),
    AIRLINES: [
      { id: 'fly-dubai', name: 'Fly Dubai', code: 'FZ', description: 'Dubai-based low-cost carrier', status: 'active' },
      { id: 'tap', name: 'TAP Air Portugal', code: 'TP', description: 'Portugal national airline', status: 'active' },
      { id: 'philippines', name: 'Philippines Airlines', code: 'PR', description: 'Flag carrier of the Philippines', status: 'active' },
      { id: 'air-india', name: 'Air India', code: 'AI', description: 'National carrier of India', status: 'active' },
      { id: 'el-al', name: 'El Al', code: 'LY', description: 'Flag carrier of Israel', status: 'active' }
    ]
  };
});

import InvoiceReconcilerPage from '@/app/app/invoice-reconciler/page';

describe('Invoice Reconciler - Airline Selection State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with no airline selected', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 4: Select Airline/)).toBeInTheDocument();
    });

    // Should show warning to select airline
    expect(screen.getByText(/Please select an airline before uploading files/)).toBeInTheDocument();
    
    // Progress indicator should show step 1
    const progressDots = screen.getByText(/Step 1 of 4/).parentElement;
    expect(progressDots).toBeInTheDocument();
  });

  test('should update state when airline is selected', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Select Fly Dubai
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'fly-dubai' } });

    await waitFor(() => {
      // Should show step 2
      expect(screen.getByText(/Step 2 of 4: Upload Files/)).toBeInTheDocument();
      
      // Should show airline selection status
      expect(screen.getByText(/Fly Dubai \(FZ\) Selected/)).toBeInTheDocument();
      
      // Should show ready state for file upload
      expect(screen.getByText(/Ready to upload files for Fly Dubai/)).toBeInTheDocument();
      
      // Should show current selection in sidebar
      expect(screen.getByText(/Current Selection/)).toBeInTheDocument();
    });
  });

  test('should show validation states correctly', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Initially should not be ready for upload
    expect(screen.getByText(/Please select an airline before uploading files/)).toBeInTheDocument();
    expect(screen.queryByText(/Ready/)).not.toBeInTheDocument();

    // Select airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'tap' } });

    await waitFor(() => {
      // Should now be ready for upload
      expect(screen.getByText(/Ready to upload files for TAP Air Portugal/)).toBeInTheDocument();
      expect(screen.getByText(/Ready/)).toBeInTheDocument();
    });
  });

  test('should handle airline change correctly', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Select first airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'philippines' } });

    await waitFor(() => {
      expect(screen.getByText(/Philippines Airlines \(PR\) Selected/)).toBeInTheDocument();
    });

    // Change to different airline
    fireEvent.change(airlineSelect, { target: { value: 'air-india' } });

    await waitFor(() => {
      expect(screen.getByText(/Air India \(AI\) Selected/)).toBeInTheDocument();
      expect(screen.getByText(/Ready to upload files for Air India/)).toBeInTheDocument();
    });
  });

  test('should clear selection when change button is clicked', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Select airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'el-al' } });

    await waitFor(() => {
      expect(screen.getByText(/El Al \(LY\) Selected/)).toBeInTheDocument();
    });

    // Click change button
    const changeButton = screen.getByText('Change');
    fireEvent.click(changeButton);

    await waitFor(() => {
      // Should reset to step 1
      expect(screen.getByText(/Step 1 of 4: Select Airline/)).toBeInTheDocument();
      expect(screen.getByText(/Please select an airline before uploading files/)).toBeInTheDocument();
      expect(screen.queryByText(/Current Selection/)).not.toBeInTheDocument();
    });
  });

  test('should show workflow progress correctly', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Initially step 1
    expect(screen.getByText(/Step 1 of 4: Select Airline/)).toBeInTheDocument();
    expect(screen.getByText(/Choose the airline type for your reconciliation/)).toBeInTheDocument();

    // Select airline to move to step 2
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'fly-dubai' } });

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 4: Upload Files/)).toBeInTheDocument();
      expect(screen.getByText(/Upload invoice and report files/)).toBeInTheDocument();
    });
  });

  test('should show airline-specific instructions', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Select airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'tap' } });

    await waitFor(() => {
      // Should show airline-specific format requirements
      expect(screen.getByText(/TAP Air Portugal format required/)).toBeInTheDocument();
      expect(screen.getByText(/TAP Air Portugal-specific format/)).toBeInTheDocument();
      expect(screen.getByText(/Standardized format \(same for all airlines\)/)).toBeInTheDocument();
    });
  });

  test('should display selection timestamp', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Select airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'philippines' } });

    await waitFor(() => {
      // Should show timestamp
      expect(screen.getByText(/Selected \d+:\d+:\d+/)).toBeInTheDocument();
    });
  });

  test('should update workflow steps in quick guide', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Initially step 1 should not be marked as complete
    const quickGuide = screen.getByText('How it works:').closest('div');
    expect(quickGuide).toBeInTheDocument();

    // Select airline
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'air-india' } });

    await waitFor(() => {
      // Step 1 should now be marked as complete
      expect(screen.getByText(/Select your airline type ✓/)).toBeInTheDocument();
    });
  });

  test('should handle disabled state correctly', async () => {
    // This test would need to be expanded when we add loading states
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      const airlineSelect = screen.getByTestId('airline-select');
      expect(airlineSelect).not.toBeDisabled();
    });
  });
});

describe('Invoice Reconciler - State Management Edge Cases', () => {
  test('should handle invalid airline selection gracefully', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    // Try to select invalid airline (this should be handled by the Select component)
    const airlineSelect = screen.getByTestId('airline-select');
    fireEvent.change(airlineSelect, { target: { value: 'invalid-airline' } });

    // Should not break the application
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 4: Select Airline/)).toBeInTheDocument();
    });
  });

  test('should maintain state consistency during rapid changes', async () => {
    render(<InvoiceReconcilerPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('airline-select')).toBeInTheDocument();
    });

    const airlineSelect = screen.getByTestId('airline-select');
    
    // Rapidly change selections
    fireEvent.change(airlineSelect, { target: { value: 'fly-dubai' } });
    fireEvent.change(airlineSelect, { target: { value: 'tap' } });
    fireEvent.change(airlineSelect, { target: { value: 'philippines' } });

    await waitFor(() => {
      // Should end up with the last selection
      expect(screen.getByText(/Philippines Airlines \(PR\) Selected/)).toBeInTheDocument();
      expect(screen.getByText(/Step 2 of 4: Upload Files/)).toBeInTheDocument();
    });
  });
}); 