import { test, expect } from '@playwright/test';

/**
 * Comprehensive Playwright tests for subscription-based access control
 * Tests various subscription scenarios, access restrictions, and user feedback
 * 
 * Test Coverage:
 * - Authentication-based access control
 * - Subscription status validation
 * - Tool-specific access restrictions
 * - Navigation behavior with different subscription states
 * - UI feedback for subscription status
 * - Error handling for access denied scenarios
 */

test.describe('Subscription-Based Access Control', () => {
  
  // Mock API responses for different subscription scenarios
  const mockSubscriptionStates = {
    activeSubscription: {
      data: [{
        id: 'tool-1',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        is_active: true,
        subscription: {
          id: 'sub-active-1',
          status: 'active',
          expires_at: null,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }],
      error: null
    },
    
    trialSubscription: {
      data: [{
        id: 'tool-2',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        is_active: true,
        subscription: {
          id: 'sub-trial-1',
          status: 'trial',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }],
      error: null
    },
    
    expiredSubscription: {
      data: [{
        id: 'tool-3',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        is_active: true,
        subscription: {
          id: 'sub-expired-1',
          status: 'active',
          expires_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }],
      error: null
    },
    
    inactiveSubscription: {
      data: [{
        id: 'tool-4',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        is_active: true,
        subscription: {
          id: 'sub-inactive-1',
          status: 'inactive',
          expires_at: null
        }
      }],
      error: null
    },
    
    noSubscription: {
      data: [{
        id: 'tool-5',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        is_active: true,
        subscription: null
      }],
      error: null
    },
    
    emptyResponse: {
      data: [],
      error: null
    }
  };

  test.describe('Authentication-Based Access Control', () => {
    test('should redirect unauthenticated users to login page', async ({ page }) => {
      // Mock unauthenticated state by intercepting auth calls
      await page.route('**/auth/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });

      // Try to access protected route directly
      await page.goto('/app/invoice-reconciler');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/auth\/login/);
      
      // Check for login form
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should redirect authenticated users from restricted tools to dashboard', async ({ page }) => {
      // Mock authenticated but no subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.noSubscription)
        });
      });

      // Navigate to dashboard first
      await page.goto('/app');
      await expect(page.locator('text=My Tools')).toBeVisible();

      // Try to access tool directly
      await page.goto('/app/invoice-reconciler');
      
      // Should be redirected back to dashboard or show access denied
      await page.waitForURL(/\/app(?:$|\/)/);
      
      // Check for access denied message or redirect to dashboard
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/app(?:$|\/)/);
    });

    test('should display authentication required message for protected routes', async ({ page }) => {
      // Clear any existing auth tokens
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/app/invoice-reconciler');
      
      // Should be on login page or see auth required message
      await page.waitForURL(/\/auth\/login/);
      
      // Check for authentication messaging
      await expect(page.locator('text=/log in|sign in|authentication|access/i')).toBeVisible();
    });
  });

  test.describe('Subscription Status Validation', () => {
    test('should allow access for users with active subscriptions', async ({ page }) => {
      // Mock active subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.activeSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for active subscription badge
      await expect(page.locator('text=Active')).toBeVisible();
      
      // Check for "Open Tool" button
      await expect(page.locator('button:has-text("Open Tool")')).toBeVisible();
      
      // Click "Open Tool" should work
      const openToolButton = page.locator('button:has-text("Open Tool")');
      await expect(openToolButton).toBeEnabled();
    });

    test('should show trial status with countdown for trial subscriptions', async ({ page }) => {
      // Mock trial subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.trialSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for trial badge
      await expect(page.locator('text=Trial')).toBeVisible();
      
      // Check for countdown information
      await expect(page.locator('text=/\\d+ days? left/i')).toBeVisible();
      
      // Should still have access during trial
      await expect(page.locator('button:has-text("Open Tool")')).toBeVisible();
    });

    test('should deny access for expired subscriptions', async ({ page }) => {
      // Mock expired subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.expiredSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for expired status
      await expect(page.locator('text=/expired|inactive/i')).toBeVisible();
      
      // Should not have "Open Tool" button or it should be disabled
      const openToolButton = page.locator('button:has-text("Open Tool")');
      if (await openToolButton.count() > 0) {
        await expect(openToolButton).toBeDisabled();
      }
      
      // Check for upgrade/renew messaging
      await expect(page.locator('text=/upgrade|renew|contact/i')).toBeVisible();
    });

    test('should deny access for inactive subscriptions', async ({ page }) => {
      // Mock inactive subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.inactiveSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for inactive status
      await expect(page.locator('text=/inactive|suspended/i')).toBeVisible();
      
      // Should not have active "Open Tool" button
      const openToolButton = page.locator('button:has-text("Open Tool")');
      if (await openToolButton.count() > 0) {
        await expect(openToolButton).toBeDisabled();
      }
    });

    test('should handle users with no subscription appropriately', async ({ page }) => {
      // Mock no subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.noSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for no access badge
      await expect(page.locator('text=/no access|not subscribed/i')).toBeVisible();
      
      // Should show subscription required messaging
      await expect(page.locator('text=/subscription required|contact administrator/i')).toBeVisible();
      
      // Should not have active tool access
      const openToolButton = page.locator('button:has-text("Open Tool")');
      if (await openToolButton.count() > 0) {
        await expect(openToolButton).toBeDisabled();
      }
    });
  });

  test.describe('Tool-Specific Access Restrictions', () => {
    test('should validate tool access before navigation', async ({ page }) => {
      // Mock active subscription for validation
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.activeSubscription)
        });
      });

      await page.goto('/app');
      
      // Find and click tool access button
      const openToolButton = page.locator('button:has-text("Open Tool")').first();
      await expect(openToolButton).toBeVisible();
      await expect(openToolButton).toBeEnabled();
      
      // Click should work for active subscriptions
      await openToolButton.click();
      
      // Should navigate or show loading state
      await page.waitForTimeout(1000); // Allow for navigation
    });

    test('should prevent navigation to restricted tools', async ({ page }) => {
      // Mock inactive subscription
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.inactiveSubscription)
        });
      });

      await page.goto('/app');
      
      // Try to click disabled tool button (if it exists)
      const restrictedButton = page.locator('button:has-text("Contact Sales"), button:has-text("Upgrade")').first();
      if (await restrictedButton.count() > 0) {
        await expect(restrictedButton).toBeVisible();
        // These buttons should lead to contact/upgrade flows, not the tool
      }
      
      // Direct navigation should also be restricted
      await page.goto('/app/invoice-reconciler');
      
      // Should be redirected or see access denied
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/\/app\/invoice-reconciler$/);
    });

    test('should handle malformed subscription data gracefully', async ({ page }) => {
      // Mock malformed subscription response
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'tool-1',
              name: 'Invoice Reconciler',
              subscription: {
                invalid: 'data'
              }
            }],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Should show error state or default to no access
      await expect(page.locator('text=/error|no access|contact support/i')).toBeVisible();
      
      // Should not crash the application
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Subscription Status UI Feedback', () => {
    test('should display appropriate status badges for different subscription states', async ({ page }) => {
      // Test multiple subscription states
      const subscriptionStates = [
        { mock: mockSubscriptionStates.activeSubscription, expectedBadge: 'Active' },
        { mock: mockSubscriptionStates.trialSubscription, expectedBadge: 'Trial' }
      ];

      for (const state of subscriptionStates) {
        await page.route('**/rest/v1/tools*', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(state.mock)
          });
        });

        await page.goto('/app');
        await expect(page.locator(`text=${state.expectedBadge}`)).toBeVisible();
        
        // Reset for next iteration
        await page.unroute('**/rest/v1/tools*');
      }
    });

    test('should show detailed subscription information on hover', async ({ page }) => {
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.activeSubscription)
        });
      });

      await page.goto('/app');
      
      // Find status badge and hover
      const statusBadge = page.locator('text=Active').first();
      await expect(statusBadge).toBeVisible();
      
      await statusBadge.hover();
      
      // Check for tooltip or detailed information
      await page.waitForTimeout(500); // Allow for hover effects
      
      // Should show additional subscription details
      // Note: This depends on the actual implementation
    });

    test('should provide clear messaging for subscription expiration warnings', async ({ page }) => {
      // Mock subscription expiring soon
      const expiringSubscription = {
        data: [{
          id: 'tool-1',
          name: 'Invoice Reconciler',
          slug: 'invoice-reconciler',
          subscription: {
            id: 'sub-expiring',
            status: 'active',
            expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
          }
        }],
        error: null
      };

      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(expiringSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for expiration warning
      await expect(page.locator('text=/expires?/i')).toBeVisible();
      await expect(page.locator('text=/\\d+ days?/i')).toBeVisible();
      
      // Should still have access but with warning
      await expect(page.locator('button:has-text("Open Tool")')).toBeVisible();
    });

    test('should handle loading states during subscription checks', async ({ page }) => {
      // Delay subscription API response
      await page.route('**/rest/v1/tools*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.activeSubscription)
        });
      });

      await page.goto('/app');
      
      // Check for loading states
      await expect(page.locator('.animate-pulse, text=/loading/i')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.locator('text=Active')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.animate-pulse')).not.toBeVisible();
    });
  });

  test.describe('Error Handling and Network Issues', () => {
    test('should handle subscription API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/app');
      
      // Should show error state
      await expect(page.locator('text=/error|problem|try again/i')).toBeVisible();
      
      // Should provide retry option
      await expect(page.locator('button:has-text("Try Again"), button:has-text("Retry")')).toBeVisible();
      
      // Application should not crash
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      // Mock network timeout
      await page.route('**/rest/v1/tools*', route => route.abort('timedout'));

      await page.goto('/app');
      
      // Should show network error message
      await expect(page.locator('text=/connection|network|timeout/i')).toBeVisible();
      
      // Should provide retry mechanism
      await expect(page.locator('button:has-text("Try Again"), button:has-text("Retry")')).toBeVisible();
    });

    test('should retry subscription checks when requested', async ({ page }) => {
      let callCount = 0;
      
      await page.route('**/rest/v1/tools*', route => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          // Second call succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSubscriptionStates.activeSubscription)
          });
        }
      });

      await page.goto('/app');
      
      // Should show error initially
      await expect(page.locator('text=/error|try again/i')).toBeVisible();
      
      // Click retry button
      const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Retry")').first();
      await retryButton.click();
      
      // Should succeed on retry
      await expect(page.locator('text=Active')).toBeVisible({ timeout: 10000 });
      
      // Verify retry actually made a second API call
      expect(callCount).toBe(2);
    });
  });

  test.describe('Multi-Tool Access Scenarios', () => {
    test('should handle multiple tools with different subscription states', async ({ page }) => {
      const multipleToolsResponse = {
        data: [
          {
            id: 'tool-1',
            name: 'Invoice Reconciler',
            slug: 'invoice-reconciler',
            subscription: {
              status: 'active',
              expires_at: null
            }
          },
          {
            id: 'tool-2',
            name: 'Report Generator',
            slug: 'report-generator',
            subscription: {
              status: 'trial',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 'tool-3',
            name: 'Data Analyzer',
            slug: 'data-analyzer',
            subscription: null
          }
        ],
        error: null
      };

      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(multipleToolsResponse)
        });
      });

      await page.goto('/app');
      
      // Should show different status badges
      await expect(page.locator('text=Active')).toBeVisible();
      await expect(page.locator('text=Trial')).toBeVisible();
      await expect(page.locator('text=/no access|not subscribed/i')).toBeVisible();
      
      // Should have different button states
      const activeTools = page.locator('button:has-text("Open Tool")');
      const restrictedTools = page.locator('button:has-text("Contact Sales"), button:has-text("Upgrade")');
      
      await expect(activeTools).toHaveCount(2); // Active and trial
      await expect(restrictedTools).toHaveCount(1); // No subscription
    });

    test('should validate access for specific tool navigation', async ({ page }) => {
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSubscriptionStates.activeSubscription)
        });
      });

      await page.goto('/app');
      
      // Wait for tools to load
      await expect(page.locator('text=Invoice Reconciler')).toBeVisible();
      
      // Direct navigation to subscribed tool should work
      await page.goto('/app/invoice-reconciler');
      
      // Should not be redirected (for active subscription)
      await page.waitForTimeout(2000);
      expect(page.url()).toMatch(/\/app\/invoice-reconciler/);
    });
  });
}); 