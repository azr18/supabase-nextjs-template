# Test info

- Name: Dashboard Loading States and Error Handling >> should navigate between auth pages correctly
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-loading-states.spec.ts:106:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('h1, h2').filter({ hasText: /sign up|register/i })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('h1, h2').filter({ hasText: /sign up|register/i })

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-loading-states.spec.ts:113:85
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
- heading "Trusted by developers worldwide" [level=3]
- text: SC
- paragraph: "\"This template helped us launch our SaaS product in just two weeks. The authentication and multi-tenancy features are rock solid.\""
- paragraph: Sarah Chen
- paragraph: CTO, TechStart
- text: MR
- paragraph: "\"The best part is how well thought out the organization management is. It saved us months of development time.\""
- paragraph: Michael Roberts
- paragraph: Founder, DataFlow
- text: JK
- paragraph: "\"Clean code, great documentation, and excellent support. Exactly what we needed to get our MVP off the ground.\""
- paragraph: Jessica Kim
- paragraph: Lead Developer, CloudScale
- paragraph: Join thousands of developers building with Invoice Reconciler SaaS Platform
```

# Test source

```ts
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
> 113 |       await expect(page.locator('h1, h2').filter({ hasText: /sign up|register/i })).toBeVisible();
      |                                                                                     ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  114 |     }
  115 |   });
  116 |
  117 |   test('should maintain accessibility standards', async ({ page }) => {
  118 |     await page.goto('/auth/login');
  119 |     
  120 |     // Check for proper form labels
  121 |     const emailInput = page.locator('input[type="email"]');
  122 |     const passwordInput = page.locator('input[type="password"]');
  123 |     
  124 |     // Should have labels or aria-labels
  125 |     const emailLabel = await emailInput.getAttribute('aria-label') || 
  126 |                       await page.locator('label').filter({ hasText: /email/i }).count() > 0;
  127 |     const passwordLabel = await passwordInput.getAttribute('aria-label') || 
  128 |                          await page.locator('label').filter({ hasText: /password/i }).count() > 0;
  129 |     
  130 |     expect(emailLabel).toBeTruthy();
  131 |     expect(passwordLabel).toBeTruthy();
  132 |   });
  133 |
  134 |   test('should handle browser navigation correctly', async ({ page }) => {
  135 |     // Test navigation flow
  136 |     await page.goto('/auth/login');
  137 |     await page.goto('/auth/register');
  138 |     
  139 |     // Go back
  140 |     await page.goBack();
  141 |     await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible();
  142 |     
  143 |     // Go forward
  144 |     await page.goForward();
  145 |     await expect(page.locator('h1, h2').filter({ hasText: /sign up|register/i })).toBeVisible();
  146 |   });
  147 |
  148 |   test('should show consistent branding and styling', async ({ page }) => {
  149 |     await page.goto('/auth/login');
  150 |     
  151 |     // Check for branding elements
  152 |     const brandingElements = [
  153 |       page.locator('text="My Agent"'),
  154 |       page.locator('[alt*="logo"]'),
  155 |       page.locator('.logo'),
  156 |       page.locator('h1, h2').first()
  157 |     ];
  158 |     
  159 |     let foundBranding = false;
  160 |     for (const element of brandingElements) {
  161 |       if (await element.count() > 0) {
  162 |         foundBranding = true;
  163 |         break;
  164 |       }
  165 |     }
  166 |     
  167 |     expect(foundBranding).toBeTruthy();
  168 |   });
  169 | }); 
```