# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Verification Process >> completes MFA verification successfully
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:218:9

# Error details

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Add New Authentication Method')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:286:18
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
> 286 |       await page.click('text=Add New Authentication Method');
      |                  ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  347 |       await page.click('text=Add New Authentication Method');
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
```