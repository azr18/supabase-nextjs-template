# Test info

- Name: Landing Page Visual Regression - Core Tests >> Process Section Visual Tests >> Process section - Mobile (375x667)
- Location: C:\Users\ariel\Documents\GitHub\supabase-nextjs-template\tests\e2e\landing-page-visual-simple.spec.ts:102:11

# Error details

```
Error: browserContext._wrapApiCall: Test ended.
Browser logs:

<launching> C:\Users\ariel\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=C:\Users\ariel\AppData\Local\Temp\playwright_chromiumdev_profile-Ow2FC9 --remote-debugging-pipe --no-startup-window
<launched> pid=10984
[pid=10984][err] [0530/183138.612:ERROR:net\socket\ssl_client_socket_impl.cc:877] handshake failed; returned -1, SSL error code 1, net_error -100
[pid=10984][err] [0530/183138.761:ERROR:net\socket\ssl_client_socket_impl.cc:877] handshake failed; returned -1, SSL error code 1, net_error -100
[pid=10984][err] [0530/183142.238:ERROR:net\socket\ssl_client_socket_impl.cc:877] handshake failed; returned -1, SSL error code 1, net_error -100
[pid=10984][err] [0530/183142.393:ERROR:net\socket\ssl_client_socket_impl.cc:877] handshake failed; returned -1, SSL error code 1, net_error -100
```

# Test source

