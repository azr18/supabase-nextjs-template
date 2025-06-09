# Test info

- Name: Fly Dubai Job Submission UI Feedback (Task 8.2) >> should display proper processing status with job ID for Fly Dubai
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\fly-dubai-job-feedback.spec.ts:212:7

# Error details

```
Error: browserContext._wrapApiCall: Test ended.
Browser logs:

<launching> C:\Users\ariel\AppData\Local\ms-playwright\firefox-1482\firefox\firefox.exe -no-remote -wait-for-browser -foreground -profile C:\Users\ariel\AppData\Local\Temp\playwright_firefoxdev_profile-YmyvKy -juggler-pipe -silent
<launched> pid=4676
[pid=4676][err] JavaScript warning: resource://services-settings/Utils.sys.mjs, line 116: unreachable code after return statement
[pid=4676][out] console.warn: services.settings: Ignoring preference override of remote settings server
[pid=4676][out] console.warn: services.settings: Allow by setting MOZ_REMOTE_SETTINGS_DEVTOOLS=1 in the environment
[pid=4676][out] 
[pid=4676][out] Juggler listening to the pipe
[pid=4676][out] console.error: "Warning: unrecognized command line flag" "-foreground"
[pid=4676][err] JavaScript error: chrome://juggler/content/Helper.js, line 82: NS_ERROR_FAILURE: Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIWebProgress.removeProgressListener]
```

# Test source

