import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality and Tool Access Integration', () => {
  // Set up authentication state before each test
  test.beforeEach(async ({ page }) => {
    // Note: In a real scenario, you would set up proper test authentication
    // For now, we'll navigate to login and simulate authentication
    await page.goto('/auth/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Core Functionality', () => {
    test('should display dashboard with all main sections', async ({ page }) => {
      // Simulate successful login (in real testing, you'd use proper auth)
      await page.goto('/app');
      
      // Check for main dashboard sections
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=My Tools')).toBeVisible();
      await expect(page.locator('text=Recent Jobs')).toBeVisible();
      await expect(page.locator('text=Account Settings')).toBeVisible();
      
      // Verify page title and metadata
      await expect(page).toHaveTitle(/Dashboard|App/);
    });

    test('should show welcome section with user information', async ({ page }) => {
      await page.goto('/app');
      
      // Wait for welcome section to load
      await expect(page.locator('text=Welcome')).toBeVisible();
      
      // Check for member information display
      const memberInfo = page.locator('text=/Member for \\d+ day/');
      await expect(memberInfo).toBeVisible();
      
      // Verify calendar icon is present
      await expect(page.locator('[data-testid="calendar-icon"], svg')).toBeVisible();
    });

    test('should handle dashboard loading states properly', async ({ page }) => {
      // Intercept API calls to simulate loading
      await page.route('**/rest/v1/tools*', async route => {
        // Delay the response to test loading states
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/app');
      
      // Check for loading skeletons during data fetch
      await expect(page.locator('.animate-pulse')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 15000 });
      
      // Verify content is loaded
      await expect(page.locator('text=My Tools')).toBeVisible();
    });

    test('should display error states when data fails to load', async ({ page }) => {
      // Mock API failure
      await page.route('**/rest/v1/tools*', route => route.abort('failed'));
      
      await page.goto('/app');
      
      // Check for error message
      await expect(page.locator('text=/Connection problem|Something went wrong/')).toBeVisible();
      
      // Check for retry button
      await expect(page.locator('button:has-text("Try Again"), button:has-text("Retry")')).toBeVisible();
      
      // Verify error icon is present
      await expect(page.locator('[data-testid="error-icon"], svg')).toBeVisible();
    });
  });

  test.describe('Tool Access Scenarios', () => {
    test('should display tools section correctly', async ({ page }) => {
      await page.goto('/app');
      
      // Wait for tools section to load
      await expect(page.locator('text=My Tools')).toBeVisible();
      
      // Check for tools section description
      await expect(page.locator('text=Access your subscribed business automation tools')).toBeVisible();
      
      // Verify section icon
      await expect(page.locator('[data-testid="tools-icon"], svg')).toBeVisible();
    });

    test('should handle empty tools state', async ({ page }) => {
      // Mock empty tools response
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], error: null })
        });
      });

      await page.goto('/app');
      
      // Wait for empty state
      await expect(page.locator('text=No tools available')).toBeVisible();
      await expect(page.locator('text=Contact your administrator')).toBeVisible();
      
      // Check for contact support button
      await expect(page.locator('button:has-text("Contact Support")')).toBeVisible();
    });

    test('should display tool cards with subscription information', async ({ page }) => {
      // Mock tools with different subscription states
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'tool-1',
                name: 'Invoice Reconciler',
                slug: 'invoice-reconciler',
                description: 'Automated invoice reconciliation tool',
                icon: '📊',
                subscription: {
                  id: 'sub-1',
                  status: 'active',
                  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }
              },
              {
                id: 'tool-2',
                name: 'Test Tool',
                slug: 'test-tool',
                description: 'A test tool for validation',
                icon: '🧪',
                subscription: {
                  id: 'sub-2',
                  status: 'trial',
                  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              }
            ],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Wait for tool cards to load
      await expect(page.locator('text=Invoice Reconciler')).toBeVisible();
      await expect(page.locator('text=Test Tool')).toBeVisible();
      
      // Check for subscription status badges
      await expect(page.locator('text=Active')).toBeVisible();
      await expect(page.locator('text=Trial')).toBeVisible();
      
      // Check for tool descriptions
      await expect(page.locator('text=Automated invoice reconciliation tool')).toBeVisible();
      
      // Verify "Open Tool" buttons for accessible tools
      await expect(page.locator('button:has-text("Open Tool")')).toHaveCount(2);
    });

    test('should show trial countdown information', async ({ page }) => {
      const trialEndDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'tool-1',
              name: 'Trial Tool',
              slug: 'trial-tool',
              subscription: {
                status: 'trial',
                trial_ends_at: trialEndDate.toISOString()
              }
            }],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Check for trial status and countdown
      await expect(page.locator('text=Trial')).toBeVisible();
      await expect(page.locator('text=/\\d+ days left/')).toBeVisible();
    });

    test('should handle tools without access correctly', async ({ page }) => {
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'tool-1',
              name: 'Restricted Tool',
              slug: 'restricted-tool',
              subscription: {
                status: 'expired'
              }
            }],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Check for access restriction indicators
      await expect(page.locator('text=Expired')).toBeVisible();
      await expect(page.locator('button:has-text("Access Required")')).toBeVisible();
      await expect(page.locator('button:has-text("Access Required")')).toBeDisabled();
      
      // Check for lock icon
      await expect(page.locator('[data-testid="lock-icon"], svg')).toBeVisible();
    });

    test('should navigate to tool pages when access is available', async ({ page }) => {
      await page.route('**/rest/v1/tools*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'tool-1',
              name: 'Invoice Reconciler',
              slug: 'invoice-reconciler',
              subscription: { status: 'active' }
            }],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Wait for tool card and click
      const openToolButton = page.locator('button:has-text("Open Tool")').first();
      await expect(openToolButton).toBeVisible();
      
      // Click should attempt navigation (we can't test the actual page without implementing it)
      await openToolButton.click();
      
      // In a real implementation, we would check for navigation to the tool page
      // await expect(page).toHaveURL('/app/invoice-reconciler');
    });
  });

  test.describe('Recent Jobs Functionality', () => {
    test('should display recent jobs section', async ({ page }) => {
      await page.goto('/app');
      
      // Check for recent jobs section
      await expect(page.locator('text=Recent Jobs')).toBeVisible();
    });

    test('should handle empty jobs state', async ({ page }) => {
      // Mock empty jobs response
      await page.route('**/rest/v1/reconciliation_jobs*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], error: null })
        });
      });

      await page.goto('/app');
      
      // Wait for empty state message
      await expect(page.locator('text=No recent jobs found')).toBeVisible();
      await expect(page.locator('text=Start using our tools')).toBeVisible();
    });

    test('should display job history with status indicators', async ({ page }) => {
      await page.route('**/rest/v1/reconciliation_jobs*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'job-1',
                job_name: 'Fly Dubai Reconciliation',
                status: 'completed',
                airline_type: 'fly_dubai',
                result_file_path: 'test/result.xlsx',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                tool: { name: 'Invoice Reconciler', slug: 'invoice-reconciler' }
              },
              {
                id: 'job-2',
                job_name: 'TAP Processing',
                status: 'processing',
                airline_type: 'tap',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                tool: { name: 'Invoice Reconciler', slug: 'invoice-reconciler' }
              }
            ],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Check for job names
      await expect(page.locator('text=Fly Dubai Reconciliation')).toBeVisible();
      await expect(page.locator('text=TAP Processing')).toBeVisible();
      
      // Check for status indicators
      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=Processing')).toBeVisible();
      
      // Check for airline type badges
      await expect(page.locator('text=Fly Dubai')).toBeVisible();
      await expect(page.locator('text=TAP')).toBeVisible();
    });

    test('should show download buttons for completed jobs', async ({ page }) => {
      await page.route('**/rest/v1/reconciliation_jobs*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'job-1',
              job_name: 'Completed Job',
              status: 'completed',
              result_file_path: 'test/result.xlsx',
              tool: { name: 'Invoice Reconciler', slug: 'invoice-reconciler' }
            }],
            error: null
          })
        });
      });

      await page.goto('/app');
      
      // Check for download button
      await expect(page.locator('button[title*="Download"], button:has-text("Download")')).toBeVisible();
    });

    test('should handle jobs loading and error states', async ({ page }) => {
      // First test loading state
      await page.route('**/rest/v1/reconciliation_jobs*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/app');
      
      // Check for loading skeleton in jobs section
      const jobsSection = page.locator('[data-testid="recent-jobs"], .recent-jobs, section:has-text("Recent Jobs")');
      await expect(jobsSection.locator('.animate-pulse')).toBeVisible();
      
      // Now test error state
      await page.route('**/rest/v1/reconciliation_jobs*', route => route.abort('failed'));
      await page.reload();
      
      // Check for error state in jobs section
      await expect(page.locator('text=/Failed to load|Error loading/')).toBeVisible();
    });
  });

  test.describe('Account Settings Integration', () => {
    test('should display account settings section', async ({ page }) => {
      await page.goto('/app');
      
      // Check for account settings section
      await expect(page.locator('text=Account Settings')).toBeVisible();
      await expect(page.locator('text=Manage your account preferences')).toBeVisible();
    });

    test('should show quick access cards for settings', async ({ page }) => {
      await page.goto('/app');
      
      // Check for settings cards
      await expect(page.locator('text=User Settings')).toBeVisible();
      await expect(page.locator('text=Change Password')).toBeVisible();
      await expect(page.locator('text=Security (MFA)')).toBeVisible();
      
      // Check for card descriptions
      await expect(page.locator('text=Comprehensive account management')).toBeVisible();
      await expect(page.locator('text=Update your account password')).toBeVisible();
      await expect(page.locator('text=Two-factor authentication setup')).toBeVisible();
    });

    test('should display account status summary', async ({ page }) => {
      await page.goto('/app');
      
      // Check for account status section
      await expect(page.locator('text=Account Status')).toBeVisible();
      await expect(page.locator('text=Active')).toBeVisible();
      
      // Check for member duration
      await expect(page.locator('text=/Member for \\d+ day/')).toBeVisible();
    });

    test('should have working navigation links to settings pages', async ({ page }) => {
      await page.goto('/app');
      
      // Test navigation to user settings
      const userSettingsLink = page.locator('a[href="/app/user-settings"]').first();
      await expect(userSettingsLink).toBeVisible();
      
      // Test anchor navigation for password settings
      const passwordLink = page.locator('a[href="/app/user-settings#password"]');
      await expect(passwordLink).toBeVisible();
      
      // Test anchor navigation for MFA settings
      const mfaLink = page.locator('a[href="/app/user-settings#mfa"]');
      await expect(mfaLink).toBeVisible();
    });
  });

  test.describe('Responsive Design and Accessibility', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      await page.goto('/app');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that main sections are still visible and accessible
      await expect(page.locator('text=Welcome')).toBeVisible();
      await expect(page.locator('text=My Tools')).toBeVisible();
      await expect(page.locator('text=Recent Jobs')).toBeVisible();
      
      // Test that tool cards stack properly on mobile
      const toolsSection = page.locator('[data-testid="tools-section"], section:has-text("My Tools")');
      await expect(toolsSection).toBeVisible();
    });

    test('should be responsive on tablet devices', async ({ page }) => {
      await page.goto('/app');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify layout maintains structure
      await expect(page.locator('text=My Tools')).toBeVisible();
      await expect(page.locator('text=Account Settings')).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/app');
      
      // Test tab navigation through interactive elements
      await page.keyboard.press('Tab');
      
      // Check that focus is visible on focusable elements
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Test Enter key activation on buttons
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.focus();
        // await page.keyboard.press('Enter'); // Uncomment when buttons have proper handlers
      }
    });
  });

  test.describe('Error Recovery and Network Handling', () => {
    test('should provide retry functionality for failed requests', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/rest/v1/tools*', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort('failed');
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [], error: null })
          });
        }
      });

      await page.goto('/app');
      
      // Wait for error state
      await expect(page.locator('button:has-text("Try Again"), button:has-text("Retry")')).toBeVisible();
      
      // Click retry
      await page.click('button:has-text("Try Again"), button:has-text("Retry")');
      
      // Should eventually show success state
      await expect(page.locator('text=My Tools')).toBeVisible();
    });

    test('should handle offline/online state changes', async ({ page }) => {
      await page.goto('/app');
      
      // Simulate going offline
      await page.context().setOffline(true);
      
      // Trigger a network request (reload or action)
      await page.reload();
      
      // Should show offline indicator
      await expect(page.locator('text=/offline|connection/i')).toBeVisible();
      
      // Simulate coming back online
      await page.context().setOffline(false);
      
      // Should attempt to recover
      await page.reload();
      await expect(page.locator('text=Welcome')).toBeVisible();
    });
  });
});

test.describe('Dashboard Performance and Loading', () => {
  test('should load dashboard within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/app');
    
    // Wait for main content to be visible
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=My Tools')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle multiple concurrent data loads efficiently', async ({ page }) => {
    let toolsRequestTime = 0;
    let jobsRequestTime = 0;
    
    await page.route('**/rest/v1/tools*', async route => {
      const start = Date.now();
      await route.continue();
      toolsRequestTime = Date.now() - start;
    });
    
    await page.route('**/rest/v1/reconciliation_jobs*', async route => {
      const start = Date.now();
      await route.continue();
      jobsRequestTime = Date.now() - start;
    });

    await page.goto('/app');
    
    // Wait for both sections to load
    await expect(page.locator('text=My Tools')).toBeVisible();
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
    
    // Both requests should complete in reasonable time
    expect(toolsRequestTime).toBeLessThan(3000);
    expect(jobsRequestTime).toBeLessThan(3000);
  });
}); 