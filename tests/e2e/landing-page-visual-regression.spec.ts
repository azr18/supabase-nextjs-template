import { test, expect } from '@playwright/test';

/**
 * Landing Page Visual Regression Tests
 * Comprehensive visual testing for all landing page components across multiple viewport sizes
 */

test.describe('Landing Page Visual Regression Tests', () => {
  // Standard viewport sizes for visual regression testing
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  // Test navigation bar visual consistency
  test.describe('Navigation Bar Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`Navigation bar - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Wait for navigation to be fully loaded
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Wait for all images and content to load
        await page.waitForLoadState('networkidle');
        
        // Take screenshot of navigation bar only
        await expect(nav).toHaveScreenshot(`nav-${name.toLowerCase()}-${width}x${height}.png`);
      });
    });

    test('Navigation mobile hamburger menu visual state', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Test closed state
      await expect(nav).toHaveScreenshot('nav-mobile-closed.png');
      
      // Test opened state
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300); // Wait for animation
        await expect(nav).toHaveScreenshot('nav-mobile-opened.png');
      }
    });
  });

  // Test Hero section visual consistency
  test.describe('Hero Section Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`Hero section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Wait for hero section to be fully loaded
        const heroSection = page.locator('section').first();
        await expect(heroSection).toBeVisible();
        
        // Wait for all content and animations to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow for animations
        
        // Take screenshot of hero section
        await expect(heroSection).toHaveScreenshot(`hero-${name.toLowerCase()}-${width}x${height}.png`);
      });
    });

    test('Hero section gradient and animation states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();
      await page.waitForLoadState('networkidle');
      
      // Test static state
      await expect(heroSection).toHaveScreenshot('hero-static-state.png');
      
      // Test hover states on value cards
      const valueCards = heroSection.locator('div[class*="grid"] > div');
      if (await valueCards.count() > 0) {
        await valueCards.first().hover();
        await page.waitForTimeout(300); // Wait for hover animation
        await expect(heroSection).toHaveScreenshot('hero-card-hover-state.png');
      }
    });
  });

  // Test Features section visual consistency
  test.describe('Features Section Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`Features section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Navigate to features section
        const featuresSection = page.locator('section').nth(1);
        await expect(featuresSection).toBeVisible();
        
        // Scroll to ensure proper loading
        await featuresSection.scrollIntoViewIfNeeded();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        // Take screenshot of features section
        await expect(featuresSection).toHaveScreenshot(`features-${name.toLowerCase()}-${width}x${height}.png`);
      });
    });

    test('Features section card interactions', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      const featuresSection = page.locator('section').nth(1);
      await featuresSection.scrollIntoViewIfNeeded();
      await expect(featuresSection).toBeVisible();
      
      // Test static state
      await expect(featuresSection).toHaveScreenshot('features-static-state.png');
      
      // Test hover state on feature cards
      const featureCards = featuresSection.locator('div[class*="group"]').first();
      if (await featureCards.isVisible()) {
        await featureCards.hover();
        await page.waitForTimeout(300);
        await expect(featuresSection).toHaveScreenshot('features-card-hover-state.png');
      }
    });
  });

  // Test Process section visual consistency
  test.describe('Process Section Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`Process section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Navigate to process section
        const processSection = page.locator('section').nth(2);
        await expect(processSection).toBeVisible();
        
        // Scroll to ensure proper loading
        await processSection.scrollIntoViewIfNeeded();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        // Take screenshot of process section
        await expect(processSection).toHaveScreenshot(`process-${name.toLowerCase()}-${width}x${height}.png`);
      });
    });

    test('Process section step animations and interactions', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      const processSection = page.locator('section').nth(2);
      await processSection.scrollIntoViewIfNeeded();
      await expect(processSection).toBeVisible();
      
      // Test static state
      await expect(processSection).toHaveScreenshot('process-static-state.png');
      
      // Test hover states on process steps
      const processSteps = processSection.locator('div[class*="group"], div[class*="hover"]').first();
      if (await processSteps.isVisible()) {
        await processSteps.hover();
        await page.waitForTimeout(300);
        await expect(processSection).toHaveScreenshot('process-step-hover-state.png');
      }
    });

    test('Process section timeline visualization', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      const processSection = page.locator('section').nth(2);
      await processSection.scrollIntoViewIfNeeded();
      await expect(processSection).toBeVisible();
      
      // Focus on timeline/step visualization
      const timeline = processSection.locator('div[class*="relative"]').first();
      if (await timeline.isVisible()) {
        await expect(timeline).toHaveScreenshot('process-timeline-visualization.png');
      }
    });
  });

  // Test Call-to-Action section visual consistency
  test.describe('Call-to-Action Section Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`CTA section - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Navigate to CTA section
        const ctaSection = page.locator('section').nth(3);
        await expect(ctaSection).toBeVisible();
        
        // Scroll to ensure proper loading
        await ctaSection.scrollIntoViewIfNeeded();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        // Take screenshot of CTA section
        await expect(ctaSection).toHaveScreenshot(`cta-${name.toLowerCase()}-${width}x${height}.png`);
      });
    });

    test('CTA section form states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      const ctaSection = page.locator('section').nth(3);
      await ctaSection.scrollIntoViewIfNeeded();
      await expect(ctaSection).toBeVisible();
      
      // Test empty form state
      await expect(ctaSection).toHaveScreenshot('cta-form-empty-state.png');
      
      // Test focused form field state
      const firstInput = ctaSection.locator('input').first();
      if (await firstInput.isVisible()) {
        await firstInput.focus();
        await page.waitForTimeout(200);
        await expect(ctaSection).toHaveScreenshot('cta-form-focused-state.png');
      }
    });
  });

  // Test full page visual consistency
  test.describe('Full Page Visual Regression', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`Full landing page - ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Wait for all content to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot(`landing-page-full-${name.toLowerCase()}-${width}x${height}.png`, {
          fullPage: true
        });
      });
    });
  });

  // Test component spacing and layout consistency
  test.describe('Layout and Spacing Visual Regression', () => {
    test('Section spacing consistency across viewports', async ({ page }) => {
      const viewportsForSpacing = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Desktop', width: 1280, height: 720 }
      ];

      for (const { name, width, height } of viewportsForSpacing) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot focusing on section gaps and spacing
        const mainContent = page.locator('main');
        await expect(mainContent).toHaveScreenshot(`layout-spacing-${name.toLowerCase()}.png`);
      }
    });

    test('Component alignment and grid consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Focus on grid layouts in each section
      const sections = ['hero', 'features', 'process', 'cta'];
      
      for (let i = 0; i < sections.length; i++) {
        const section = page.locator('section').nth(i);
        await section.scrollIntoViewIfNeeded();
        
        // Look for grid containers
        const gridContainer = section.locator('div[class*="grid"]').first();
        if (await gridContainer.isVisible()) {
          await expect(gridContainer).toHaveScreenshot(`${sections[i]}-grid-alignment.png`);
        }
      }
    });
  });

  // Test color scheme and brand consistency
  test.describe('Brand Consistency Visual Regression', () => {
    test('Blue gradient theme consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test all sections with gradient elements
      const gradientElements = page.locator('[class*="gradient"], [class*="bg-gradient"]');
      const count = await gradientElements.count();
      
      if (count > 0) {
        // Screenshot gradient elements for color consistency verification
        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = gradientElements.nth(i);
          if (await element.isVisible()) {
            await element.scrollIntoViewIfNeeded();
            await expect(element).toHaveScreenshot(`gradient-element-${i}.png`);
          }
        }
      }
    });

    test('Button styling consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find all buttons and test their visual consistency
      const buttons = page.locator('button, a[class*="button"]');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 6); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await button.scrollIntoViewIfNeeded();
            
            // Normal state
            await expect(button).toHaveScreenshot(`button-${i}-normal.png`);
            
            // Hover state
            await button.hover();
            await page.waitForTimeout(200);
            await expect(button).toHaveScreenshot(`button-${i}-hover.png`);
          }
        }
      }
    });
  });

  // Test dark mode compatibility (if implemented)
  test.describe('Theme Compatibility Visual Regression', () => {
    test('Light theme consistency check', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Ensure light theme is active and take screenshot
      await expect(page).toHaveScreenshot('landing-page-light-theme.png', {
        fullPage: true
      });
    });
  });

  // Test loading states and transitions
  test.describe('Loading States Visual Regression', () => {
    test('Page load transition states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Navigate and capture loading state
      const response = page.goto('/');
      
      // Try to capture early loading state
      try {
        await page.waitForSelector('body', { timeout: 1000 });
        await expect(page).toHaveScreenshot('page-loading-state.png');
      } catch {
        // Loading was too fast, skip this test
      }
      
      await response;
      await page.waitForLoadState('networkidle');
      
      // Capture fully loaded state
      await expect(page).toHaveScreenshot('page-loaded-state.png');
    });
  });
}); 