```ts
  112 |   });
  113 |
  114 |   test('should display enhanced error feedback for Fly Dubai reconciliation failures', async ({ page }) => {
  115 |     // Navigate through the flow to the reconciliation step
  116 |     await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
  117 |     await page.click('button:has-text("Continue")');
  118 |     
  119 |     // Mock invoice selection
  120 |     await page.evaluate(() => {
  121 |       window.dispatchEvent(new CustomEvent('invoiceSelected', { 
  122 |         detail: { invoiceId: 'test-flydubai-invoice-123' } 
  123 |       }));
  124 |     });
  125 |     await page.click('button:has-text("Continue")');
  126 |     
  127 |     // Upload a test file
  128 |     const fileContent = Buffer.from('Mock Excel content');
  129 |     await page.setInputFiles('input[type="file"]', {
  130 |       name: 'test-report.xlsx',
  131 |       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  132 |       buffer: fileContent,
  133 |     });
  134 |     
  135 |     // Mock API error response
  136 |     await page.route('/api/reconcile', async route => {
  137 |       await route.fulfill({
  138 |         status: 400,
  139 |         contentType: 'application/json',
  140 |         body: JSON.stringify({
  141 |           error: 'Invalid Fly Dubai invoice format detected',
  142 |           success: false
  143 |         }),
  144 |       });
  145 |     });
  146 |     
  147 |     // Start reconciliation
  148 |     await page.click('button:has-text("Start Reconciliation")');
  149 |     
  150 |     // Verify enhanced error feedback for Fly Dubai
  151 |     await expect(page.locator('.toast')).toContainText('🚫 Fly Dubai Reconciliation Error');
  152 |     await expect(page.locator('.toast')).toContainText('Failed to start Fly Dubai reconciliation');
  153 |     await expect(page.locator('.toast')).toContainText('Invalid Fly Dubai invoice format detected');
  154 |     
  155 |     // Verify user is returned to the report upload step
  156 |     await expect(page.locator('text=Upload Excel Report')).toBeVisible();
  157 |   });
  158 |
  159 |   test('should show generic feedback for non-Fly Dubai airlines', async ({ page }) => {
  160 |     // Test with TAP airline to ensure generic messaging is preserved
  161 |     await page.selectOption('[data-testid="airline-selector"]', 'tap');
  162 |     await page.click('button:has-text("Continue")');
  163 |     
  164 |     // Mock invoice selection and continue to report upload
  165 |     await page.evaluate(() => {
  166 |       window.dispatchEvent(new CustomEvent('invoiceSelected', { 
  167 |         detail: { invoiceId: 'test-tap-invoice-123' } 
  168 |       }));
  169 |     });
  170 |     await page.click('button:has-text("Continue")');
  171 |     
  172 |     // Upload report file
  173 |     const fileContent = Buffer.from('Mock Excel content');
  174 |     await page.setInputFiles('input[type="file"]', {
  175 |       name: 'test-report.xlsx',
  176 |       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  177 |       buffer: fileContent,
  178 |     });
  179 |     
  180 |     // Mock successful API response
  181 |     await page.route('/api/reconcile', async route => {
  182 |       await route.fulfill({
  183 |         status: 200,
  184 |         contentType: 'application/json',
  185 |         body: JSON.stringify({
  186 |           jobId: 'tap-job-87654321-wxyz',
  187 |           success: true
  188 |         }),
  189 |       });
  190 |     });
  191 |     
  192 |     // Start reconciliation
  193 |     await page.click('button:has-text("Start Reconciliation")');
  194 |     
  195 |     // Verify generic feedback is shown (not Fly Dubai specific)
  196 |     await expect(page.locator('.toast')).toContainText('Uploading Report');
  197 |     await expect(page.locator('.toast')).not.toContainText('🚀 Fly Dubai');
  198 |     await expect(page.locator('.toast')).toContainText('Starting Reconciliation');
  199 |     await expect(page.locator('.toast')).toContainText('Reconciliation Started');
  200 |     
  201 |     // Verify generic processing UI
  202 |     await expect(page.locator('text=Processing TAP Reconciliation')).toBeVisible();
  203 |     await expect(page.locator('text=Processing Steps:')).toBeVisible();
  204 |     await expect(page.locator('text=Extracting invoice data')).toBeVisible();
  205 |     
  206 |     // Verify Fly Dubai-specific elements are NOT shown
  207 |     await expect(page.locator('text=🛩️ Processing Fly Dubai')).not.toBeVisible();
  208 |     await expect(page.locator('text=What we\'re processing:')).not.toBeVisible();
  209 |     await expect(page.locator('text=Fly Dubai Processing Info')).not.toBeVisible();
  210 |   });
  211 |
> 212 |   test('should display proper processing status with job ID for Fly Dubai', async ({ page }) => {
      |       ^ Error: browserContext._wrapApiCall: Test ended.
  213 |     // Complete the flow to processing step
  214 |     await page.selectOption('[data-testid="airline-selector"]', 'flydubai');
  215 |     await page.click('button:has-text("Continue")');
  216 |     
  217 |     await page.evaluate(() => {
  218 |       window.dispatchEvent(new CustomEvent('invoiceSelected', { 
  219 |         detail: { invoiceId: 'test-flydubai-invoice-123' } 
  220 |       }));
  221 |     });
  222 |     await page.click('button:has-text("Continue")');
  223 |     
  224 |     const fileContent = Buffer.from('Mock Excel content');
  225 |     await page.setInputFiles('input[type="file"]', {
  226 |       name: 'test-report.xlsx',
  227 |       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  228 |       buffer: fileContent,
  229 |     });
  230 |     
  231 |     await page.route('/api/reconcile', async route => {
  232 |       await route.fulfill({
  233 |         status: 200,
  234 |         contentType: 'application/json',
  235 |         body: JSON.stringify({
  236 |           jobId: 'flydubai-job-12345678-abcd-efgh-ijkl-mnopqrstuvwx',
  237 |           success: true
  238 |         }),
  239 |       });
  240 |     });
  241 |     
  242 |     await page.click('button:has-text("Start Reconciliation")');
  243 |     
  244 |     // Wait for processing state
  245 |     await page.waitForSelector('text=🛩️ Processing Fly Dubai Reconciliation');
  246 |     
  247 |     // Verify job ID is displayed in processing status
  248 |     await expect(page.locator('text=Job ID: 12345678...')).toBeVisible();
  249 |     
  250 |     // Verify the progress indicators show proper status
  251 |     await expect(page.locator('text=✓')).toBeVisible(); // Completed step
  252 |     await expect(page.locator('text=⏳')).toBeVisible(); // Pending steps
  253 |     
  254 |     // Verify the spinning animation is present
  255 |     await expect(page.locator('.animate-spin')).toBeVisible();
  256 |   });
  257 | }); 
```