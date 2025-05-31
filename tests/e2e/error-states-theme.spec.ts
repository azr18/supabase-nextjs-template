import { test, expect } from '@playwright/test';

test.describe('Error States & Feedback Components - Blue Gradient Theme', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page
    await page.goto('/app/test-error-states');
  });

  test('should display page with blue gradient theme', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page.locator('h1')).toContainText('Error States & Feedback Components Test');
    
    // Verify gradient background
    const container = page.locator('div').first();
    await expect(container).toHaveClass(/bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50/);
  });

  test('should show success toast with blue gradient', async ({ page }) => {
    // Click success toast button
    await page.click('button:has-text("Success Toast")');
    
    // Wait for toast to appear and verify styling
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Success!');
    
    // Check for blue gradient styling
    await expect(toast).toHaveClass(/border-blue-200/);
  });

  test('should show warning toast with violet gradient', async ({ page }) => {
    // Click warning toast button
    await page.click('button:has-text("Warning Toast")');
    
    // Wait for toast to appear and verify styling
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Warning');
    
    // Check for violet gradient styling
    await expect(toast).toHaveClass(/border-violet-200/);
  });

  test('should show info toast with blue gradient', async ({ page }) => {
    // Click info toast button
    await page.click('button:has-text("Info Toast")');
    
    // Wait for toast to appear and verify styling
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Information');
    
    // Check for blue gradient styling
    await expect(toast).toHaveClass(/border-blue-200/);
  });

  test('should toggle success alert with blue gradient theme', async ({ page }) => {
    // Click toggle success alert button
    await page.click('button:has-text("Toggle Success Alert")');
    
    // Verify alert appears with blue gradient
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('This is a success message with blue gradient theme');
    
    // Check for blue gradient styling
    await expect(alert).toHaveClass(/bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50/);
    
    // Verify blue icon color
    const icon = alert.locator('svg').first();
    await expect(icon).toHaveClass(/text-blue-600/);
  });

  test('should toggle error alert with red gradient theme', async ({ page }) => {
    // Click toggle error alert button
    await page.click('button:has-text("Toggle Error Alert")');
    
    // Verify alert appears with red gradient
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('This is an error message with gradient theme');
    
    // Check for red gradient styling
    await expect(alert).toHaveClass(/bg-gradient-to-br from-red-50 via-red-100 to-pink-50/);
  });

  test('should toggle warning alert with violet gradient theme', async ({ page }) => {
    // Click toggle warning alert button
    await page.click('button:has-text("Toggle Warning Alert")');
    
    // Verify warning appears with violet gradient
    const warning = page.locator('div:has-text("This is a warning message with blue gradient theme")');
    await expect(warning).toBeVisible();
    
    // Check for violet gradient styling
    await expect(warning).toHaveClass(/bg-gradient-to-r from-violet-50 via-blue-50 to-blue-100/);
    
    // Verify violet icon color
    const icon = warning.locator('svg').first();
    await expect(icon).toHaveClass(/text-violet-600/);
  });

  test('should display status icons with correct blue theme colors', async ({ page }) => {
    // Check success icon
    const successIcon = page.locator('div:has-text("Success") svg');
    await expect(successIcon).toHaveClass(/text-blue-600/);
    
    // Check error icon
    const errorIcon = page.locator('div:has-text("Error") svg');
    await expect(errorIcon).toHaveClass(/text-blue-500/);
    
    // Check warning icon
    const warningIcon = page.locator('div:has-text("Warning") svg');
    await expect(warningIcon).toHaveClass(/text-violet-600/);
    
    // Check network icon
    const networkIcon = page.locator('div:has-text("Network") svg');
    await expect(networkIcon).toHaveClass(/text-violet-500/);
  });

  test('should display form error states with gradient styling', async ({ page }) => {
    // Check login/register style error
    const loginError = page.locator('div:has-text("Invalid email or password")');
    await expect(loginError).toBeVisible();
    await expect(loginError).toHaveClass(/bg-gradient-to-br from-red-50 via-red-100 to-pink-50/);
    
    // Check contact form style success
    const contactSuccess = page.locator('div:has-text("Message Sent Successfully")');
    await expect(contactSuccess).toBeVisible();
    await expect(contactSuccess).toHaveClass(/bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50/);
    
    // Check verification email style
    const verificationSuccess = page.locator('div:has-text("Verification email has been resent successfully")');
    await expect(verificationSuccess).toBeVisible();
    await expect(verificationSuccess).toHaveClass(/bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50/);
  });

  test('should display loading states with blue gradient theme', async ({ page }) => {
    // Check processing state
    const processingState = page.locator('div:has-text("Processing your request...")');
    await expect(processingState).toBeVisible();
    await expect(processingState).toHaveClass(/bg-gradient-to-r from-blue-50 to-violet-50/);
    
    // Check uploading state
    const uploadingState = page.locator('div:has-text("Uploading file...")');
    await expect(uploadingState).toBeVisible();
    await expect(uploadingState).toHaveClass(/bg-gradient-to-r from-violet-50 to-blue-50/);
    
    // Verify loading spinners have correct colors
    const spinner = processingState.locator('div.animate-spin');
    await expect(spinner).toHaveClass(/border-blue-600/);
    
    // Verify bounce dots have correct colors
    const bounceDots = uploadingState.locator('div.animate-bounce');
    await expect(bounceDots.first()).toHaveClass(/bg-violet-600/);
    await expect(bounceDots.nth(1)).toHaveClass(/bg-blue-600/);
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify cards stack properly on mobile
    const cards = page.locator('[data-testid="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check heading hierarchy
    await expect(page.locator('h1')).toHaveText('Error States & Feedback Components Test');
    
    // Check that buttons are accessible
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      await expect(button).toBeEnabled();
    }
    
    // Check that alerts have proper role
    await page.click('button:has-text("Toggle Success Alert")');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
  });
}); 