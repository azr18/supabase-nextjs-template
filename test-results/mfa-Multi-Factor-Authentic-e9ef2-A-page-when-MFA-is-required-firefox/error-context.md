# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Authentication Flow >> redirects to 2FA page when MFA is required
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:412:9

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected pattern: /.*\/auth\/2fa/
Received string:  "http://localhost:3000/auth/login"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    8 × locator resolved to <html lang="en">…</html>
      - unexpected value "http://localhost:3000/auth/login"

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:450:26
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
  350 |       
  351 |       await page.fill('input[placeholder*="Enter 6-digit code"]', '000000');
  352 |       await page.click('text=Verify and Complete Setup');
  353 |       
  354 |       // Check error message
  355 |       await expect(page.locator('text=Invalid verification code')).toBeVisible();
  356 |     });
  357 |   });
  358 |
  359 |   test.describe('MFA Factor Management', () => {
  360 |     test('allows removal of existing MFA factors', async ({ page }) => {
  361 |       let factorsExist = true;
  362 |       
  363 |       await page.route('**/auth/v1/factors**', async route => {
  364 |         if (route.request().method() === 'GET') {
  365 |           await route.fulfill({
  366 |             status: 200,
  367 |             contentType: 'application/json',
  368 |             body: JSON.stringify({
  369 |               all: factorsExist ? [{
  370 |                 id: 'factor-123',
  371 |                 friendly_name: 'My Device',
  372 |                 factor_type: 'totp',
  373 |                 status: 'verified',
  374 |                 created_at: '2024-01-01T00:00:00Z'
  375 |               }] : [],
  376 |               totp: factorsExist ? [{
  377 |                 id: 'factor-123',
  378 |                 friendly_name: 'My Device',
  379 |                 factor_type: 'totp',
  380 |                 status: 'verified',
  381 |                 created_at: '2024-01-01T00:00:00Z'
  382 |               }] : []
  383 |             })
  384 |           });
  385 |         }
  386 |       });
  387 |
  388 |       // Mock unenroll endpoint
  389 |       await page.route('**/auth/v1/factors/*/unenroll**', async route => {
  390 |         factorsExist = false;
  391 |         await route.fulfill({
  392 |           status: 200,
  393 |           contentType: 'application/json',
  394 |           body: JSON.stringify({})
  395 |         });
  396 |       });
  397 |
  398 |       await page.goto('/app/user-settings');
  399 |       
  400 |       // Check existing factor
  401 |       await expect(page.locator('text=My Device')).toBeVisible();
  402 |       
  403 |       // Remove factor
  404 |       await page.click('text=Remove');
  405 |       
  406 |       // Verify removal
  407 |       await expect(page.locator('text=Add New Authentication Method')).toBeVisible();
  408 |     });
  409 |   });
  410 |
  411 |   test.describe('MFA Authentication Flow', () => {
  412 |     test('redirects to 2FA page when MFA is required', async ({ page }) => {
  413 |       // Mock login that requires MFA
  414 |       await page.route('**/auth/v1/token**', async route => {
  415 |         await route.fulfill({
  416 |           status: 200,
  417 |           contentType: 'application/json',
  418 |           body: JSON.stringify({
  419 |             access_token: 'mock_token',
  420 |             user: {
  421 |               id: 'user_id',
  422 |               email: 'test@example.com'
  423 |             }
  424 |           })
  425 |         });
  426 |       });
  427 |
  428 |       // Mock AAL check showing MFA required
  429 |       await page.route('**/auth/v1/factors/*/challenge**', async route => {
  430 |         await route.fulfill({
  431 |           status: 200,
  432 |           contentType: 'application/json',
  433 |           body: JSON.stringify({
  434 |             aal1: { id: 'aal1' },
  435 |             aal2: { id: 'aal2' },
  436 |             nextLevel: 'aal2',
  437 |             currentLevel: 'aal1'
  438 |           })
  439 |         });
  440 |       });
  441 |
  442 |       await page.goto('/auth/login');
  443 |       
  444 |       // Login
  445 |       await page.fill('input[type="email"]', 'test@example.com');
  446 |       await page.fill('input[type="password"]', 'password123');
  447 |       await page.click('button[type="submit"]:has-text("Sign in")');
  448 |       
  449 |       // Should redirect to 2FA
> 450 |       await expect(page).toHaveURL(/.*\/auth\/2fa/);
      |                          ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
  451 |     });
  452 |
  453 |     test('displays MFA verification page correctly', async ({ page }) => {
  454 |       // Mock MFA factors for verification
  455 |       await page.route('**/auth/v1/factors**', async route => {
  456 |         await route.fulfill({
  457 |           status: 200,
  458 |           contentType: 'application/json',
  459 |           body: JSON.stringify({
  460 |             totp: [{
  461 |               id: 'factor-123',
  462 |               friendly_name: 'My Authenticator',
  463 |               factor_type: 'totp',
  464 |               status: 'verified',
  465 |               created_at: '2024-01-01T00:00:00Z'
  466 |             }]
  467 |           })
  468 |         });
  469 |       });
  470 |
  471 |       await page.goto('/auth/2fa');
  472 |       
  473 |       // Check 2FA page elements
  474 |       await expect(page.locator('text=Two-Factor Authentication Required')).toBeVisible();
  475 |       await expect(page.locator('text=Please enter the verification code')).toBeVisible();
  476 |       await expect(page.locator('input[placeholder*="Enter 6-digit code"]')).toBeVisible();
  477 |     });
  478 |
  479 |     test('completes MFA verification during login', async ({ page }) => {
  480 |       await page.route('**/auth/v1/factors**', async route => {
  481 |         await route.fulfill({
  482 |           status: 200,
  483 |           contentType: 'application/json',
  484 |           body: JSON.stringify({
  485 |             totp: [{
  486 |               id: 'factor-123',
  487 |               friendly_name: 'My Authenticator',
  488 |               factor_type: 'totp',
  489 |               status: 'verified',
  490 |               created_at: '2024-01-01T00:00:00Z'
  491 |             }]
  492 |           })
  493 |         });
  494 |       });
  495 |
  496 |       await page.route('**/auth/v1/factors/*/challenge**', async route => {
  497 |         await route.fulfill({
  498 |           status: 200,
  499 |           contentType: 'application/json',
  500 |           body: JSON.stringify({
  501 |             id: 'challenge-123'
  502 |           })
  503 |         });
  504 |       });
  505 |
  506 |       await page.route('**/auth/v1/factors/*/verify**', async route => {
  507 |         await route.fulfill({
  508 |           status: 200,
  509 |           contentType: 'application/json',
  510 |           body: JSON.stringify({
  511 |             access_token: 'verified_token'
  512 |           })
  513 |         });
  514 |       });
  515 |
  516 |       await page.goto('/auth/2fa');
  517 |       
  518 |       // Enter verification code
  519 |       await page.fill('input[placeholder*="Enter 6-digit code"]', '123456');
  520 |       await page.click('button:has-text("Verify")');
  521 |       
  522 |       // Should redirect to app
  523 |       await expect(page).toHaveURL(/.*\/app/);
  524 |     });
  525 |   });
  526 |
  527 |   test.describe('MFA Accessibility and UX', () => {
  528 |     test('has proper accessibility attributes', async ({ page }) => {
  529 |       await page.route('**/auth/v1/factors**', async route => {
  530 |         await route.fulfill({
  531 |           status: 200,
  532 |           contentType: 'application/json',
  533 |           body: JSON.stringify({
  534 |             all: [],
  535 |             totp: []
  536 |           })
  537 |         });
  538 |       });
  539 |
  540 |       await page.goto('/app/user-settings');
  541 |       
  542 |       // Check accessibility features
  543 |       const mfaSection = page.locator('text=Two-Factor Authentication (2FA)').locator('..');
  544 |       await expect(mfaSection).toBeVisible();
  545 |       
  546 |       // Check for proper heading structure
  547 |       await expect(page.locator('h1, h2, h3').filter({ hasText: 'User Settings' })).toBeVisible();
  548 |     });
  549 |
  550 |     test('provides clear user feedback during operations', async ({ page }) => {
```