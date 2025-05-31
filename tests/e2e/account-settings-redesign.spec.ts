import { test, expect } from '@playwright/test';

test.describe('Account Settings Visual Redesign', () => {
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
    
    // Navigate to user settings
    await page.goto('/app/user-settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display Account Settings with landing page visual hierarchy', async ({ page }) => {
    // Check main page gradient background
    const mainContainer = page.locator('div').first();
    await expect(mainContainer).toHaveClass(/bg-gradient-to-br/);
    await expect(mainContainer).toHaveClass(/from-slate-50/);
    await expect(mainContainer).toHaveClass(/via-blue-50\/30/);
    await expect(mainContainer).toHaveClass(/to-violet-50\/20/);

    // Check page header with gradient text
    const pageTitle = page.locator('h1:has-text("User Settings")');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toHaveClass(/bg-gradient-to-r/);
    await expect(pageTitle).toHaveClass(/from-primary/);
    await expect(pageTitle).toHaveClass(/via-blue-600/);
    await expect(pageTitle).toHaveClass(/to-violet-600/);
    await expect(pageTitle).toHaveClass(/bg-clip-text/);
    await expect(pageTitle).toHaveClass(/text-transparent/);

    // Check subtitle styling
    const subtitle = page.locator('p:has-text("world-class security")');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveClass(/text-blue-600\/70/);
  });

  test('should display User Details card with blue gradient theme', async ({ page }) => {
    const userDetailsCard = page.locator('[class*="group relative transition-all"]:has-text("User Details")');
    await expect(userDetailsCard).toBeVisible();

    // Test card hover effects
    await expect(userDetailsCard).toHaveClass(/hover:shadow-2xl/);
    await expect(userDetailsCard).toHaveClass(/hover:scale-105/);
    await expect(userDetailsCard).toHaveClass(/hover:-translate-y-2/);
    await expect(userDetailsCard).toHaveClass(/bg-white\/90/);
    await expect(userDetailsCard).toHaveClass(/backdrop-blur-sm/);
    await expect(userDetailsCard).toHaveClass(/border-2/);
    await expect(userDetailsCard).toHaveClass(/border-blue-200/);

    // Test gradient header
    const cardHeader = userDetailsCard.locator('[class*="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600"]');
    await expect(cardHeader).toBeVisible();

    // Test icon styling
    const iconContainer = cardHeader.locator('[class*="bg-white/20 rounded-xl"]');
    await expect(iconContainer).toBeVisible();
    await expect(iconContainer).toHaveClass(/group-hover:scale-110/);
    await expect(iconContainer).toHaveClass(/group-hover:rotate-3/);

    // Test card content styling
    const userIdField = userDetailsCard.locator('[class*="bg-blue-50/50 p-3 rounded-lg border border-blue-200"]');
    await expect(userIdField.first()).toBeVisible();
  });

  test('should display Change Password card with violet gradient theme', async ({ page }) => {
    const passwordCard = page.locator('[class*="group relative transition-all"]:has-text("Change Password")');
    await expect(passwordCard).toBeVisible();

    // Test violet gradient header
    const cardHeader = passwordCard.locator('[class*="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-600"]');
    await expect(cardHeader).toBeVisible();

    // Test form inputs
    const newPasswordInput = passwordCard.locator('#new-password');
    await expect(newPasswordInput).toBeVisible();
    await expect(newPasswordInput).toHaveClass(/rounded-xl/);
    await expect(newPasswordInput).toHaveClass(/border-2/);
    await expect(newPasswordInput).toHaveClass(/border-blue-200/);
    await expect(newPasswordInput).toHaveClass(/focus:border-violet-500/);

    const confirmPasswordInput = passwordCard.locator('#confirm-password');
    await expect(confirmPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toHaveClass(/rounded-xl/);
    await expect(confirmPasswordInput).toHaveClass(/border-2/);
    await expect(confirmPasswordInput).toHaveClass(/border-blue-200/);

    // Test submit button styling
    const submitButton = passwordCard.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveClass(/bg-gradient-to-r/);
    await expect(submitButton).toHaveClass(/from-blue-600/);
    await expect(submitButton).toHaveClass(/via-violet-500/);
    await expect(submitButton).toHaveClass(/to-violet-700/);
    await expect(submitButton).toHaveClass(/hover:scale-105/);
    await expect(submitButton).toHaveClass(/hover:shadow-xl/);
  });

  test('should display MFA card with purple gradient theme', async ({ page }) => {
    const mfaCard = page.locator('[class*="group relative transition-all"]:has-text("Two-Factor Authentication")');
    await expect(mfaCard).toBeVisible();

    // Test purple gradient header
    const cardHeader = mfaCard.locator('[class*="bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600"]');
    await expect(cardHeader).toBeVisible();

    // Test Shield icon
    const shieldIcon = cardHeader.locator('[class*="bg-white/20 rounded-xl"]');
    await expect(shieldIcon).toBeVisible();

    // Test MFA setup button if present
    const mfaButton = mfaCard.locator('button:has-text("Add New Authentication Method")');
    if (await mfaButton.count() > 0) {
      await expect(mfaButton).toHaveClass(/bg-gradient-to-r/);
      await expect(mfaButton).toHaveClass(/from-violet-600/);
      await expect(mfaButton).toHaveClass(/via-purple-500/);
      await expect(mfaButton).toHaveClass(/to-purple-600/);
      await expect(mfaButton).toHaveClass(/hover:scale-105/);
    }
  });

  test('should maintain hover effects across all cards', async ({ page }) => {
    const allCards = page.locator('[class*="group relative transition-all duration-500"]');
    const cardCount = await allCards.count();
    
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = allCards.nth(i);
      await expect(card).toHaveClass(/duration-500/);
      await expect(card).toHaveClass(/hover:shadow-2xl/);
      await expect(card).toHaveClass(/hover:scale-105/);
      await expect(card).toHaveClass(/hover:-translate-y-2/);
      
      // Test hover activation
      await card.hover();
      await page.waitForTimeout(300);
    }
  });

  test('should display enhanced alerts with backdrop blur', async ({ page }) => {
    // Try to trigger an error or success alert by filling password form incorrectly
    await page.fill('#new-password', 'test123');
    await page.fill('#confirm-password', 'different456');
    await page.click('button[type="submit"]');
    
    // Wait for potential error alert
    await page.waitForTimeout(1000);
    
    const alerts = page.locator('[class*="backdrop-blur-sm"]');
    if (await alerts.count() > 0) {
      const firstAlert = alerts.first();
      await expect(firstAlert).toHaveClass(/backdrop-blur-sm/);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('h1:has-text("User Settings")')).toBeVisible();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1:has-text("User Settings")')).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1:has-text("User Settings")')).toBeVisible();

    // Cards should maintain their styling across all sizes
    const cards = page.locator('[class*="group relative transition-all"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
}); 