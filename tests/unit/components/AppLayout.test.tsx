import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '../../../nextjs/src/components/AppLayout';
import { GlobalProvider } from '../../../nextjs/src/lib/context/GlobalContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock Supabase client
jest.mock('../../../nextjs/src/lib/supabase/client', () => ({
  createSPASassClient: jest.fn(() => Promise.resolve({
    logout: jest.fn(),
  })),
}));

// Mock the global context with user data
const mockUser = {
  email: 'test.user@example.com',
  id: '123',
};

const MockedAppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalProvider>
      <AppLayout>{children}</AppLayout>
    </GlobalProvider>
  );
};

describe('AppLayout Navigation', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue('/app');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display Dashboard navigation link instead of Homepage', () => {
    render(
      <MockedAppLayout>
        <div>Test content</div>
      </MockedAppLayout>
    );

    // Should show "Dashboard" not "Homepage"
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
  });

  it('should display User Settings navigation link', () => {
    render(
      <MockedAppLayout>
        <div>Test content</div>
      </MockedAppLayout>
    );

    expect(screen.getByText('User Settings')).toBeInTheDocument();
  });

  it('should not contain any demo-related navigation links', () => {
    render(
      <MockedAppLayout>
        <div>Test content</div>
      </MockedAppLayout>
    );

    // Verify no demo links exist
    expect(screen.queryByText(/storage.*demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/table.*demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/file.*demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/task.*demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/demo-testimonials/i)).not.toBeInTheDocument();
  });

  it('should have correct navigation structure for SaaS platform', () => {
    render(
      <MockedAppLayout>
        <div>Test content</div>
      </MockedAppLayout>
    );

    // Should only have essential navigation items
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    const userSettingsLink = screen.getByRole('link', { name: /user settings/i });

    expect(dashboardLink).toHaveAttribute('href', '/app');
    expect(userSettingsLink).toHaveAttribute('href', '/app/user-settings');
  });

  describe('Blue Gradient Theme Styling', () => {
    it('should apply blue gradient background to main container', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      const mainContainer = screen.getByText('Test content').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gradient-to-br', 'from-gray-50', 'via-blue-50', 'to-violet-50');
    });

    it('should apply blue gradient theme to sidebar header', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // The brand/logo should have blue gradient styling
      const brandElement = screen.getByText(/my agent/i);
      expect(brandElement.parentElement?.parentElement).toHaveClass('bg-gradient-to-r', 'from-gray-800', 'via-blue-500', 'to-blue-600');
    });

    it('should apply blue gradient active state to navigation links', () => {
      (usePathname as jest.Mock).mockReturnValue('/app');
      
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'via-violet-500', 'to-violet-600');
    });

    it('should apply blue gradient hover effects to navigation links', () => {
      (usePathname as jest.Mock).mockReturnValue('/app/other');
      
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      const userSettingsLink = screen.getByRole('link', { name: /user settings/i });
      expect(userSettingsLink).toHaveClass('hover:from-blue-50', 'hover:via-violet-50', 'hover:to-violet-100');
    });

    it('should apply blue gradient styling to user avatar', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Look for the user avatar container
      const avatarContainer = screen.getByText('??').parentElement;
      expect(avatarContainer).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'via-violet-500', 'to-violet-600');
    });

    it('should apply backdrop blur effects to transparent elements', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Check for backdrop blur in sidebar and top navigation
      const sidebar = screen.getByText(/my agent/i).closest('.fixed');
      expect(sidebar).toHaveClass('backdrop-blur-md');
    });

    it('should use blue-themed border colors', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Check for blue-themed borders
      const sidebar = screen.getByText(/my agent/i).closest('.fixed');
      expect(sidebar).toHaveClass('border-r', 'border-blue-100');
    });
  });

  describe('Navigation Interactions', () => {
    it('should handle user dropdown interactions', async () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Find and click the user dropdown button
      const userButton = screen.getByText('??').closest('button');
      if (userButton) {
        fireEvent.click(userButton);

        // Should show dropdown menu items
        await waitFor(() => {
          expect(screen.getByText('Account Settings')).toBeInTheDocument();
          expect(screen.getByText('Change Password')).toBeInTheDocument();
          expect(screen.getByText('Security (MFA)')).toBeInTheDocument();
          expect(screen.getByText('Sign Out')).toBeInTheDocument();
        });
      }
    });

    it('should apply hover states correctly', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      const userSettingsLink = screen.getByRole('link', { name: /user settings/i });
      
      // Verify hover effects are configured
      expect(userSettingsLink).toHaveClass('hover:scale-105', 'transition-all', 'duration-300');
    });

    it('should maintain rounded corners consistent with theme', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      const navigationLinks = screen.getAllByRole('link');
      navigationLinks.forEach(link => {
        // Navigation links should have rounded-xl for modern appearance
        expect(link).toHaveClass('rounded-xl');
      });
    });

    it('should show active state indicators', () => {
      (usePathname as jest.Mock).mockReturnValue('/app');
      
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Active dashboard link should have gradient background and text colors
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('text-white', 'shadow-lg');
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile navigation correctly', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Mobile sidebar should be hidden by default
      const sidebar = screen.getByText(/my agent/i).closest('.fixed');
      expect(sidebar).toHaveClass('-translate-x-full', 'lg:translate-x-0');
    });

    it('should apply consistent spacing and layout', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Check for consistent padding and margins
      const navigationContainer = screen.getByRole('navigation');
      expect(navigationContainer).toHaveClass('space-y-2', 'px-3', 'mt-6');
      
      // Main content should have proper padding
      const mainContent = screen.getByText('Test content').parentElement;
      expect(mainContent).toHaveClass('p-6');
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper ARIA labels and navigation structure', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // Navigation should be properly labeled
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Links should be accessible
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const userSettingsLink = screen.getByRole('link', { name: /user settings/i });
      
      expect(dashboardLink).toBeInTheDocument();
      expect(userSettingsLink).toBeInTheDocument();
    });

    it('should handle keyboard navigation properly', () => {
      render(
        <MockedAppLayout>
          <div>Test content</div>
        </MockedAppLayout>
      );

      // All interactive elements should be focusable
      const interactiveElements = screen.getAllByRole('button').concat(screen.getAllByRole('link'));
      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
}); 