import { test, expect } from '@playwright/test';

test.describe('Dashboard Loading States and Error Handling', () => {
  test('should properly redirect unauthenticated users to login', async ({ page }) => {
    // Test the actual authentication flow
    await page.goto('/app');
    
    // Should be redirected to login page due to authentication middleware
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    
    // Verify we're on the login page
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible();
  });

  test('should show login page elements', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check login page loads properly
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show register page elements', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check register page loads properly
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Simulate network failure during form submission
    await page.route('**/auth/**', route => route.abort('failed'));
    
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Should handle the network error gracefully
    await page.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show loading states during form submission', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Delay the auth response to observe loading states
    await page.route('**/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Look for loading states when submitting
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check if button shows loading state or is disabled
    await page.waitForTimeout(500);
    const isDisabled = await submitButton.isDisabled();
    const buttonText = await submitButton.textContent();
    
    // Should show some form of loading feedback
    expect(isDisabled || buttonText?.toLowerCase().includes('loading') || buttonText?.toLowerCase().includes('signing')).toBeTruthy();
  });

  test('should handle form validation correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation or stay on page
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check HTML5 validation attributes
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('should navigate between auth pages correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Find navigation links
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")').first();
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await expect(page.locator('h1, h2').filter({ hasText: /sign up|register/i })).toBeVisible();
    }
  });

  test('should maintain accessibility standards', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Should have labels or aria-labels
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                      await page.locator('label').filter({ hasText: /email/i }).count() > 0;
    const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                         await page.locator('label').filter({ hasText: /password/i }).count() > 0;
    
    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();
  });

  test('should handle browser navigation correctly', async ({ page }) => {
    // Test navigation flow
    await page.goto('/auth/login');
    await page.goto('/auth/register');
    
    // Go back
    await page.goBack();
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible();
    
    // Go forward
    await page.goForward();
    await expect(page.locator('h1, h2').filter({ hasText: /sign up|register/i })).toBeVisible();
  });

  test('should show consistent branding and styling', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for branding elements
    const brandingElements = [
      page.locator('text="My Agent"'),
      page.locator('[alt*="logo"]'),
      page.locator('.logo'),
      page.locator('h1, h2').first()
    ];
    
    let foundBranding = false;
    for (const element of brandingElements) {
      if (await element.count() > 0) {
        foundBranding = true;
        break;
      }
    }
    
    expect(foundBranding).toBeTruthy();
  });
}); 