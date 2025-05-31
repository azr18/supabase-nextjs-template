import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AirlineSelector, { AIRLINES } from '@/components/InvoiceReconciler/AirlineSelector';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('AirlineSelector', () => {
  const mockOnAirlineChange = jest.fn();

  beforeEach(() => {
    mockOnAirlineChange.mockClear();
  });

  it('renders the component with title and description', () => {
    render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
      />
    );

    expect(screen.getByText('Select Airline')).toBeInTheDocument();
    expect(screen.getByText('Choose the airline type for your invoice reconciliation')).toBeInTheDocument();
  });

  it('shows placeholder text when no airline is selected', () => {
    render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
      />
    );

    expect(screen.getByText('Select an airline...')).toBeInTheDocument();
  });

  it('displays all supported airlines in the supported airlines summary', () => {
    render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
      />
    );

    // Check that all airline codes are displayed in the summary
    AIRLINES.forEach((airline) => {
      const badges = screen.getAllByText(airline.code);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('shows selected airline information when an airline is selected', () => {
    const selectedAirline = 'fly-dubai';
    render(
      <AirlineSelector
        selectedAirline={selectedAirline}
        onAirlineChange={mockOnAirlineChange}
      />
    );

    expect(screen.getByText('Fly Dubai')).toBeInTheDocument();
    expect(screen.getByText('Dubai-based low-cost carrier')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('displays airline-specific requirements instructions', () => {
    render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
      />
    );

    expect(screen.getByText('Important: Airline-Specific Requirements')).toBeInTheDocument();
    expect(screen.getByText(/Each airline has specific invoice formats/)).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
        disabled={true}
      />
    );

    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeDisabled();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-test-class';
    const { container } = render(
      <AirlineSelector
        selectedAirline={null}
        onAirlineChange={mockOnAirlineChange}
        className={customClass}
      />
    );

    const cardElement = container.querySelector('.custom-test-class');
    expect(cardElement).toBeInTheDocument();
  });

  it('exports AIRLINES data correctly', () => {
    expect(AIRLINES).toHaveLength(5);
    expect(AIRLINES[0]).toHaveProperty('id', 'fly-dubai');
    expect(AIRLINES[0]).toHaveProperty('name', 'Fly Dubai');
    expect(AIRLINES[0]).toHaveProperty('code', 'FZ');
    expect(AIRLINES[0]).toHaveProperty('status', 'active');
  });

  it('includes all required airlines from PRD', () => {
    const airlineNames = AIRLINES.map(airline => airline.name);
    
    expect(airlineNames).toContain('Fly Dubai');
    expect(airlineNames).toContain('TAP Air Portugal');
    expect(airlineNames).toContain('Philippines Airlines');
    expect(airlineNames).toContain('Air India');
    expect(airlineNames).toContain('El Al');
  });
}); 