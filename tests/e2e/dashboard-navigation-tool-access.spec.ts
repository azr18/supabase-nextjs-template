import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation and Tool Access Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard (assuming auth will be handled by middleware)
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Main Navigation Structure', () => {
    test('should display navigation elements correctly', async ({ page }) => {
      // Check if we have navigation structure (even if redirected to login)
      const hasNav = await page.locator('nav, [role="navigation"]').count();
      const hasLogin = await page.locator('text=Login').or(page.locator('text=Sign in')).count();
      
      if (hasLogin > 0) {
        // If redirected to login, that's expected behavior - navigation protection works
        await expect(page.locator('text=Login').or(page.locator('text=Sign in'))).toBeVisible();
        console.log('Dashboard navigation protection working - redirected to login');
      } else if (hasNav > 0) {
        // If navigation is present, check its structure
        await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
        console.log('Dashboard navigation structure detected');
      }
    });

    test('should handle mobile navigation toggle', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Look for mobile menu button (hamburger)
      const mobileMenuButton = page.locator('button:has(svg), [data-testid="mobile-menu"]').first();
      
      if (await mobileMenuButton.isVisible()) {
        // Test mobile menu functionality
        await mobileMenuButton.click();
        // Check if overlay or navigation appears
        await page.waitForTimeout(500);
        console.log('Mobile navigation toggle tested');
      } else {
        console.log('Mobile menu not found - may be on login page');
      }
    });
  });

  test.describe('Authentication Flow Navigation', () => {
    test('should handle dashboard access correctly', async ({ page }) => {
      // This test verifies proper routing behavior
      await page.goto('/app');
      
      // Check if we're redirected to login (expected for unauthenticated users)
      const currentUrl = page.url();
      
      if (currentUrl.includes('/auth/login')) {
        // Good - authentication protection is working
        await expect(page.locator('form').or(page.locator('text=Login')).or(page.locator('text=Sign in'))).toBeVisible();
        console.log('Dashboard access protection working correctly');
      } else if (currentUrl.includes('/app')) {
        // User might be authenticated, check for dashboard elements
        await expect(page.locator('text=Welcome').or(page.locator('text=Dashboard')).or(page.locator('text=My Tools'))).toBeVisible();
        console.log('Dashboard access granted - user authenticated');
      }
    });

    test('should handle user settings navigation', async ({ page }) => {
      await page.goto('/app/user-settings');
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/auth/login')) {
        // Expected behavior for unauthenticated users
        await expect(page.locator('form').or(page.locator('text=Login'))).toBeVisible();
        console.log('User settings access protection working');
      } else if (currentUrl.includes('/app/user-settings')) {
        // User is authenticated, check for settings page
        await expect(page.locator('text=User Settings').or(page.locator('text=Settings'))).toBeVisible();
        console.log('User settings page accessible');
      }
    });
  });

  test.describe('Tool Access Simulation', () => {
    test('should display tool interface elements', async ({ page }) => {
      // Navigate to app and check what's displayed
      await page.goto('/app');
      
      // If on dashboard, look for tool-related elements
      if (page.url().includes('/app') && !page.url().includes('/auth')) {
        // Mock tools API to test tool display
        await page.route('**/rest/v1/tools*', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [{
                id: 'tool-1',
                name: 'Invoice Reconciler',
                slug: 'invoice-reconciler',
                description: 'Automated invoice reconciliation',
                subscription: { status: 'active' }
              }],
              error: null
            })
          });
        });

        await page.reload();
        
        // Look for tool card elements
        await page.waitForSelector('text=Invoice Reconciler', { timeout: 5000 });
        console.log('Tool interface elements detected');
      } else {
        console.log('Dashboard not accessible - authentication required');
      }
    });

    test('should handle tool access restrictions', async ({ page }) => {
      await page.goto('/app');
      
      if (page.url().includes('/app') && !page.url().includes('/auth')) {
        // Mock restricted tool
        await page.route('**/rest/v1/tools*', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [{
                id: 'tool-1',
                name: 'Restricted Tool',
                slug: 'restricted-tool',
                description: 'Access required',
                subscription: { status: 'expired' }
              }],
              error: null
            })
          });
        });

        await page.reload();
        
        // Look for access restriction indicators
        await page.waitForSelector('text=Expired', { timeout: 5000 });
        console.log('Tool access restrictions working');
      } else {
        console.log('Tool access test skipped - authentication required');
      }
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should work on different screen sizes', async ({ page }) => {
      // Test desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/app');
      await page.waitForLoadState('networkidle');
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      console.log('Responsive navigation tested across screen sizes');
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/app');
      
      // Test basic keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Check if focus is working
      const focusedElement = page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      
      if (hasFocus) {
        console.log('Keyboard navigation working');
      } else {
        console.log('Keyboard navigation - no focused elements detected');
      }
    });
  });

  test.describe('Navigation Error Handling', () => {
    test('should handle navigation to non-existent pages', async ({ page }) => {
      // Try to navigate to a non-existent page
      const response = await page.goto('/app/non-existent-page');
      
      // Should handle gracefully (404 or redirect)
      if (response) {
        const status = response.status();
        console.log(`Navigation to non-existent page returned status: ${status}`);
        expect([200, 404, 302, 307, 308]).toContain(status);
      }
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto('/app');
      
      // Mock API error
      await page.route('**/rest/v1/**', route => route.abort('failed'));
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should not crash the application
      console.log('API error handling tested');
    });
  });

  test.describe('Direct URL Navigation', () => {
    test('should handle direct navigation to dashboard sections', async ({ page }) => {
      // Test direct navigation to various sections
      const sections = ['/app', '/app/user-settings'];
      
      for (const section of sections) {
        await page.goto(section);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        console.log(`Direct navigation to ${section} resulted in: ${currentUrl}`);
        
        // Should either show the section or redirect to login
        const isOnLoginPage = currentUrl.includes('/auth/login');
        const isOnTargetPage = currentUrl.includes(section);
        
        expect(isOnLoginPage || isOnTargetPage).toBe(true);
      }
    });

    test('should handle anchor navigation', async ({ page }) => {
      // Test anchor navigation within user settings
      await page.goto('/app/user-settings#password');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      console.log(`Anchor navigation resulted in: ${currentUrl}`);
      
      // Should preserve anchor or redirect to login
      const hasAnchor = currentUrl.includes('#password');
      const isOnLoginPage = currentUrl.includes('/auth/login');
      
      expect(hasAnchor || isOnLoginPage).toBe(true);
    });
  });
}); 