import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Consistency Across Device Sizes', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
  });

  const deviceSizes = [
    { name: 'mobile-small', width: 320, height: 568 },
    { name: 'mobile-medium', width: 375, height: 667 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop-small', width: 1200, height: 800 },
    { name: 'desktop-medium', width: 1440, height: 900 },
    { name: 'desktop-large', width: 1920, height: 1080 },
    { name: 'ultrawide', width: 2560, height: 1440 }
  ];

  test.describe('Blue Gradient Theme Consistency', () => {
    deviceSizes.forEach(({ name, width, height }) => {
      test(`Blue gradient theme should be consistent on ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Test Welcome Card gradient
        const welcomeCard = page.locator('[data-testid="welcome-card"]');
        if (await welcomeCard.isVisible()) {
          const welcomeHeader = welcomeCard.locator('.bg-gradient-to-r');
          await expect(welcomeHeader).toHaveClass(/from-gray-800.*via-blue-500.*to-blue-600/);
          
          // Ensure gradient text is readable
          const welcomeTitle = welcomeHeader.locator('h1, h2, h3').first();
          if (await welcomeTitle.isVisible()) {
            await expect(welcomeTitle).toHaveCSS('color', /rgb\(255, 255, 255\)/);
          }
        }

        // Test Tools Section gradient
        const toolsSection = page.locator('[data-testid="tools-section"]');
        if (await toolsSection.isVisible()) {
          const toolsHeader = toolsSection.locator('.bg-gradient-to-r');
          await expect(toolsHeader).toHaveClass(/from-blue-600.*via-violet-500.*to-violet-600/);
          
          const toolsTitle = toolsHeader.locator('h1, h2, h3').first();
          if (await toolsTitle.isVisible()) {
            await expect(toolsTitle).toHaveCSS('color', /rgb\(255, 255, 255\)/);
          }
        }

        // Test Settings Section gradient
        const settingsSection = page.locator('[data-testid="settings-section"]');
        if (await settingsSection.isVisible()) {
          const settingsHeader = settingsSection.locator('.bg-gradient-to-r');
          await expect(settingsHeader).toHaveClass(/from-violet-600.*via-purple-500.*to-purple-600/);
          
          const settingsTitle = settingsHeader.locator('h1, h2, h3').first();
          if (await settingsTitle.isVisible()) {
            await expect(settingsTitle).toHaveCSS('color', /rgb\(255, 255, 255\)/);
          }
        }

        // Test ToolCard gradients
        const toolCards = page.locator('[data-testid="tool-card"]');
        const toolCardCount = await toolCards.count();
        
        for (let i = 0; i < Math.min(toolCardCount, 3); i++) {
          const toolCard = toolCards.nth(i);
          if (await toolCard.isVisible()) {
            const gradientElements = toolCard.locator('.bg-gradient-to-r, .bg-gradient-to-br');
            const gradientCount = await gradientElements.count();
            
            if (gradientCount > 0) {
              // Verify gradient classes contain blue/violet/purple spectrum
              for (let j = 0; j < gradientCount; j++) {
                const gradient = gradientElements.nth(j);
                const gradientClass = await gradient.getAttribute('class');
                
                expect(gradientClass).toMatch(/(blue|violet|purple)/);
              }
            }
          }
        }
      });
    });
  });

  test.describe('Component Alignment and Spacing', () => {
    deviceSizes.forEach(({ name, width, height }) => {
      test(`Component alignment should be consistent on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Test main container spacing
        const dashboardContent = page.locator('[data-testid="dashboard-content"]');
        await expect(dashboardContent).toBeVisible();
        
        const containerPadding = await dashboardContent.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            paddingLeft: styles.paddingLeft,
            paddingRight: styles.paddingRight,
            paddingTop: styles.paddingTop,
            paddingBottom: styles.paddingBottom
          };
        });

        // Verify appropriate padding for device size
        const paddingValue = parseInt(containerPadding.paddingLeft);
        if (width < 640) {
          expect(paddingValue).toBeGreaterThanOrEqual(16); // min 1rem on mobile
        } else if (width < 1024) {
          expect(paddingValue).toBeGreaterThanOrEqual(24); // min 1.5rem on tablet
        } else {
          expect(paddingValue).toBeGreaterThanOrEqual(32); // min 2rem on desktop
        }

        // Test card spacing consistency
        const cards = page.locator('.card, [class*="Card"]');
        const cardCount = await cards.count();
        
        if (cardCount > 1) {
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            const card = cards.nth(i);
            if (await card.isVisible()) {
              const cardBox = await card.boundingBox();
              if (cardBox) {
                // Cards should not overflow viewport
                expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(width + 5);
                
                // Cards should have reasonable minimum height
                expect(cardBox.height).toBeGreaterThanOrEqual(60);
              }
            }
          }
        }

        // Test tools grid alignment
        const toolsGrid = page.locator('[data-testid="tools-grid"]');
        if (await toolsGrid.isVisible()) {
          const gridBox = await toolsGrid.boundingBox();
          if (gridBox) {
            // Grid should not overflow
            expect(gridBox.x + gridBox.width).toBeLessThanOrEqual(width + 5);
          }

          // Test individual tool card alignment
          const toolCards = toolsGrid.locator('[data-testid="tool-card"]');
          const toolCardCount = await toolCards.count();
          
          for (let i = 0; i < toolCardCount; i++) {
            const toolCard = toolCards.nth(i);
            if (await toolCard.isVisible()) {
              const cardBox = await toolCard.boundingBox();
              if (cardBox) {
                expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(width + 5);
              }
            }
          }
        }

        // Test settings grid alignment
        const settingsGrid = page.locator('[data-testid="settings-grid"]');
        if (await settingsGrid.isVisible()) {
          const settingsItems = settingsGrid.locator('a, div');
          const settingsCount = await settingsItems.count();
          
          for (let i = 0; i < settingsCount; i++) {
            const item = settingsItems.nth(i);
            if (await item.isVisible()) {
              const itemBox = await item.boundingBox();
              if (itemBox) {
                expect(itemBox.x + itemBox.width).toBeLessThanOrEqual(width + 5);
              }
            }
          }
        }
      });
    });
  });

  test.describe('Typography and Readability', () => {
    deviceSizes.forEach(({ name, width, height }) => {
      test(`Typography should be readable and properly sized on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Test heading sizes across viewports
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        
        for (let i = 0; i < headingCount; i++) {
          const heading = headings.nth(i);
          if (await heading.isVisible()) {
            const fontSize = await heading.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return parseFloat(styles.fontSize);
            });

            // Minimum font sizes for readability
            if (width < 640) {
              expect(fontSize).toBeGreaterThanOrEqual(14); // Mobile minimum
            } else {
              expect(fontSize).toBeGreaterThanOrEqual(16); // Desktop minimum
            }

            // Maximum font sizes to prevent overflow
            expect(fontSize).toBeLessThanOrEqual(48);
          }
        }

        // Test body text readability
        const bodyText = page.locator('p, span, div').filter({
          hasText: /\w{10,}/ // Text with at least 10 characters
        });
        const textCount = await bodyText.count();
        
        for (let i = 0; i < Math.min(textCount, 5); i++) {
          const text = bodyText.nth(i);
          if (await text.isVisible()) {
            const fontSize = await text.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return parseFloat(styles.fontSize);
            });

            // Body text minimum sizes
            if (width < 640) {
              expect(fontSize).toBeGreaterThanOrEqual(12);
            } else {
              expect(fontSize).toBeGreaterThanOrEqual(14);
            }
          }
        }

        // Test contrast on gradient backgrounds
        const whiteTextOnGradient = page.locator('.text-white').first();
        if (await whiteTextOnGradient.isVisible()) {
          const textColor = await whiteTextOnGradient.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return styles.color;
          });
          
          // Should be white or very light
          expect(textColor).toMatch(/rgb\(255, 255, 255\)|rgba\(255, 255, 255/);
        }
      });
    });
  });

  test.describe('Interactive Elements Accessibility', () => {
    deviceSizes.forEach(({ name, width, height }) => {
      test(`Interactive elements should be accessible on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Test button touch targets
        const buttons = page.locator('button, [role="button"]');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const buttonBox = await button.boundingBox();
            if (buttonBox) {
              // Touch targets should be at least 44px for mobile
              if (width < 768) {
                expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThanOrEqual(32);
              }
              
              // Buttons should not be too wide
              expect(buttonBox.width).toBeLessThanOrEqual(width * 0.9);
            }
          }
        }

        // Test link targets
        const links = page.locator('a');
        const linkCount = await links.count();
        
        for (let i = 0; i < Math.min(linkCount, 10); i++) {
          const link = links.nth(i);
          if (await link.isVisible()) {
            const linkBox = await link.boundingBox();
            if (linkBox) {
              // Links should have adequate size for mobile interaction
              if (width < 768) {
                expect(Math.min(linkBox.width, linkBox.height)).toBeGreaterThanOrEqual(24);
              }
            }
          }
        }

        // Test hover effects on non-touch devices
        if (width >= 1024) {
          const hoverableElements = page.locator('.hover\\:scale-105, .hover\\:shadow-xl, .group');
          const hoverCount = await hoverableElements.count();
          
          for (let i = 0; i < Math.min(hoverCount, 3); i++) {
            const element = hoverableElements.nth(i);
            if (await element.isVisible()) {
              await element.hover();
              await page.waitForTimeout(100);
              
              const transform = await element.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return styles.transform;
              });
              
              // Should have some transform applied on hover
              expect(transform).not.toBe('none');
            }
          }
        }
      });
    });
  });

  test.describe('Visual Regression Testing', () => {
    const keyDeviceSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];

    keyDeviceSizes.forEach(({ name, width, height }) => {
      test(`Visual regression test for dashboard on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');
        
        // Wait for any animations to complete
        await page.waitForTimeout(1000);

        // Hide dynamic content that might change between runs
        await page.addStyleTag({
          content: `
            [data-testid="last-updated"], 
            .animate-spin,
            time,
            [datetime] {
              visibility: hidden !important;
            }
          `
        });

        // Take full page screenshot
        await expect(page).toHaveScreenshot(`dashboard-visual-consistency-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
          threshold: 0.3,
          maxDiffPixels: 1000
        });

        // Take individual component screenshots
        const welcomeCard = page.locator('[data-testid="welcome-card"]');
        if (await welcomeCard.isVisible()) {
          await expect(welcomeCard).toHaveScreenshot(`welcome-card-${name}.png`, {
            threshold: 0.2
          });
        }

        const toolsSection = page.locator('[data-testid="tools-section"]');
        if (await toolsSection.isVisible()) {
          await expect(toolsSection).toHaveScreenshot(`tools-section-${name}.png`, {
            threshold: 0.2
          });
        }

        const settingsSection = page.locator('[data-testid="settings-section"]');
        if (await settingsSection.isVisible()) {
          await expect(settingsSection).toHaveScreenshot(`settings-section-${name}.png`, {
            threshold: 0.2
          });
        }
      });
    });
  });

  test.describe('Content Overflow Prevention', () => {
    deviceSizes.forEach(({ name, width, height }) => {
      test(`Content should not overflow on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Check horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        expect(hasHorizontalScroll).toBeFalsy();

        // Check for elements extending beyond viewport
        const allElements = page.locator('*').filter({
          has: page.locator(':visible')
        });
        
        const overflowingElements = await allElements.evaluateAll((elements, viewportWidth) => {
          return elements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.right > viewportWidth + 10; // 10px tolerance
          }).length;
        }, width);

        expect(overflowingElements).toBe(0);

        // Test text doesn't overflow containers
        const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
        const textCount = await textElements.count();
        
        for (let i = 0; i < Math.min(textCount, 10); i++) {
          const element = textElements.nth(i);
          if (await element.isVisible()) {
            const hasOverflow = await element.evaluate((el) => {
              return el.scrollWidth > el.clientWidth;
            });
            
            // If overflow exists, it should be handled with truncation
            if (hasOverflow) {
              const className = await element.getAttribute('class');
              expect(className).toMatch(/(truncate|line-clamp|overflow-hidden)/);
            }
          }
        }
      });
    });
  });

  test.describe('Loading States Visual Consistency', () => {
    const keyDeviceSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'desktop', width: 1200, height: 800 }
    ];

    keyDeviceSizes.forEach(({ name, width, height }) => {
      test(`Loading states should be visually consistent on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        
        // Intercept API calls to simulate loading states
        await page.route('/api/**', route => {
          // Delay response to capture loading state
          setTimeout(() => route.continue(), 2000);
        });

        await page.goto('/app');
        
        // Capture loading state
        await page.waitForSelector('.animate-pulse, .animate-spin', { timeout: 5000 });
        
        await expect(page).toHaveScreenshot(`dashboard-loading-${name}.png`, {
          fullPage: true,
          animations: 'allow',
          threshold: 0.3
        });

        // Verify loading skeletons are properly sized
        const skeletons = page.locator('.animate-pulse');
        const skeletonCount = await skeletons.count();
        
        for (let i = 0; i < skeletonCount; i++) {
          const skeleton = skeletons.nth(i);
          if (await skeleton.isVisible()) {
            const skeletonBox = await skeleton.boundingBox();
            if (skeletonBox) {
              expect(skeletonBox.width).toBeGreaterThan(50);
              expect(skeletonBox.height).toBeGreaterThan(20);
              expect(skeletonBox.x + skeletonBox.width).toBeLessThanOrEqual(width + 5);
            }
          }
        }
      });
    });
  });
}); 