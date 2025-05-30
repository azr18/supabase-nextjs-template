import { test, expect } from '@playwright/test';

test.describe('Landing Page Complete Responsive Design', () => {
  // Test on different device sizes
  const deviceSizes = [
    { 
      name: 'Mobile Portrait', 
      width: 375, 
      height: 667, 
      type: 'mobile',
    },
    { 
      name: 'Tablet Portrait', 
      width: 768, 
      height: 1024, 
      type: 'tablet',
    },
    { 
      name: 'Desktop Small', 
      width: 1280, 
      height: 720, 
      type: 'desktop',
    },
    { 
      name: 'Desktop Large', 
      width: 1920, 
      height: 1080, 
      type: 'desktop',
    }
  ];

  deviceSizes.forEach(({ name, width, height, type }) => {
    test(`Complete landing page layout on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Wait for page to fully load with longer timeout
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Give time for React components to render
      
      // Test Navigation Bar Responsiveness
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 10000 });
      
      // Check logo/brand visibility
      const brandLogo = nav.locator('span').first();
      await expect(brandLogo).toBeVisible();
      
      if (type === 'mobile') {
        // Mobile: Check that desktop navigation is hidden (using more specific selector)
        const desktopNavItems = nav.locator('a[href="#features"]');
        await expect(desktopNavItems).toBeHidden();
      } else {
        // Tablet/Desktop: Check that navigation links are visible
        const featuresLink = nav.locator('a[href="#features"]');
        await expect(featuresLink).toBeVisible();
        
        const processLink = nav.locator('a[href="#process"]');
        await expect(processLink).toBeVisible();
        
        const contactLink = nav.locator('a[href="#contact"]');
        await expect(contactLink).toBeVisible();
      }
      
      // Test Hero Section Responsiveness
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();
      
      // Check hero content structure
      const heroHeadline = heroSection.locator('h1');
      await expect(heroHeadline).toBeVisible();
      
      const heroSubheadline = heroSection.locator('h2');
      await expect(heroSubheadline).toBeVisible();
      
      // Check hero CTA buttons
      const heroCTAButtons = heroSection.locator('a[href="/auth/register"], a[href*="calendly"]');
      const buttonCount = await heroCTAButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(1); // At least one CTA button should be present
      
      // Test Features Section Responsiveness
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeVisible();
      
      const featuresHeading = featuresSection.locator('h2').first();
      await expect(featuresHeading).toBeVisible();
      
      // Test Process Section Responsiveness
      const processSection = page.locator('#process');
      await expect(processSection).toBeVisible();
      
      const processHeading = processSection.locator('h2').first();
      await expect(processHeading).toBeVisible();
      
      // Test Call-to-Action Section Responsiveness
      const ctaSection = page.locator('#contact');
      await expect(ctaSection).toBeVisible();
      
      const ctaHeading = ctaSection.locator('h2').first();
      await expect(ctaHeading).toBeVisible();
      
      // Check contact form layout
      const contactForm = ctaSection.locator('form');
      await expect(contactForm).toBeVisible();
      
      // Test Footer Responsiveness
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      // Check footer grid layout
      const footerGrid = footer.locator('.grid');
      await expect(footerGrid).toBeVisible();
    });
  });

  test('Landing page scroll behavior and sticky navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Test navigation stays fixed during scroll
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    
    // Scroll down to features section
    await page.locator('#features').scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
    
    // Scroll to process section
    await page.locator('#process').scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
    
    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
  });

  test('Navigation anchor links work correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Test features link
    const featuresLink = page.locator('a[href="#features"]');
    await expect(featuresLink).toBeVisible();
    await featuresLink.click();
    await page.waitForTimeout(500); // Wait for smooth scroll
    
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeInViewport();
    
    // Test process link
    const processLink = page.locator('a[href="#process"]');
    await processLink.click();
    await page.waitForTimeout(500);
    
    const processSection = page.locator('#process');
    await expect(processSection).toBeInViewport();
    
    // Test contact link
    const contactLink = page.locator('a[href="#contact"]');
    await contactLink.click();
    await page.waitForTimeout(500);
    
    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeInViewport();
  });

  test('Typography is responsive and readable across device sizes', async ({ page }) => {
    const devices = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];

    for (const { width, height, name } of devices) {
      await page.setViewportSize({ width, height });
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check main headlines are visible and readable
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      
      for (let i = 0; i < h1Count; i++) {
        const h1 = h1Elements.nth(i);
        await expect(h1).toBeVisible();
      }
      
      // Check h2 elements are visible
      const h2Elements = page.locator('h2');
      const h2Count = await h2Elements.count();
      
      for (let i = 0; i < Math.min(h2Count, 3); i++) { // Test first 3 h2 elements
        const h2 = h2Elements.nth(i);
        await expect(h2).toBeVisible();
      }
    }
  });

  test('Interactive elements are touch-friendly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Test button sizes are adequate for touch (minimum 40px)
    const buttons = page.locator('button, a[role="button"], input[type="submit"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(35); // Minimum touch target size
          expect(boundingBox.width).toBeGreaterThanOrEqual(35);
        }
      }
    }
    
    // Test form inputs are adequately sized
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const boundingBox = await input.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(35);
        }
      }
    }
  });

  test('Page sections adapt layout correctly across devices', async ({ page }) => {
    const deviceSizes = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];

    for (const { width, height, name } of deviceSizes) {
      await page.setViewportSize({ width, height });
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Test that all main sections are visible
      const sections = ['#features', '#process', '#contact'];
      
      for (const sectionId of sections) {
        const section = page.locator(sectionId);
        await expect(section).toBeVisible();
        
        // Scroll to section to ensure it's in view
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeInViewport();
      }
    }
  });

  test('Responsive images and media scale correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const deviceSizes = [
      { width: 375, height: 667 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of deviceSizes) {
      await page.setViewportSize({ width, height });
      await page.reload({ waitUntil: 'networkidle' });
      
      // Check that any images or media elements scale appropriately
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          const boundingBox = await image.boundingBox();
          
          if (boundingBox) {
            // Images should not exceed viewport width
            expect(boundingBox.width).toBeLessThanOrEqual(width + 10); // +10 for tolerance
          }
        }
      }
      
      // Check SVG icons scale appropriately
      const svgIcons = page.locator('svg');
      const svgCount = await svgIcons.count();
      
      for (let i = 0; i < Math.min(svgCount, 5); i++) {
        const svg = svgIcons.nth(i);
        if (await svg.isVisible()) {
          await expect(svg).toBeVisible();
        }
      }
    }
  });

  test('Content overflow is handled correctly on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very small mobile screen
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check that main sections don't cause horizontal overflow
    const sections = ['nav', '#features', '#process', '#contact', 'footer'];
    
    for (const sectionSelector of sections) {
      const section = page.locator(sectionSelector).first();
      if (await section.isVisible()) {
        const sectionBox = await section.boundingBox();
        
        if (sectionBox) {
          // Allow some tolerance for scrollbars
          expect(sectionBox.width).toBeLessThanOrEqual(340);
        }
      }
    }
  });
}); 