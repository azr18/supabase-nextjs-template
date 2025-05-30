# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Enrollment Process >> completes MFA enrollment flow successfully
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:111:9

# Error details

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Add New Authentication Method')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:149:18
```

# Page snapshot

```yaml
- link "Back to Homepage":
  - /url: /
  - img
  - text: Back to Homepage
- heading "Invoice Reconciler SaaS Platform" [level=2]
- heading "Quick Sign In" [level=3]
- text: Or continue with
- button "Continue with GitHub":
  - img
  - text: Continue with GitHub
- button "Continue with Google":
  - img
  - text: Continue with Google
- button "Continue with Facebook":
  - img
  - text: Continue with Facebook
- button "Continue with Apple":
  - img
  - text: Continue with Apple
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
   49 |       // Navigate to user settings
   50 |       await page.goto('/app/user-settings');
   51 |       
   52 |       // Check for MFA section
   53 |       await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
   54 |       await expect(page.locator('text=Add an additional layer of security')).toBeVisible();
   55 |     });
   56 |
   57 |     test('shows empty state when no MFA factors exist', async ({ page }) => {
   58 |       // Mock empty MFA factors list
   59 |       await page.route('**/auth/v1/factors**', async route => {
   60 |         await route.fulfill({
   61 |           status: 200,
   62 |           contentType: 'application/json',
   63 |           body: JSON.stringify({
   64 |             all: [],
   65 |             totp: []
   66 |           })
   67 |         });
   68 |       });
   69 |
   70 |       await page.goto('/app/user-settings');
   71 |       
   72 |       // Check empty state message
   73 |       await expect(page.locator('text=Protect your account with two-factor authentication')).toBeVisible();
   74 |       await expect(page.locator('text=Add New Authentication Method')).toBeVisible();
   75 |     });
   76 |
   77 |     test('displays existing MFA factors when they exist', async ({ page }) => {
   78 |       // Mock existing MFA factor
   79 |       await page.route('**/auth/v1/factors**', async route => {
   80 |         await route.fulfill({
   81 |           status: 200,
   82 |           contentType: 'application/json',
   83 |           body: JSON.stringify({
   84 |             all: [{
   85 |               id: 'factor-123',
   86 |               friendly_name: 'My Authenticator App',
   87 |               factor_type: 'totp',
   88 |               status: 'verified',
   89 |               created_at: '2024-01-01T00:00:00Z'
   90 |             }],
   91 |             totp: [{
   92 |               id: 'factor-123',
   93 |               friendly_name: 'My Authenticator App',
   94 |               factor_type: 'totp',
   95 |               status: 'verified',
   96 |               created_at: '2024-01-01T00:00:00Z'
   97 |             }]
   98 |           })
   99 |         });
  100 |       });
  101 |
  102 |       await page.goto('/app/user-settings');
  103 |       
  104 |       // Check existing factor display
  105 |       await expect(page.locator('text=My Authenticator App')).toBeVisible();
  106 |       await expect(page.locator('text=Verified')).toBeVisible();
  107 |     });
  108 |   });
  109 |
  110 |   test.describe('MFA Enrollment Process', () => {
  111 |     test('completes MFA enrollment flow successfully', async ({ page }) => {
  112 |       // Mock empty factors initially
  113 |       await page.route('**/auth/v1/factors**', async route => {
  114 |         if (route.request().method() === 'GET') {
  115 |           await route.fulfill({
  116 |             status: 200,
  117 |             contentType: 'application/json',
  118 |             body: JSON.stringify({
  119 |               all: [],
  120 |               totp: []
  121 |             })
  122 |           });
  123 |         } else {
  124 |           await route.continue();
  125 |         }
  126 |       });
  127 |
  128 |       // Mock enrollment endpoint
  129 |       await page.route('**/auth/v1/factors**', async route => {
  130 |         if (route.request().method() === 'POST') {
  131 |           await route.fulfill({
  132 |             status: 200,
  133 |             contentType: 'application/json',
  134 |             body: JSON.stringify({
  135 |               id: 'factor-123',
  136 |               totp: {
  137 |                 qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
  138 |               }
  139 |             })
  140 |           });
  141 |         } else {
  142 |           await route.continue();
  143 |         }
  144 |       });
  145 |
  146 |       await page.goto('/app/user-settings');
  147 |       
  148 |       // Start enrollment
> 149 |       await page.click('text=Add New Authentication Method');
      |                  ^ Error: page.click: Test timeout of 30000ms exceeded.
  150 |       
  151 |       // Fill in friendly name
  152 |       await page.fill('input[placeholder*="Enter a name"]', 'My Test Authenticator');
  153 |       await page.click('text=Continue');
  154 |       
  155 |       // Check QR code display
  156 |       await expect(page.locator('text=Scan this QR code')).toBeVisible();
  157 |       await expect(page.locator('img')).toBeVisible(); // QR code image
  158 |     });
  159 |
  160 |     test('validates friendly name input', async ({ page }) => {
  161 |       await page.route('**/auth/v1/factors**', async route => {
  162 |         await route.fulfill({
  163 |           status: 200,
  164 |           contentType: 'application/json',
  165 |           body: JSON.stringify({
  166 |             all: [],
  167 |             totp: []
  168 |           })
  169 |         });
  170 |       });
  171 |
  172 |       await page.goto('/app/user-settings');
  173 |       
  174 |       // Start enrollment without name
  175 |       await page.click('text=Add New Authentication Method');
  176 |       await page.click('text=Continue');
  177 |       
  178 |       // Check validation error
  179 |       await expect(page.locator('text=Please provide a name')).toBeVisible();
  180 |     });
  181 |
  182 |     test('handles enrollment errors gracefully', async ({ page }) => {
  183 |       await page.route('**/auth/v1/factors**', async route => {
  184 |         if (route.request().method() === 'GET') {
  185 |           await route.fulfill({
  186 |             status: 200,
  187 |             contentType: 'application/json',
  188 |             body: JSON.stringify({
  189 |               all: [],
  190 |               totp: []
  191 |             })
  192 |           });
  193 |         } else if (route.request().method() === 'POST') {
  194 |           await route.fulfill({
  195 |             status: 400,
  196 |             contentType: 'application/json',
  197 |             body: JSON.stringify({
  198 |               error: {
  199 |                 message: 'Enrollment failed'
  200 |               }
  201 |             })
  202 |           });
  203 |         }
  204 |       });
  205 |
  206 |       await page.goto('/app/user-settings');
  207 |       
  208 |       await page.click('text=Add New Authentication Method');
  209 |       await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
  210 |       await page.click('text=Continue');
  211 |       
  212 |       // Check error handling
  213 |       await expect(page.locator('text=Enrollment failed')).toBeVisible();
  214 |     });
  215 |   });
  216 |
  217 |   test.describe('MFA Verification Process', () => {
  218 |     test('completes MFA verification successfully', async ({ page }) => {
  219 |       // Mock enrollment and challenge/verify endpoints
  220 |       let enrollmentCompleted = false;
  221 |       
  222 |       await page.route('**/auth/v1/factors**', async route => {
  223 |         const method = route.request().method();
  224 |         
  225 |         if (method === 'GET') {
  226 |           await route.fulfill({
  227 |             status: 200,
  228 |             contentType: 'application/json',
  229 |             body: JSON.stringify({
  230 |               all: enrollmentCompleted ? [{
  231 |                 id: 'factor-123',
  232 |                 friendly_name: 'Test Device',
  233 |                 factor_type: 'totp',
  234 |                 status: 'verified',
  235 |                 created_at: '2024-01-01T00:00:00Z'
  236 |               }] : [],
  237 |               totp: enrollmentCompleted ? [{
  238 |                 id: 'factor-123',
  239 |                 friendly_name: 'Test Device',
  240 |                 factor_type: 'totp',
  241 |                 status: 'verified',
  242 |                 created_at: '2024-01-01T00:00:00Z'
  243 |               }] : []
  244 |             })
  245 |           });
  246 |         } else if (method === 'POST') {
  247 |           await route.fulfill({
  248 |             status: 200,
  249 |             contentType: 'application/json',
```