import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AirlineSelector, { AIRLINES } from '@/components/InvoiceReconciler/AirlineSelector';

// Mock the UI components
jest.mock('@/components/ui/select', () => ({
  Select: (props: any) => (
    <div data-testid="mock-select" data-disabled={props.disabled} data-value={props.value}>
      <button onClick={() => props.onValueChange('fly-dubai')}>Select Airline</button>
      {props.children}
    </div>
  ),
  SelectContent: (props: any) => <div data-testid="select-content">{props.children}</div>,
  SelectItem: (props: any) => (
    <div data-testid={`select-item-${props.value}`} data-disabled={props.disabled}>
      {props.children}
    </div>
  ),
  SelectTrigger: (props: any) => (
    <div data-testid="select-trigger" className={props.className}>
      {props.children}
    </div>
  ),
  SelectValue: (props: any) => <span>{props.placeholder}</span>
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: (props: any) => (
    <span data-testid="badge" className={props.className}>
      {props.children}
    </span>
  )
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => (
    <div data-testid="skeleton" className={props.className} />
  )
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: (props: any) => <div data-testid="loader2-icon" className={props.className} />,
  Plane: (props: any) => <div data-testid="plane-icon" className={props.className} />
}));

describe('AirlineSelector', () => {
  const mockOnAirlineChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders airline selector with default props', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
        />
      );

      expect(screen.getByTestId('airline-selector')).toBeInTheDocument();
      expect(screen.getByText('Select Airline')).toBeInTheDocument();
      expect(screen.getByTestId('mock-select')).toBeInTheDocument();
    });

    it('displays all supported airlines in the data', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
        />
      );

      // Verify all airlines are available
      AIRLINES.forEach(airline => {
        expect(screen.getByTestId(`select-item-${airline.id}`)).toBeInTheDocument();
      });
    });

    it('calls onAirlineChange when selection changes', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
        />
      );

      fireEvent.click(screen.getByText('Select Airline'));
      expect(mockOnAirlineChange).toHaveBeenCalledWith('fly-dubai');
    });

    it('displays selected airline correctly', () => {
      render(
        <AirlineSelector
          selectedAirline="fly-dubai"
          onAirlineChange={mockOnAirlineChange}
        />
      );

      expect(screen.getByTestId('mock-select')).toHaveAttribute('data-value', 'fly-dubai');
    });
  });

  describe('Loading States', () => {
    it('renders loading skeleton when isLoading is true', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('airline-selector-loading')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(2); // Label and select skeletons
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading airlines...')).toBeInTheDocument();
    });

    it('uses custom loading label when provided', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isLoading={true}
          loadingLabel="Fetching airline data..."
        />
      );

      expect(screen.getByText('Fetching airline data...')).toBeInTheDocument();
    });

    it('does not render main selector when loading', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isLoading={true}
        />
      );

      expect(screen.queryByTestId('airline-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
    });
  });

  describe('Processing States', () => {
    it('shows processing indicator in label when isProcessing is true', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isProcessing={true}
        />
      );

      expect(screen.getByText('Select Airline')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('disables select when processing', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isProcessing={true}
        />
      );

      expect(screen.getByTestId('mock-select')).toHaveAttribute('data-disabled', 'true');
    });

    it('shows processing message in select trigger when processing', () => {
      render(
        <AirlineSelector
          selectedAirline={null}
          onAirlineChange={mockOnAirlineChange}
          isProcessing={true}
        />
      );

      expect(screen.getByText('Processing selection...')).toBeInTheDocument();
    });

    it('shows processing feedback when airline is selected and processing', () => {
      render(
        <AirlineSelector
          selectedAirline="fly-dubai"
          onAirlineChange={mockOnAirlineChange}
          isProcessing={true}
        />
      );

      expect(screen.getByText('Processing Fly Dubai selection...')).toBeInTheDocument();
      expect(screen.getByText('Validating access and preparing reconciliation interface')).toBeInTheDocument();
      expect(screen.getByTestId('plane-icon')).toBeInTheDocument();
    });
  });

  describe('Airlines Data', () => {
    it('exports AIRLINES constant correctly', () => {
      expect(AIRLINES).toBeDefined();
      expect(AIRLINES.length).toBe(5);
      expect(AIRLINES[0]).toHaveProperty('id');
      expect(AIRLINES[0]).toHaveProperty('name');
      expect(AIRLINES[0]).toHaveProperty('code');
      expect(AIRLINES[0]).toHaveProperty('description');
      expect(AIRLINES[0]).toHaveProperty('status');
    });

    it('has correct airline data structure', () => {
      const expectedAirlines = [
        { id: 'fly-dubai', name: 'Fly Dubai', code: 'FZ' },
        { id: 'tap', name: 'TAP Air Portugal', code: 'TP' },
        { id: 'philippines', name: 'Philippines Airlines', code: 'PR' },
        { id: 'air-india', name: 'Air India', code: 'AI' },
        { id: 'el-al', name: 'El Al', code: 'LY' }
      ];

      expectedAirlines.forEach((expected, index) => {
        expect(AIRLINES[index].id).toBe(expected.id);
        expect(AIRLINES[index].name).toBe(expected.name);
        expect(AIRLINES[index].code).toBe(expected.code);
      });
    });
  });
}); 