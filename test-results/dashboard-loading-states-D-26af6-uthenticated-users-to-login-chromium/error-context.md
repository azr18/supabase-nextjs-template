# Test info

- Name: Dashboard Loading States and Error Handling >> should properly redirect unauthenticated users to login
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-loading-states.spec.ts:4:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('h1, h2').filter({ hasText: /sign in|login/i })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('h1, h2').filter({ hasText: /sign in|login/i })

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-loading-states.spec.ts:12:80
```

# Page snapshot

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
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
   3 | test.describe('Dashboard Loading States and Error Handling', () => {
   4 |   test('should properly redirect unauthenticated users to login', async ({ page }) => {
   5 |     // Test the actual authentication flow
   6 |     await page.goto('/app');
   7 |     
   8 |     // Should be redirected to login page due to authentication middleware
   9 |     await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
   10 |     
   11 |     // Verify we're on the login page
>  12 |     await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible();
      |                                                                                ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   13 |   });
   14 |
   15 |   test('should show login page elements', async ({ page }) => {
   16 |     await page.goto('/auth/login');
   17 |     
   18 |     // Check login page loads properly
   19 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   20 |     await expect(page.locator('input[type="password"]')).toBeVisible();
   21 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
   22 |   });
   23 |
   24 |   test('should show register page elements', async ({ page }) => {
   25 |     await page.goto('/auth/register');
   26 |     
   27 |     // Check register page loads properly
   28 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   29 |     await expect(page.locator('input[type="password"]')).toBeVisible();
   30 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
   31 |   });
   32 |
   33 |   test('should be responsive on different screen sizes', async ({ page }) => {
   34 |     await page.goto('/auth/login');
   35 |     
   36 |     // Test mobile
   37 |     await page.setViewportSize({ width: 375, height: 667 });
   38 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   39 |     
   40 |     // Test tablet
   41 |     await page.setViewportSize({ width: 768, height: 1024 });
   42 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   43 |     
   44 |     // Test desktop
   45 |     await page.setViewportSize({ width: 1200, height: 800 });
   46 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   47 |   });
   48 |
   49 |   test('should handle network errors gracefully', async ({ page }) => {
   50 |     await page.goto('/auth/login');
   51 |     
   52 |     // Simulate network failure during form submission
   53 |     await page.route('**/auth/**', route => route.abort('failed'));
   54 |     
   55 |     await page.locator('input[type="email"]').fill('test@example.com');
   56 |     await page.locator('input[type="password"]').fill('password123');
   57 |     await page.locator('button[type="submit"]').click();
   58 |     
   59 |     // Should handle the network error gracefully
   60 |     await page.waitForTimeout(2000);
   61 |     
   62 |     // Page should still be functional
   63 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   64 |   });
   65 |
   66 |   test('should show loading states during form submission', async ({ page }) => {
   67 |     await page.goto('/auth/login');
   68 |     
   69 |     // Delay the auth response to observe loading states
   70 |     await page.route('**/auth/**', async route => {
   71 |       await new Promise(resolve => setTimeout(resolve, 1000));
   72 |       route.continue();
   73 |     });
   74 |     
   75 |     await page.locator('input[type="email"]').fill('test@example.com');
   76 |     await page.locator('input[type="password"]').fill('password123');
   77 |     
   78 |     // Look for loading states when submitting
   79 |     const submitButton = page.locator('button[type="submit"]');
   80 |     await submitButton.click();
   81 |     
   82 |     // Check if button shows loading state or is disabled
   83 |     await page.waitForTimeout(500);
   84 |     const isDisabled = await submitButton.isDisabled();
   85 |     const buttonText = await submitButton.textContent();
   86 |     
   87 |     // Should show some form of loading feedback
   88 |     expect(isDisabled || buttonText?.toLowerCase().includes('loading') || buttonText?.toLowerCase().includes('signing')).toBeTruthy();
   89 |   });
   90 |
   91 |   test('should handle form validation correctly', async ({ page }) => {
   92 |     await page.goto('/auth/login');
   93 |     
   94 |     // Try to submit empty form
   95 |     await page.locator('button[type="submit"]').click();
   96 |     
   97 |     // Should show validation or stay on page
   98 |     const emailInput = page.locator('input[type="email"]');
   99 |     await expect(emailInput).toBeVisible();
  100 |     
  101 |     // Check HTML5 validation attributes
  102 |     const isRequired = await emailInput.getAttribute('required');
  103 |     expect(isRequired).not.toBeNull();
  104 |   });
  105 |
  106 |   test('should navigate between auth pages correctly', async ({ page }) => {
  107 |     await page.goto('/auth/login');
  108 |     
  109 |     // Find navigation links
  110 |     const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")').first();
  111 |     if (await registerLink.count() > 0) {
  112 |       await registerLink.click();
```