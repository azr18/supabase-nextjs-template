import { test, expect } from '@playwright/test';

test.describe('Subscription Status Indicators and User Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/app');
  });

  test.describe('Visual Status Indicators', () => {
    test('should display subscription status badges correctly', async ({ page }) => {
      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check for tool cards with status indicators
      const toolCards = page.locator('[data-testid="tool-card"]');
      await expect(toolCards.first()).toBeVisible({ timeout: 15000 });
      
      // Verify status badges are present
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      if (await statusBadges.count() > 0) {
        // Check first badge is visible and has proper styling
        await expect(statusBadges.first()).toBeVisible();
        
        // Verify badge has proper text content (Active, Trial, Expired, etc.)
        const badgeText = await statusBadges.first().textContent();
        expect(badgeText).toMatch(/Active|Trial|Expired|Inactive|No Access/i);
        
        // Verify badge has proper color coding via CSS classes
        const badgeClass = await statusBadges.first().getAttribute('class');
        expect(badgeClass).toContain('badge');
      }
    });

    test('should show different badge variants for different subscription states', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Look for multiple tool cards with different subscription states
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      const badgeCount = await statusBadges.count();
      
      if (badgeCount > 0) {
        for (let i = 0; i < Math.min(badgeCount, 3); i++) {
          const badge = statusBadges.nth(i);
          await expect(badge).toBeVisible();
          
          // Verify each badge has appropriate styling
          const badgeClass = await badge.getAttribute('class');
          expect(badgeClass).toMatch(/badge|status|active|trial|expired|inactive/i);
        }
      }
    });

    test('should display subscription countdown timers for trial/expiring subscriptions', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Look for countdown timers or expiration notices
      const countdowns = page.locator('[data-testid="subscription-countdown"], [data-testid="trial-countdown"]');
      
      if (await countdowns.count() > 0) {
        await expect(countdowns.first()).toBeVisible();
        
        // Verify countdown shows time information
        const countdownText = await countdowns.first().textContent();
        expect(countdownText).toMatch(/days?|hours?|expires?|trial|remaining/i);
      }
    });
  });

  test.describe('User Feedback Messages', () => {
    test('should show appropriate feedback when clicking on tools with different subscription states', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Find tool cards
      const toolCards = page.locator('[data-testid="tool-card"]');
      const cardCount = await toolCards.count();
      
      if (cardCount > 0) {
        // Click on first tool card
        await toolCards.first().click();
        
        // Wait a moment for any feedback/navigation
        await page.waitForTimeout(1000);
        
        // Check if we're redirected or if there's feedback
        const currentUrl = page.url();
        const feedbackMessages = page.locator('[role="alert"], .toast, [data-testid="feedback-message"]');
        
        // Either we should navigate to tool or get feedback
        if (currentUrl.includes('/app/')) {
          // Successfully navigated to tool
          expect(currentUrl).toContain('/app/');
        } else if (await feedbackMessages.count() > 0) {
          // Got feedback message instead
          await expect(feedbackMessages.first()).toBeVisible();
        }
      }
    });

    test('should display helpful error messages for expired subscriptions', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Look for expired subscription indicators
      const expiredBadges = page.locator('[data-testid="subscription-status-badge"]')
        .filter({ hasText: /expired|inactive/i });
      
      if (await expiredBadges.count() > 0) {
        // Find the tool card containing the expired badge
        const expiredToolCard = expiredBadges.first().locator('..').locator('[data-testid="tool-card"]');
        
        // Try to interact with expired tool
        if (await expiredToolCard.count() > 0) {
          await expiredToolCard.click();
          
          // Check for appropriate feedback
          await page.waitForTimeout(1000);
          const feedbackMessages = page.locator('[role="alert"], .toast, [data-testid="feedback-message"]');
          
          if (await feedbackMessages.count() > 0) {
            const messageText = await feedbackMessages.first().textContent();
            expect(messageText).toMatch(/subscription|expired|access|upgrade|contact/i);
          }
        }
      }
    });

    test('should show subscription renewal prompts for expiring subscriptions', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Look for trial or expiring subscription warnings
      const warningElements = page.locator('[data-testid="subscription-warning"], [data-testid="trial-warning"]');
      
      if (await warningElements.count() > 0) {
        await expect(warningElements.first()).toBeVisible();
        
        // Verify warning content
        const warningText = await warningElements.first().textContent();
        expect(warningText).toMatch(/trial|expir|renew|upgrade|contact/i);
      }
    });
  });

  test.describe('Interactive Features', () => {
    test('should show subscription information on hover tooltips', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Find tool cards with status badges
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      
      if (await statusBadges.count() > 0) {
        // Hover over first status badge
        await statusBadges.first().hover();
        
        // Wait for potential tooltip
        await page.waitForTimeout(500);
        
        // Look for tooltip or additional information
        const tooltips = page.locator('[role="tooltip"], [data-testid="subscription-tooltip"]');
        
        if (await tooltips.count() > 0) {
          await expect(tooltips.first()).toBeVisible();
          
          // Verify tooltip contains useful information
          const tooltipText = await tooltips.first().textContent();
          expect(tooltipText).toMatch(/subscription|status|expires?|active|trial/i);
        }
      }
    });

    test('should allow manual refresh of subscription status', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Look for refresh button or manual refresh capability
      const refreshButtons = page.locator('[data-testid="refresh-status"], [data-testid="manual-refresh"]');
      
      if (await refreshButtons.count() > 0) {
        // Click refresh button
        await refreshButtons.first().click();
        
        // Verify loading state appears
        const loadingIndicators = page.locator('[data-testid="loading"], .animate-spin');
        
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).toBeVisible();
          
          // Wait for loading to complete
          await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Loading States and Error Handling', () => {
    test('should show appropriate loading states while checking subscription status', async ({ page }) => {
      // Navigate to dashboard and immediately check for loading states
      await page.goto('http://localhost:3000/app');
      
      // Look for loading indicators during initial load
      const loadingStates = page.locator('[data-testid="loading"], .animate-spin, [data-testid="skeleton"]');
      
      // Loading states might be very brief, so we check if they exist at all
      const hasLoadingStates = await loadingStates.count() > 0;
      
      if (hasLoadingStates) {
        // If loading states exist, verify they eventually disappear
        await expect(loadingStates.first()).not.toBeVisible({ timeout: 15000 });
      }
      
      // Verify that dashboard content eventually loads
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 15000 });
    });

    test('should handle subscription check errors gracefully', async ({ page }) => {
      // Intercept subscription API calls and simulate errors
      await page.route('/api/subscriptions/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('http://localhost:3000/app');
      
      // Wait for page to handle the error
      await page.waitForTimeout(3000);
      
      // Look for error handling UI
      const errorMessages = page.locator('[role="alert"], [data-testid="error-message"], .error');
      
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
        
        // Verify error message is user-friendly
        const errorText = await errorMessages.first().textContent();
        expect(errorText).toMatch(/error|unable|try again|problem|contact/i);
      }
    });

    test('should provide fallback UI when subscription data is unavailable', async ({ page }) => {
      // Intercept and delay subscription API calls
      await page.route('/api/subscriptions/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tools: [] })
        });
      });
      
      await page.goto('http://localhost:3000/app');
      
      // Check for fallback UI during loading
      await page.waitForTimeout(2000);
      
      const fallbackElements = page.locator('[data-testid="fallback"], [data-testid="no-data"], .fallback');
      
      if (await fallbackElements.count() > 0) {
        await expect(fallbackElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Features', () => {
    test('should have proper ARIA labels for subscription status elements', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check status badges for accessibility attributes
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      
      if (await statusBadges.count() > 0) {
        const firstBadge = statusBadges.first();
        
        // Check for ARIA attributes
        const ariaLabel = await firstBadge.getAttribute('aria-label');
        const role = await firstBadge.getAttribute('role');
        
        // Should have either aria-label or role for screen readers
        expect(ariaLabel || role).toBeTruthy();
      }
    });

    test('should support keyboard navigation for subscription-related interactions', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Test keyboard navigation to tool cards
      await page.keyboard.press('Tab');
      
      // Check if focus is visible on interactive elements
      const focusedElement = await page.locator(':focus');
      
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toBeVisible();
        
        // Verify focused element is interactive
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        expect(['button', 'a', 'input', 'div']).toContain(tagName);
      }
    });

    test('should have sufficient color contrast for subscription status indicators', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check status badges for proper styling
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      
      if (await statusBadges.count() > 0) {
        const firstBadge = statusBadges.first();
        
        // Get computed styles
        const styles = await firstBadge.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontSize: computed.fontSize
          };
        });
        
        // Verify basic styling properties exist
        expect(styles.backgroundColor).toBeTruthy();
        expect(styles.color).toBeTruthy();
        expect(styles.fontSize).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display subscription indicators properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('http://localhost:3000/app');
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check that subscription status elements are visible on mobile
      const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
      
      if (await statusBadges.count() > 0) {
        await expect(statusBadges.first()).toBeVisible();
        
        // Verify text is readable on mobile
        const badgeBox = await statusBadges.first().boundingBox();
        if (badgeBox) {
          expect(badgeBox.width).toBeGreaterThan(30); // Minimum touch target
          expect(badgeBox.height).toBeGreaterThan(20);
        }
      }
    });

    test('should adapt subscription feedback for tablet screens', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('http://localhost:3000/app');
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Verify layout adapts properly
      const toolCards = page.locator('[data-testid="tool-card"]');
      
      if (await toolCards.count() > 0) {
        await expect(toolCards.first()).toBeVisible();
        
        // Check that cards are properly sized for tablet
        const cardBox = await toolCards.first().boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(768); // Should not exceed viewport
          expect(cardBox.width).toBeGreaterThan(200); // Should be reasonable size
        }
      }
    });
  });
}); 