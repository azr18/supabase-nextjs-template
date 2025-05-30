# Test info

- Name: Authentication Flow >> email login form validation works correctly
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:80:7

# Error details

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]:has-text("Sign in")')
    - locator resolved to <button type="submit" class="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">Sign in</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-blue-600 text-white hover:bg-blue-700">Accept</button> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    8 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-blue-600 text-white hover:bg-blue-700">Accept</button> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-blue-600 text-white hover:bg-blue-700">Accept</button> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm text-gray-600">We use cookies to enhance your browsing experienc…</p> from <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-500 ease-in-out">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:99:16
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
- textbox "Email address": test@example.com
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
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Authentication Flow', () => {
   4 |   // Test basic page loading and UI elements
   5 |   test('login page loads correctly with Google OAuth button', async ({ page }) => {
   6 |     await page.goto('/auth/login');
   7 |     
   8 |     // Check if page loads properly
   9 |     await expect(page).toHaveTitle(/Invoice Reconciler SaaS Platform/);
   10 |     
   11 |     // Check for Google OAuth section
   12 |     await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
   13 |     
   14 |     // Check for Google OAuth button
   15 |     const googleButton = page.locator('button:has-text("Continue with Google")');
   16 |     await expect(googleButton).toBeVisible();
   17 |     
   18 |     // Check for email/password form
   19 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   20 |     await expect(page.locator('input[type="password"]')).toBeVisible();
   21 |     
   22 |     // Check for form labels
   23 |     await expect(page.locator('label[for="email"]')).toHaveText('Email address');
   24 |     await expect(page.locator('label[for="password"]')).toHaveText('Password');
   25 |     
   26 |     // Check for sign-in button
   27 |     await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
   28 |     
   29 |     // Check for navigation links
   30 |     await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();
   31 |     await expect(page.locator('a:has-text("Sign up")')).toBeVisible();
   32 |   });
   33 |
   34 |   test('registration page loads correctly with Google OAuth button', async ({ page }) => {
   35 |     await page.goto('/auth/register');
   36 |     
   37 |     // Check for Google OAuth section
   38 |     await expect(page.locator('h3:has-text("Quick Sign Up")')).toBeVisible();
   39 |     
   40 |     // Check for Google OAuth button
   41 |     const googleButton = page.locator('button:has-text("Continue with Google")');
   42 |     await expect(googleButton).toBeVisible();
   43 |     
   44 |     // Check for email/password form fields
   45 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   46 |     await expect(page.locator('input[type="password"]')).toBeVisible();
   47 |     
   48 |     // Check for sign-up button
   49 |     await expect(page.locator('button[type="submit"]:has-text("Sign up")')).toBeVisible();
   50 |     
   51 |     // Check for navigation to login
   52 |     await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
   53 |   });
   54 |
   55 |   test('Google OAuth button triggers authentication flow', async ({ page }) => {
   56 |     await page.goto('/auth/login');
   57 |     
   58 |     // Wait for the page to load
   59 |     await page.waitForLoadState('domcontentloaded');
   60 |     
   61 |     // Mock the OAuth response to avoid external dependencies
   62 |     await page.route('**/auth/v1/authorize**', async route => {
   63 |       await route.fulfill({
   64 |         status: 302,
   65 |         headers: {
   66 |           'Location': '/api/auth/callback?code=mock_auth_code&state=mock_state'
   67 |         }
   68 |       });
   69 |     });
   70 |     
   71 |     // Click the Google OAuth button
   72 |     const googleButton = page.locator('button:has-text("Continue with Google")');
   73 |     await googleButton.click();
   74 |     
   75 |     // Should be redirected or trigger OAuth flow
   76 |     // Since we're testing the UI interaction, we verify the button click doesn't throw errors
   77 |     await page.waitForTimeout(1000); // Wait for any potential navigation
   78 |   });
   79 |
   80 |   test('email login form validation works correctly', async ({ page }) => {
   81 |     await page.goto('/auth/login');
   82 |     
   83 |     // Try to submit empty form
   84 |     await page.click('button[type="submit"]:has-text("Sign in")');
   85 |     
   86 |     // Check for HTML5 validation (email required)
   87 |     const emailInput = page.locator('input[type="email"]');
   88 |     await expect(emailInput).toBeVisible();
   89 |     
   90 |     // Fill invalid email
   91 |     await emailInput.fill('invalid-email');
   92 |     await page.click('button[type="submit"]:has-text("Sign in")');
   93 |     
   94 |     // Check for email validation (browser native or custom)
   95 |     await expect(emailInput).toBeVisible();
   96 |     
   97 |     // Fill valid email but no password
   98 |     await emailInput.fill('test@example.com');
>  99 |     await page.click('button[type="submit"]:has-text("Sign in")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  100 |     
  101 |     // Check password field is required
  102 |     const passwordInput = page.locator('input[type="password"]');
  103 |     await expect(passwordInput).toBeVisible();
  104 |   });
  105 |
  106 |   test('navigation between login and register works', async ({ page }) => {
  107 |     // Start at login page
  108 |     await page.goto('/auth/login');
  109 |     await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
  110 |     
  111 |     // Navigate to register
  112 |     await page.click('a:has-text("Sign up")');
  113 |     await expect(page).toHaveURL(/.*\/auth\/register/);
  114 |     await expect(page.locator('h3:has-text("Quick Sign Up")')).toBeVisible();
  115 |     
  116 |     // Navigate back to login
  117 |     await page.click('a:has-text("Sign in")');
  118 |     await expect(page).toHaveURL(/.*\/auth\/login/);
  119 |     await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
  120 |   });
  121 |
  122 |   test('forgot password link works', async ({ page }) => {
  123 |     await page.goto('/auth/login');
  124 |     
  125 |     // Click forgot password link
  126 |     await page.click('a:has-text("Forgot your password?")');
  127 |     await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
  128 |   });
  129 |
  130 |   test('SSO providers configuration is respected', async ({ page }) => {
  131 |     await page.goto('/auth/login');
  132 |     
  133 |     // Check which providers are enabled based on environment
  134 |     // This tests the getEnabledProviders function
  135 |     const googleButton = page.locator('button:has-text("Continue with Google")');
  136 |     
  137 |     // Google should be visible if configured
  138 |     if (process.env.NEXT_PUBLIC_SSO_PROVIDERS?.includes('google')) {
  139 |       await expect(googleButton).toBeVisible();
  140 |     }
  141 |     
  142 |     // GitHub button should only be visible if configured
  143 |     const githubButton = page.locator('button:has-text("Continue with GitHub")');
  144 |     if (process.env.NEXT_PUBLIC_SSO_PROVIDERS?.includes('github')) {
  145 |       await expect(githubButton).toBeVisible();
  146 |     }
  147 |   });
  148 |
  149 |   test('responsive design works on mobile', async ({ page }) => {
  150 |     // Set mobile viewport
  151 |     await page.setViewportSize({ width: 375, height: 667 });
  152 |     await page.goto('/auth/login');
  153 |     
  154 |     // Check if elements are visible and properly arranged on mobile
  155 |     await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
  156 |     await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  157 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  158 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  159 |     
  160 |     // Check button heights and spacing work on mobile
  161 |     const googleButton = page.locator('button:has-text("Continue with Google")');
  162 |     await expect(googleButton).toHaveCSS('height', '44px'); // h-11 = 44px
  163 |   });
  164 |
  165 |   test('error handling displays correctly', async ({ page }) => {
  166 |     await page.goto('/auth/login');
  167 |     
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
```