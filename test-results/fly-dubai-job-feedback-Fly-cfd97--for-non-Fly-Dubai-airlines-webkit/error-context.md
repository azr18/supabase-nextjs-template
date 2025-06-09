# Test info

- Name: Fly Dubai Job Submission UI Feedback (Task 8.2) >> should show generic feedback for non-Fly Dubai airlines
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\fly-dubai-job-feedback.spec.ts:159:7

# Error details

```
Error: expect(locator).toContainText(expected)

Locator: locator('h1')
Expected string: "Invoice Reconciler"
Received string: "My Agent"
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('h1')
    7 × locator resolved to <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-violet-600 bg-clip-text text-transparent mb-4 leading-normal">My Agent</h1>
      - unexpected value "My Agent"

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\fly-dubai-job-feedback.spec.ts:9:38
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Fly Dubai Job Submission UI Feedback (Task 8.2)', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to the invoice reconciler page
   6 |     await page.goto('/app/invoice-reconciler');
   7 |     
   8 |     // Wait for the page to load and ensure we have access
>  9 |     await expect(page.locator('h1')).toContainText('Invoice Reconciler');
     |                                      ^ Error: expect(locator).toContainText(expected)
   10 |   });
   11 |
   12 |   test('should display enhanced feedback when starting Fly Dubai reconciliation', async ({ page }) => {
   13 |     // Step 1: Select Fly Dubai airline
   14 |     await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
   15 |     
   16 |     // Verify Fly Dubai specific airline banner
   17 |     await expect(page.locator('[data-testid="airline-banner"]')).toContainText('Fly Dubai');
   18 |     
   19 |     // Click Continue to go to invoice upload
   20 |     await page.click('button:has-text("Continue")');
   21 |     
   22 |     // Step 2: Select or upload a Fly Dubai invoice
   23 |     // For this test, we'll assume an invoice is selected
   24 |     await expect(page.locator('[data-testid="invoice-manager"]')).toBeVisible();
   25 |     
   26 |     // Mock invoice selection
   27 |     await page.evaluate(() => {
   28 |       // Simulate invoice selection via the component
   29 |       window.dispatchEvent(new CustomEvent('invoiceSelected', { 
   30 |         detail: { invoiceId: 'test-flydubai-invoice-123' } 
   31 |       }));
   32 |     });
   33 |     
   34 |     // Click Continue to go to report upload
   35 |     await page.click('button:has-text("Continue")');
   36 |     
   37 |     // Step 3: Upload Excel report
   38 |     await expect(page.locator('text=Upload Excel Report')).toBeVisible();
   39 |     
   40 |     // Create a mock Excel file for testing
   41 |     const fileContent = Buffer.from('Mock Excel content for testing');
   42 |     
   43 |     // Upload the report file
   44 |     await page.setInputFiles('input[type="file"]', {
   45 |       name: 'test-report.xlsx',
   46 |       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   47 |       buffer: fileContent,
   48 |     });
   49 |     
   50 |     // Verify the file was selected and success feedback is shown
   51 |     await expect(page.locator('text=Excel report ready for processing')).toBeVisible();
   52 |     await expect(page.locator('text=Click "Start Reconciliation" to begin processing your Fly Dubai data')).toBeVisible();
   53 |     
   54 |     // Step 4: Start Fly Dubai reconciliation and verify enhanced feedback
   55 |     
   56 |     // Mock the API response for successful job creation
   57 |     await page.route('/api/reconcile', async route => {
   58 |       await route.fulfill({
   59 |         status: 200,
   60 |         contentType: 'application/json',
   61 |         body: JSON.stringify({
   62 |           jobId: 'flydubai-job-12345678-abcd-efgh-ijkl-mnopqrstuvwx',
   63 |           success: true,
   64 |           message: 'Fly Dubai reconciliation job started successfully'
   65 |         }),
   66 |       });
   67 |     });
   68 |     
   69 |     // Click Start Reconciliation button
   70 |     await page.click('button:has-text("Start Reconciliation")');
   71 |     
   72 |     // Verify enhanced Fly Dubai-specific toast messages appear
   73 |     // Check for the upload feedback toast
   74 |     await expect(page.locator('.toast')).toContainText('🚀 Fly Dubai Reconciliation Starting');
   75 |     await expect(page.locator('.toast')).toContainText('Uploading your Excel report file for Fly Dubai processing');
   76 |     
   77 |     // Wait for processing feedback toast
   78 |     await expect(page.locator('.toast')).toContainText('✈️ Processing Fly Dubai Data');
   79 |     await expect(page.locator('.toast')).toContainText('Initiating Fly Dubai reconciliation engine');
   80 |     await expect(page.locator('.toast')).toContainText('This typically takes 5-7 minutes');
   81 |     
   82 |     // Check for job creation success toast
   83 |     await expect(page.locator('.toast')).toContainText('🎯 Fly Dubai Job Started Successfully!');
   84 |     await expect(page.locator('.toast')).toContainText('Job ID: flydubai-');
   85 |     await expect(page.locator('.toast')).toContainText('Your Fly Dubai reconciliation is now processing');
   86 |     
   87 |     // Step 5: Verify enhanced processing UI for Fly Dubai
   88 |     
   89 |     // Check for enhanced processing status display
   90 |     await expect(page.locator('text=🛩️ Processing Fly Dubai Reconciliation')).toBeVisible();
   91 |     await expect(page.locator('text=Your Fly Dubai invoice and report are being analyzed')).toBeVisible();
   92 |     await expect(page.locator('text=Job ID: flydubai-')).toBeVisible();
   93 |     
   94 |     // Verify Fly Dubai-specific processing steps
   95 |     await expect(page.locator('text=Fly Dubai Processing Steps:')).toBeVisible();
   96 |     await expect(page.locator('text=Extracting AWB and CCA data from Fly Dubai invoice')).toBeVisible();
   97 |     await expect(page.locator('text=Processing standardized Excel report data')).toBeVisible();
   98 |     await expect(page.locator('text=Performing Fly Dubai-specific reconciliation analysis')).toBeVisible();
   99 |     await expect(page.locator('text=Generating Fly Dubai reconciliation report with summary, AWB, and CCA sheets')).toBeVisible();
  100 |     
  101 |     // Verify additional Fly Dubai-specific information section
  102 |     await expect(page.locator('text=What we\'re processing:')).toBeVisible();
  103 |     await expect(page.locator('text=• AWB (Air Waybill) data extraction')).toBeVisible();
  104 |     await expect(page.locator('text=• CCA (Cargo Charges Correction) analysis')).toBeVisible();
  105 |     await expect(page.locator('text=• Net due amount reconciliation')).toBeVisible();
  106 |     await expect(page.locator('text=• Multi-sheet Excel report generation')).toBeVisible();
  107 |     
  108 |     // Verify Fly Dubai processing info section
  109 |     await expect(page.locator('text=Fly Dubai Processing Info')).toBeVisible();
```