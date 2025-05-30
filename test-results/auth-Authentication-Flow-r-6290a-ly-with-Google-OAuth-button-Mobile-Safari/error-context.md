# Test info

- Name: Authentication Flow >> registration page loads correctly with Google OAuth button
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:34:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('h3:has-text("Quick Sign Up")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('h3:has-text("Quick Sign Up")')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\auth.spec.ts:38:64
```

# Page snapshot

```yaml
- link "Back to Homepage":
  - /url: /
  - img
  - text: Back to Homepage
- heading "Invoice Reconciler SaaS Platform" [level=2]
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
- text: Or register with email Email address
- textbox "Email address"
- text: Password
- textbox "Password"
- text: Confirm Password
- textbox "Confirm Password"
- checkbox "I agree to the Terms of Service and Privacy Policy"
- text: I agree to the
- link "Terms of Service":
  - /url: /legal/terms
- text: and
- link "Privacy Policy":
  - /url: /legal/privacy
- button "Create account"
- text: Already have an account?
- link "Sign in":
  - /url: /auth/login
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
>  38 |     await expect(page.locator('h3:has-text("Quick Sign Up")')).toBeVisible();
      |                                                                ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
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
   99 |     await page.click('button[type="submit"]:has-text("Sign in")');
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
```