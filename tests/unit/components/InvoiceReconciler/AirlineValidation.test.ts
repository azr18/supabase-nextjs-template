// Mock the AIRLINES data
const MOCK_AIRLINES = [
  {
    id: 'fly-dubai',
    name: 'Fly Dubai',
    code: 'FZ',
    description: 'Dubai-based low-cost carrier',
    status: 'active' as const
  },
  {
    id: 'tap',
    name: 'TAP Air Portugal',
    code: 'TP',
    description: 'Portugal national airline',
    status: 'active' as const
  },
  {
    id: 'coming-soon-airline',
    name: 'Future Airline',
    code: 'FA',
    description: 'Future airline',
    status: 'coming-soon' as const
  }
];

// Validation function (extracted from the component for testing)
const validateAirlineSelection = (airlineId: string | null): { isValid: boolean; canProceed: boolean; error: string | null } => {
  if (!airlineId) {
    return {
      isValid: false,
      canProceed: false,
      error: 'Please select an airline to continue'
    };
  }

  const airlineData = MOCK_AIRLINES.find(airline => airline.id === airlineId);
  
  if (!airlineData) {
    return {
      isValid: false,
      canProceed: false,
      error: 'Invalid airline selection'
    };
  }

  if (airlineData.status !== 'active') {
    return {
      isValid: true,
      canProceed: false,
      error: `${airlineData.name} is coming soon and not yet available for reconciliation`
    };
  }

  return {
    isValid: true,
    canProceed: true,
    error: null
  };
};

describe('Airline Selection Validation', () => {
  describe('validateAirlineSelection', () => {
    it('should return error when no airline is selected', () => {
      const result = validateAirlineSelection(null);
      
      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.error).toBe('Please select an airline to continue');
    });

    it('should return error when empty string is provided', () => {
      const result = validateAirlineSelection('');
      
      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.error).toBe('Please select an airline to continue');
    });

    it('should return error for invalid airline ID', () => {
      const result = validateAirlineSelection('invalid-airline-id');
      
      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.error).toBe('Invalid airline selection');
    });

    it('should return success for valid active airline - Fly Dubai', () => {
      const result = validateAirlineSelection('fly-dubai');
      
      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should return success for valid active airline - TAP', () => {
      const result = validateAirlineSelection('tap');
      
      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should return validation warning for coming-soon airline', () => {
      const result = validateAirlineSelection('coming-soon-airline');
      
      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(false);
      expect(result.error).toBe('Future Airline is coming soon and not yet available for reconciliation');
    });

    it('should handle airline selection consistently', () => {
      // Test multiple valid selections
      const validAirlines = ['fly-dubai', 'tap'];
      
      validAirlines.forEach(airlineId => {
        const result = validateAirlineSelection(airlineId);
        expect(result.isValid).toBe(true);
        expect(result.canProceed).toBe(true);
        expect(result.error).toBe(null);
      });
    });

    it('should handle case sensitivity correctly', () => {
      // Should fail for incorrect casing
      const result = validateAirlineSelection('FLY-DUBAI');
      
      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.error).toBe('Invalid airline selection');
    });
  });

  describe('Workflow State Validation', () => {
    it('should validate workflow state transitions', () => {
      // Start with no selection
      let validation = validateAirlineSelection(null);
      expect(validation.canProceed).toBe(false);
      
      // Select valid airline
      validation = validateAirlineSelection('fly-dubai');
      expect(validation.canProceed).toBe(true);
      
      // Change to coming-soon airline
      validation = validateAirlineSelection('coming-soon-airline');
      expect(validation.canProceed).toBe(false);
      expect(validation.isValid).toBe(true); // Valid selection but can't proceed
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error messages for each validation scenario', () => {
      const scenarios = [
        { input: null, expectedError: 'Please select an airline to continue' },
        { input: 'invalid-id', expectedError: 'Invalid airline selection' },
        { input: 'coming-soon-airline', expectedError: 'Future Airline is coming soon and not yet available for reconciliation' }
      ];

      scenarios.forEach(({ input, expectedError }) => {
        const result = validateAirlineSelection(input);
        expect(result.error).toBe(expectedError);
      });
    });

    it('should return null error for successful validation', () => {
      const result = validateAirlineSelection('fly-dubai');
      expect(result.error).toBe(null);
    });
  });
}); 