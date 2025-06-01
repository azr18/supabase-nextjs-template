# Test info

- Name: FileUpload Component E2E Tests >> File Preview and Management >> should allow removing selected file
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:228:9

# Error details

```
Error: page.selectOption: Target page, context or browser has been closed
Call log:
  - waiting for locator('[data-testid="airline-selector"]')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:230:18
```

# Test source

```ts
  130 |   test.describe('FileUpload Component Rendering', () => {
  131 |     test('should render file upload component when airline is selected', async ({ page }) => {
  132 |       // Select an airline first
  133 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  134 |       await page.click('button:has-text("Continue")');
  135 |       
  136 |       // Should be on invoice upload step
  137 |       await expect(page.locator('text=Upload New Invoice')).toBeVisible();
  138 |       await expect(page.locator('text=Upload PDF Invoice')).toBeVisible();
  139 |       await expect(page.locator('text=Drag and drop a PDF file here')).toBeVisible();
  140 |     });
  141 |
  142 |     test('should show airline-specific information', async ({ page }) => {
  143 |       // Select an airline first
  144 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  145 |       await page.click('button:has-text("Continue")');
  146 |       
  147 |       // Should show airline-specific note
  148 |       await expect(page.locator('text=Please upload a PDF invoice in Fly Dubai format')).toBeVisible();
  149 |     });
  150 |
  151 |     test('should show file size limit information', async ({ page }) => {
  152 |       // Select an airline first
  153 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  154 |       await page.click('button:has-text("Continue")');
  155 |       
  156 |       // Should show file size limit
  157 |       await expect(page.locator('text=Maximum file size: 25 MB')).toBeVisible();
  158 |     });
  159 |   });
  160 |
  161 |   test.describe('File Upload Functionality', () => {
  162 |     test('should successfully upload a valid PDF file', async ({ page }) => {
  163 |       // Select an airline first
  164 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  165 |       await page.click('button:has-text("Continue")');
  166 |       
  167 |       // Upload a valid PDF file
  168 |       const fileInput = page.locator('input[type="file"]');
  169 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  170 |       
  171 |       // Should show success feedback
  172 |       await expect(page.locator('text=File ready for upload')).toBeVisible();
  173 |       await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
  174 |       
  175 |       // Should enable continue button
  176 |       await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
  177 |     });
  178 |
  179 |     test('should show validation error for non-PDF files', async ({ page }) => {
  180 |       // Select an airline first
  181 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  182 |       await page.click('button:has-text("Continue")');
  183 |       
  184 |       // Try to upload a text file
  185 |       const fileInput = page.locator('input[type="file"]');
  186 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
  187 |       
  188 |       // Should show error message
  189 |       await expect(page.locator('text=Only PDF files are allowed for invoice uploads')).toBeVisible();
  190 |       
  191 |       // Continue button should remain disabled
  192 |       await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
  193 |     });
  194 |
  195 |     test('should show validation error for large files', async ({ page }) => {
  196 |       // Select an airline first
  197 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  198 |       await page.click('button:has-text("Continue")');
  199 |       
  200 |       // Try to upload a large file
  201 |       const fileInput = page.locator('input[type="file"]');
  202 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/large-file.pdf'));
  203 |       
  204 |       // Should show error message
  205 |       await expect(page.locator('text=File size must be less than 25 MB')).toBeVisible();
  206 |       
  207 |       // Continue button should remain disabled
  208 |       await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
  209 |     });
  210 |   });
  211 |
  212 |   test.describe('File Preview and Management', () => {
  213 |     test('should show file preview after successful upload', async ({ page }) => {
  214 |       // Select an airline first
  215 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  216 |       await page.click('button:has-text("Continue")');
  217 |       
  218 |       // Upload a valid PDF file
  219 |       const fileInput = page.locator('input[type="file"]');
  220 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  221 |       
  222 |       // Should show file preview with details
  223 |       await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
  224 |       await expect(page.locator('text=PDF')).toBeVisible();
  225 |       await expect(page.locator('text=File ready for upload')).toBeVisible();
  226 |     });
  227 |
  228 |     test('should allow removing selected file', async ({ page }) => {
  229 |       // Select an airline first
> 230 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      |                  ^ Error: page.selectOption: Target page, context or browser has been closed
  231 |       await page.click('button:has-text("Continue")');
  232 |       
  233 |       // Upload a valid PDF file
  234 |       const fileInput = page.locator('input[type="file"]');
  235 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  236 |       
  237 |       // Wait for file to be selected
  238 |       await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
  239 |       
  240 |       // Remove the file
  241 |       const removeButton = page.locator('button[aria-label="Remove selected file"]');
  242 |       await removeButton.click();
  243 |       
  244 |       // Should return to upload state
  245 |       await expect(page.locator('text=Upload PDF Invoice')).toBeVisible();
  246 |       await expect(page.locator('text=test-invoice.pdf')).not.toBeVisible();
  247 |       
  248 |       // Continue button should be disabled again
  249 |       await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
  250 |     });
  251 |
  252 |     test('should allow choosing different file after selection', async ({ page }) => {
  253 |       // Select an airline first
  254 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
  255 |       await page.click('button:has-text("Continue")');
  256 |       
  257 |       // Upload a valid PDF file
  258 |       const fileInput = page.locator('input[type="file"]');
  259 |       await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
  260 |       
  261 |       // Wait for file to be selected
  262 |       await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
  263 |       
  264 |       // Click "Choose Different File"
  265 |       await page.click('button:has-text("Choose Different File")');
  266 |       
  267 |       // Should trigger file input (in e2e test, we just verify the button is clickable)
  268 |       await expect(page.locator('button:has-text("Choose Different File")')).toBeVisible();
  269 |     });
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
```