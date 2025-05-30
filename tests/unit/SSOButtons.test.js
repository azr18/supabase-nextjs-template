import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SSOButtons from '../../nextjs/src/components/SSOButtons';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }) => <a href={href}>{children}</a>;
});

// Mock Supabase client
jest.mock('../../nextjs/src/lib/supabase/client', () => ({
  createSPAClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
    },
  })),
}));

const { createSPAClient } = require('../../nextjs/src/lib/supabase/client');

describe('SSOButtons Component', () => {
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnError.mockClear();
    
    // Set up default environment
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,github';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SSO_PROVIDERS;
  });

  test('renders Google OAuth button when provider is enabled', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google');
    expect(googleButton).toBeInTheDocument();
    expect(googleButton.closest('button')).toHaveClass('bg-white', 'hover:bg-gray-50');
  });

  test('does not render when no providers are enabled', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = '';
    
    const { container } = render(<SSOButtons onError={mockOnError} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('renders multiple providers when configured', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,github,facebook';
    
    render(<SSOButtons onError={mockOnError} />);
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
  });

  test('Google OAuth button has correct styling and icon', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google').closest('button');
    
    expect(googleButton).toHaveClass('bg-white', 'hover:bg-gray-50', 'text-gray-700', 'border-gray-300');
    
    // Check for Google icon (SVG)
    const googleIcon = googleButton.querySelector('svg');
    expect(googleIcon).toBeInTheDocument();
    expect(googleIcon).toHaveClass('w-5', 'h-5');
  });

  test('clicking Google OAuth button triggers signInWithOAuth', async () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      },
    };
    createSPAClient.mockReturnValue(mockSupabase);
    
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback',
        },
      });
    });
    
    expect(mockOnError).not.toHaveBeenCalled();
  });

  test('handles OAuth error and calls onError callback', async () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    const mockError = new Error('OAuth failed');
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({ error: mockError }),
      },
    };
    createSPAClient.mockReturnValue(mockSupabase);
    
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('OAuth failed');
    });
  });

  test('handles unknown errors gracefully', async () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockRejectedValue('Unknown error'),
      },
    };
    createSPAClient.mockReturnValue(mockSupabase);
    
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('An unknown error occurred');
    });
  });

  test('renders terms and privacy links correctly', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    render(<SSOButtons onError={mockOnError} />);
    
    const termsLink = screen.getByText('Terms and Conditions');
    const privacyLink = screen.getByText('Privacy Policy');
    
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest('a')).toHaveAttribute('href', '/legal/terms');
    
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/legal/privacy');
  });

  test('renders divider and text correctly', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    render(<SSOButtons onError={mockOnError} />);
    
    expect(screen.getByText('Or continue with')).toBeInTheDocument();
  });

  test('ignores invalid provider configurations', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,invalid_provider,github';
    
    render(<SSOButtons onError={mockOnError} />);
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.queryByText('Continue with invalid_provider')).not.toBeInTheDocument();
  });

  test('handles empty string in providers configuration', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google,,github';
    
    render(<SSOButtons onError={mockOnError} />);
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  test('renders without onError callback', async () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      },
    };
    createSPAClient.mockReturnValue(mockSupabase);
    
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    
    // Render without onError prop
    render(<SSOButtons />);
    
    const googleButton = screen.getByText('Continue with Google');
    
    // Should not throw error when clicking
    expect(() => fireEvent.click(googleButton)).not.toThrow();
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled();
    });
  });

  test('button has correct accessibility attributes', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'google';
    
    render(<SSOButtons onError={mockOnError} />);
    
    const googleButton = screen.getByText('Continue with Google').closest('button');
    
    expect(googleButton).toHaveAttribute('type', 'button');
    expect(googleButton).not.toHaveAttribute('disabled');
  });

  test('provider configurations are case insensitive', () => {
    process.env.NEXT_PUBLIC_SSO_PROVIDERS = 'GOOGLE,GitHub';
    
    render(<SSOButtons onError={mockOnError} />);
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });
}); 