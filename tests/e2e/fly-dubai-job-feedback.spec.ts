import { test, expect } from '@playwright/test';

test.describe('Fly Dubai Job Submission UI Feedback (Task 8.2)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the invoice reconciler page
    await page.goto('/app/invoice-reconciler');
    
    // Wait for the page to load and ensure we have access
    await expect(page.locator('h1')).toContainText('Invoice Reconciler');
  });

  test('should display enhanced feedback when starting Fly Dubai reconciliation', async ({ page }) => {
    // Step 1: Select Fly Dubai airline
    await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
    
    // Verify Fly Dubai specific airline banner
    await expect(page.locator('[data-testid="airline-banner"]')).toContainText('Fly Dubai');
    
    // Click Continue to go to invoice upload
    await page.click('button:has-text("Continue")');
    
    // Step 2: Select or upload a Fly Dubai invoice
    // For this test, we'll assume an invoice is selected
    await expect(page.locator('[data-testid="invoice-manager"]')).toBeVisible();
    
    // Mock invoice selection
    await page.evaluate(() => {
      // Simulate invoice selection via the component
      window.dispatchEvent(new CustomEvent('invoiceSelected', { 
        detail: { invoiceId: 'test-flydubai-invoice-123' } 
      }));
    });
    
    // Click Continue to go to report upload
    await page.click('button:has-text("Continue")');
    
    // Step 3: Upload Excel report
    await expect(page.locator('text=Upload Excel Report')).toBeVisible();
    
    // Create a mock Excel file for testing
    const fileContent = Buffer.from('Mock Excel content for testing');
    
    // Upload the report file
    await page.setInputFiles('input[type="file"]', {
      name: 'test-report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });
    
    // Verify the file was selected and success feedback is shown
    await expect(page.locator('text=Excel report ready for processing')).toBeVisible();
    await expect(page.locator('text=Click "Start Reconciliation" to begin processing your Fly Dubai data')).toBeVisible();
    
    // Step 4: Start Fly Dubai reconciliation and verify enhanced feedback
    
    // Mock the API response for successful job creation
    await page.route('/api/reconcile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'flydubai-job-12345678-abcd-efgh-ijkl-mnopqrstuvwx',
          success: true,
          message: 'Fly Dubai reconciliation job started successfully'
        }),
      });
    });
    
    // Click Start Reconciliation button
    await page.click('button:has-text("Start Reconciliation")');
    
    // Verify enhanced Fly Dubai-specific toast messages appear
    // Check for the upload feedback toast
    await expect(page.locator('.toast')).toContainText('🚀 Fly Dubai Reconciliation Starting');
    await expect(page.locator('.toast')).toContainText('Uploading your Excel report file for Fly Dubai processing');
    
    // Wait for processing feedback toast
    await expect(page.locator('.toast')).toContainText('✈️ Processing Fly Dubai Data');
    await expect(page.locator('.toast')).toContainText('Initiating Fly Dubai reconciliation engine');
    await expect(page.locator('.toast')).toContainText('This typically takes 5-7 minutes');
    
    // Check for job creation success toast
    await expect(page.locator('.toast')).toContainText('🎯 Fly Dubai Job Started Successfully!');
    await expect(page.locator('.toast')).toContainText('Job ID: flydubai-');
    await expect(page.locator('.toast')).toContainText('Your Fly Dubai reconciliation is now processing');
    
    // Step 5: Verify enhanced processing UI for Fly Dubai
    
    // Check for enhanced processing status display
    await expect(page.locator('text=🛩️ Processing Fly Dubai Reconciliation')).toBeVisible();
    await expect(page.locator('text=Your Fly Dubai invoice and report are being analyzed')).toBeVisible();
    await expect(page.locator('text=Job ID: flydubai-')).toBeVisible();
    
    // Verify Fly Dubai-specific processing steps
    await expect(page.locator('text=Fly Dubai Processing Steps:')).toBeVisible();
    await expect(page.locator('text=Extracting AWB and CCA data from Fly Dubai invoice')).toBeVisible();
    await expect(page.locator('text=Processing standardized Excel report data')).toBeVisible();
    await expect(page.locator('text=Performing Fly Dubai-specific reconciliation analysis')).toBeVisible();
    await expect(page.locator('text=Generating Fly Dubai reconciliation report with summary, AWB, and CCA sheets')).toBeVisible();
    
    // Verify additional Fly Dubai-specific information section
    await expect(page.locator('text=What we\'re processing:')).toBeVisible();
    await expect(page.locator('text=• AWB (Air Waybill) data extraction')).toBeVisible();
    await expect(page.locator('text=• CCA (Cargo Charges Correction) analysis')).toBeVisible();
    await expect(page.locator('text=• Net due amount reconciliation')).toBeVisible();
    await expect(page.locator('text=• Multi-sheet Excel report generation')).toBeVisible();
    
    // Verify Fly Dubai processing info section
    await expect(page.locator('text=Fly Dubai Processing Info')).toBeVisible();
    await expect(page.locator('text=Your Fly Dubai reconciliation job is running in the background')).toBeVisible();
    await expect(page.locator('text=extract AWB and CCA data from your invoice')).toBeVisible();
  });

  test('should display enhanced error feedback for Fly Dubai reconciliation failures', async ({ page }) => {
    // Navigate through the flow to the reconciliation step
    await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
    await page.click('button:has-text("Continue")');
    
    // Mock invoice selection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('invoiceSelected', { 
        detail: { invoiceId: 'test-flydubai-invoice-123' } 
      }));
    });
    await page.click('button:has-text("Continue")');
    
    // Upload a test file
    const fileContent = Buffer.from('Mock Excel content');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });
    
    // Mock API error response
    await page.route('/api/reconcile', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid Fly Dubai invoice format detected',
          success: false
        }),
      });
    });
    
    // Start reconciliation
    await page.click('button:has-text("Start Reconciliation")');
    
    // Verify enhanced error feedback for Fly Dubai
    await expect(page.locator('.toast')).toContainText('🚫 Fly Dubai Reconciliation Error');
    await expect(page.locator('.toast')).toContainText('Failed to start Fly Dubai reconciliation');
    await expect(page.locator('.toast')).toContainText('Invalid Fly Dubai invoice format detected');
    
    // Verify user is returned to the report upload step
    await expect(page.locator('text=Upload Excel Report')).toBeVisible();
  });

  test('should show generic feedback for non-Fly Dubai airlines', async ({ page }) => {
    // Test with TAP airline to ensure generic messaging is preserved
    await page.selectOption('[data-testid="airline-selector"]', 'tap');
    await page.click('button:has-text("Continue")');
    
    // Mock invoice selection and continue to report upload
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('invoiceSelected', { 
        detail: { invoiceId: 'test-tap-invoice-123' } 
      }));
    });
    await page.click('button:has-text("Continue")');
    
    // Upload report file
    const fileContent = Buffer.from('Mock Excel content');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });
    
    // Mock successful API response
    await page.route('/api/reconcile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'tap-job-87654321-wxyz',
          success: true
        }),
      });
    });
    
    // Start reconciliation
    await page.click('button:has-text("Start Reconciliation")');
    
    // Verify generic feedback is shown (not Fly Dubai specific)
    await expect(page.locator('.toast')).toContainText('Uploading Report');
    await expect(page.locator('.toast')).not.toContainText('🚀 Fly Dubai');
    await expect(page.locator('.toast')).toContainText('Starting Reconciliation');
    await expect(page.locator('.toast')).toContainText('Reconciliation Started');
    
    // Verify generic processing UI
    await expect(page.locator('text=Processing TAP Reconciliation')).toBeVisible();
    await expect(page.locator('text=Processing Steps:')).toBeVisible();
    await expect(page.locator('text=Extracting invoice data')).toBeVisible();
    
    // Verify Fly Dubai-specific elements are NOT shown
    await expect(page.locator('text=🛩️ Processing Fly Dubai')).not.toBeVisible();
    await expect(page.locator('text=What we\'re processing:')).not.toBeVisible();
    await expect(page.locator('text=Fly Dubai Processing Info')).not.toBeVisible();
  });

  test('should display proper processing status with job ID for Fly Dubai', async ({ page }) => {
    // Complete the flow to processing step
    await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
    await page.click('button:has-text("Continue")');
    
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('invoiceSelected', { 
        detail: { invoiceId: 'test-flydubai-invoice-123' } 
      }));
    });
    await page.click('button:has-text("Continue")');
    
    const fileContent = Buffer.from('Mock Excel content');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });
    
    await page.route('/api/reconcile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'flydubai-job-12345678-abcd-efgh-ijkl-mnopqrstuvwx',
          success: true
        }),
      });
    });
    
    await page.click('button:has-text("Start Reconciliation")');
    
    // Wait for processing state
    await page.waitForSelector('text=🛩️ Processing Fly Dubai Reconciliation');
    
    // Verify job ID is displayed in processing status
    await expect(page.locator('text=Job ID: 12345678...')).toBeVisible();
    
    // Verify the progress indicators show proper status
    await expect(page.locator('text=✓')).toBeVisible(); // Completed step
    await expect(page.locator('text=⏳')).toBeVisible(); // Pending steps
    
    // Verify the spinning animation is present
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
}); 