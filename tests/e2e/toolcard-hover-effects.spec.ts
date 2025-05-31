import { test, expect } from '@playwright/test';

test.describe('ToolCard Hover Effects - Landing Page Pattern Matching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard page where ToolCard components are displayed
    await page.goto('/app');
    
    // Wait for the page to load and any dynamic content
    await page.waitForLoadState('networkidle');
    
    // Check if user is logged in, if not, mock authentication
    const isLoginPage = await page.url().includes('/auth/login');
    if (isLoginPage) {
      // Mock login for testing - this should be handled by your test setup
      await page.goto('/app');
    }
  });

  test('ToolCard hover effects match landing page patterns', async ({ page }) => {
    // Find a ToolCard component
    const toolCard = page.locator('[class*="group relative transition-all duration-500"]').first();
    await expect(toolCard).toBeVisible();

    // Test initial state
    await expect(toolCard).toHaveClass(/hover:shadow-2xl/);
    await expect(toolCard).toHaveClass(/hover:scale-105/);
    await expect(toolCard).toHaveClass(/hover:-translate-y-1/);

    // Test hover state for scale and shadow effects
    await toolCard.hover();
    await page.waitForTimeout(600); // Wait for transition to complete (duration-500)

    // Verify enhanced gradient overlay changes on hover
    const gradientOverlay = toolCard.locator('[class*="group-hover:from-blue-500"]');
    await expect(gradientOverlay).toBeVisible();

    // Test icon hover effects (scale and rotation)
    const iconContainer = toolCard.locator('[class*="group-hover:scale-110 group-hover:rotate-3"]');
    if (await iconContainer.count() > 0) {
      await expect(iconContainer).toBeVisible();
      await expect(iconContainer).toHaveClass(/group-hover:shadow-xl/);
    }

    // Test title color change on hover
    const cardTitle = toolCard.locator('[class*="group-hover:text-blue-700"]');
    await expect(cardTitle).toBeVisible();

    // Test refresh button hover effects
    const refreshButton = toolCard.locator('[class*="hover:scale-110 hover:shadow-lg"]');
    if (await refreshButton.count() > 0) {
      await refreshButton.hover();
      await page.waitForTimeout(300);
      await expect(refreshButton).toHaveClass(/hover:scale-110/);
    }
  });

  test('ToolCard button hover effects work correctly', async ({ page }) => {
    // Find a ToolCard with an active subscription (should have "Open Tool" button)
    const activeToolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(activeToolCard).toBeVisible();

    const openToolButton = activeToolCard.locator('button:has-text("Open Tool")');
    
    if (await openToolButton.count() > 0) {
      // Test button hover scale effect
      await expect(openToolButton).toHaveClass(/hover:scale-105/);
      
      // Test button gradient transition
      await expect(openToolButton).toHaveClass(/hover:to-violet-600/);
      
      // Test ArrowRight icon hover effects
      const arrowIcon = openToolButton.locator('[class*="group-hover/btn:translate-x-1 group-hover/btn:scale-110"]');
      await expect(arrowIcon).toBeVisible();
      
      // Hover on button to test animations
      await openToolButton.hover();
      await page.waitForTimeout(500); // Wait for transition
    }
  });

  test('ToolCard transitions match landing page duration patterns', async ({ page }) => {
    const toolCard = page.locator('[class*="group relative transition-all duration-500"]').first();
    await expect(toolCard).toBeVisible();

    // Verify transition durations match landing page patterns
    await expect(toolCard).toHaveClass(/duration-500/);
    
    // Test icon container duration
    const iconContainer = toolCard.locator('[class*="transition-all duration-500"]');
    if (await iconContainer.count() > 0) {
      await expect(iconContainer).toHaveClass(/duration-500/);
    }

    // Test title transition duration
    const title = toolCard.locator('[class*="transition-colors duration-300"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveClass(/duration-300/);

    // Test description transition duration
    const description = toolCard.locator('[class*="transition-colors duration-300"]');
    if (await description.count() > 0) {
      await expect(description).toHaveClass(/duration-300/);
    }
  });

  test('ToolCard hover effects work on different screen sizes', async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    let toolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(toolCard).toBeVisible();
    
    await toolCard.hover();
    await page.waitForTimeout(500);

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    toolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(toolCard).toBeVisible();
    
    await toolCard.hover();
    await page.waitForTimeout(500);

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    toolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(toolCard).toBeVisible();
    
    // On mobile, hover effects may not apply, but component should still be functional
    await toolCard.hover();
    await page.waitForTimeout(300);
  });

  test('ToolCard gradient and shadow effects are visually consistent', async ({ page }) => {
    const toolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(toolCard).toBeVisible();

    // Test border color transitions match landing page patterns
    await expect(toolCard).toHaveClass(/border-blue-200/);
    await expect(toolCard).toHaveClass(/hover:border-blue-300/);
    await expect(toolCard).toHaveClass(/hover:border-violet-300/);

    // Test shadow progression (shadow-lg to shadow-xl to shadow-2xl)
    await expect(toolCard).toHaveClass(/hover:shadow-2xl/);
    
    // Hover to activate effects
    await toolCard.hover();
    await page.waitForTimeout(600);

    // Test enhanced gradient overlay
    const gradientOverlay = toolCard.locator('[class*="group-hover:from-blue-500/\\[0\\.05\\]"]');
    await expect(gradientOverlay).toBeVisible();
  });

  test('ToolCard accessibility is maintained with new hover effects', async ({ page }) => {
    const toolCard = page.locator('[class*="group relative transition-all"]').first();
    await expect(toolCard).toBeVisible();

    // Test that card is still keyboard accessible
    await toolCard.focus();
    await page.waitForTimeout(300);

    // Test that button inside card can be focused
    const button = toolCard.locator('button').first();
    if (await button.count() > 0) {
      await button.focus();
      await page.waitForTimeout(300);
      
      // Verify button is still clickable after hover effects
      await expect(button).toBeEnabled();
    }

    // Test that links are still accessible
    const link = toolCard.locator('a[href*="/app/"]');
    if (await link.count() > 0) {
      await link.focus();
      await page.waitForTimeout(300);
      await expect(link).toBeVisible();
    }
  });
}); 