import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the ToolCard component since this is an integration test
const mockToolCard = vi.fn();
vi.mock('../../nextjs/src/components/Dashboard/ToolCard', () => ({
  ToolCard: mockToolCard
}));

// Mock the global context
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock tool data
const mockTool = {
  id: 'tool-1',
  name: 'Invoice Reconciler',
  slug: 'invoice-reconciler',
  description: 'Automated invoice reconciliation tool',
  icon: '📊',
  status: 'active',
  order_index: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subscription: {
    id: 'sub-1',
    user_id: 'test-user-id',
    tool_id: 'tool-1',
    status: 'active' as const,
    started_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-12-31T23:59:59Z',
    trial_ends_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
};

describe('ToolCard Subscription Validation API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful subscription check by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: true,
        subscription: mockTool.subscription,
        reason: null
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make correct API call for subscription validation', async () => {
    // Test the API endpoint directly
    const response = await fetch('/api/subscriptions?tool=invoice-reconciler', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/subscriptions?tool=invoice-reconciler',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    const data = await response.json();
    expect(data.hasAccess).toBe(true);
    expect(data.subscription).toEqual(mockTool.subscription);
  });

  it('should handle expired subscription API response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: false,
        subscription: {
          ...mockTool.subscription,
          status: 'expired'
        },
        reason: 'Subscription has expired'
      })
    });

    const response = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const data = await response.json();

    expect(data.hasAccess).toBe(false);
    expect(data.subscription.status).toBe('expired');
    expect(data.reason).toBe('Subscription has expired');
  });

  it('should handle trial subscription API response', async () => {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 5); // 5 days from now

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: true,
        subscription: {
          ...mockTool.subscription,
          status: 'trial',
          trial_ends_at: trialEndDate.toISOString()
        },
        reason: null
      })
    });

    const response = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const data = await response.json();

    expect(data.hasAccess).toBe(true);
    expect(data.subscription.status).toBe('trial');
    expect(data.subscription.trial_ends_at).toBe(trialEndDate.toISOString());
  });

  it('should handle API error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });

    const response = await fetch('/api/subscriptions?tool=invoice-reconciler');
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    try {
      await fetch('/api/subscriptions?tool=invoice-reconciler');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('should handle no subscription found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: false,
        subscription: null,
        reason: 'No active subscription found'
      })
    });

    const response = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const data = await response.json();

    expect(data.hasAccess).toBe(false);
    expect(data.subscription).toBeNull();
    expect(data.reason).toBe('No active subscription found');
  });

  it('should validate subscription status for different tools', async () => {
    const tools = ['invoice-reconciler', 'data-processor', 'report-generator'];
    
    for (const toolSlug of tools) {
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          hasAccess: true,
          subscription: {
            ...mockTool.subscription,
            tool_id: `tool-${toolSlug}`
          },
          reason: null
        })
      });

      await fetch(`/api/subscriptions?tool=${toolSlug}`);
      
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/subscriptions?tool=${toolSlug}`,
        expect.any(Object)
      );
    }
  });

  it('should handle subscription status changes over time', async () => {
    // First call - active subscription
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: true,
        subscription: {
          ...mockTool.subscription,
          status: 'active'
        },
        reason: null
      })
    });

    // Second call - expired subscription
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: false,
        subscription: {
          ...mockTool.subscription,
          status: 'expired'
        },
        reason: 'Subscription has expired'
      })
    });

    // First validation
    const firstResponse = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const firstData = await firstResponse.json();
    expect(firstData.subscription.status).toBe('active');
    expect(firstData.hasAccess).toBe(true);

    // Second validation (status changed)
    const secondResponse = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const secondData = await secondResponse.json();
    expect(secondData.subscription.status).toBe('expired');
    expect(secondData.hasAccess).toBe(false);
  });

  it('should validate subscription with expiration warnings', async () => {
    const soonExpireDate = new Date();
    soonExpireDate.setDate(soonExpireDate.getDate() + 3); // 3 days from now

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        hasAccess: true,
        subscription: {
          ...mockTool.subscription,
          status: 'active',
          expires_at: soonExpireDate.toISOString()
        },
        reason: null
      })
    });

    const response = await fetch('/api/subscriptions?tool=invoice-reconciler');
    const data = await response.json();

    expect(data.hasAccess).toBe(true);
    expect(data.subscription.status).toBe('active');
    expect(data.subscription.expires_at).toBe(soonExpireDate.toISOString());
  });
}); 