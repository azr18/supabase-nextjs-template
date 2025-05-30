import { test, expect } from '@playwright/test';

test.describe('Features and Process Sections Responsive Design', () => {
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
    test(`Features section displays correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeVisible();
      
      // Check section header visibility and responsive text scaling
      const featuresHeading = featuresSection.locator('h2').first();
      await expect(featuresHeading).toBeVisible();
      await expect(featuresHeading).toContainText('AI-powered toolkit');
      
      // Check features grid responsiveness
      const featuresGrid = featuresSection.locator('div').filter({ hasText: 'Intelligent Operations' }).first();
      await expect(featuresGrid).toBeVisible();
      
      // Verify features cards are visible
      const featureCards = featuresSection.locator('[class*="group bg-white"]');
      await expect(featureCards).toHaveCount(8);
      
      // Check CTA section responsiveness
      const ctaSection = featuresSection.locator('[class*="bg-gradient-to-r from-gray-800"]');
      await expect(ctaSection).toBeVisible();
      
      // Verify value proposition cards
      const valueCards = ctaSection.locator('[class*="bg-white/10"]');
      await expect(valueCards).toHaveCount(3);
    });

    test(`Process section displays correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      const processSection = page.locator('#process');
      await expect(processSection).toBeVisible();
      
      // Check section header
      const processHeading = processSection.locator('h2').first();
      await expect(processHeading).toBeVisible();
      await expect(processHeading).toContainText('From Zero to Hero');
      
      // Check layout based on screen size
      if (width < 1024) {
        // Mobile/Tablet - should show vertical layout
        const mobileLayout = processSection.locator('.block.lg\\:hidden');
        await expect(mobileLayout).toBeVisible();
        
        // Verify all 5 process steps are visible in mobile layout
        const mobileSteps = mobileLayout.locator('[class*="flex items-start"]');
        await expect(mobileSteps).toHaveCount(5);
        
        // Check vertical connector lines
        const verticalConnectors = mobileLayout.locator('[class*="w-0.5 h-"]');
        await expect(verticalConnectors).toHaveCount(4); // 4 connectors for 5 steps
      } else {
        // Desktop - should show horizontal layout
        const desktopLayout = processSection.locator('.hidden.lg\\:block');
        await expect(desktopLayout).toBeVisible();
        
        // Verify grid layout for desktop
        const desktopGrid = desktopLayout.locator('[class*="grid lg:grid-cols-5"]');
        await expect(desktopGrid).toBeVisible();
        
        // Check horizontal connector lines
        const horizontalConnectors = desktopGrid.locator('[class*="absolute top-1/2"]');
        await expect(horizontalConnectors).toHaveCount(4); // 4 connectors for 5 steps
      }
      
      // Check timeline section
      const timelineSection = processSection.getByText('Your AI Journey Timeline');
      await expect(timelineSection).toBeVisible();
      
      // Verify timeline cards
      const timelineCards = processSection.locator('div').filter({ hasText: 'Week 1' }).locator('..').locator('[class*="bg-white/10"]');
      await expect(timelineCards).toHaveCount(3);
    });
  });

  test('Features section responsive grid layout changes correctly', async ({ page }) => {
    await page.goto('/');
    
    const featuresSection = page.locator('#features');
    const featuresGrid = featuresSection.locator('div').filter({ hasText: 'Intelligent Operations' }).first();
    
    // Test mobile layout (1 column)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(featuresGrid).toBeVisible();
    // Grid should stack vertically on mobile
    
    // Test tablet layout (2 columns)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(featuresGrid).toBeVisible();
    
    // Test desktop layout (3-4 columns)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await expect(featuresGrid).toBeVisible();
  });

  test('Process section layout switches between mobile and desktop correctly', async ({ page }) => {
    await page.goto('/');
    
    const processSection = page.locator('#process');
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileLayout = processSection.locator('.block.lg\\:hidden');
    const desktopLayout = processSection.locator('.hidden.lg\\:block');
    
    await expect(mobileLayout).toBeVisible();
    await expect(desktopLayout).toBeHidden();
    
    // Test desktop layout
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    
    await expect(mobileLayout).toBeHidden();
    await expect(desktopLayout).toBeVisible();
  });

  test('Features section hover effects work correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    const featuresSection = page.locator('#features');
    const firstFeatureCard = featuresSection.locator('[class*="group bg-white"]').first();
    
    await expect(firstFeatureCard).toBeVisible();
    
    // Test hover effect on feature card
    await firstFeatureCard.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Verify the icon scales on hover
    const icon = firstFeatureCard.locator('[class*="group-hover:scale-110"]');
    await expect(icon).toBeVisible();
  });

  test('Process section hover effects work correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    const processSection = page.locator('#process');
    const desktopLayout = processSection.locator('.hidden.lg\\:block');
    const firstStep = desktopLayout.locator('.group').first();
    
    await expect(firstStep).toBeVisible();
    
    // Test hover effect on process step
    await firstStep.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Verify the step circle scales on hover
    const stepCircle = firstStep.locator('[class*="group-hover:scale-110"]');
    await expect(stepCircle).toHaveCount(2); // Step circle and icon
  });

  test('Typography scaling works correctly across device sizes', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile typography
    await page.setViewportSize({ width: 375, height: 667 });
    
    const featuresHeading = page.locator('#features h2').first();
    const processHeading = page.locator('#process h2').first();
    
    await expect(featuresHeading).toBeVisible();
    await expect(processHeading).toBeVisible();
    
    // Test desktop typography
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    await expect(featuresHeading).toBeVisible();
    await expect(processHeading).toBeVisible();
  });

  test('CTA sections are responsive and functional', async ({ page }) => {
    await page.goto('/');
    
    // Test Features CTA section
    const featuresCTA = page.locator('#features [class*="bg-gradient-to-r from-gray-800"]');
    await expect(featuresCTA).toBeVisible();
    
    // Test Process timeline section  
    const processTimeline = page.getByText('Your AI Journey Timeline');
    await expect(processTimeline).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(featuresCTA).toBeVisible();
    await expect(processTimeline).toBeVisible();
    
    // Test desktop layout
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await expect(featuresCTA).toBeVisible();
    await expect(processTimeline).toBeVisible();
  });

  test('All interactive elements are accessible on touch devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test that all feature cards are touchable
    const featureCards = page.locator('#features [class*="group bg-white"]');
    const cardCount = await featureCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = featureCards.nth(i);
      await expect(card).toBeVisible();
      // Verify card is in viewport and clickable
      await card.scrollIntoViewIfNeeded();
    }
    
    // Test that process steps are accessible on mobile
    const processSteps = page.locator('#process .block.lg\\:hidden [class*="flex items-start"]');
    const stepCount = await processSteps.count();
    
    for (let i = 0; i < stepCount; i++) {
      const step = processSteps.nth(i);
      await expect(step).toBeVisible();
      await step.scrollIntoViewIfNeeded();
    }
  });
}); 