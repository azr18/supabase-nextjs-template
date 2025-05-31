import { test, expect } from '@playwright/test';

test.describe('Invoice Reconciler - Dynamic Airline Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting the token in localStorage
    await page.goto('http://localhost:3001');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should display dynamic airline-specific information when airline is selected', async ({ page }) => {
    // Navigate to invoice reconciler
    await page.goto('http://localhost:3001/app/invoice-reconciler');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="airline-selector"]', { timeout: 10000 }).catch(() => {
      // Fallback to looking for select trigger
      return page.waitForSelector('button[role="combobox"]', { timeout: 5000 });
    });

    // Test Fly Dubai selection
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="fly-dubai"]');
    
    // Verify dynamic airline banner appears
    await expect(page.locator('text=Fly Dubai (FZ)')).toBeVisible();
    await expect(page.locator('text=3-5 minutes')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();

    // Verify airline configuration panel appears
    await expect(page.locator('text=Fly Dubai Configuration')).toBeVisible();
    await expect(page.locator('text=Dubai-based low-cost carrier')).toBeVisible();
    
    // Verify processing details
    await expect(page.locator('text=Processing Details')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
    
    // Verify requirements section
    await expect(page.locator('text=Requirements')).toBeVisible();
    await expect(page.locator('text=Booking reference numbers')).toBeVisible();
    await expect(page.locator('text=Passenger details')).toBeVisible();
    await expect(page.locator('text=Route information')).toBeVisible();
    
    // Verify report sections
    await expect(page.locator('text=Generated Report Sections')).toBeVisible();
    await expect(page.locator('text=Flight Summary')).toBeVisible();
    await expect(page.locator('text=Passenger Breakdown')).toBeVisible();
    await expect(page.locator('text=Route Analysis')).toBeVisible();
    await expect(page.locator('text=Discrepancy Report')).toBeVisible();
    
    // Verify processing tip
    await expect(page.locator('text=Processing Tip')).toBeVisible();
    await expect(page.locator('text=Ensure all booking references are clearly visible in the PDF.')).toBeVisible();
  });

  test('should update interface when different airlines are selected', async ({ page }) => {
    await page.goto('http://localhost:3001/app/invoice-reconciler');
    
    // Wait for selector to be available
    await page.waitForSelector('button[role="combobox"]', { timeout: 10000 });

    // Test TAP selection
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="tap"]');
    
    // Verify TAP-specific information
    await expect(page.locator('text=TAP Air Portugal (TP)')).toBeVisible();
    await expect(page.locator('text=4-6 minutes')).toBeVisible();
    await expect(page.locator('text=Portugal national airline')).toBeVisible();
    await expect(page.locator('text=TAP booking codes')).toBeVisible();
    await expect(page.locator('text=Flight segments')).toBeVisible();
    await expect(page.locator('text=Fare breakdown')).toBeVisible();
    
    // Switch to Air India
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="air-india"]');
    
    // Verify Air India-specific information
    await expect(page.locator('text=Air India (AI)')).toBeVisible();
    await expect(page.locator('text=National carrier of India')).toBeVisible();
    await expect(page.locator('text=AI booking references')).toBeVisible();
    await expect(page.locator('text=Domestic/International classification')).toBeVisible();
    await expect(page.locator('text=Fare components')).toBeVisible();
    
    // Switch to El Al
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="el-al"]');
    
    // Verify El Al-specific information
    await expect(page.locator('text=El Al (LY)')).toBeVisible();
    await expect(page.locator('text=Flag carrier of Israel')).toBeVisible();
    await expect(page.locator('text=5-8 minutes')).toBeVisible();
    await expect(page.locator('text=LY flight codes')).toBeVisible();
    await expect(page.locator('text=Security fees')).toBeVisible();
    await expect(page.locator('text=Route details')).toBeVisible();
  });

  test('should show step-specific airline context as user progresses', async ({ page }) => {
    await page.goto('http://localhost:3001/app/invoice-reconciler');
    
    // Wait for selector and select Philippines Airlines
    await page.waitForSelector('button[role="combobox"]', { timeout: 10000 });
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="philippines"]');
    
    // Verify initial selection
    await expect(page.locator('text=Philippines Airlines (PR)')).toBeVisible();
    
    // Proceed to next step
    await page.click('text=Continue');
    
    // Verify step 2 shows airline context
    await expect(page.locator('text=Philippines Airlines Invoice Upload')).toBeVisible();
    await expect(page.locator('text=Format: PDF • Processing: 5-7 minutes')).toBeVisible();
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    await expect(page.locator('text=Required Information:')).toBeVisible();
    await expect(page.locator('text=PR flight numbers')).toBeVisible();
    await expect(page.locator('text=Passenger manifest')).toBeVisible();
    await expect(page.locator('text=Pricing details')).toBeVisible();
    
    // Proceed to step 3
    await page.click('text=Continue');
    
    // Verify step 3 shows processing context
    await expect(page.locator('text=Philippines Airlines Invoice Ready')).toBeVisible();
    await expect(page.locator('text=Expected processing time: 5-7 minutes')).toBeVisible();
    await expect(page.locator('text=Generated Report Will Include:')).toBeVisible();
    await expect(page.locator('text=Flight Manifest')).toBeVisible();
    await expect(page.locator('text=Pricing Analysis')).toBeVisible();
    await expect(page.locator('text=Route Summary')).toBeVisible();
    await expect(page.locator('text=Exception Report')).toBeVisible();
    
    // Proceed to processing step
    await page.click('text=Start Reconciliation');
    
    // Verify processing step shows airline-specific context
    await expect(page.locator('text=Processing Philippines Airlines Reconciliation')).toBeVisible();
    await expect(page.locator('text=Estimated completion: 5-7 minutes')).toBeVisible();
    await expect(page.locator('text=Processing Steps:')).toBeVisible();
    await expect(page.locator('text=Extracting Philippines Airlines invoice data...')).toBeVisible();
  });

  test('should prevent proceeding without airline selection', async ({ page }) => {
    await page.goto('http://localhost:3001/app/invoice-reconciler');
    
    // Wait for page to load
    await page.waitForSelector('button[role="combobox"]', { timeout: 10000 });
    
    // Verify continue button is disabled when no airline is selected
    const continueButton = page.locator('text=Select Airline to Continue');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeDisabled();
    
    // No airline configuration panel should be visible
    await expect(page.locator('text=Configuration')).not.toBeVisible();
    await expect(page.locator('text=Processing Details')).not.toBeVisible();
  });

  test('should maintain airline context throughout the workflow', async ({ page }) => {
    await page.goto('http://localhost:3001/app/invoice-reconciler');
    
    // Select Fly Dubai
    await page.waitForSelector('button[role="combobox"]', { timeout: 10000 });
    await page.click('button[role="combobox"]');
    await page.click('div[data-value="fly-dubai"]');
    
    // Verify Fly Dubai is maintained through steps
    await page.click('text=Continue'); // Step 2
    await expect(page.locator('text=Fly Dubai Invoice Upload')).toBeVisible();
    
    await page.click('text=Continue'); // Step 3
    await expect(page.locator('text=Fly Dubai Invoice Ready')).toBeVisible();
    
    await page.click('text=Start Reconciliation'); // Step 4
    await expect(page.locator('text=Processing Fly Dubai Reconciliation')).toBeVisible();
    
    // Test navigation back maintains context
    await page.click('text=Previous');
    await expect(page.locator('text=Fly Dubai Invoice Ready')).toBeVisible();
    
    await page.click('text=Previous');
    await expect(page.locator('text=Fly Dubai Invoice Upload')).toBeVisible();
    
    await page.click('text=Previous');
    await expect(page.locator('text=Fly Dubai (FZ)')).toBeVisible();
    await expect(page.locator('text=Fly Dubai Configuration')).toBeVisible();
  });
}); 