# Test info

- Name: Subscription Status Indicators and User Feedback >> Responsive Design >> should adapt subscription feedback for tablet screens
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:350:9

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="dashboard-content"]') to be visible

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:355:18
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
  255 |       const fallbackElements = page.locator('[data-testid="fallback"], [data-testid="no-data"], .fallback');
  256 |       
  257 |       if (await fallbackElements.count() > 0) {
  258 |         await expect(fallbackElements.first()).toBeVisible();
  259 |       }
  260 |     });
  261 |   });
  262 |
  263 |   test.describe('Accessibility Features', () => {
  264 |     test('should have proper ARIA labels for subscription status elements', async ({ page }) => {
  265 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  266 |       
  267 |       // Check status badges for accessibility attributes
  268 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
  269 |       
  270 |       if (await statusBadges.count() > 0) {
  271 |         const firstBadge = statusBadges.first();
  272 |         
  273 |         // Check for ARIA attributes
  274 |         const ariaLabel = await firstBadge.getAttribute('aria-label');
  275 |         const role = await firstBadge.getAttribute('role');
  276 |         
  277 |         // Should have either aria-label or role for screen readers
  278 |         expect(ariaLabel || role).toBeTruthy();
  279 |       }
  280 |     });
  281 |
  282 |     test('should support keyboard navigation for subscription-related interactions', async ({ page }) => {
  283 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  284 |       
  285 |       // Test keyboard navigation to tool cards
  286 |       await page.keyboard.press('Tab');
  287 |       
  288 |       // Check if focus is visible on interactive elements
  289 |       const focusedElement = await page.locator(':focus');
  290 |       
  291 |       if (await focusedElement.count() > 0) {
  292 |         await expect(focusedElement).toBeVisible();
  293 |         
  294 |         // Verify focused element is interactive
  295 |         const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
  296 |         expect(['button', 'a', 'input', 'div']).toContain(tagName);
  297 |       }
  298 |     });
  299 |
  300 |     test('should have sufficient color contrast for subscription status indicators', async ({ page }) => {
  301 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  302 |       
  303 |       // Check status badges for proper styling
  304 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
  305 |       
  306 |       if (await statusBadges.count() > 0) {
  307 |         const firstBadge = statusBadges.first();
  308 |         
  309 |         // Get computed styles
  310 |         const styles = await firstBadge.evaluate((el) => {
  311 |           const computed = window.getComputedStyle(el);
  312 |           return {
  313 |             backgroundColor: computed.backgroundColor,
  314 |             color: computed.color,
  315 |             fontSize: computed.fontSize
  316 |           };
  317 |         });
  318 |         
  319 |         // Verify basic styling properties exist
  320 |         expect(styles.backgroundColor).toBeTruthy();
  321 |         expect(styles.color).toBeTruthy();
  322 |         expect(styles.fontSize).toBeTruthy();
  323 |       }
  324 |     });
  325 |   });
  326 |
  327 |   test.describe('Responsive Design', () => {
  328 |     test('should display subscription indicators properly on mobile devices', async ({ page }) => {
  329 |       // Set mobile viewport
  330 |       await page.setViewportSize({ width: 375, height: 667 });
  331 |       
  332 |       await page.goto('http://localhost:3000/app');
  333 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  334 |       
  335 |       // Check that subscription status elements are visible on mobile
  336 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
  337 |       
  338 |       if (await statusBadges.count() > 0) {
  339 |         await expect(statusBadges.first()).toBeVisible();
  340 |         
  341 |         // Verify text is readable on mobile
  342 |         const badgeBox = await statusBadges.first().boundingBox();
  343 |         if (badgeBox) {
  344 |           expect(badgeBox.width).toBeGreaterThan(30); // Minimum touch target
  345 |           expect(badgeBox.height).toBeGreaterThan(20);
  346 |         }
  347 |       }
  348 |     });
  349 |
  350 |     test('should adapt subscription feedback for tablet screens', async ({ page }) => {
  351 |       // Set tablet viewport
  352 |       await page.setViewportSize({ width: 768, height: 1024 });
  353 |       
  354 |       await page.goto('http://localhost:3000/app');
> 355 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  356 |       
  357 |       // Verify layout adapts properly
  358 |       const toolCards = page.locator('[data-testid="tool-card"]');
  359 |       
  360 |       if (await toolCards.count() > 0) {
  361 |         await expect(toolCards.first()).toBeVisible();
  362 |         
  363 |         // Check that cards are properly sized for tablet
  364 |         const cardBox = await toolCards.first().boundingBox();
  365 |         if (cardBox) {
  366 |           expect(cardBox.width).toBeLessThan(768); // Should not exceed viewport
  367 |           expect(cardBox.width).toBeGreaterThan(200); // Should be reasonable size
  368 |         }
  369 |       }
  370 |     });
  371 |   });
  372 | }); 
```