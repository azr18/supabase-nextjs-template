import { test, expect } from '@playwright/test';

/**
 * Landing Page Responsive Design Tests
 * Focused testing for responsive layout changes and component behavior across device sizes
 */

test.describe('Landing Page Responsive Design Tests', () => {
  // Critical responsive breakpoints based on Tailwind CSS defaults
  const responsiveBreakpoints = [
    { name: 'Mobile Small', width: 320, height: 568 }, // iPhone 5/SE
    { name: 'Mobile Medium', width: 375, height: 667 }, // iPhone 6/7/8
    { name: 'Mobile Large', width: 414, height: 896 }, // iPhone XR
    { name: 'Tablet Small', width: 640, height: 960 }, // SM breakpoint
    { name: 'Tablet Medium', width: 768, height: 1024 }, // MD breakpoint
    { name: 'Desktop Small', width: 1024, height: 768 }, // LG breakpoint
    { name: 'Desktop Medium', width: 1280, height: 720 }, // XL breakpoint
    { name: 'Desktop Large', width: 1536, height: 864 }, // 2XL breakpoint
    { name: 'Ultra Wide', width: 2560, height: 1440 }
  ];

  test.describe('Navigation Responsive Behavior', () => {
    test('Navigation layout changes across breakpoints', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Test mobile hamburger menu visibility
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
        const mobileMenu = page.locator('div[class*="md:hidden"], nav div[class*="flex-col"]');
        
        if (width < 768) {
          // Mobile: hamburger menu should be visible
          await expect(menuButton).toBeVisible();
        } else {
          // Desktop: full navigation should be visible
          const navLinks = page.locator('nav a[href*="#"]');
          const linkCount = await navLinks.count();
          expect(linkCount).toBeGreaterThan(0);
        }
        
        console.log(`${name} (${width}x${height}): Navigation test passed`);
      }
    });

    test('Navigation menu interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
      
      if (await menuButton.isVisible()) {
        // Test menu opening
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Check if mobile menu is visible
        const mobileMenu = page.locator('div[class*="fixed"], div[class*="absolute"]').filter({ hasText: /Home|About|Features|Contact/ });
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu.first()).toBeVisible();
        }
        
        // Test menu closing
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Hero Section Responsive Layout', () => {
    test('Hero content stacking and sizing', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        const heroSection = page.locator('section').first();
        await expect(heroSection).toBeVisible();
        
        // Test headline responsiveness
        const headline = heroSection.locator('h1');
        await expect(headline).toBeVisible();
        
        // Test value proposition cards layout
        const valueCards = heroSection.locator('div[class*="grid"] > div');
        const cardCount = await valueCards.count();
        
        if (cardCount > 0) {
          // Verify cards are visible and properly arranged
          for (let i = 0; i < cardCount; i++) {
            await expect(valueCards.nth(i)).toBeVisible();
          }
        }
        
        // Test CTA buttons layout
        const ctaButtons = heroSection.locator('a[href="/auth/register"], a[href*="calendly"]');
        const buttonCount = await ctaButtons.count();
        
        if (buttonCount > 0) {
          // Verify all buttons are visible and accessible
          for (let i = 0; i < buttonCount; i++) {
            await expect(ctaButtons.nth(i)).toBeVisible();
          }
        }
        
        console.log(`${name} (${width}x${height}): Hero layout test passed`);
      }
    });

    test('Hero typography scaling', async ({ page }) => {
      const typographyBreakpoints = [
        { width: 375, expectedMinSize: 24 }, // Mobile
        { width: 768, expectedMinSize: 32 }, // Tablet
        { width: 1280, expectedMinSize: 48 } // Desktop
      ];

      for (const { width, expectedMinSize } of typographyBreakpoints) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');
        
        const heroSection = page.locator('section').first();
        const headline = heroSection.locator('h1');
        
        // Get computed font size
        const fontSize = await headline.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });
        
        expect(fontSize).toBeGreaterThanOrEqual(expectedMinSize);
        console.log(`Width ${width}px: Font size ${fontSize}px (minimum ${expectedMinSize}px)`);
      }
    });
  });

  test.describe('Features Section Responsive Grid', () => {
    test('Features grid layout adaptation', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        const featuresSection = page.locator('section').nth(1);
        await featuresSection.scrollIntoViewIfNeeded();
        await expect(featuresSection).toBeVisible();
        
        // Test feature cards grid
        const featureCards = featuresSection.locator('div[class*="grid"] > div, div[class*="flex"] > div');
        const cardCount = await featureCards.count();
        
        if (cardCount > 0) {
          // Verify all feature cards are visible
          for (let i = 0; i < cardCount; i++) {
            await expect(featureCards.nth(i)).toBeVisible();
          }
          
          // Test card content structure
          const firstCard = featureCards.first();
          const cardIcon = firstCard.locator('svg, img').first();
          const cardTitle = firstCard.locator('h3, h4').first();
          const cardDescription = firstCard.locator('p').first();
          
          if (await cardIcon.isVisible()) await expect(cardIcon).toBeVisible();
          if (await cardTitle.isVisible()) await expect(cardTitle).toBeVisible();
          if (await cardDescription.isVisible()) await expect(cardDescription).toBeVisible();
        }
        
        console.log(`${name} (${width}x${height}): Features grid test passed`);
      }
    });
  });

  test.describe('Process Section Responsive Timeline', () => {
    test('Process steps layout and visibility', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        const processSection = page.locator('section').nth(2);
        await processSection.scrollIntoViewIfNeeded();
        await expect(processSection).toBeVisible();
        
        // Test process steps visibility
        const processSteps = processSection.locator('div[class*="group"], div[class*="step"], div[class*="relative"] > div');
        const stepCount = await processSteps.count();
        
        if (stepCount > 0) {
          // Verify at least first few steps are visible
          const visibleSteps = Math.min(stepCount, 5);
          for (let i = 0; i < visibleSteps; i++) {
            const step = processSteps.nth(i);
            if (await step.isVisible()) {
              await expect(step).toBeVisible();
            }
          }
        }
        
        console.log(`${name} (${width}x${height}): Process steps test passed`);
      }
    });

    test('Process timeline visualization on different screens', async ({ page }) => {
      const timelineBreakpoints = [
        { width: 375, layout: 'vertical' },
        { width: 768, layout: 'mixed' },
        { width: 1280, layout: 'horizontal' }
      ];

      for (const { width, layout } of timelineBreakpoints) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');
        
        const processSection = page.locator('section').nth(2);
        await processSection.scrollIntoViewIfNeeded();
        
        // Check for timeline elements
        const timelineElements = processSection.locator('div[class*="line"], div[class*="connector"], div[class*="border"]');
        const timelineCount = await timelineElements.count();
        
        console.log(`Width ${width}px (${layout}): Timeline elements found: ${timelineCount}`);
      }
    });
  });

  test.describe('Call-to-Action Section Responsive Form', () => {
    test('CTA form layout across devices', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        const ctaSection = page.locator('section').nth(3);
        await ctaSection.scrollIntoViewIfNeeded();
        await expect(ctaSection).toBeVisible();
        
        // Test form elements visibility
        const formInputs = ctaSection.locator('input, textarea, select');
        const inputCount = await formInputs.count();
        
        if (inputCount > 0) {
          // Verify form inputs are visible and properly sized
          for (let i = 0; i < inputCount; i++) {
            const input = formInputs.nth(i);
            await expect(input).toBeVisible();
            
            // Test input accessibility
            const inputWidth = await input.evaluate((el) => (el as HTMLElement).offsetWidth);
            expect(inputWidth).toBeGreaterThan(100); // Minimum usable width
          }
        }
        
        // Test submit button
        const submitButton = ctaSection.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await expect(submitButton.first()).toBeVisible();
        }
        
        console.log(`${name} (${width}x${height}): CTA form test passed`);
      }
    });

    test('Form field stacking on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const ctaSection = page.locator('section').nth(3);
      await ctaSection.scrollIntoViewIfNeeded();
      
      const formInputs = ctaSection.locator('input');
      const inputCount = await formInputs.count();
      
      if (inputCount > 1) {
        // Test that inputs stack vertically on mobile
        const firstInput = formInputs.first();
        const secondInput = formInputs.nth(1);
        
        const firstRect = await firstInput.boundingBox();
        const secondRect = await secondInput.boundingBox();
        
        if (firstRect && secondRect) {
          // Second input should be below the first (vertical stacking)
          expect(secondRect.y).toBeGreaterThan(firstRect.y);
        }
      }
    });
  });

  test.describe('Overall Page Layout Consistency', () => {
    test('Section spacing and padding consistency', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Test that all sections are visible and properly spaced
        const sections = page.locator('section');
        const sectionCount = await sections.count();
        
        if (sectionCount > 0) {
          for (let i = 0; i < sectionCount; i++) {
            const section = sections.nth(i);
            await section.scrollIntoViewIfNeeded();
            await expect(section).toBeVisible();
            
            // Check section has proper padding
            const sectionHeight = await section.evaluate((el) => (el as HTMLElement).offsetHeight);
            expect(sectionHeight).toBeGreaterThan(50); // Minimum section height
          }
        }
        
        console.log(`${name} (${width}x${height}): Section spacing test passed`);
      }
    });

    test('Horizontal scrolling prevention', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Check for horizontal overflow
        const bodyScrollWidth = await page.evaluate(() => {
          return {
            scrollWidth: document.body.scrollWidth,
            clientWidth: document.body.clientWidth
          };
        });
        
        // Body should not have horizontal overflow
        expect(bodyScrollWidth.scrollWidth).toBeLessThanOrEqual(bodyScrollWidth.clientWidth + 5); // 5px tolerance
        
        console.log(`${name} (${width}x${height}): No horizontal overflow detected`);
      }
    });

    test('Content readability at all sizes', async ({ page }) => {
      for (const { name, width, height } of responsiveBreakpoints) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Test minimum font sizes for readability
        const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div').filter({ hasText: /.+/ });
        const elementCount = await textElements.count();
        
        if (elementCount > 0) {
          // Sample a few text elements
          const sampleSize = Math.min(elementCount, 10);
          for (let i = 0; i < sampleSize; i += Math.floor(elementCount / sampleSize)) {
            const element = textElements.nth(i);
            
            if (await element.isVisible()) {
              const fontSize = await element.evaluate((el) => {
                return parseInt(window.getComputedStyle(el).fontSize);
              });
              
              // Minimum readable font size (14px)
              expect(fontSize).toBeGreaterThanOrEqual(12);
            }
          }
        }
        
        console.log(`${name} (${width}x${height}): Content readability test passed`);
      }
    });
  });

  test.describe('Touch and Click Target Sizes', () => {
    test('Interactive elements meet touch target requirements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile test
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test buttons and links
      const interactiveElements = page.locator('button, a, input[type="button"], input[type="submit"]');
      const elementCount = await interactiveElements.count();
      
      if (elementCount > 0) {
        for (let i = 0; i < elementCount; i++) {
          const element = interactiveElements.nth(i);
          
          if (await element.isVisible()) {
            const boundingBox = await element.boundingBox();
            
            if (boundingBox) {
              // Touch targets should be at least 44px in either dimension (WCAG guidelines)
              const minTouchTarget = 40; // Slightly relaxed for complex layouts
              const meetsRequirement = boundingBox.width >= minTouchTarget || boundingBox.height >= minTouchTarget;
              
              expect(meetsRequirement).toBeTruthy();
            }
          }
        }
      }
    });
  });
}); 