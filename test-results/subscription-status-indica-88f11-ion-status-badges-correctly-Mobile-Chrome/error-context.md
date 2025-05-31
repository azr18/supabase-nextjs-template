# Test info

- Name: Subscription Status Indicators and User Feedback >> Visual Status Indicators >> should display subscription status badges correctly
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:10:9

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="dashboard-content"]') to be visible

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:12:18
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
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Subscription Status Indicators and User Feedback', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to dashboard
   6 |     await page.goto('http://localhost:3000/app');
   7 |   });
   8 |
   9 |   test.describe('Visual Status Indicators', () => {
   10 |     test('should display subscription status badges correctly', async ({ page }) => {
   11 |       // Wait for dashboard to load
>  12 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
   13 |       
   14 |       // Check for tool cards with status indicators
   15 |       const toolCards = page.locator('[data-testid="tool-card"]');
   16 |       await expect(toolCards.first()).toBeVisible({ timeout: 15000 });
   17 |       
   18 |       // Verify status badges are present
   19 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
   20 |       if (await statusBadges.count() > 0) {
   21 |         // Check first badge is visible and has proper styling
   22 |         await expect(statusBadges.first()).toBeVisible();
   23 |         
   24 |         // Verify badge has proper text content (Active, Trial, Expired, etc.)
   25 |         const badgeText = await statusBadges.first().textContent();
   26 |         expect(badgeText).toMatch(/Active|Trial|Expired|Inactive|No Access/i);
   27 |         
   28 |         // Verify badge has proper color coding via CSS classes
   29 |         const badgeClass = await statusBadges.first().getAttribute('class');
   30 |         expect(badgeClass).toContain('badge');
   31 |       }
   32 |     });
   33 |
   34 |     test('should show different badge variants for different subscription states', async ({ page }) => {
   35 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   36 |       
   37 |       // Look for multiple tool cards with different subscription states
   38 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
   39 |       const badgeCount = await statusBadges.count();
   40 |       
   41 |       if (badgeCount > 0) {
   42 |         for (let i = 0; i < Math.min(badgeCount, 3); i++) {
   43 |           const badge = statusBadges.nth(i);
   44 |           await expect(badge).toBeVisible();
   45 |           
   46 |           // Verify each badge has appropriate styling
   47 |           const badgeClass = await badge.getAttribute('class');
   48 |           expect(badgeClass).toMatch(/badge|status|active|trial|expired|inactive/i);
   49 |         }
   50 |       }
   51 |     });
   52 |
   53 |     test('should display subscription countdown timers for trial/expiring subscriptions', async ({ page }) => {
   54 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   55 |       
   56 |       // Look for countdown timers or expiration notices
   57 |       const countdowns = page.locator('[data-testid="subscription-countdown"], [data-testid="trial-countdown"]');
   58 |       
   59 |       if (await countdowns.count() > 0) {
   60 |         await expect(countdowns.first()).toBeVisible();
   61 |         
   62 |         // Verify countdown shows time information
   63 |         const countdownText = await countdowns.first().textContent();
   64 |         expect(countdownText).toMatch(/days?|hours?|expires?|trial|remaining/i);
   65 |       }
   66 |     });
   67 |   });
   68 |
   69 |   test.describe('User Feedback Messages', () => {
   70 |     test('should show appropriate feedback when clicking on tools with different subscription states', async ({ page }) => {
   71 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   72 |       
   73 |       // Find tool cards
   74 |       const toolCards = page.locator('[data-testid="tool-card"]');
   75 |       const cardCount = await toolCards.count();
   76 |       
   77 |       if (cardCount > 0) {
   78 |         // Click on first tool card
   79 |         await toolCards.first().click();
   80 |         
   81 |         // Wait a moment for any feedback/navigation
   82 |         await page.waitForTimeout(1000);
   83 |         
   84 |         // Check if we're redirected or if there's feedback
   85 |         const currentUrl = page.url();
   86 |         const feedbackMessages = page.locator('[role="alert"], .toast, [data-testid="feedback-message"]');
   87 |         
   88 |         // Either we should navigate to tool or get feedback
   89 |         if (currentUrl.includes('/app/')) {
   90 |           // Successfully navigated to tool
   91 |           expect(currentUrl).toContain('/app/');
   92 |         } else if (await feedbackMessages.count() > 0) {
   93 |           // Got feedback message instead
   94 |           await expect(feedbackMessages.first()).toBeVisible();
   95 |         }
   96 |       }
   97 |     });
   98 |
   99 |     test('should display helpful error messages for expired subscriptions', async ({ page }) => {
  100 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  101 |       
  102 |       // Look for expired subscription indicators
  103 |       const expiredBadges = page.locator('[data-testid="subscription-status-badge"]')
  104 |         .filter({ hasText: /expired|inactive/i });
  105 |       
  106 |       if (await expiredBadges.count() > 0) {
  107 |         // Find the tool card containing the expired badge
  108 |         const expiredToolCard = expiredBadges.first().locator('..').locator('[data-testid="tool-card"]');
  109 |         
  110 |         // Try to interact with expired tool
  111 |         if (await expiredToolCard.count() > 0) {
  112 |           await expiredToolCard.click();
```