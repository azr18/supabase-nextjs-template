# Test info

- Name: Subscription Status Indicators and User Feedback >> Accessibility Features >> should support keyboard navigation for subscription-related interactions
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:282:9

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="dashboard-content"]') to be visible

    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:283:18
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
  183 |           await expect(loadingIndicators.first()).toBeVisible();
  184 |           
  185 |           // Wait for loading to complete
  186 |           await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
  187 |         }
  188 |       }
  189 |     });
  190 |   });
  191 |
  192 |   test.describe('Loading States and Error Handling', () => {
  193 |     test('should show appropriate loading states while checking subscription status', async ({ page }) => {
  194 |       // Navigate to dashboard and immediately check for loading states
  195 |       await page.goto('http://localhost:3000/app');
  196 |       
  197 |       // Look for loading indicators during initial load
  198 |       const loadingStates = page.locator('[data-testid="loading"], .animate-spin, [data-testid="skeleton"]');
  199 |       
  200 |       // Loading states might be very brief, so we check if they exist at all
  201 |       const hasLoadingStates = await loadingStates.count() > 0;
  202 |       
  203 |       if (hasLoadingStates) {
  204 |         // If loading states exist, verify they eventually disappear
  205 |         await expect(loadingStates.first()).not.toBeVisible({ timeout: 15000 });
  206 |       }
  207 |       
  208 |       // Verify that dashboard content eventually loads
  209 |       await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 15000 });
  210 |     });
  211 |
  212 |     test('should handle subscription check errors gracefully', async ({ page }) => {
  213 |       // Intercept subscription API calls and simulate errors
  214 |       await page.route('/api/subscriptions/**', (route) => {
  215 |         route.fulfill({
  216 |           status: 500,
  217 |           contentType: 'application/json',
  218 |           body: JSON.stringify({ error: 'Internal server error' })
  219 |         });
  220 |       });
  221 |       
  222 |       await page.goto('http://localhost:3000/app');
  223 |       
  224 |       // Wait for page to handle the error
  225 |       await page.waitForTimeout(3000);
  226 |       
  227 |       // Look for error handling UI
  228 |       const errorMessages = page.locator('[role="alert"], [data-testid="error-message"], .error');
  229 |       
  230 |       if (await errorMessages.count() > 0) {
  231 |         await expect(errorMessages.first()).toBeVisible();
  232 |         
  233 |         // Verify error message is user-friendly
  234 |         const errorText = await errorMessages.first().textContent();
  235 |         expect(errorText).toMatch(/error|unable|try again|problem|contact/i);
  236 |       }
  237 |     });
  238 |
  239 |     test('should provide fallback UI when subscription data is unavailable', async ({ page }) => {
  240 |       // Intercept and delay subscription API calls
  241 |       await page.route('/api/subscriptions/**', async (route) => {
  242 |         await new Promise(resolve => setTimeout(resolve, 5000));
  243 |         route.fulfill({
  244 |           status: 200,
  245 |           contentType: 'application/json',
  246 |           body: JSON.stringify({ tools: [] })
  247 |         });
  248 |       });
  249 |       
  250 |       await page.goto('http://localhost:3000/app');
  251 |       
  252 |       // Check for fallback UI during loading
  253 |       await page.waitForTimeout(2000);
  254 |       
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
> 283 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      |                  ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
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
  355 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
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