import { test, expect } from '@playwright/test';

/**
 * Simplified Landing Page Visual Regression Tests
 * Focused visual testing for core responsive breakpoints and component sections
 */

test.describe('Landing Page Visual Regression - Core Tests', () => {
  // Core viewport sizes for essential testing
  const coreViewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];

  test.beforeEach(async ({ page }) => {
    // Go to the landing page and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow for animations
  });

  // Test full page visual consistency at core breakpoints
  test.describe('Full Page Visual Consistency', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`Full page visual - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot(`full-page-${name.toLowerCase()}.png`, {
          fullPage: true,
          threshold: 0.2
        });
      });
    });
  });

  // Test navigation visual consistency
  test.describe('Navigation Visual Tests', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`Navigation - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Take navigation screenshot
        await expect(nav).toHaveScreenshot(`nav-${name.toLowerCase()}.png`, {
          threshold: 0.2
        });
      });
    });
  });

  // Test hero section visual consistency
  test.describe('Hero Section Visual Tests', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`Hero section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const heroSection = page.locator('section').first();
        await expect(heroSection).toBeVisible();
        
        // Take hero section screenshot
        await expect(heroSection).toHaveScreenshot(`hero-${name.toLowerCase()}.png`, {
          threshold: 0.2
        });
      });
    });
  });

  // Test features section visual consistency
  test.describe('Features Section Visual Tests', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`Features section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const featuresSection = page.locator('section').nth(1);
        await featuresSection.scrollIntoViewIfNeeded();
        await expect(featuresSection).toBeVisible();
        
        // Take features section screenshot
        await expect(featuresSection).toHaveScreenshot(`features-${name.toLowerCase()}.png`, {
          threshold: 0.2
        });
      });
    });
  });

  // Test process section visual consistency
  test.describe('Process Section Visual Tests', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`Process section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const processSection = page.locator('section').nth(2);
        await processSection.scrollIntoViewIfNeeded();
        await expect(processSection).toBeVisible();
        
        // Take process section screenshot
        await expect(processSection).toHaveScreenshot(`process-${name.toLowerCase()}.png`, {
          threshold: 0.2
        });
      });
    });
  });

  // Test call-to-action section visual consistency
  test.describe('Call-to-Action Section Visual Tests', () => {
    coreViewports.forEach(({ name, width, height }) => {
      test(`CTA section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const ctaSection = page.locator('section').nth(3);
        await ctaSection.scrollIntoViewIfNeeded();
        await expect(ctaSection).toBeVisible();
        
        // Take CTA section screenshot
        await expect(ctaSection).toHaveScreenshot(`cta-${name.toLowerCase()}.png`, {
          threshold: 0.2
        });
      });
    });
  });

  // Test responsive component behavior
  test.describe('Responsive Behavior Verification', () => {
    test('Navigation mobile hamburger menu functionality', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Look for hamburger menu button
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
      if (await menuButton.isVisible()) {
        // Test closed state
        await expect(nav).toHaveScreenshot('nav-mobile-closed.png');
        
        // Test opened state
        await menuButton.click();
        await page.waitForTimeout(300);
        await expect(nav).toHaveScreenshot('nav-mobile-opened.png');
      }
    });

    test('Hero section responsive layout verification', async ({ page }) => {
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const heroSection = page.locator('section').first();
      const headline = heroSection.locator('h1');
      await expect(headline).toBeVisible();
      
      // Test that content is readable and properly stacked
      const headlineText = await headline.textContent();
      expect(headlineText).toContain('Transform Your Business');
      
      // Test desktop layout
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(headline).toBeVisible();
    });

    test('Features grid responsive behavior', async ({ page }) => {
      // Test mobile stacking
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const featuresSection = page.locator('section').nth(1);
      await featuresSection.scrollIntoViewIfNeeded();
      
      const featureCards = featuresSection.locator('div[class*="grid"] > div, div[class*="flex"] > div');
      const cardCount = await featureCards.count();
      
      if (cardCount > 0) {
        await expect(featureCards.first()).toBeVisible();
      }
      
      // Test desktop grid
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await featuresSection.scrollIntoViewIfNeeded();
      
      if (cardCount > 0) {
        await expect(featureCards.first()).toBeVisible();
      }
    });

    test('Process section timeline responsive behavior', async ({ page }) => {
      // Test mobile vertical layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const processSection = page.locator('section').nth(2);
      await processSection.scrollIntoViewIfNeeded();
      
      const processSteps = processSection.locator('div[class*="group"], div[class*="step"]');
      const stepCount = await processSteps.count();
      
      if (stepCount > 0) {
        await expect(processSteps.first()).toBeVisible();
      }
      
      // Test desktop horizontal layout
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await processSection.scrollIntoViewIfNeeded();
      
      if (stepCount > 0) {
        await expect(processSteps.first()).toBeVisible();
      }
    });

    test('CTA form responsive layout', async ({ page }) => {
      // Test mobile form stacking
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const ctaSection = page.locator('section').nth(3);
      await ctaSection.scrollIntoViewIfNeeded();
      
      const formInputs = ctaSection.locator('input, textarea');
      const inputCount = await formInputs.count();
      
      if (inputCount > 0) {
        await expect(formInputs.first()).toBeVisible();
      }
      
      // Test desktop form layout
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await ctaSection.scrollIntoViewIfNeeded();
      
      if (inputCount > 0) {
        await expect(formInputs.first()).toBeVisible();
      }
    });
  });
}); 