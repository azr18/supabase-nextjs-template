import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoiceManager from '@/components/InvoiceReconciler/InvoiceManager'; // Adjust path as needed
import { SavedInvoice } from '@/lib/supabase/types'; // Assuming this type exists

// Mock data for testing
const mockInvoices: SavedInvoice[] = [
  {
    id: '1',
    user_id: 'user-1',
    airline_id: 'airline-1',
    filename: 'invoice1.pdf',
    file_path: 'user-1/airline-1/invoice1.pdf',
    file_size: 1024,
    file_hash: 'hash1',
    uploaded_at: new Date().toISOString(),
    // Add other necessary fields from your SavedInvoice type if they affect rendering/logic
    // For example, if you have 'metadata' or 'status' fields that are displayed
  },
  {
    id: '2',
    user_id: 'user-1',
    airline_id: 'airline-1',
    filename: 'invoice2.pdf',
    file_path: 'user-1/airline-1/invoice2.pdf',
    file_size: 2048,
    file_hash: 'hash2',
    uploaded_at: new Date().toISOString(),
  },
];

describe('InvoiceManager Component - Selection Functionality', () => {
  let mockOnInvoiceSelect: jest.Mock;
  let mockOnDeleteInvoice: jest.Mock; // Will be used in later tests for 8.18

  beforeEach(() => {
    mockOnInvoiceSelect = jest.fn();
    mockOnDeleteInvoice = jest.fn(); // For task 8.18
  });

  it('should render correctly with a list of invoices', () => {
    render(
      <InvoiceManager
        invoices={mockInvoices}
        selectedInvoiceId={null}
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    expect(screen.getByText('invoice1.pdf')).toBeInTheDocument();
    expect(screen.getByText('invoice2.pdf')).toBeInTheDocument();
    // Check for radio buttons associated with each invoice
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBe(mockInvoices.length);
  });

  it('should render a message when no invoices are available for the selected airline', () => {
    render(
      <InvoiceManager
        invoices={[]}
        selectedInvoiceId={null}
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    expect(screen.getByText(/No invoices found for the selected airline/i)).toBeInTheDocument();
  });

  it('should render a loading state when isLoading is true', () => {
    render(
      <InvoiceManager
        invoices={[]}
        selectedInvoiceId={null}
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={true}
        currentAirlineId="airline-1"
      />
    );
    // Assuming you have a distinctive loading indicator, e.g., text or a spinner with a test-id
    // For this example, let's assume a text "Loading invoices..." is shown.
    // Adjust this selector based on your actual loading UI.
    expect(screen.getByText(/Loading invoices.../i)).toBeInTheDocument();
  });

  it('should call onInvoiceSelect with the correct invoice ID when an invoice is selected', () => {
    render(
      <InvoiceManager
        invoices={mockInvoices}
        selectedInvoiceId={null}
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    // Find radio button by its accessible name (e.g., the filename) or by value if that's more reliable
    // For this example, assuming radio buttons might have values equal to invoice IDs.
    // A more robust way might be to associate label with input.
    const radioButtonForInvoice1 = screen.getAllByRole('radio')[0]; // Select the first radio button
    fireEvent.click(radioButtonForInvoice1);

    expect(mockOnInvoiceSelect).toHaveBeenCalledTimes(1);
    expect(mockOnInvoiceSelect).toHaveBeenCalledWith(mockInvoices[0].id);
  });

  it('should display the correct invoice as selected based on selectedInvoiceId prop', () => {
    render(
      <InvoiceManager
        invoices={mockInvoices}
        selectedInvoiceId={mockInvoices[1].id} // Second invoice is pre-selected
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    const radioButtons = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radioButtons[0].checked).toBe(false);
    expect(radioButtons[1].checked).toBe(true);
  });

  it('should correctly update selection when a new invoice is chosen', () => {
    const { rerender } = render(
      <InvoiceManager
        invoices={mockInvoices}
        selectedInvoiceId={mockInvoices[0].id} // First invoice initially selected
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    // User clicks the second invoice
    const radioButtonForInvoice2 = screen.getAllByRole('radio')[1];
    fireEvent.click(radioButtonForInvoice2);

    expect(mockOnInvoiceSelect).toHaveBeenCalledTimes(1);
    expect(mockOnInvoiceSelect).toHaveBeenCalledWith(mockInvoices[1].id);

    // Simulate parent component updating the selectedInvoiceId prop
    rerender(
      <InvoiceManager
        invoices={mockInvoices}
        selectedInvoiceId={mockInvoices[1].id} // Now second invoice is selected
        onInvoiceSelect={mockOnInvoiceSelect}
        onDeleteInvoice={mockOnDeleteInvoice}
        isLoading={false}
        currentAirlineId="airline-1"
      />
    );

    const radioButtons = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radioButtons[0].checked).toBe(false);
    expect(radioButtons[1].checked).toBe(true);
  });

  // Add more tests as needed for edge cases or specific behaviors of selection
}); 