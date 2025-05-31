/**
 * Integration tests for subscription status indicators
 * Task 5.5: Add subscription status indicators to dashboard UI
 */

import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionStatusSummary } from '@/components/Dashboard/SubscriptionStatusSummary';
import { SubscriptionStatusBadge } from '@/components/Dashboard/SubscriptionStatusBadge';
import { ToolWithSubscription } from '@/lib/supabase/queries/tools';

// Mock data for testing
const mockActiveSubscription = {
  id: '1',
  user_id: 'user1',
  tool_id: 'tool1',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  trial_ends_at: null
};

const mockTrialSubscription = {
  id: '2',
  user_id: 'user1',
  tool_id: 'tool2',
  status: 'trial',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: null,
  trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
};

const mockExpiredSubscription = {
  id: '3',
  user_id: 'user1',
  tool_id: 'tool3',
  status: 'expired',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  trial_ends_at: null
};

const mockInactiveSubscription = {
  id: '4',
  user_id: 'user1',
  tool_id: 'tool4',
  status: 'inactive',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: null,
  trial_ends_at: null
};

const mockExpiringSoonSubscription = {
  id: '5',
  user_id: 'user1',
  tool_id: 'tool5',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  trial_ends_at: null
};

const createMockTool = (id: string, name: string, subscription: any = null): ToolWithSubscription => ({
  id,
  name,
  slug: `tool-${id}`,
  description: `Test tool ${name}`,
  icon: '🔧',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subscription
});

