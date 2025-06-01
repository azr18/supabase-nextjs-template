# Test info

- Name: FileUpload Component E2E Tests >> Visual States >> should show proper disabled state
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:360:9

# Error details

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="airline-selector"]')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:370:18
```

# Page snapshot

```yaml
- link "Back to Homepage":
  - /url: /
  - img
  - text: Back to Homepage
- heading "My Agent" [level=1]
- paragraph: AI Business Automation Platform
- heading "Quick Sign In" [level=3]
- text: Or continue with
- button "Continue with Google":
  - img
  - text: Continue with Google
- text: By creating an account via selected provider, you agree to our
- link "Terms and Conditions":
  - /url: /legal/terms
- text: and
- link "Privacy Policy":
  - /url: /legal/privacy
- text: Or sign in with email Email address
- textbox "Email address"
- text: Password
- textbox "Password"
- link "Forgot your password?":
  - /url: /auth/forgot-password
- button "Sign in"
- text: Don't have an account?
- link "Sign up":
  - /url: /auth/register
- heading "Automate Your Business" [level=2]
- paragraph: Join businesses transforming their operations with custom AI solutions
- img
- heading "AI-Powered Automation" [level=3]
- paragraph: Intelligent document processing and reconciliation tailored to your business needs
- text: "1"
- img
- heading "Lightning Fast Results" [level=3]
- paragraph: Automated workflows that save hours of manual processing time every month
- text: "2"
- img
- heading "Enterprise Security" [level=3]
- paragraph: Bank-level security with user isolation and encrypted data storage
- text: "3"
- paragraph: Trusted by businesses worldwide
- status:
  - img
  - text: Static route
  - button "Hide static indicator":
    - img
- alert
- img
- paragraph: We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
- paragraph:
  - text: Read our
  - link "Privacy Policy":
    - /url: /legal/privacy
  - text: and
  - link "Terms of Service":
    - /url: /legal/terms
  - text: for more information.
- button "Decline"
- button "Accept"
- button "Close":
  - img
