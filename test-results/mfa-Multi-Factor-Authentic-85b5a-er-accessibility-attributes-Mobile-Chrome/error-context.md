# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Accessibility and UX >> has proper accessibility attributes
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:528:9

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=Two-Factor Authentication (2FA)').locator('..')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Two-Factor Authentication (2FA)').locator('..')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:544:32
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
  444 |       // Login
  445 |       await page.fill('input[type="email"]', 'test@example.com');
  446 |       await page.fill('input[type="password"]', 'password123');
  447 |       await page.click('button[type="submit"]:has-text("Sign in")');
  448 |       
  449 |       // Should redirect to 2FA
  450 |       await expect(page).toHaveURL(/.*\/auth\/2fa/);
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
> 544 |       await expect(mfaSection).toBeVisible();
      |                                ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  545 |       
  546 |       // Check for proper heading structure
  547 |       await expect(page.locator('h1, h2, h3').filter({ hasText: 'User Settings' })).toBeVisible();
  548 |     });
  549 |
  550 |     test('provides clear user feedback during operations', async ({ page }) => {
  551 |       await page.route('**/auth/v1/factors**', async route => {
  552 |         const method = route.request().method();
  553 |         
  554 |         if (method === 'GET') {
  555 |           await route.fulfill({
  556 |             status: 200,
  557 |             contentType: 'application/json',
  558 |             body: JSON.stringify({
  559 |               all: [],
  560 |               totp: []
  561 |             })
  562 |           });
  563 |         } else if (method === 'POST') {
  564 |           // Simulate slow enrollment
  565 |           await new Promise(resolve => setTimeout(resolve, 1000));
  566 |           await route.fulfill({
  567 |             status: 200,
  568 |             contentType: 'application/json',
  569 |             body: JSON.stringify({
  570 |               id: 'factor-123',
  571 |               totp: {
  572 |                 qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
  573 |               }
  574 |             })
  575 |           });
  576 |         }
  577 |       });
  578 |
  579 |       await page.goto('/app/user-settings');
  580 |       
  581 |       await page.click('text=Add New Authentication Method');
  582 |       await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
  583 |       await page.click('text=Continue');
  584 |       
  585 |       // Check loading state
  586 |       await expect(page.locator('text=Processing')).toBeVisible();
  587 |     });
  588 |
  589 |     test('displays responsive design across device sizes', async ({ page }) => {
  590 |       await page.route('**/auth/v1/factors**', async route => {
  591 |         await route.fulfill({
  592 |           status: 200,
  593 |           contentType: 'application/json',
  594 |           body: JSON.stringify({
  595 |             all: [],
  596 |             totp: []
  597 |           })
  598 |         });
  599 |       });
  600 |
  601 |       // Test mobile viewport
  602 |       await page.setViewportSize({ width: 375, height: 667 });
  603 |       await page.goto('/app/user-settings');
  604 |       
  605 |       await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
  606 |       
  607 |       // Test desktop viewport
  608 |       await page.setViewportSize({ width: 1200, height: 800 });
  609 |       await page.goto('/app/user-settings');
  610 |       
  611 |       await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
  612 |     });
  613 |   });
  614 | }); 
```