```ts
   2 |
   3 | /**
   4 |  * Simplified Landing Page Visual Regression Tests
   5 |  * Focused visual testing for core responsive breakpoints and component sections
   6 |  */
   7 |
   8 | test.describe('Landing Page Visual Regression - Core Tests', () => {
   9 |   // Core viewport sizes for essential testing
   10 |   const coreViewports = [
   11 |     { name: 'Mobile', width: 375, height: 667 },
   12 |     { name: 'Tablet', width: 768, height: 1024 },
   13 |     { name: 'Desktop', width: 1280, height: 720 }
   14 |   ];
   15 |
   16 |   test.beforeEach(async ({ page }) => {
   17 |     // Go to the landing page and wait for it to load
   18 |     await page.goto('/');
   19 |     await page.waitForLoadState('networkidle');
   20 |     await page.waitForTimeout(1000); // Allow for animations
   21 |   });
   22 |
   23 |   // Test full page visual consistency at core breakpoints
   24 |   test.describe('Full Page Visual Consistency', () => {
   25 |     coreViewports.forEach(({ name, width, height }) => {
   26 |       test(`Full page visual - ${name} (${width}x${height})`, async ({ page }) => {
   27 |         await page.setViewportSize({ width, height });
   28 |         await page.reload();
   29 |         await page.waitForLoadState('networkidle');
   30 |         await page.waitForTimeout(1000);
   31 |         
   32 |         // Take full page screenshot
   33 |         await expect(page).toHaveScreenshot(`full-page-${name.toLowerCase()}.png`, {
   34 |           fullPage: true,
   35 |           threshold: 0.2
   36 |         });
   37 |       });
   38 |     });
   39 |   });
   40 |
   41 |   // Test navigation visual consistency
   42 |   test.describe('Navigation Visual Tests', () => {
   43 |     coreViewports.forEach(({ name, width, height }) => {
   44 |       test(`Navigation - ${name} (${width}x${height})`, async ({ page }) => {
   45 |         await page.setViewportSize({ width, height });
   46 |         await page.reload();
   47 |         await page.waitForLoadState('networkidle');
   48 |         
   49 |         const nav = page.locator('nav');
   50 |         await expect(nav).toBeVisible();
   51 |         
   52 |         // Take navigation screenshot
   53 |         await expect(nav).toHaveScreenshot(`nav-${name.toLowerCase()}.png`, {
   54 |           threshold: 0.2
   55 |         });
   56 |       });
   57 |     });
   58 |   });
   59 |
   60 |   // Test hero section visual consistency
   61 |   test.describe('Hero Section Visual Tests', () => {
   62 |     coreViewports.forEach(({ name, width, height }) => {
   63 |       test(`Hero section - ${name} (${width}x${height})`, async ({ page }) => {
   64 |         await page.setViewportSize({ width, height });
   65 |         await page.reload();
   66 |         await page.waitForLoadState('networkidle');
   67 |         
   68 |         const heroSection = page.locator('section').first();
   69 |         await expect(heroSection).toBeVisible();
   70 |         
   71 |         // Take hero section screenshot
   72 |         await expect(heroSection).toHaveScreenshot(`hero-${name.toLowerCase()}.png`, {
   73 |           threshold: 0.2
   74 |         });
   75 |       });
   76 |     });
   77 |   });
   78 |
   79 |   // Test features section visual consistency
   80 |   test.describe('Features Section Visual Tests', () => {
   81 |     coreViewports.forEach(({ name, width, height }) => {
   82 |       test(`Features section - ${name} (${width}x${height})`, async ({ page }) => {
   83 |         await page.setViewportSize({ width, height });
   84 |         await page.reload();
   85 |         await page.waitForLoadState('networkidle');
   86 |         
   87 |         const featuresSection = page.locator('section').nth(1);
   88 |         await featuresSection.scrollIntoViewIfNeeded();
   89 |         await expect(featuresSection).toBeVisible();
   90 |         
   91 |         // Take features section screenshot
   92 |         await expect(featuresSection).toHaveScreenshot(`features-${name.toLowerCase()}.png`, {
   93 |           threshold: 0.2
   94 |         });
   95 |       });
   96 |     });
   97 |   });
   98 |
   99 |   // Test process section visual consistency
  100 |   test.describe('Process Section Visual Tests', () => {
  101 |     coreViewports.forEach(({ name, width, height }) => {
> 102 |       test(`Process section - ${name} (${width}x${height})`, async ({ page }) => {
      |           ^ Error: browserContext._wrapApiCall: Test ended.
  103 |         await page.setViewportSize({ width, height });
  104 |         await page.reload();
  105 |         await page.waitForLoadState('networkidle');
  106 |         
  107 |         const processSection = page.locator('section').nth(2);
  108 |         await processSection.scrollIntoViewIfNeeded();
  109 |         await expect(processSection).toBeVisible();
  110 |         
  111 |         // Take process section screenshot
  112 |         await expect(processSection).toHaveScreenshot(`process-${name.toLowerCase()}.png`, {
  113 |           threshold: 0.2
  114 |         });
  115 |       });
  116 |     });
  117 |   });
  118 |
  119 |   // Test call-to-action section visual consistency
  120 |   test.describe('Call-to-Action Section Visual Tests', () => {
  121 |     coreViewports.forEach(({ name, width, height }) => {
  122 |       test(`CTA section - ${name} (${width}x${height})`, async ({ page }) => {
  123 |         await page.setViewportSize({ width, height });
  124 |         await page.reload();
  125 |         await page.waitForLoadState('networkidle');
  126 |         
  127 |         const ctaSection = page.locator('section').nth(3);
  128 |         await ctaSection.scrollIntoViewIfNeeded();
  129 |         await expect(ctaSection).toBeVisible();
  130 |         
  131 |         // Take CTA section screenshot
  132 |         await expect(ctaSection).toHaveScreenshot(`cta-${name.toLowerCase()}.png`, {
  133 |           threshold: 0.2
  134 |         });
  135 |       });
  136 |     });
  137 |   });
  138 |
  139 |   // Test responsive component behavior
  140 |   test.describe('Responsive Behavior Verification', () => {
  141 |     test('Navigation mobile hamburger menu functionality', async ({ page }) => {
  142 |       await page.setViewportSize({ width: 375, height: 667 });
  143 |       await page.reload();
  144 |       await page.waitForLoadState('networkidle');
  145 |       
  146 |       const nav = page.locator('nav');
  147 |       await expect(nav).toBeVisible();
  148 |       
  149 |       // Look for hamburger menu button
  150 |       const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
  151 |       if (await menuButton.isVisible()) {
  152 |         // Test closed state
  153 |         await expect(nav).toHaveScreenshot('nav-mobile-closed.png');
  154 |         
  155 |         // Test opened state
  156 |         await menuButton.click();
  157 |         await page.waitForTimeout(300);
  158 |         await expect(nav).toHaveScreenshot('nav-mobile-opened.png');
  159 |       }
  160 |     });
  161 |
  162 |     test('Hero section responsive layout verification', async ({ page }) => {
  163 |       // Test mobile layout
  164 |       await page.setViewportSize({ width: 375, height: 667 });
  165 |       await page.reload();
  166 |       await page.waitForLoadState('networkidle');
  167 |       
  168 |       const heroSection = page.locator('section').first();
  169 |       const headline = heroSection.locator('h1');
  170 |       await expect(headline).toBeVisible();
  171 |       
  172 |       // Test that content is readable and properly stacked
  173 |       const headlineText = await headline.textContent();
  174 |       expect(headlineText).toContain('Transform Your Business');
  175 |       
  176 |       // Test desktop layout
  177 |       await page.setViewportSize({ width: 1280, height: 720 });
  178 |       await page.reload();
  179 |       await page.waitForLoadState('networkidle');
  180 |       
  181 |       await expect(headline).toBeVisible();
  182 |     });
  183 |
  184 |     test('Features grid responsive behavior', async ({ page }) => {
  185 |       // Test mobile stacking
  186 |       await page.setViewportSize({ width: 375, height: 667 });
  187 |       await page.reload();
  188 |       await page.waitForLoadState('networkidle');
  189 |       
  190 |       const featuresSection = page.locator('section').nth(1);
  191 |       await featuresSection.scrollIntoViewIfNeeded();
  192 |       
  193 |       const featureCards = featuresSection.locator('div[class*="grid"] > div, div[class*="flex"] > div');
  194 |       const cardCount = await featureCards.count();
  195 |       
  196 |       if (cardCount > 0) {
  197 |         await expect(featureCards.first()).toBeVisible();
  198 |       }
  199 |       
  200 |       // Test desktop grid
  201 |       await page.setViewportSize({ width: 1280, height: 720 });
  202 |       await page.reload();
```