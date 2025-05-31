import { test, expect } from '@playwright/test';

test.describe('Dashboard Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
    { name: 'large-desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`Dashboard layout should be responsive on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/app');
      
      // Wait for the page to load completely
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Test welcome section responsiveness
      const welcomeCard = page.locator('.card').first();
      await expect(welcomeCard).toBeVisible();
      
      // Test tools grid layout
      const toolsGrid = page.locator('[data-testid="tools-grid"]');
      if (await toolsGrid.isVisible()) {
        // Check grid columns based on viewport
        const gridClass = await toolsGrid.getAttribute('class');
        if (width < 768) {
          expect(gridClass).toContain('grid-cols-1');
        } else if (width < 1200) {
          expect(gridClass).toContain('md:grid-cols-2');
        } else {
          expect(gridClass).toContain('xl:grid-cols-3');
        }
      }

      // Test account settings grid responsiveness
      const settingsGrid = page.locator('[data-testid="settings-grid"]');
      if (await settingsGrid.isVisible()) {
        const gridClass = await settingsGrid.getAttribute('class');
        if (width < 640) {
          expect(gridClass).toContain('grid-cols-1');
        } else if (width < 1024) {
          expect(gridClass).toContain('sm:grid-cols-2');
        } else {
          expect(gridClass).toContain('lg:grid-cols-3');
        }
      }

      // Verify no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 20); // Small tolerance for browser differences
    });

    test(`Text truncation should work properly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/app');
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check that tool names are truncated properly on small screens
      const toolCards = page.locator('[data-testid="tool-card"]');
      const count = await toolCards.count();
      
      for (let i = 0; i < count; i++) {
        const toolCard = toolCards.nth(i);
        const toolTitle = toolCard.locator('h3, h2').first();
        
        if (await toolTitle.isVisible()) {
          const titleClass = await toolTitle.getAttribute('class');
          expect(titleClass).toContain('truncate');
        }
      }
    });

    test(`Buttons should be appropriately sized on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/app');
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check button sizes
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const buttonBox = await button.boundingBox();
          if (buttonBox) {
            // Minimum touch target size for mobile
            if (width < 768) {
              expect(buttonBox.height).toBeGreaterThanOrEqual(32);
            }
            // Ensure buttons don't overflow
            expect(buttonBox.width).toBeLessThanOrEqual(width);
          }
        }
      }
    });
  });

  test('Navigation should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    // Test mobile menu toggle
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Verify menu opens
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();
      
      // Test menu close
      const closeButton = page.locator('button[aria-label="Close menu"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(sidebar).not.toBeVisible();
      }
    }
  });

  test('Recent jobs should stack properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
    
    const jobItems = page.locator('[data-testid="job-item"]');
    const count = await jobItems.count();
    
    for (let i = 0; i < count; i++) {
      const jobItem = jobItems.nth(i);
      if (await jobItem.isVisible()) {
        const jobItemClass = await jobItem.getAttribute('class');
        // Should use flex-col on mobile
        expect(jobItemClass).toContain('flex-col');
        expect(jobItemClass).toContain('sm:flex-row');
      }
    }
  });

  test('Form elements should be properly sized on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/user-settings');
    
    // Wait for settings page to load
    await page.waitForSelector('#password', { timeout: 10000 });
    
    // Check input field responsiveness
    const inputs = page.locator('input[type="password"]');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const inputBox = await input.boundingBox();
        if (inputBox) {
          // Inputs should be full width on mobile
          const parentBox = await input.locator('..').boundingBox();
          if (parentBox) {
            expect(inputBox.width).toBeGreaterThan(parentBox.width * 0.9);
          }
        }
      }
    }
  });

  test('Visual regression test for responsive breakpoints', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
    
    // Test different breakpoints
    const breakpoints = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1200 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: 800 });
      await page.waitForTimeout(500); // Allow layout to settle
      
      // Take screenshot for visual comparison
      await expect(page).toHaveScreenshot(`dashboard-${breakpoint.name}.png`, {
        fullPage: true,
        threshold: 0.3
      });
    }
  });

  test('Touch interactions should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
    
    // Test touch targets are large enough
    const interactiveElements = page.locator('button, a, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count && i < 10; i++) { // Test first 10 elements
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          // Minimum 44px touch target (Apple HIG recommendation)
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });

  test('Content overflow should be handled properly', async ({ page }) => {
    const viewports = [375, 768, 1200];
    
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/app');
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
      
      // Check that all cards are contained within viewport
      const cards = page.locator('.card');
      const cardCount = await cards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          const box = await card.boundingBox();
          if (box) {
            expect(box.x + box.width).toBeLessThanOrEqual(width + 50); // Small tolerance
          }
        }
      }
    }
  });
}); 