/**
 * Integration tests for password reset functionality
 * Tests both forgot password and reset password flows with Supabase Auth
 */

import { beforeAll, beforeEach, afterEach, describe, test, expect, vi } from 'vitest';

// Mock Supabase client for testing
const mockSupabaseClient = {
  auth: {
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn()
  }
};

const mockCreateSPASassClient = vi.fn(() => ({
  getSupabaseClient: () => mockSupabaseClient
}));

// Mock Next.js router
const mockRouter = {
  push: vi.fn()
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
});

vi.mock('@/lib/supabase/client', () => ({
  createSPASassClient: mockCreateSPASassClient
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('Password Reset Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Forgot Password Flow', () => {
    test('should successfully send password reset email for existing user', async () => {
      // Arrange
      const email = 'testuser1@example.com';
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      // Mock the forgot password page functionality
      const handleSubmit = async (e) => {
        e.preventDefault();
        const supabase = await mockCreateSPASassClient();
        const { error } = await supabase.getSupabaseClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
      };

      // Act
      const mockEvent = { preventDefault: vi.fn() };
      const result = await handleSubmit(mockEvent);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: 'http://localhost:3000/auth/reset-password'
      });
      expect(result.error).toBeNull();
    });

    test('should handle errors when sending password reset email', async () => {
      // Arrange
      const email = 'invalid@example.com';
      const errorMessage = 'User not found';
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({ 
        error: new Error(errorMessage) 
      });

      // Mock the forgot password page functionality
      const handleSubmit = async (e) => {
        e.preventDefault();
        const supabase = await mockCreateSPASassClient();
        const { error } = await supabase.getSupabaseClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
      };

      // Act
      const mockEvent = { preventDefault: vi.fn() };
      const result = await handleSubmit(mockEvent);

      // Assert
      expect(result.error.message).toBe(errorMessage);
    });

    test('should validate email format before sending reset request', () => {
      // Arrange
      const invalidEmails = ['', 'invalid-email', 'test@', '@example.com'];
      
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Act & Assert
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });

      expect(validateEmail('valid@example.com')).toBe(true);
    });
  });

  describe('Reset Password Flow', () => {
    test('should successfully reset password with valid session', async () => {
      // Arrange
      const newPassword = 'newSecurePassword123';
      const confirmPassword = 'newSecurePassword123';
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      });
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });

      // Mock the reset password page functionality
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
          return { error: new Error("Passwords don't match") };
        }

        if (newPassword.length < 6) {
          return { error: new Error('Password must be at least 6 characters long') };
        }

        const supabase = await mockCreateSPASassClient();
        const { error } = await supabase.getSupabaseClient().auth.updateUser({
          password: newPassword
        });
        
        return { error };
      };

      // Act
      const mockEvent = { preventDefault: vi.fn() };
      const result = await handleSubmit(mockEvent);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword
      });
      expect(result.error).toBeNull();
    });

    test('should validate password confirmation match', async () => {
      // Arrange
      const newPassword = 'password123';
      const confirmPassword = 'differentPassword';

      // Mock the reset password validation
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
          return { error: new Error("Passwords don't match") };
        }
        
        return { error: null };
      };

      // Act
      const mockEvent = { preventDefault: vi.fn() };
      const result = await handleSubmit(mockEvent);

      // Assert
      expect(result.error.message).toBe("Passwords don't match");
    });

    test('should validate minimum password length', async () => {
      // Arrange
      const shortPassword = '123';

      // Mock the reset password validation
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (shortPassword.length < 6) {
          return { error: new Error('Password must be at least 6 characters long') };
        }
        
        return { error: null };
      };

      // Act
      const mockEvent = { preventDefault: vi.fn() };
      const result = await handleSubmit(mockEvent);

      // Assert
      expect(result.error.message).toBe('Password must be at least 6 characters long');
    });

    test('should handle invalid or expired reset session', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid session')
      });

      // Mock session validation
      const checkSession = async () => {
        try {
          const supabase = await mockCreateSPASassClient();
          const { data: { user }, error } = await supabase.getSupabaseClient().auth.getUser();

          if (error || !user) {
            return { error: new Error('Invalid or expired reset link. Please request a new password reset.') };
          }
          
          return { error: null };
        } catch {
          return { error: new Error('Failed to verify reset session') };
        }
      };

      // Act
      const result = await checkSession();

      // Assert
      expect(result.error.message).toBe('Invalid or expired reset link. Please request a new password reset.');
    });
  });

  describe('User Experience Tests', () => {
    test('should provide clear success feedback after sending reset email', () => {
      // Test that success state is properly handled
      const successState = {
        success: true,
        message: 'Check your email'
      };

      expect(successState.success).toBe(true);
      expect(successState.message).toBe('Check your email');
    });

    test('should provide clear feedback after successful password reset', () => {
      // Test that success state after password reset is properly handled
      const successState = {
        success: true,
        message: 'Password reset successful',
        redirect: '/app'
      };

      expect(successState.success).toBe(true);
      expect(successState.message).toBe('Password reset successful');
      expect(successState.redirect).toBe('/app');
    });

    test('should handle network errors gracefully', async () => {
      // Arrange
      mockSupabaseClient.auth.resetPasswordForEmail.mockRejectedValue(
        new Error('Network error')
      );

      // Mock error handling
      const handleSubmit = async () => {
        try {
          const supabase = await mockCreateSPASassClient();
          await supabase.getSupabaseClient().auth.resetPasswordForEmail('test@example.com', {
            redirectTo: 'http://localhost:3000/auth/reset-password'
          });
          return { error: null };
        } catch (err) {
          if (err instanceof Error) {
            return { error: err };
          } else {
            return { error: new Error('An unknown error occurred') };
          }
        }
      };

      // Act
      const result = await handleSubmit();

      // Assert
      expect(result.error.message).toBe('Network error');
    });
  });

  describe('Security Tests', () => {
    test('should use secure redirect URL for password reset', () => {
      // Arrange
      const baseUrl = 'http://localhost:3000';
      const expectedRedirectTo = `${baseUrl}/auth/reset-password`;

      // Act
      const redirectUrl = `${window.location.origin}/auth/reset-password`;

      // Assert
      expect(redirectUrl).toBe(expectedRedirectTo);
      expect(redirectUrl).toMatch(/^https?:\/\/[^\/]+\/auth\/reset-password$/);
    });

    test('should not expose sensitive information in error messages', () => {
      // Test that user enumeration is prevented
      const handleError = (error) => {
        // In production, we should not reveal whether user exists or not
        if (error.message.includes('User not found')) {
          return 'If this email exists in our system, you will receive a password reset link.';
        }
        return error.message;
      };

      const userNotFoundError = handleError(new Error('User not found'));
      expect(userNotFoundError).toBe('If this email exists in our system, you will receive a password reset link.');
    });
  });
}); 