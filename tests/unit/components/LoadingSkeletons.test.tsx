import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  WelcomeSkeleton,
  ToolCardSkeleton,
  ToolsSectionSkeleton,
  RecentJobsSkeleton,
  AccountSettingsSkeleton,
  DashboardSkeleton
} from '@/components/Dashboard/LoadingSkeletons';

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Wrench: () => <div data-testid="wrench-icon">Wrench</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CalendarDays: () => <div data-testid="calendar-icon">Calendar</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

describe('LoadingSkeletons Components', () => {
  describe('WelcomeSkeleton', () => {
    it('renders with blue gradient theme styling', () => {
      const { container } = render(<WelcomeSkeleton />);
      
      // Check for blue gradient card styling
      const card = container.querySelector('[class*="bg-gradient-to-r"][class*="from-white"][class*="via-blue-50"]');
      expect(card).toBeInTheDocument();
      
      // Check for blue gradient icon container
      const iconContainer = container.querySelector('[class*="bg-gradient-to-r"][class*="from-blue-500"][class*="to-blue-600"]');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for calendar icon with blue color
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });
  });

  describe('ToolCardSkeleton', () => {
    it('renders with blue gradient theme and hover effects', () => {
      const { container } = render(<ToolCardSkeleton />);
      
      // Check for card with hover effects and blue gradient
      const card = container.querySelector('[class*="hover:scale-105"][class*="hover:shadow-xl"][class*="bg-gradient-to-br"]');
      expect(card).toBeInTheDocument();
      
      // Check for blue gradient icon container
      const iconContainer = container.querySelector('[class*="bg-gradient-to-r"][class*="from-blue-500"][class*="to-blue-600"]');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for gradient skeleton elements
      const gradientSkeletons = container.querySelectorAll('[class*="bg-gradient-to-r"]');
      expect(gradientSkeletons.length).toBeGreaterThan(3);
    });
  });

  describe('ToolsSectionSkeleton', () => {
    it('renders with blue gradient theme and proper structure', () => {
      const { container } = render(<ToolsSectionSkeleton />);
      
      // Check for main card with blue gradient
      const card = container.querySelector('[class*="bg-gradient-to-r"][class*="from-white"][class*="via-blue-50"]');
      expect(card).toBeInTheDocument();
      
      // Check for wrench icon
      expect(screen.getByTestId('wrench-icon')).toBeInTheDocument();
      
      // Check for "My Tools" text with gradient
      expect(screen.getByText('My Tools')).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText('Access your subscribed business automation tools')).toBeInTheDocument();
      
      // Check for grid of tool card skeletons (should have 3)
      const toolCards = container.querySelectorAll('[class*="hover:scale-105"]');
      expect(toolCards).toHaveLength(3);
    });
  });

  describe('RecentJobsSkeleton', () => {
    it('renders with blue gradient theme and job items', () => {
      const { container } = render(<RecentJobsSkeleton />);
      
      // Check for main card with blue gradient
      const card = container.querySelector('[class*="bg-gradient-to-r"][class*="from-white"][class*="via-blue-50"]');
      expect(card).toBeInTheDocument();
      
      // Check for clock icon
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      
      // Check for "Recent Jobs" text
      expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
      
      // Check for job items (should have 3)
      const jobItems = container.querySelectorAll('[class*="hover:shadow-md"][class*="transition-all"]');
      expect(jobItems).toHaveLength(3);
    });
  });

  describe('AccountSettingsSkeleton', () => {
    it('renders with blue gradient theme and settings structure', () => {
      const { container } = render(<AccountSettingsSkeleton />);
      
      // Check for main card with blue gradient
      const card = container.querySelector('[class*="bg-gradient-to-r"][class*="from-white"][class*="via-blue-50"]');
      expect(card).toBeInTheDocument();
      
      // Check for settings icon
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      
      // Check for "Account Settings" text
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText('Manage your account preferences and security')).toBeInTheDocument();
    });
  });

  describe('DashboardSkeleton', () => {
    it('renders complete dashboard with background pattern and all sections', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for main container with background gradient
      const mainContainer = container.querySelector('[class*="min-h-screen"][class*="bg-gradient-to-b"]');
      expect(mainContainer).toBeInTheDocument();
      
      // Check for background pattern
      const backgroundPattern = container.querySelector('[class*="bg-grid-white"]');
      expect(backgroundPattern).toBeInTheDocument();
      
      // Check for all skeleton sections
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument(); // WelcomeSkeleton
      expect(screen.getByTestId('wrench-icon')).toBeInTheDocument(); // ToolsSectionSkeleton
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument(); // RecentJobsSkeleton
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument(); // AccountSettingsSkeleton
      
      // Check for proper text content
      expect(screen.getByText('My Tools')).toBeInTheDocument();
      expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
  });

  describe('Blue Gradient Theme Consistency', () => {
    it('all skeleton components use consistent blue gradient patterns', () => {
      const { container: welcomeContainer } = render(<WelcomeSkeleton />);
      const { container: toolCardContainer } = render(<ToolCardSkeleton />);
      const { container: toolsSectionContainer } = render(<ToolsSectionSkeleton />);
      const { container: recentJobsContainer } = render(<RecentJobsSkeleton />);
      const { container: accountContainer } = render(<AccountSettingsSkeleton />);
      
      // Check that all components use blue gradient patterns
      const containers = [
        welcomeContainer,
        toolCardContainer,
        toolsSectionContainer,
        recentJobsContainer,
        accountContainer
      ];
      
      containers.forEach(container => {
        // Each should have blue gradient elements
        const blueGradients = container.querySelectorAll('[class*="from-blue-"]');
        expect(blueGradients.length).toBeGreaterThan(0);
        
        // Each should have consistent border styling
        const blueBorders = container.querySelectorAll('[class*="border-blue-200"]');
        expect(blueBorders.length).toBeGreaterThan(0);
      });
    });
  });
}); 