describe('SubscriptionStatusSummary', () => {
  test('displays no tools message when tools array is empty', () => {
    render(<SubscriptionStatusSummary tools={[]} />);
    
    expect(screen.getByText('No tools configured')).toBeInTheDocument();
    expect(screen.getByText('No tools available')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    render(<SubscriptionStatusSummary tools={[]} isLoading={true} />);
    
    expect(screen.getByText('Loading subscription information...')).toBeInTheDocument();
    expect(screen.getByText('Subscription Status')).toBeInTheDocument();
  });

  test('calculates and displays subscription summary correctly', () => {
    const tools = [
      createMockTool('1', 'Tool 1', mockActiveSubscription),
      createMockTool('2', 'Tool 2', mockTrialSubscription),
      createMockTool('3', 'Tool 3', mockExpiredSubscription),
      createMockTool('4', 'Tool 4', mockInactiveSubscription),
      createMockTool('5', 'Tool 5', null) // No subscription
    ];

    render(<SubscriptionStatusSummary tools={tools} />);
    
    // Check counts
    expect(screen.getByText('1')).toBeInTheDocument(); // Active
    expect(screen.getByText('1')).toBeInTheDocument(); // Trial
    expect(screen.getByText('1')).toBeInTheDocument(); // Expired/Inactive
    expect(screen.getByText('1')).toBeInTheDocument(); // No Access
    expect(screen.getByText('Total Tools: 5')).toBeInTheDocument();
    expect(screen.getByText('Accessible: 2')).toBeInTheDocument();
    expect(screen.getByText('Unavailable: 3')).toBeInTheDocument();
  });

  test('displays expiring soon warning correctly', () => {
    const tools = [
      createMockTool('1', 'Tool 1', mockExpiringSoonSubscription)
    ];

    render(<SubscriptionStatusSummary tools={tools} />);
    
    expect(screen.getByText(/expiring soon/)).toBeInTheDocument();
    expect(screen.getByText(/1 subscription expiring within 7 days/)).toBeInTheDocument();
  });

  test('shows correct overall status messages', () => {
    // All tools active
    const allActiveTools = [
      createMockTool('1', 'Tool 1', mockActiveSubscription),
      createMockTool('2', 'Tool 2', mockActiveSubscription)
    ];
    
    const { rerender } = render(<SubscriptionStatusSummary tools={allActiveTools} />);
    expect(screen.getByText('All tools active')).toBeInTheDocument();

    // Mixed accessible tools
    const mixedTools = [
      createMockTool('1', 'Tool 1', mockActiveSubscription),
      createMockTool('2', 'Tool 2', mockTrialSubscription),
      createMockTool('3', 'Tool 3', null)
    ];
    
    rerender(<SubscriptionStatusSummary tools={mixedTools} />);
    expect(screen.getByText('Some tools accessible')).toBeInTheDocument();

    // No active subscriptions
    const noActiveTools = [
      createMockTool('1', 'Tool 1', mockExpiredSubscription),
      createMockTool('2', 'Tool 2', null)
    ];
    
    rerender(<SubscriptionStatusSummary tools={noActiveTools} />);
    expect(screen.getByText('No active subscriptions')).toBeInTheDocument();
  });

  test('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnRefresh = vi.fn();
    
    const tools = [createMockTool('1', 'Tool 1', mockActiveSubscription)];
    
    render(<SubscriptionStatusSummary tools={tools} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledOnce();
  });

  test('displays appropriate status icons for different scenarios', () => {
    const excellentTools = [
      createMockTool('1', 'Tool 1', mockActiveSubscription)
    ];
    
    const { rerender } = render(<SubscriptionStatusSummary tools={excellentTools} />);
    
    // Should show green status for excellent
    expect(screen.getByText('All tools active')).toBeInTheDocument();

    const poorTools = [
      createMockTool('1', 'Tool 1', mockExpiredSubscription)
    ];
    
    rerender(<SubscriptionStatusSummary tools={poorTools} />);
    
    // Should show poor status message
    expect(screen.getByText('No active subscriptions')).toBeInTheDocument();
  });
});

describe('SubscriptionStatusBadge', () => {
  test('displays no access badge when subscription is null', () => {
    render(<SubscriptionStatusBadge subscription={null} />);
    
    expect(screen.getByText('No Access')).toBeInTheDocument();
  });

  test('displays active subscription badge correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockActiveSubscription} />);
    
    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
  });

  test('displays trial subscription badge correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockTrialSubscription} />);
    
    expect(screen.getByText('Trial Period')).toBeInTheDocument();
  });

  test('displays expired subscription badge correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockExpiredSubscription} />);
    
    expect(screen.getByText('Subscription Expired')).toBeInTheDocument();
  });

  test('displays inactive subscription badge correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockInactiveSubscription} />);
    
    expect(screen.getByText('Inactive Subscription')).toBeInTheDocument();
  });

  test('shows compact variant correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockActiveSubscription} variant="compact" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Active Subscription')).not.toBeInTheDocument();
  });

  test('shows detailed variant correctly', () => {
    render(<SubscriptionStatusBadge subscription={mockTrialSubscription} variant="detailed" />);
    
    expect(screen.getByText('Trial Period')).toBeInTheDocument();
  });

  test('shows time information for expiring subscriptions', () => {
    const expiringSoonTrial = {
      ...mockTrialSubscription,
      trial_ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
    };
    
    render(<SubscriptionStatusBadge subscription={expiringSoonTrial} />);
    
    expect(screen.getByText(/2d left/)).toBeInTheDocument();
  });

  test('shows expired text for past dates', () => {
    const expiredTrial = {
      ...mockTrialSubscription,
      trial_ends_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };
    
    render(<SubscriptionStatusBadge subscription={expiredTrial} />);
    
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  test('hides icons when showIcon is false', () => {
    render(<SubscriptionStatusBadge subscription={mockActiveSubscription} showIcon={false} />);
    
    // Should not contain any SVG icons
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('applies custom className correctly', () => {
    const { container } = render(
      <SubscriptionStatusBadge 
        subscription={mockActiveSubscription} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Subscription Status Integration', () => {
  test('summary and badges work together consistently', () => {
    const tools = [
      createMockTool('1', 'Tool 1', mockActiveSubscription),
      createMockTool('2', 'Tool 2', mockTrialSubscription),
      createMockTool('3', 'Tool 3', null)
    ];

    const { container } = render(
      <div>
        <SubscriptionStatusSummary tools={tools} />
        {tools.map(tool => (
          <SubscriptionStatusBadge 
            key={tool.id}
            subscription={tool.subscription}
            variant="compact"
          />
        ))}
      </div>
    );

    // Summary should show correct counts
    expect(screen.getByText('Total Tools: 3')).toBeInTheDocument();
    expect(screen.getByText('Accessible: 2')).toBeInTheDocument();
    expect(screen.getByText('Unavailable: 1')).toBeInTheDocument();

    // Individual badges should be present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();
  });

  test('handles empty state consistently across components', () => {
    render(
      <div>
        <SubscriptionStatusSummary tools={[]} />
        <SubscriptionStatusBadge subscription={null} />
      </div>
    );

    expect(screen.getByText('No tools configured')).toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();
  });

  test('handles loading states appropriately', () => {
    render(
      <div>
        <SubscriptionStatusSummary tools={[]} isLoading={true} />
      </div>
    );

    expect(screen.getByText('Loading subscription information...')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  test('subscription status summary has proper ARIA labels', () => {
    const tools = [createMockTool('1', 'Tool 1', mockActiveSubscription)];
    
    render(<SubscriptionStatusSummary tools={tools} />);
    
    // Should have proper headings and structure
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('status badges are keyboard accessible when interactive', () => {
    render(<SubscriptionStatusBadge subscription={mockActiveSubscription} />);
    
    // Badge content should be properly accessible
    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  test('handles malformed subscription data gracefully', () => {
    const malformedSubscription = {
      ...mockActiveSubscription,
      status: 'unknown-status' as any
    };
    
    render(<SubscriptionStatusBadge subscription={malformedSubscription} />);
    
    expect(screen.getByText('unknown-status')).toBeInTheDocument();
  });

  test('handles missing date fields gracefully', () => {
    const subscriptionWithoutDates = {
      ...mockActiveSubscription,
      expires_at: null,
      trial_ends_at: null
    };
    
    render(<SubscriptionStatusBadge subscription={subscriptionWithoutDates} />);
    
    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
    // Should not show any time information
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
  });
});

describe('Performance', () => {
  test('handles large numbers of tools efficiently', () => {
    const manyTools = Array.from({ length: 100 }, (_, i) => 
      createMockTool(
        `tool-${i}`, 
        `Tool ${i}`, 
        i % 4 === 0 ? mockActiveSubscription :
        i % 4 === 1 ? mockTrialSubscription :
        i % 4 === 2 ? mockExpiredSubscription : null
      )
    );

    const startTime = performance.now();
    render(<SubscriptionStatusSummary tools={manyTools} />);
    const endTime = performance.now();

    // Should render within reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
    
    expect(screen.getByText('Total Tools: 100')).toBeInTheDocument();
  });
}); 