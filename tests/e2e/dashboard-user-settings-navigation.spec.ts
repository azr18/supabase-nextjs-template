import { test, expect } from '@playwright/test';

test.describe('Dashboard User Settings Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and user data
    await page.goto('/auth/login');
    
    // Wait for the login form to be ready
    await page.waitForSelector('form');
    
    // Fill in test credentials and login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/app');
  });

  test('should display Account Settings section in dashboard', async ({ page }) => {
    // Check that Account Settings section exists
    await expect(page.locator('h3:has-text("Account Settings")')).toBeVisible();
    
    // Check that account settings cards are present
    await expect(page.locator('text="User Settings"')).toBeVisible();
    await expect(page.locator('text="Change Password"')).toBeVisible();
    await expect(page.locator('text="Security (MFA)"')).toBeVisible();
  });

  test('should navigate to user settings page from dashboard', async ({ page }) => {
    // Click on the "User Settings" card
    await page.click('a:has-text("User Settings")');
    
    // Should navigate to user settings page
    await page.waitForURL('/app/user-settings');
    
    // Verify user settings page content
    await expect(page.locator('h1:has-text("User Settings")')).toBeVisible();
    await expect(page.locator('text="User Details"')).toBeVisible();
    await expect(page.locator('text="Change Password"')).toBeVisible();
    await expect(page.locator('text="Two-Factor Authentication"')).toBeVisible();
  });

  test('should navigate directly to password section', async ({ page }) => {
    // Click on the "Change Password" quick access card
    await page.click('a[href="/app/user-settings#password"]');
    
    // Should navigate to user settings page with password hash
    await page.waitForURL('/app/user-settings#password');
    
    // Verify the password section is visible and in view
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('text="Change Password"').nth(1)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should navigate directly to MFA section', async ({ page }) => {
    // Click on the "Security (MFA)" quick access card
    await page.click('a[href="/app/user-settings#mfa"]');
    
    // Should navigate to user settings page with MFA hash
    await page.waitForURL('/app/user-settings#mfa');
    
    // Verify the MFA section is visible
    await expect(page.locator('#mfa')).toBeVisible();
    await expect(page.locator('text="Two-Factor Authentication"')).toBeVisible();
  });

  test('should display account summary in dashboard', async ({ page }) => {
    // Check account summary section
    await expect(page.locator('text="Account Status"')).toBeVisible();
    await expect(page.locator('text="Active"')).toBeVisible();
    await expect(page.locator('text="Member for"')).toBeVisible();
  });

  test('should access user settings from header dropdown', async ({ page }) => {
    // Click on user avatar/email in header
    await page.click('button:has(span:has-text("test@"))');
    
    // Check dropdown menu options
    await expect(page.locator('text="Account Settings"')).toBeVisible();
    await expect(page.locator('text="Change Password"')).toBeVisible();
    await expect(page.locator('text="Security (MFA)"')).toBeVisible();
    
    // Click on Account Settings from dropdown
    await page.click('button:has-text("Account Settings")');
    
    // Should navigate to user settings
    await page.waitForURL('/app/user-settings');
    await expect(page.locator('h1:has-text("User Settings")')).toBeVisible();
  });

  test('should access password change from header dropdown', async ({ page }) => {
    // Click on user avatar/email in header
    await page.click('button:has(span:has-text("test@"))');
    
    // Click on Change Password from dropdown
    await page.click('button:has-text("Change Password")');
    
    // Should navigate to user settings with password hash
    await page.waitForURL('/app/user-settings#password');
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should access MFA from header dropdown', async ({ page }) => {
    // Click on user avatar/email in header
    await page.click('button:has(span:has-text("test@"))');
    
    // Click on Security (MFA) from dropdown
    await page.click('button:has-text("Security (MFA)")');
    
    // Should navigate to user settings with MFA hash
    await page.waitForURL('/app/user-settings#mfa');
    await expect(page.locator('#mfa')).toBeVisible();
  });

  test('should highlight user settings in sidebar navigation', async ({ page }) => {
    // Navigate to user settings
    await page.click('a:has-text("User Settings")');
    await page.waitForURL('/app/user-settings');
    
    // Check that the sidebar navigation item is highlighted
    const navLink = page.locator('nav a:has-text("User Settings")');
    await expect(navLink).toHaveClass(/bg-primary-50/);
    await expect(navLink).toHaveClass(/text-primary-600/);
  });

  test('should maintain responsive design for account settings', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('text="User Settings"')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text="User Settings"')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text="User Settings"')).toBeVisible();
  });
}); 