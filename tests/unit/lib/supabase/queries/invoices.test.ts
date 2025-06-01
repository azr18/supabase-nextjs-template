import {
  getUserInvoicesByAirline,
  getAllUserInvoices,
  getSavedInvoiceById,
  getInvoicesCountByAirline,
  formatFileSize,
  getAirlineDisplayName,
  getRelativeTime,
  isPotentialDuplicate,
  getInvoiceUsageInfo,
  retryInvoicesQuery,
  InvoicesError,
  InvoicesQueryError
} from '@/lib/supabase/queries/invoices';
import { createSPAClient } from '@/lib/supabase/client';
import { UserInvoicesByAirlineResult, SavedInvoice } from '@/lib/supabase/types';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        single: jest.fn()
      }))
    }))
  }))
};

(createSPAClient as jest.Mock).mockReturnValue(mockSupabase);

describe('Invoices Query Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInvoicesByAirline', () => {
    it('should fetch invoices for specific airline', async () => {
      const mockInvoices: UserInvoicesByAirlineResult[] = [
        {
          id: '1',
          airline_type: 'fly_dubai',
          original_filename: 'invoice1.pdf',
          file_size: 1024000,
          file_size_mb: 1.0,
          upload_date: '2024-01-01T00:00:00Z',
          last_used_at: '2024-01-02T00:00:00Z',
          usage_count: 2,
          metadata: null
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockInvoices,
        error: null
      });

      const result = await getUserInvoicesByAirline('fly_dubai');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_invoices_by_airline', {
        p_airline_type: 'fly_dubai'
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should fetch all invoices when no airline specified', async () => {
      const mockInvoices: UserInvoicesByAirlineResult[] = [];

      mockSupabase.rpc.mockResolvedValue({
        data: mockInvoices,
        error: null
      });

      const result = await getUserInvoicesByAirline();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_invoices_by_airline', {
        p_airline_type: undefined
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'Database error' }
      });

      await expect(getUserInvoicesByAirline('fly_dubai')).rejects.toThrow(InvoicesError);
    });

    it('should return empty array when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getUserInvoicesByAirline('fly_dubai');
      expect(result).toEqual([]);
    });
  });

  describe('getAllUserInvoices', () => {
    it('should call getUserInvoicesByAirline without airline parameter', async () => {
      const mockInvoices: UserInvoicesByAirlineResult[] = [];

      mockSupabase.rpc.mockResolvedValue({
        data: mockInvoices,
        error: null
      });

      const result = await getAllUserInvoices();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_invoices_by_airline', {
        p_airline_type: undefined
      });
      expect(result).toEqual(mockInvoices);
    });
  });

  describe('getSavedInvoiceById', () => {
    it('should fetch specific invoice by ID', async () => {
      const mockInvoice: SavedInvoice = {
        id: '1',
        user_id: 'user1',
        airline_type: 'fly_dubai',
        original_filename: 'invoice1.pdf',
        file_path: 'user1/fly_dubai/invoice1.pdf',
        file_hash: 'abc123',
        file_size: 1024000,
        mime_type: 'application/pdf',
        is_active: true,
        upload_date: '2024-01-01T00:00:00Z',
        last_used_at: '2024-01-02T00:00:00Z',
        usage_count: 2,
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockChain = {
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockInvoice,
              error: null
            })
          }))
        }))
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockChain)
      });

      const result = await getSavedInvoiceById('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_invoices');
      expect(result).toEqual(mockInvoice);
    });

    it('should return null when invoice not found', async () => {
      const mockChain = {
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          }))
        }))
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockChain)
      });

      const result = await getSavedInvoiceById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getInvoicesCountByAirline', () => {
    it('should count invoices by airline type', async () => {
      const mockData = [
        { airline_type: 'fly_dubai' },
        { airline_type: 'fly_dubai' },
        { airline_type: 'tap' }
      ];

      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: mockData,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockChain)
      });

      const result = await getInvoicesCountByAirline();

      expect(result).toEqual({
        fly_dubai: 2,
        tap: 1
      });
    });

    it('should return empty object when no invoices', async () => {
      const mockChain = {
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockChain)
      });

      const result = await getInvoicesCountByAirline();
      expect(result).toEqual({});
    });
  });

  describe('Utility Functions', () => {
    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(formatFileSize(0)).toBe('0 B');
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1048576)).toBe('1 MB');
        expect(formatFileSize(1073741824)).toBe('1 GB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
      });
    });

    describe('getAirlineDisplayName', () => {
      it('should return correct display names', () => {
        expect(getAirlineDisplayName('fly_dubai')).toBe('Fly Dubai');
        expect(getAirlineDisplayName('tap')).toBe('TAP');
        expect(getAirlineDisplayName('philippines_airlines')).toBe('Philippines Airlines');
        expect(getAirlineDisplayName('air_india')).toBe('Air India');
        expect(getAirlineDisplayName('el_al')).toBe('El Al');
        expect(getAirlineDisplayName('unknown_airline')).toBe('UNKNOWN AIRLINE');
      });
    });

    describe('getRelativeTime', () => {
      it('should return correct relative time strings', () => {
        const now = new Date();
        
        // Just now
        const justNow = new Date(now.getTime() - 30 * 1000).toISOString();
        expect(getRelativeTime(justNow)).toBe('Just now');
        
        // Minutes ago
        const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
        expect(getRelativeTime(minutesAgo)).toBe('5 minutes ago');
        
        // Hours ago
        const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
        expect(getRelativeTime(hoursAgo)).toBe('3 hours ago');
        
        // Days ago
        const daysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
        expect(getRelativeTime(daysAgo)).toBe('5 days ago');
      });

      it('should handle singular vs plural correctly', () => {
        const now = new Date();
        
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
        expect(getRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
        
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        expect(getRelativeTime(oneHourAgo)).toBe('1 hour ago');
        
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        expect(getRelativeTime(oneDayAgo)).toBe('1 day ago');
      });
    });

    describe('isPotentialDuplicate', () => {
      it('should detect potential duplicates', () => {
        const existingInvoices: UserInvoicesByAirlineResult[] = [
          {
            id: '1',
            airline_type: 'fly_dubai',
            original_filename: 'Invoice_123.pdf',
            file_size: 1024,
            file_size_mb: 1.0,
            upload_date: '2024-01-01T00:00:00Z',
            last_used_at: null,
            usage_count: 0,
            metadata: null
          }
        ];

        expect(isPotentialDuplicate('Invoice_123.pdf', existingInvoices)).toBe(true);
        expect(isPotentialDuplicate('invoice_123.pdf', existingInvoices)).toBe(true);
        expect(isPotentialDuplicate('Different_Invoice.pdf', existingInvoices)).toBe(false);
      });
    });

    describe('getInvoiceUsageInfo', () => {
      it('should return correct usage info', () => {
        const unusedInvoice: UserInvoicesByAirlineResult = {
          id: '1',
          airline_type: 'fly_dubai',
          original_filename: 'test.pdf',
          file_size: 1024,
          file_size_mb: 1.0,
          upload_date: '2024-01-01T00:00:00Z',
          last_used_at: null,
          usage_count: 0,
          metadata: null
        };

        const usedOnceInvoice: UserInvoicesByAirlineResult = {
          ...unusedInvoice,
          usage_count: 1
        };

        const usedMultipleInvoice: UserInvoicesByAirlineResult = {
          ...unusedInvoice,
          usage_count: 5
        };

        expect(getInvoiceUsageInfo(unusedInvoice)).toEqual({
          label: 'Unused',
          className: 'bg-gray-100 text-gray-600'
        });

        expect(getInvoiceUsageInfo(usedOnceInvoice)).toEqual({
          label: 'Used once',
          className: 'bg-blue-100 text-blue-700'
        });

        expect(getInvoiceUsageInfo(usedMultipleInvoice)).toEqual({
          label: 'Used 5 times',
          className: 'bg-green-100 text-green-700'
        });
      });
    });
  });

  describe('retryInvoicesQuery', () => {
    it('should succeed on first attempt', async () => {
      const mockQueryFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryInvoicesQuery(mockQueryFn);
      
      expect(result).toBe('success');
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockQueryFn = jest.fn()
        .mockRejectedValueOnce(new InvoicesError(InvoicesQueryError.NETWORK_ERROR, 'Network error', null, true))
        .mockResolvedValue('success');
      
      const result = await retryInvoicesQuery(mockQueryFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockQueryFn = jest.fn()
        .mockRejectedValue(new InvoicesError(InvoicesQueryError.AUTH_ERROR, 'Auth error', null, false));
      
      await expect(retryInvoicesQuery(mockQueryFn, 3, 100)).rejects.toThrow('Auth error');
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const mockQueryFn = jest.fn()
        .mockRejectedValue(new InvoicesError(InvoicesQueryError.NETWORK_ERROR, 'Network error', null, true));
      
      await expect(retryInvoicesQuery(mockQueryFn, 2, 100)).rejects.toThrow('Network error');
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'fetch failed' }
      });

      await expect(getUserInvoicesByAirline('fly_dubai')).rejects.toThrow(InvoicesError);
    });

    it('should handle authentication errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'UNAUTHORIZED', status: 401 }
      });

      try {
        await getUserInvoicesByAirline('fly_dubai');
      } catch (error) {
        expect(error).toBeInstanceOf(InvoicesError);
        expect((error as InvoicesError).code).toBe(InvoicesQueryError.AUTH_ERROR);
        expect((error as InvoicesError).retryable).toBe(false);
      }
    });

    it('should handle server errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { status: 500, message: 'Internal server error' }
      });

      try {
        await getUserInvoicesByAirline('fly_dubai');
      } catch (error) {
        expect(error).toBeInstanceOf(InvoicesError);
        expect((error as InvoicesError).code).toBe(InvoicesQueryError.SERVER_ERROR);
        expect((error as InvoicesError).retryable).toBe(true);
      }
    });
  });
}); 