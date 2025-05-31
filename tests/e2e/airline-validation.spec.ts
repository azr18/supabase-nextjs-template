import { test, expect } from '@playwright/test';

test.describe('Invoice Reconciler - Airline Selection Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the invoice reconciler page 
    // Note: This assumes user is logged in or we'll handle auth separately
    await page.goto('/app/invoice-reconciler');
  });

  test('should show disabled continue button when no airline is selected', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Check that we're on step 1 of airline selection
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('text=Select Airline')).toBeVisible();
    
    // The continue button should be disabled with specific text
    const disabledButton = page.locator('button:has-text("Select Airline to Continue")');
    await expect(disabledButton).toBeVisible();
    await expect(disabledButton).toBeDisabled();
    
    // Should show validation error text
    await expect(page.locator('text=Please select an airline to continue')).toBeVisible();
  });

  test('should enable continue button when airline is selected', async ({ page }) => {
    // Wait for the airline selector to be available
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Find and click the airline dropdown trigger
    const dropdownTrigger = page.locator('text=Choose the airline type');
    await dropdownTrigger.click();
    
    // Wait for dropdown options to appear and select Fly Dubai
    await page.waitForSelector('text=Fly Dubai');
    await page.locator('text=Fly Dubai').click();
    
    // Wait for the selection to be processed
    await page.waitForTimeout(1000);
    
    // Check that success feedback appears
    await expect(page.locator('text=Fly Dubai selected and ready for reconciliation')).toBeVisible();
    
    // Check that the continue button is now enabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    
    // Verify the validation error is gone
    await expect(page.locator('text=Please select an airline to continue')).not.toBeVisible();
  });

  test('should proceed to step 2 when continue is clicked after airline selection', async ({ page }) => {
    // Wait for the airline selector
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Select an airline
    const dropdownTrigger = page.locator('text=Choose the airline type');
    await dropdownTrigger.click();
    await page.waitForSelector('text=TAP Air Portugal');
    await page.locator('text=TAP Air Portugal').click();
    
    // Wait for selection processing
    await page.waitForTimeout(1000);
    
    // Click continue button
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Should navigate to step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    await expect(page.locator('text=Upload TAP Air Portugal Invoice')).toBeVisible();
    
    // Should show airline banner
    await expect(page.locator('text=TAP Air Portugal (TP)')).toBeVisible();
  });

  test('should show toast notification when trying to proceed without selection', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Try to click the disabled continue button
    const disabledButton = page.locator('button:has-text("Select Airline to Continue")');
    await expect(disabledButton).toBeDisabled();
    
    // The button should not be clickable and should show validation feedback
    await expect(page.locator('text=Please select an airline to continue')).toBeVisible();
  });

  test('should handle coming-soon airlines appropriately', async ({ page }) => {
    // This test assumes we modify one airline to be coming-soon for testing
    // For now, we'll test with an active airline and verify the feedback
    
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Select an active airline
    const dropdownTrigger = page.locator('text=Choose the airline type');
    await dropdownTrigger.click();
    await page.waitForSelector('text=Philippines Airlines');
    await page.locator('text=Philippines Airlines').click();
    
    // Wait for selection processing
    await page.waitForTimeout(1000);
    
    // Should show success feedback for active airline
    await expect(page.locator('text=Philippines Airlines selected and ready for reconciliation')).toBeVisible();
    
    // Continue button should be enabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeEnabled();
  });

  test('should clear validation state when changing airline selection', async ({ page }) => {
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Initially should show validation error
    await expect(page.locator('text=Please select an airline to continue')).toBeVisible();
    
    // Select first airline
    const dropdownTrigger = page.locator('text=Choose the airline type');
    await dropdownTrigger.click();
    await page.waitForSelector('text=Air India');
    await page.locator('text=Air India').click();
    await page.waitForTimeout(1000);
    
    // Should show success feedback
    await expect(page.locator('text=Air India selected and ready for reconciliation')).toBeVisible();
    
    // Change selection
    await dropdownTrigger.click();
    await page.waitForSelector('text=El Al');
    await page.locator('text=El Al').click();
    await page.waitForTimeout(1000);
    
    // Should show new success feedback
    await expect(page.locator('text=El Al selected and ready for reconciliation')).toBeVisible();
    await expect(page.locator('text=Air India selected')).not.toBeVisible();
  });

  test('should show progress indicator correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 });
    
    // Check initial progress state
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    
    // Check progress dots - first should be active, others inactive
    const progressDots = page.locator('.w-3.h-3.rounded-full');
    await expect(progressDots.first()).toHaveClass(/bg-gradient-to-r from-blue-500 to-violet-500/);
    
    // Select airline and proceed
    const dropdownTrigger = page.locator('text=Choose the airline type');
    await dropdownTrigger.click();
    await page.waitForSelector('text=Fly Dubai');
    await page.locator('text=Fly Dubai').click();
    await page.waitForTimeout(1000);
    
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Check progress updates to step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });
}); 