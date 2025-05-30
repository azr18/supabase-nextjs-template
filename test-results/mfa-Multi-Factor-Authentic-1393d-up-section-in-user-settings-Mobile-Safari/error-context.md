# Test info

- Name: Multi-Factor Authentication (MFA) >> MFA Setup in User Settings >> displays MFA setup section in user settings
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:48:9

# Error details

```
Error: expect(locator).toBeVisible()

Locator: locator('text=Two-Factor Authentication (2FA)')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Two-Factor Authentication (2FA)')

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\mfa.spec.ts:53:74
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Multi-Factor Authentication (MFA)', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Mock Supabase responses for consistent testing
   6 |     await page.route('**/auth/v1/**', async route => {
   7 |       const url = route.request().url();
   8 |       const method = route.request().method();
   9 |       
   10 |       // Mock successful authentication
   11 |       if (url.includes('/token') && method === 'POST') {
   12 |         await route.fulfill({
   13 |           status: 200,
   14 |           contentType: 'application/json',
   15 |           body: JSON.stringify({
   16 |             access_token: 'mock_access_token',
   17 |             user: { 
   18 |               id: 'mock_user_id', 
   19 |               email: 'test@example.com',
   20 |               aal: 'aal1'
   21 |             }
   22 |           })
   23 |         });
   24 |         return;
   25 |       }
   26 |       
   27 |       // Mock user session
   28 |       if (url.includes('/user') && method === 'GET') {
   29 |         await route.fulfill({
   30 |           status: 200,
   31 |           contentType: 'application/json',
   32 |           body: JSON.stringify({
   33 |             user: { 
   34 |               id: 'mock_user_id', 
   35 |               email: 'test@example.com'
   36 |             }
   37 |           })
   38 |         });
   39 |         return;
   40 |       }
   41 |       
   42 |       // Continue with actual request for other routes
   43 |       await route.continue();
   44 |     });
   45 |   });
   46 |
   47 |   test.describe('MFA Setup in User Settings', () => {
   48 |     test('displays MFA setup section in user settings', async ({ page }) => {
   49 |       // Navigate to user settings
   50 |       await page.goto('/app/user-settings');
   51 |       
   52 |       // Check for MFA section
>  53 |       await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible()
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
  149 |       await page.click('text=Add New Authentication Method');
  150 |       
  151 |       // Fill in friendly name
  152 |       await page.fill('input[placeholder*="Enter a name"]', 'My Test Authenticator');
  153 |       await page.click('text=Continue');
```