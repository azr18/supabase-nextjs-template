# Test info

- Name: Authentication Integration Tests >> complete authentication flow with valid credentials
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:239:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:268:16
```

# Page snapshot

```yaml
- link "Back to Homepage":
  - /url: /
  - img
  - text: Back to Homepage
- heading "Invoice Reconciler SaaS Platform" [level=2]
- text: Auth session or user missing
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
- textbox "Email address": test@example.com
- text: Password
- textbox "Password": password123
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
  168 |     // Mock a failed authentication response
  169 |     await page.route('**/auth/v1/token**', async route => {
  170 |       await route.fulfill({
  171 |         status: 400,
  172 |         contentType: 'application/json',
  173 |         body: JSON.stringify({
  174 |           error: 'invalid_credentials',
  175 |           error_description: 'Invalid login credentials'
  176 |         })
  177 |       });
  178 |     });
  179 |     
  180 |     // Fill and submit invalid credentials
  181 |     await page.fill('input[type="email"]', 'test@example.com');
  182 |     await page.fill('input[type="password"]', 'wrongpassword');
  183 |     await page.click('button[type="submit"]:has-text("Sign in")');
  184 |     
  185 |     // Check for error message display
  186 |     await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 5000 });
  187 |   });
  188 |
  189 |   test('loading states work correctly', async ({ page }) => {
  190 |     await page.goto('/auth/login');
  191 |     
  192 |     // Mock slow response to test loading state
  193 |     await page.route('**/auth/v1/token**', async route => {
  194 |       await new Promise(resolve => setTimeout(resolve, 2000));
  195 |       await route.fulfill({
  196 |         status: 200,
  197 |         contentType: 'application/json',
  198 |         body: JSON.stringify({ access_token: 'mock_token' })
  199 |       });
  200 |     });
  201 |     
  202 |     // Fill and submit form
  203 |     await page.fill('input[type="email"]', 'test@example.com');
  204 |     await page.fill('input[type="password"]', 'password123');
  205 |     
  206 |     const submitButton = page.locator('button[type="submit"]');
  207 |     await submitButton.click();
  208 |     
  209 |     // Check loading state
  210 |     await expect(submitButton).toHaveText('Signing in...');
  211 |     await expect(submitButton).toBeDisabled();
  212 |   });
  213 |
  214 |   test('terms and privacy links work correctly', async ({ page }) => {
  215 |     await page.goto('/auth/login');
  216 |     
  217 |     // Check terms and conditions link
  218 |     const termsLink = page.locator('a:has-text("Terms and Conditions")');
  219 |     await expect(termsLink).toBeVisible();
  220 |     await expect(termsLink).toHaveAttribute('href', '/legal/terms');
  221 |     
  222 |     // Check privacy policy link
  223 |     const privacyLink = page.locator('a:has-text("Privacy Policy")');
  224 |     await expect(privacyLink).toBeVisible();
  225 |     await expect(privacyLink).toHaveAttribute('href', '/legal/privacy');
  226 |   });
  227 |
  228 |   test('OAuth callback page handles authentication', async ({ page }) => {
  229 |     // Test the OAuth callback endpoint
  230 |     await page.goto('/api/auth/callback?code=test_code&state=test_state');
  231 |     
  232 |     // Should redirect to dashboard or appropriate page
  233 |     // Since this is a mock scenario, we just ensure it doesn't error
  234 |     await page.waitForLoadState('domcontentloaded');
  235 |   });
  236 | });
  237 |
  238 | test.describe('Authentication Integration Tests', () => {
  239 |   test('complete authentication flow with valid credentials', async ({ page }) => {
  240 |     // This would require setting up test user credentials
  241 |     // For now, we'll test the UI flow without actual authentication
  242 |     
  243 |     await page.goto('/auth/login');
  244 |     
  245 |     // Fill form with test credentials
  246 |     await page.fill('input[type="email"]', 'test@example.com');
  247 |     await page.fill('input[type="password"]', 'password123');
  248 |     
  249 |     // Mock successful authentication
  250 |     await page.route('**/auth/v1/token**', async route => {
  251 |       await route.fulfill({
  252 |         status: 200,
  253 |         contentType: 'application/json',
  254 |         body: JSON.stringify({
  255 |           access_token: 'mock_access_token',
  256 |           refresh_token: 'mock_refresh_token',
  257 |           user: {
  258 |             id: 'mock_user_id',
  259 |             email: 'test@example.com'
  260 |           }
  261 |         })
  262 |       });
  263 |     });
  264 |     
  265 |     await page.click('button[type="submit"]:has-text("Sign in")');
  266 |     
  267 |     // Should redirect to dashboard
> 268 |     await page.waitForURL(/.*\/app/, { timeout: 10000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  269 |   });
  270 |
  271 |   test('MFA flow triggers when required', async ({ page }) => {
  272 |     await page.goto('/auth/login');
  273 |     
  274 |     // Mock successful login but MFA required
  275 |     await page.route('**/auth/v1/token**', async route => {
  276 |       await route.fulfill({
  277 |         status: 200,
  278 |         contentType: 'application/json',
  279 |         body: JSON.stringify({
  280 |           access_token: 'mock_access_token',
  281 |           user: { id: 'mock_user_id', email: 'test@example.com' }
  282 |         })
  283 |       });
  284 |     });
  285 |     
  286 |     await page.route('**/auth/v1/factors**', async route => {
  287 |       await route.fulfill({
  288 |         status: 200,
  289 |         contentType: 'application/json',
  290 |         body: JSON.stringify({
  291 |           aal1: { id: 'aal1' },
  292 |           aal2: { id: 'aal2' },
  293 |           nextLevel: 'aal2',
  294 |           currentLevel: 'aal1'
  295 |         })
  296 |       });
  297 |     });
  298 |     
  299 |     // Fill and submit form
  300 |     await page.fill('input[type="email"]', 'test@example.com');
  301 |     await page.fill('input[type="password"]', 'password123');
  302 |     await page.click('button[type="submit"]:has-text("Sign in")');
  303 |     
  304 |     // Should redirect to 2FA page
  305 |     await page.waitForURL(/.*\/auth\/2fa/, { timeout: 10000 });
  306 |   });
  307 | }); 
```