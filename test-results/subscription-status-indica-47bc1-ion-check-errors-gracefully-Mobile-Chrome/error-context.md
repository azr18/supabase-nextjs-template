# Test info

- Name: Subscription Status Indicators and User Feedback >> Loading States and Error Handling >> should handle subscription check errors gracefully
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:212:9

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /error|unable|try again|problem|contact/i
Received string:  ""
    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\subscription-status-indicators.spec.ts:235:27
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
  135 |         // Verify warning content
  136 |         const warningText = await warningElements.first().textContent();
  137 |         expect(warningText).toMatch(/trial|expir|renew|upgrade|contact/i);
  138 |       }
  139 |     });
  140 |   });
  141 |
  142 |   test.describe('Interactive Features', () => {
  143 |     test('should show subscription information on hover tooltips', async ({ page }) => {
  144 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  145 |       
  146 |       // Find tool cards with status badges
  147 |       const statusBadges = page.locator('[data-testid="subscription-status-badge"]');
  148 |       
  149 |       if (await statusBadges.count() > 0) {
  150 |         // Hover over first status badge
  151 |         await statusBadges.first().hover();
  152 |         
  153 |         // Wait for potential tooltip
  154 |         await page.waitForTimeout(500);
  155 |         
  156 |         // Look for tooltip or additional information
  157 |         const tooltips = page.locator('[role="tooltip"], [data-testid="subscription-tooltip"]');
  158 |         
  159 |         if (await tooltips.count() > 0) {
  160 |           await expect(tooltips.first()).toBeVisible();
  161 |           
  162 |           // Verify tooltip contains useful information
  163 |           const tooltipText = await tooltips.first().textContent();
  164 |           expect(tooltipText).toMatch(/subscription|status|expires?|active|trial/i);
  165 |         }
  166 |       }
  167 |     });
  168 |
  169 |     test('should allow manual refresh of subscription status', async ({ page }) => {
  170 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  171 |       
  172 |       // Look for refresh button or manual refresh capability
  173 |       const refreshButtons = page.locator('[data-testid="refresh-status"], [data-testid="manual-refresh"]');
  174 |       
  175 |       if (await refreshButtons.count() > 0) {
  176 |         // Click refresh button
  177 |         await refreshButtons.first().click();
  178 |         
  179 |         // Verify loading state appears
  180 |         const loadingIndicators = page.locator('[data-testid="loading"], .animate-spin');
  181 |         
  182 |         if (await loadingIndicators.count() > 0) {
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
> 235 |         expect(errorText).toMatch(/error|unable|try again|problem|contact/i);
      |                           ^ Error: expect(received).toMatch(expected)
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
```