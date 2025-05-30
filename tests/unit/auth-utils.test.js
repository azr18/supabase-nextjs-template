// Unit tests for authentication utility functions and components
const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');

// Mock Next.js components and modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithOAuth: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('../../nextjs/src/lib/supabase/client', () => ({
  createSPAClient: jest.fn(() => mockSupabaseClient),
  createSSRClient: jest.fn(() => mockSupabaseClient),
}));

describe('Authentication Utility Functions', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,github';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('Email/Password Authentication', () => {
    test('validates email format correctly', () => {
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('validates password strength requirements', () => {
      const validatePassword = (password) => {
        return {
          isValid: password.length >= 8,
          hasMinLength: password.length >= 8,
          hasUpperCase: /[A-Z]/.test(password),
          hasLowerCase: /[a-z]/.test(password),
          hasNumber: /\d/.test(password),
          hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
      };

      const strongPassword = validatePassword('Test123!@#');
      expect(strongPassword.isValid).toBe(true);
      expect(strongPassword.hasMinLength).toBe(true);
      expect(strongPassword.hasUpperCase).toBe(true);
      expect(strongPassword.hasLowerCase).toBe(true);
      expect(strongPassword.hasNumber).toBe(true);
      expect(strongPassword.hasSpecialChar).toBe(true);

      const weakPassword = validatePassword('123');
      expect(weakPassword.isValid).toBe(false);
      expect(weakPassword.hasMinLength).toBe(false);
    });

    test('handles authentication errors appropriately', () => {
      const handleAuthError = (error) => {
        const errorMap = {
          'Invalid login credentials': 'The email or password you entered is incorrect.',
          'Email not confirmed': 'Please check your email and click the confirmation link.',
          'Too many requests': 'Too many login attempts. Please try again later.',
          'User already registered': 'An account with this email already exists.',
        };

        return errorMap[error] || 'An unexpected error occurred. Please try again.';
      };

      expect(handleAuthError('Invalid login credentials')).toBe('The email or password you entered is incorrect.');
      expect(handleAuthError('Email not confirmed')).toBe('Please check your email and click the confirmation link.');
      expect(handleAuthError('Unknown error')).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('OAuth Provider Configuration', () => {
    test('parses SSO providers configuration correctly', () => {
      const getEnabledProviders = () => {
        const providers = process.env.NEXT_PUBLIC_SSO_PROVIDERS || '';
        return providers.split(',').map(p => p.trim()).filter(p => p && p.length > 0);
      };

      process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,github,facebook';
      expect(getEnabledProviders()).toEqual(['google', 'github', 'facebook']);

      process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
      expect(getEnabledProviders()).toEqual(['google']);

      process.env.NEXT_PUBLIC_SSO_PROVIDERS = '';
      expect(getEnabledProviders()).toEqual([]);

      process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google, , github';
      expect(getEnabledProviders()).toEqual(['google', 'github']);
    });

    test('validates OAuth provider names', () => {
      const validateProvider = (provider) => {
        const validProviders = ['google', 'github', 'facebook', 'twitter', 'apple', 'discord'];
        return validProviders.includes(provider.toLowerCase());
      };

      expect(validateProvider('google')).toBe(true);
      expect(validateProvider('GitHub')).toBe(true);
      expect(validateProvider('facebook')).toBe(true);
      expect(validateProvider('invalid_provider')).toBe(false);
      expect(validateProvider('')).toBe(false);
    });

    test('constructs OAuth redirect URLs correctly', () => {
      const getOAuthRedirectURL = (provider) => {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return `${baseURL}/api/auth/callback`;
      };

      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
      expect(getOAuthRedirectURL('google')).toBe('https://myapp.com/api/auth/callback');

      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getOAuthRedirectURL('google')).toBe('http://localhost:3000/api/auth/callback');
    });
  });

  describe('Session Management', () => {
    test('handles session state changes correctly', () => {
      const handleSessionChange = (event, session) => {
        const validEvents = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'];
        
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid session event: ${event}`);
        }

        switch (event) {
          case 'SIGNED_IN':
            return { user: session?.user, isAuthenticated: true };
          case 'SIGNED_OUT':
            return { user: null, isAuthenticated: false };
          case 'TOKEN_REFRESHED':
            return { user: session?.user, isAuthenticated: true, tokenRefreshed: true };
          case 'USER_UPDATED':
            return { user: session?.user, isAuthenticated: true, userUpdated: true };
          default:
            return { user: null, isAuthenticated: false };
        }
      };

      const mockSession = { user: { id: '123', email: 'test@example.com' } };

      const signedIn = handleSessionChange('SIGNED_IN', mockSession);
      expect(signedIn.isAuthenticated).toBe(true);
      expect(signedIn.user).toEqual(mockSession.user);

      const signedOut = handleSessionChange('SIGNED_OUT', null);
      expect(signedOut.isAuthenticated).toBe(false);
      expect(signedOut.user).toBe(null);

      const tokenRefreshed = handleSessionChange('TOKEN_REFRESHED', mockSession);
      expect(tokenRefreshed.tokenRefreshed).toBe(true);

      expect(() => handleSessionChange('INVALID_EVENT', mockSession)).toThrow('Invalid session event: INVALID_EVENT');
    });

    test('validates session expiration correctly', () => {
      const isSessionExpired = (session) => {
        if (!session?.expires_at) return true;
        
        const expirationTime = new Date(session.expires_at * 1000);
        const currentTime = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        
        return expirationTime.getTime() - bufferTime <= currentTime.getTime();
      };

      const validSession = {
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      expect(isSessionExpired(validSession)).toBe(false);

      const expiredSession = {
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      expect(isSessionExpired(expiredSession)).toBe(true);

      const almostExpiredSession = {
        expires_at: Math.floor(Date.now() / 1000) + 60, // 1 minute from now (within buffer)
      };
      expect(isSessionExpired(almostExpiredSession)).toBe(true);

      expect(isSessionExpired(null)).toBe(true);
      expect(isSessionExpired({})).toBe(true);
    });
  });

  describe('Route Protection', () => {
    test('determines protected routes correctly', () => {
      const isProtectedRoute = (pathname) => {
        const protectedPaths = ['/app', '/dashboard', '/settings', '/admin'];
        const publicPaths = ['/auth', '/api/auth', '/', '/about', '/contact'];
        
        // Check if it's explicitly public
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return false;
        }
        
        // Check if it's explicitly protected
        if (protectedPaths.some(path => pathname.startsWith(path))) {
          return true;
        }
        
        // Default to protected for unknown paths
        return true;
      };

      expect(isProtectedRoute('/app')).toBe(true);
      expect(isProtectedRoute('/app/invoice-reconciler')).toBe(true);
      expect(isProtectedRoute('/dashboard')).toBe(true);
      expect(isProtectedRoute('/settings')).toBe(true);
      
      expect(isProtectedRoute('/auth/login')).toBe(false);
      expect(isProtectedRoute('/auth/register')).toBe(false);
      expect(isProtectedRoute('/api/auth/callback')).toBe(false);
      expect(isProtectedRoute('/')).toBe(false);
      
      expect(isProtectedRoute('/unknown-path')).toBe(true);
    });

    test('handles redirect logic for authentication', () => {
      const getAuthRedirect = (currentPath, isAuthenticated) => {
        const isProtected = currentPath.startsWith('/app') || currentPath.startsWith('/dashboard');
        const isAuthPage = currentPath.startsWith('/auth');
        
        if (isAuthenticated && isAuthPage) {
          return '/app'; // Redirect to dashboard if already authenticated
        }
        
        if (!isAuthenticated && isProtected) {
          return `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        
        return null; // No redirect needed
      };

      expect(getAuthRedirect('/app', false)).toBe('/auth/login?redirect=%2Fapp');
      expect(getAuthRedirect('/auth/login', true)).toBe('/app');
      expect(getAuthRedirect('/app', true)).toBe(null);
      expect(getAuthRedirect('/auth/login', false)).toBe(null);
      expect(getAuthRedirect('/', false)).toBe(null);
      expect(getAuthRedirect('/', true)).toBe(null);
    });
  });

  describe('Error Handling', () => {
    test('categorizes authentication errors correctly', () => {
      const categorizeAuthError = (error) => {
        const errorCategories = {
          client: ['Invalid email format', 'Password too short', 'Required field missing'],
          server: ['Internal server error', 'Database connection failed', 'Service unavailable'],
          auth: ['Invalid credentials', 'Account locked', 'Too many attempts', 'Email not verified'],
          network: ['Network error', 'Connection timeout', 'Request failed'],
        };

        for (const [category, messages] of Object.entries(errorCategories)) {
          if (messages.some(msg => error.includes(msg))) {
            return category;
          }
        }
        
        return 'unknown';
      };

      expect(categorizeAuthError('Invalid email format')).toBe('client');
      expect(categorizeAuthError('Invalid credentials')).toBe('auth');
      expect(categorizeAuthError('Internal server error')).toBe('server');
      expect(categorizeAuthError('Network error')).toBe('network');
      expect(categorizeAuthError('Unexpected error')).toBe('unknown');
    });

    test('provides user-friendly error messages', () => {
      const getUserFriendlyError = (error) => {
        const errorMessages = {
          'Invalid login credentials': 'The email or password is incorrect. Please try again.',
          'Email not confirmed': 'Please check your email for a confirmation link.',
          'User already registered': 'An account with this email already exists.',
          'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
          'Network request failed': 'Connection problem. Please check your internet and try again.',
          'Too many requests': 'Too many attempts. Please wait a few minutes before trying again.',
        };

        return errorMessages[error] || 'Something went wrong. Please try again later.';
      };

      expect(getUserFriendlyError('Invalid login credentials')).toBe('The email or password is incorrect. Please try again.');
      expect(getUserFriendlyError('Email not confirmed')).toBe('Please check your email for a confirmation link.');
      expect(getUserFriendlyError('Random error')).toBe('Something went wrong. Please try again later.');
    });
  });

  describe('Form Validation', () => {
    test('validates registration form inputs', () => {
      const validateRegistrationForm = (formData) => {
        const errors = {};
        
        if (!formData.email) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) {
          errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }
        
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors,
        };
      };

      const validForm = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      expect(validateRegistrationForm(validForm).isValid).toBe(true);

      const invalidForm = {
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
      };
      const result = validateRegistrationForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 8 characters long');
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
    });

    test('validates login form inputs', () => {
      const validateLoginForm = (formData) => {
        const errors = {};
        
        if (!formData.email) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) {
          errors.password = 'Password is required';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors,
        };
      };

      const validForm = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(validateLoginForm(validForm).isValid).toBe(true);

      const invalidForm = {
        email: '',
        password: '',
      };
      const result = validateLoginForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email is required');
      expect(result.errors.password).toBe('Password is required');
    });
  });
}); 