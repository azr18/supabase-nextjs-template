# Test info

- Name: Dashboard Responsive Design >> Buttons should be appropriately sized on mobile
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-responsive.spec.ts:86:9

# Error details

```
Error: page.waitForURL: Test timeout of 60000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/app" until "load"
  navigated to "http://localhost:3000/auth/login?email=test%40example.com&password=password123"
============================================================
    at C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\dashboard-responsive.spec.ts:10:16
```

# Page snapshot

```yaml
- link "Back to Homepage":
  - /url: /
  - img
  - text: Back to Homepage
- heading "My Agent" [level=1]
- paragraph: AI Business Automation Platform
- heading "Quick Sign In" [level=3]
- text: Or continue with
- button "Continue with Google":
  - img
  - text: Continue with Google
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
- heading "Automate Your Business" [level=2]
- paragraph: Join businesses transforming their operations with custom AI solutions
- img
- heading "AI-Powered Automation" [level=3]
- paragraph: Intelligent document processing and reconciliation tailored to your business needs
- text: "1"
- img
- heading "Lightning Fast Results" [level=3]
- paragraph: Automated workflows that save hours of manual processing time every month
- text: "2"
- img
- heading "Enterprise Security" [level=3]
- paragraph: Bank-level security with user isolation and encrypted data storage
- text: "3"
- paragraph: Trusted by businesses worldwide
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
   3 | test.describe('Dashboard Responsive Design', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Mock authentication state
   6 |     await page.goto('/auth/login');
   7 |     await page.fill('[name="email"]', 'test@example.com');
   8 |     await page.fill('[name="password"]', 'password123');
   9 |     await page.click('button[type="submit"]');
>  10 |     await page.waitForURL('/app');
      |                ^ Error: page.waitForURL: Test timeout of 60000ms exceeded.
   11 |   });
   12 |
   13 |   const viewports = [
   14 |     { name: 'mobile', width: 375, height: 667 },
   15 |     { name: 'tablet', width: 768, height: 1024 },
   16 |     { name: 'desktop', width: 1200, height: 800 },
   17 |     { name: 'large-desktop', width: 1920, height: 1080 }
   18 |   ];
   19 |
   20 |   viewports.forEach(({ name, width, height }) => {
   21 |     test(`Dashboard layout should be responsive on ${name}`, async ({ page }) => {
   22 |       await page.setViewportSize({ width, height });
   23 |       await page.goto('/app');
   24 |       
   25 |       // Wait for the page to load completely
   26 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   27 |       
   28 |       // Test welcome section responsiveness
   29 |       const welcomeCard = page.locator('.card').first();
   30 |       await expect(welcomeCard).toBeVisible();
   31 |       
   32 |       // Test tools grid layout
   33 |       const toolsGrid = page.locator('[data-testid="tools-grid"]');
   34 |       if (await toolsGrid.isVisible()) {
   35 |         // Check grid columns based on viewport
   36 |         const gridClass = await toolsGrid.getAttribute('class');
   37 |         if (width < 768) {
   38 |           expect(gridClass).toContain('grid-cols-1');
   39 |         } else if (width < 1200) {
   40 |           expect(gridClass).toContain('md:grid-cols-2');
   41 |         } else {
   42 |           expect(gridClass).toContain('xl:grid-cols-3');
   43 |         }
   44 |       }
   45 |
   46 |       // Test account settings grid responsiveness
   47 |       const settingsGrid = page.locator('[data-testid="settings-grid"]');
   48 |       if (await settingsGrid.isVisible()) {
   49 |         const gridClass = await settingsGrid.getAttribute('class');
   50 |         if (width < 640) {
   51 |           expect(gridClass).toContain('grid-cols-1');
   52 |         } else if (width < 1024) {
   53 |           expect(gridClass).toContain('sm:grid-cols-2');
   54 |         } else {
   55 |           expect(gridClass).toContain('lg:grid-cols-3');
   56 |         }
   57 |       }
   58 |
   59 |       // Verify no horizontal scroll
   60 |       const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
   61 |       expect(bodyWidth).toBeLessThanOrEqual(width + 20); // Small tolerance for browser differences
   62 |     });
   63 |
   64 |     test(`Text truncation should work properly on ${name}`, async ({ page }) => {
   65 |       await page.setViewportSize({ width, height });
   66 |       await page.goto('/app');
   67 |       
   68 |       // Wait for content to load
   69 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   70 |       
   71 |       // Check that tool names are truncated properly on small screens
   72 |       const toolCards = page.locator('[data-testid="tool-card"]');
   73 |       const count = await toolCards.count();
   74 |       
   75 |       for (let i = 0; i < count; i++) {
   76 |         const toolCard = toolCards.nth(i);
   77 |         const toolTitle = toolCard.locator('h3, h2').first();
   78 |         
   79 |         if (await toolTitle.isVisible()) {
   80 |           const titleClass = await toolTitle.getAttribute('class');
   81 |           expect(titleClass).toContain('truncate');
   82 |         }
   83 |       }
   84 |     });
   85 |
   86 |     test(`Buttons should be appropriately sized on ${name}`, async ({ page }) => {
   87 |       await page.setViewportSize({ width, height });
   88 |       await page.goto('/app');
   89 |       
   90 |       // Wait for content to load
   91 |       await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
   92 |       
   93 |       // Check button sizes
   94 |       const buttons = page.locator('button');
   95 |       const count = await buttons.count();
   96 |       
   97 |       for (let i = 0; i < count; i++) {
   98 |         const button = buttons.nth(i);
   99 |         if (await button.isVisible()) {
  100 |           const buttonBox = await button.boundingBox();
  101 |           if (buttonBox) {
  102 |             // Minimum touch target size for mobile
  103 |             if (width < 768) {
  104 |               expect(buttonBox.height).toBeGreaterThanOrEqual(32);
  105 |             }
  106 |             // Ensure buttons don't overflow
  107 |             expect(buttonBox.width).toBeLessThanOrEqual(width);
  108 |           }
  109 |         }
  110 |       }
```