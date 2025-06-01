# Test info

- Name: FileUpload Component E2E Tests >> File Upload Functionality >> should successfully upload a valid PDF file
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:162:9

# Error details

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="airline-selector"]')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\file-upload.spec.ts:164:18
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
   64 |   test.afterAll(async () => {
   65 |     // Clean up test files
   66 |     const testFilesDir = path.join(__dirname, '../../test-files');
   67 |     if (fs.existsSync(testFilesDir)) {
   68 |       fs.rmSync(testFilesDir, { recursive: true });
   69 |     }
   70 |   });
   71 |
   72 |   test.beforeEach(async ({ page }) => {
   73 |     // Mock Supabase auth and tool access
   74 |     await page.route('**/auth/v1/**', async route => {
   75 |       const url = route.request().url();
   76 |       if (url.includes('/user')) {
   77 |         await route.fulfill({
   78 |           status: 200,
   79 |           contentType: 'application/json',
   80 |           body: JSON.stringify({
   81 |             data: {
   82 |               user: {
   83 |                 id: 'test-user-id',
   84 |                 email: TEST_EMAIL,
   85 |                 user_metadata: {},
   86 |                 app_metadata: {}
   87 |               }
   88 |             }
   89 |           })
   90 |         });
   91 |       } else {
   92 |         await route.continue();
   93 |       }
   94 |     });
   95 |
   96 |     // Mock tool access API
   97 |     await page.route('**/rest/v1/rpc/has_tool_access*', async route => {
   98 |       await route.fulfill({
   99 |         status: 200,
  100 |         contentType: 'application/json',
  101 |         body: JSON.stringify(true)
  102 |       });
  103 |     });
  104 |
  105 |     // Mock tool subscription status
  106 |     await page.route('**/rest/v1/rpc/get_tool_subscription_status*', async route => {
  107 |       await route.fulfill({
  108 |         status: 200,
  109 |         contentType: 'application/json',
  110 |         body: JSON.stringify({
  111 |           subscription: { id: 'test-sub', status: 'active' },
  112 |           status: 'active'
  113 |         })
  114 |       });
  115 |     });
  116 |
  117 |     // Mock saved invoices API
  118 |     await page.route('**/rest/v1/rpc/get_user_invoices_by_airline*', async route => {
  119 |       await route.fulfill({
  120 |         status: 200,
  121 |         contentType: 'application/json',
  122 |         body: JSON.stringify([])
  123 |       });
  124 |     });
  125 |
  126 |     await page.goto('/app/invoice-reconciler');
  127 |     await page.waitForLoadState('networkidle');
  128 |   });
  129 |
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
> 164 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      |                  ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
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
  230 |       await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
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
```