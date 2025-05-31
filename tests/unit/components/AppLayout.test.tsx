import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppLayout from '@/components/AppLayout';
import { GlobalProvider } from '@/lib/context/GlobalContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/app',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createSPASassClient: () => ({
    logout: jest.fn(),
  }),
}));

const MockedAppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalProvider>
      <AppLayout>{children}</AppLayout>
    </GlobalProvider>
  );
};

describe('AppLayout Navigation', () => {
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
}); 