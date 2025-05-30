import { test, expect } from '@playwright/test';

test.describe('Hero Section Responsive Design', () => {
  // Test on different device sizes
  const deviceSizes = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Ultra Wide', width: 2560, height: 1440 }
  ];

  deviceSizes.forEach(({ name, width, height }) => {
    test(`Hero section displays correctly on ${name} (${width}x${height})`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width, height });
      
      // Navigate to landing page
      await page.goto('/');
      
      // Wait for the hero section to load and target it specifically
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();
      
      // Check main headline is visible and properly sized (within hero section)
      const headline = heroSection.locator('h1');
      await expect(headline).toBeVisible();
      await expect(headline).toContainText('Transform Your Business with');
      await expect(headline).toContainText('Custom AI Solutions');
      
      // Check subheadline is visible (within hero section)
      const subheadline = heroSection.locator('h2');
      await expect(subheadline).toBeVisible();
      await expect(subheadline).toContainText('Expert AI automation across Marketing, Sales, Operations & Finance');
      
      // Check description paragraph is visible (within hero section)
      const description = heroSection.locator('p').first();
      await expect(description).toBeVisible();
      await expect(description).toContainText('Every business will be transformed by AI');
      
      // Check value proposition cards are visible (within hero section)
      const valueCards = heroSection.locator('div[class*="grid"] > div');
      await expect(valueCards).toHaveCount(3);
      
      // Verify each value card has proper structure
      for (let i = 0; i < 3; i++) {
        const card = valueCards.nth(i);
        await expect(card.locator('svg')).toBeVisible(); // Icon
        await expect(card.locator('h3')).toBeVisible(); // Title
        await expect(card.locator('p')).toBeVisible(); // Description
      }
      
      // Check CTA buttons are visible and clickable (within hero section)
      const ctaButtons = heroSection.locator('a[href="/auth/register"], a[href*="calendly"]');
      await expect(ctaButtons).toHaveCount(2);
      
      for (let i = 0; i < 2; i++) {
        const button = ctaButtons.nth(i);
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
      }
      
      // Check trust signal badges are visible (within hero section)
      const trustBadges = heroSection.locator('span[class*="bg-secondary"]');
      await expect(trustBadges).toHaveCount(6);
    });
  });

  test('Hero section responsive button layout', async ({ page }) => {
    // Test mobile layout (stacked buttons)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const heroSection = page.locator('section').first();
    
    // Look for the specific CTA button container with its exact classes
    const ctaButtons = heroSection.locator('a[href="/auth/register"], a[href*="calendly"]');
    await expect(ctaButtons).toHaveCount(2);
    
    // Verify buttons are stacked vertically on mobile by checking their parent container
    const buttonParent = ctaButtons.first().locator('..');
    const parentClasses = await buttonParent.getAttribute('class');
    expect(parentClasses).toContain('flex-col');
    
    // Test desktop layout (horizontal buttons)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    
    const ctaButtonsDesktop = heroSection.locator('a[href="/auth/register"], a[href*="calendly"]');
    const buttonParentDesktop = ctaButtonsDesktop.first().locator('..');
    const parentClassesDesktop = await buttonParentDesktop.getAttribute('class');
    expect(parentClassesDesktop).toContain('md:flex-row');
  });

  test('Hero section responsive value cards grid', async ({ page }) => {
    // Test mobile layout (single column)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const heroSection = page.locator('section').first();
    const gridContainer = heroSection.locator('div[class*="grid-cols-1"]').first();
    await expect(gridContainer).toBeVisible();
    
    // Test tablet/desktop layout (three columns)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    await expect(gridContainer).toHaveClass(/md:grid-cols-3/);
  });

  test('Hero section responsive typography scaling', async ({ page }) => {
    const sizes = [
      { width: 375, expectedClass: 'text-3xl' }, // Mobile
      { width: 640, expectedClass: 'sm:text-4xl' }, // Small
      { width: 768, expectedClass: 'md:text-5xl' }, // Medium
      { width: 1024, expectedClass: 'lg:text-6xl' }, // Large
      { width: 1280, expectedClass: 'xl:text-7xl' } // Extra large
    ];

    for (const { width, expectedClass } of sizes) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      
      const heroSection = page.locator('section').first();
      const headline = heroSection.locator('h1');
      const classes = await headline.getAttribute('class');
      expect(classes).toContain(expectedClass);
    }
  });

  test('Hero section responsive spacing and padding', async ({ page }) => {
    // Test mobile spacing
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const heroSection = page.locator('section').first();
    const mainContainer = heroSection.locator('div[class*="max-w-7xl"]').first();
    const classes = await mainContainer.getAttribute('class');
    
    // Check mobile padding classes
    expect(classes).toContain('px-4');
    expect(classes).toContain('pt-8');
    expect(classes).toContain('pb-12');
    
    // Test desktop spacing
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    
    const updatedClasses = await mainContainer.getAttribute('class');
    
    // Check desktop padding classes
    expect(updatedClasses).toContain('lg:px-8');
    expect(updatedClasses).toContain('lg:pt-20');
    expect(updatedClasses).toContain('lg:pb-24');
  });

  test('Hero section background pattern scaling', async ({ page }) => {
    // Test different background grid sizes
    const sizes = [
      { width: 375, expectedPattern: 'bg-[size:30px_30px]' },
      { width: 640, expectedPattern: 'sm:bg-[size:40px_40px]' },
      { width: 1024, expectedPattern: 'lg:bg-[size:50px_50px]' }
    ];

    for (const { width, expectedPattern } of sizes) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      
      const heroSection = page.locator('section').first();
      const backgroundPattern = heroSection.locator('div[class*="bg-grid-white"]').first();
      const classes = await backgroundPattern.getAttribute('class');
      expect(classes).toContain(expectedPattern);
    }
  });

  test('Hero section color consistency across devices', async ({ page }) => {
    const devices = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of devices) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      const heroSection = page.locator('section').first();
      
      // Test gradient colors are applied correctly
      const gradientSpan = heroSection.locator('span[class*="bg-gradient-to-r"]').first();
      const classes = await gradientSpan.getAttribute('class');
      expect(classes).toContain('from-primary');
      expect(classes).toContain('via-blue-600');
      expect(classes).toContain('to-violet-600');
      
      // Test CTA button gradients
      const ctaButton = heroSection.locator('a[href="/auth/register"] button');
      const buttonClasses = await ctaButton.getAttribute('class');
      expect(buttonClasses).toContain('from-gray-800');
      expect(buttonClasses).toContain('via-blue-500');
      expect(buttonClasses).toContain('to-blue-600');
    }
  });

  test('Hero section accessibility across devices', async ({ page }) => {
    const devices = [
      { width: 375, height: 667 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of devices) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      const heroSection = page.locator('section').first();
      
      // Check heading hierarchy within hero section
      const h1 = heroSection.locator('h1');
      const h2 = heroSection.locator('h2');
      const h3s = heroSection.locator('h3');
      
      await expect(h1).toHaveCount(1);
      await expect(h2).toHaveCount(1);
      await expect(h3s).toHaveCount(3);
      
      // Check button accessibility within hero section
      const buttons = heroSection.locator('button, a[role="button"]');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
      }
      
      // Check color contrast (basic check) within hero section
      const textElements = heroSection.locator('h1, h2, h3, p');
      for (let i = 0; i < await textElements.count(); i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
      }
    }
  });

  test('Hero section interactive elements work on touch devices', async ({ page }) => {
    // Simulate touch device
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const heroSection = page.locator('section').first();
    
    // Test hover effects work on touch (they should still be accessible)
    const ctaButton = heroSection.locator('a[href="/auth/register"] button');
    await ctaButton.hover();
    await expect(ctaButton).toBeVisible();
    
    // Test buttons are properly sized for touch
    const buttonBox = await ctaButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target size
    
    // Test calendly link button
    const calendlyButton = heroSection.locator('a[href*="calendly"] button');
    const calendlyBox = await calendlyButton.boundingBox();
    expect(calendlyBox?.height).toBeGreaterThan(40);
  });
}); 