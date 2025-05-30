# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Verification Process >> handles verification errors
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:298:9

# Error details

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Add New Authentication Method')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:347:18
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
  247 |           await route.fulfill({
  248 |             status: 200,
  249 |             contentType: 'application/json',
  250 |             body: JSON.stringify({
  251 |               id: 'factor-123',
  252 |               totp: {
  253 |                 qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
  254 |               }
  255 |             })
  256 |           });
  257 |         }
  258 |       });
  259 |
  260 |       // Mock challenge endpoint
  261 |       await page.route('**/auth/v1/factors/*/challenge**', async route => {
  262 |         await route.fulfill({
  263 |           status: 200,
  264 |           contentType: 'application/json',
  265 |           body: JSON.stringify({
  266 |             id: 'challenge-123'
  267 |           })
  268 |         });
  269 |       });
  270 |
  271 |       // Mock verify endpoint
  272 |       await page.route('**/auth/v1/factors/*/verify**', async route => {
  273 |         enrollmentCompleted = true;
  274 |         await route.fulfill({
  275 |           status: 200,
  276 |           contentType: 'application/json',
  277 |           body: JSON.stringify({
  278 |             access_token: 'verified_token'
  279 |           })
  280 |         });
  281 |       });
  282 |
  283 |       await page.goto('/app/user-settings');
  284 |       
  285 |       // Complete enrollment flow
  286 |       await page.click('text=Add New Authentication Method');
  287 |       await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
  288 |       await page.click('text=Continue');
  289 |       
  290 |       // Enter verification code
  291 |       await page.fill('input[placeholder*="Enter 6-digit code"]', '123456');
  292 |       await page.click('text=Verify and Complete Setup');
  293 |       
  294 |       // Check success
  295 |       await expect(page.locator('text=Test Device')).toBeVisible();
  296 |     });
  297 |
  298 |     test('handles verification errors', async ({ page }) => {
  299 |       await page.route('**/auth/v1/factors**', async route => {
  300 |         if (route.request().method() === 'POST') {
  301 |           await route.fulfill({
  302 |             status: 200,
  303 |             contentType: 'application/json',
  304 |             body: JSON.stringify({
  305 |               id: 'factor-123',
  306 |               totp: {
  307 |                 qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
  308 |               }
  309 |             })
  310 |           });
  311 |         } else {
  312 |           await route.fulfill({
  313 |             status: 200,
  314 |             contentType: 'application/json',
  315 |             body: JSON.stringify({
  316 |               all: [],
  317 |               totp: []
  318 |             })
  319 |           });
  320 |         }
  321 |       });
  322 |
  323 |       await page.route('**/auth/v1/factors/*/challenge**', async route => {
  324 |         await route.fulfill({
  325 |           status: 200,
  326 |           contentType: 'application/json',
  327 |           body: JSON.stringify({
  328 |             id: 'challenge-123'
  329 |           })
  330 |         });
  331 |       });
  332 |
  333 |       await page.route('**/auth/v1/factors/*/verify**', async route => {
  334 |         await route.fulfill({
  335 |           status: 400,
  336 |           contentType: 'application/json',
  337 |           body: JSON.stringify({
  338 |             error: {
  339 |               message: 'Invalid verification code'
  340 |             }
  341 |           })
  342 |         });
  343 |       });
  344 |
  345 |       await page.goto('/app/user-settings');
  346 |       
> 347 |       await page.click('text=Add New Authentication Method');
      |                  ^ Error: page.click: Test timeout of 30000ms exceeded.
  348 |       await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
  349 |       await page.click('text=Continue');
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
```