```

# Test source

```ts
  270 |   });
  271 |
  272 |   test.describe('Integration with Workflow', () => {
  273 |     test('should integrate with existing invoice selection workflow', async ({ page }) => {
  274 |       // Select an airline first
  275 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  276 |       await page.click('button:has-text("Continue")');
  277 |       
  278 |       // Should show both saved invoices section and file upload section
  279 |       await expect(page.locator('text=Saved Invoices')).toBeVisible();
  280 |       await expect(page.locator('text=Upload New Invoice')).toBeVisible();
  281 |       
  282 |       // Upload a file
  283 |       const fileInput = page.locator('input[type="file"]');
  284 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  285 |       
  286 |       // Should show file upload success message
  287 |       await expect(page.locator('text=New invoice file ready for upload')).toBeVisible();
  288 |       await expect(page.locator('text=File: test-invoice.pdf')).toBeVisible();
  289 |       
  290 |       // Continue button should be enabled
  291 |       await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
  292 |     });
  293 |
  294 |     test('should show validation error when neither invoice nor file is selected', async ({ page }) => {
  295 |       // Select an airline first
  296 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  297 |       await page.click('button:has-text("Continue")');
  298 |       
  299 |       // Don't select anything - should show validation error
  300 |       await expect(page.locator('text=Please either select an existing invoice or upload a new invoice file')).toBeVisible();
  301 |       
  302 |       // Continue button should be disabled
  303 |       await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
  304 |     });
  305 |   });
  306 |
  307 |   test.describe('Accessibility', () => {
  308 |     test('should be keyboard accessible', async ({ page }) => {
  309 |       // Select an airline first
  310 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  311 |       await page.click('button:has-text("Continue")');
  312 |       
  313 |       // Upload area should be focusable
  314 |       const uploadArea = page.locator('[aria-label="Upload area for PDF invoice files"]');
  315 |       await uploadArea.focus();
  316 |       
  317 |       // Should have proper tabindex
  318 |       await expect(uploadArea).toHaveAttribute('tabindex', '0');
  319 |       
  320 |       // Should have proper role
  321 |       await expect(uploadArea).toHaveAttribute('role', 'button');
  322 |     });
  323 |
  324 |     test('should have proper ARIA labels', async ({ page }) => {
  325 |       // Select an airline first
  326 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  327 |       await page.click('button:has-text("Continue")');
  328 |       
  329 |       // Check ARIA labels
  330 |       await expect(page.locator('[aria-label="Upload area for PDF invoice files"]')).toBeVisible();
  331 |       await expect(page.locator('[aria-label="File input for PDF invoices"]')).toBeVisible();
  332 |     });
  333 |   });
  334 |
  335 |   test.describe('Visual States', () => {
  336 |     test('should show loading state during file validation', async ({ page }) => {
  337 |       // Select an airline first
  338 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  339 |       await page.click('button:has-text("Continue")');
  340 |       
  341 |       // Upload a file and check for loading state
  342 |       const fileInput = page.locator('input[type="file"]');
  343 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  344 |       
  345 |       // Should show success state after validation
  346 |       await expect(page.locator('text=File ready for upload')).toBeVisible();
  347 |     });
  348 |
  349 |     test('should maintain blue gradient theme consistency', async ({ page }) => {
  350 |       // Select an airline first
  351 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  352 |       await page.click('button:has-text("Continue")');
  353 |       
  354 |       // Check for blue gradient theme elements
  355 |       const uploadCard = page.locator('text=Upload New Invoice').locator('..');
  356 |       await expect(uploadCard).toHaveClass(/from-blue-50/);
  357 |       await expect(uploadCard).toHaveClass(/border-blue-200/);
  358 |     });
  359 |
  360 |     test('should show proper disabled state', async ({ page }) => {
  361 |       // Mock disabled state by adding disabled prop
  362 |       await page.evaluate(() => {
  363 |         const uploadComponents = document.querySelectorAll('[data-testid*="file-upload"]');
  364 |         uploadComponents.forEach(component => {
  365 |           (component as any).disabled = true;
  366 |         });
  367 |       });
  368 |       
  369 |       // Select an airline first
> 370 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      |                  ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
  371 |       await page.click('button:has-text("Continue")');
  372 |       
  373 |       // Browse button should be disabled
  374 |       const browseButton = page.locator('button:has-text("Browse Files")');
  375 |       await expect(browseButton).toBeDisabled();
  376 |     });
  377 |   });
  378 |
  379 |   test.describe('Error Handling', () => {
  380 |     test('should handle multiple file validation errors gracefully', async ({ page }) => {
  381 |       // Select an airline first
  382 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  383 |       await page.click('button:has-text("Continue")');
  384 |       
  385 |       // Try different invalid files
  386 |       const fileInput = page.locator('input[type="file"]');
  387 |       
  388 |       // First, try a non-PDF file
  389 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
  390 |       await expect(page.locator('text=Only PDF files are allowed')).toBeVisible();
  391 |       
  392 |       // Then try a large PDF file
  393 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/large-file.pdf'));
  394 |       await expect(page.locator('text=File size must be less than 25 MB')).toBeVisible();
  395 |       
  396 |       // Finally, upload a valid file
  397 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  398 |       await expect(page.locator('text=File ready for upload')).toBeVisible();
  399 |     });
  400 |
  401 |     test('should recover from error states properly', async ({ page }) => {
  402 |       // Select an airline first
  403 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  404 |       await page.click('button:has-text("Continue")');
  405 |       
  406 |       const fileInput = page.locator('input[type="file"]');
  407 |       
  408 |       // Upload invalid file first
  409 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
  410 |       await expect(page.locator('text=Only PDF files are allowed')).toBeVisible();
  411 |       
  412 |       // Upload valid file - should clear error
  413 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  414 |       await expect(page.locator('text=File ready for upload')).toBeVisible();
  415 |       await expect(page.locator('text=Only PDF files are allowed')).not.toBeVisible();
  416 |     });
  417 |   });
  418 | }); 
```