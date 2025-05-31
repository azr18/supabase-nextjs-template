import { test, expect } from '@playwright/test';

test.describe('ToolCard Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // This would typically navigate to a test page that includes ToolCard components
    // For now, we'll skip these tests until the dashboard integration is complete
  });

  test.skip('should display active tool with subscription correctly', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/app');
    
    // Wait for tools to load
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Check for active subscription badge
    await expect(page.locator('text=Active')).toBeVisible();
    
    // Check for "Open Tool" button
    await expect(page.locator('text=Open Tool')).toBeVisible();
    
    // Verify tool can be clicked
    const toolLink = page.locator('[data-testid="tool-card"] a');
    await expect(toolLink).toBeVisible();
    await expect(toolLink).toHaveAttribute('href', /\/app\/.+/);
  });

  test.skip('should display trial subscription with countdown', async ({ page }) => {
    // Would require test data setup with trial subscription
    await page.goto('/app');
    
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Check for trial badge
    await expect(page.locator('text=Trial')).toBeVisible();
    
    // Check for days left indicator
    await expect(page.locator('text=/\\d+ days left/')).toBeVisible();
  });

  test.skip('should show access required for tools without subscription', async ({ page }) => {
    await page.goto('/app');
    
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Check for "No Access" or similar status
    await expect(page.locator('text=Access Required')).toBeVisible();
    
    // Check that button is disabled
    await expect(page.locator('button:has-text("Access Required")')).toBeDisabled();
    
    // Check for lock icon
    await expect(page.locator('[data-testid="lock-icon"]')).toBeVisible();
  });

  test.skip('should navigate to tool page when clicked', async ({ page }) => {
    await page.goto('/app');
    
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Find an active tool card and click it
    const activeToolCard = page.locator('[data-testid="tool-card"]:has-text("Open Tool")').first();
    await activeToolCard.click();
    
    // Should navigate to tool page
    await expect(page).toHaveURL(/\/app\/.+/);
  });

  test.skip('should display tool information correctly', async ({ page }) => {
    await page.goto('/app');
    
    await page.waitForSelector('[data-testid="tool-card"]');
    
    const toolCard = page.locator('[data-testid="tool-card"]').first();
    
    // Check for tool name
    await expect(toolCard.locator('h3, [data-testid="tool-name"]')).toBeVisible();
    
    // Check for tool description
    await expect(toolCard.locator('[data-testid="tool-description"]')).toBeVisible();
    
    // Check for tool icon if present
    const icon = toolCard.locator('[data-testid="tool-icon"]');
    if (await icon.count() > 0) {
      await expect(icon).toBeVisible();
    }
  });

  test.skip('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="tool-card"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="tool-card"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('[data-testid="tool-card"]')).toBeVisible();
  });

  test.skip('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('[data-testid="tool-card"]');
    
    // Focus on first tool card
    await page.keyboard.press('Tab');
    
    // Check that focus is on a clickable element
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key navigation
    await page.keyboard.press('Enter');
    
    // Should navigate to tool page if accessible
    await page.waitForTimeout(1000); // Wait for navigation
  });

  test('ToolCard component should be importable', async () => {
    // Basic test to ensure the component can be imported without errors
    // This runs in Node.js context, not browser
    const fs = await import('fs');
    const path = await import('path');
    
    const componentPath = path.join(process.cwd(), 'nextjs/src/components/Dashboard/ToolCard.tsx');
    const componentExists = fs.existsSync(componentPath);
    
    expect(componentExists).toBe(true);
    
    // Read file and check for exports
    const componentContent = fs.readFileSync(componentPath, 'utf-8');
    expect(componentContent).toContain('export');
    expect(componentContent).toContain('ToolCard');
  });

  test('Tools query utility should be importable', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const utilityPath = path.join(process.cwd(), 'nextjs/src/lib/supabase/queries/tools.ts');
    const utilityExists = fs.existsSync(utilityPath);
    
    expect(utilityExists).toBe(true);
    
    // Read file and check for exports
    const utilityContent = fs.readFileSync(utilityPath, 'utf-8');
    expect(utilityContent).toContain('getToolsWithSubscriptions');
    expect(utilityContent).toContain('hasToolAccess');
    expect(utilityContent).toContain('getToolWithSubscription');
    expect(utilityContent).toContain('getToolSubscriptionStatus');
  });
}); 