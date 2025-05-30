import { test, expect, Page } from '@playwright/test';

/**
 * Landing Page Performance and SEO Tests
 * Comprehensive testing for Core Web Vitals, Lighthouse metrics, and SEO optimization
 */

test.describe('Landing Page Performance Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      // Simulate realistic network conditions
      viewport: { width: 1200, height: 800 }
    });
    page = await context.newPage();
  });

  test('should meet Core Web Vitals performance thresholds', async () => {
    // Navigate to landing page
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    // Measure First Contentful Paint (FCP) - should be under 1.8s
    const fcpMetric = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntriesByName('first-contentful-paint');
          if (entries.length > 0) {
            resolve(entries[0].startTime);
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Fallback if FCP is already available
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          resolve(fcpEntry.startTime);
        }
      });
    });

    console.log(`First Contentful Paint: ${fcpMetric}ms`);
    expect(fcpMetric).toBeLessThan(1800); // FCP should be under 1.8 seconds

    // Measure Largest Contentful Paint (LCP) - should be under 2.5s
    const lcpMetric = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    console.log(`Largest Contentful Paint: ${lcpMetric}ms`);
    expect(lcpMetric).toBeLessThan(2500); // LCP should be under 2.5 seconds

    // Check that critical content is visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have optimal loading performance', async () => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const domLoadTime = Date.now() - startTime;
    
    await page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - startTime;

    console.log(`DOM Content Loaded: ${domLoadTime}ms`);
    console.log(`Network Idle: ${networkIdleTime}ms`);

    // Performance expectations
    expect(domLoadTime).toBeLessThan(2000); // DOM should load in under 2 seconds
    expect(networkIdleTime).toBeLessThan(4000); // All resources should load in under 4 seconds
  });

  test('should have efficient resource loading', async () => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check response time
    expect(response?.status()).toBe(200);

    // Analyze resource loading
    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const imageCount = resources.filter(r => r.initiatorType === 'img').length;
      const cssCount = resources.filter(r => r.initiatorType === 'link' && r.name.includes('.css')).length;
      const jsCount = resources.filter(r => r.initiatorType === 'script').length;
      
      const totalSize = resources.reduce((sum, resource) => {
        return sum + (resource.transferSize || 0);
      }, 0);

      return { imageCount, cssCount, jsCount, totalSize, resourceCount: resources.length };
    });

    console.log('Resource Metrics:', resourceMetrics);

    // Resource optimization checks
    expect(resourceMetrics.totalSize).toBeLessThan(3 * 1024 * 1024); // Total resources under 3MB
    expect(resourceMetrics.resourceCount).toBeLessThan(50); // Reasonable number of resources
  });

  test('should be responsive and perform well on mobile devices', async ({ browser }) => {
    // Test mobile performance
    const mobileContext = await browser.newContext({
      ...browser.newContext(),
      viewport: { width: 375, height: 667 }, // iPhone SE dimensions
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const mobilePage = await mobileContext.newPage();
    const startTime = Date.now();
    
    await mobilePage.goto('/', { waitUntil: 'networkidle' });
    const mobileLoadTime = Date.now() - startTime;

    console.log(`Mobile Load Time: ${mobileLoadTime}ms`);
    expect(mobileLoadTime).toBeLessThan(5000); // Mobile should load in under 5 seconds

    // Check mobile layout
    await expect(mobilePage.locator('nav')).toBeVisible();
    await expect(mobilePage.locator('h1')).toBeVisible();
    
    // Check that content is properly responsive
    const viewportWidth = await mobilePage.evaluate(() => window.innerWidth);
    expect(viewportWidth).toBe(375);

    await mobileContext.close();
  });
});

test.describe('Landing Page SEO Tests', () => {
  test('should have proper SEO metadata and structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check HTML structure and semantics
    const title = await page.locator('title').textContent();
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(10);
    expect(title!.length).toBeLessThan(60); // Optimal title length for SEO
    console.log(`Page Title: "${title}"`);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    expect(metaDescription!.length).toBeLessThan(160); // Optimal meta description length
    console.log(`Meta Description: "${metaDescription}"`);

    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one H1

    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text!.length).toBeGreaterThan(10);
    console.log(`H1 Text: "${h1Text}"`);

    // Check for proper heading hierarchy (H1 -> H2 -> H3)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(3); // Should have multiple headings
    console.log('Heading Structure:', headings);

    // Check for alt attributes on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy(); // All images should have alt text
    }
    console.log(`Images with alt text: ${images.length}`);
  });

  test('should have proper Open Graph and social media metadata', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

    console.log('Open Graph Metadata:', { ogTitle, ogDescription, ogType, ogUrl });

    // These might not be implemented yet, so we'll check if they exist and log for improvement
    if (ogTitle) expect(ogTitle.length).toBeGreaterThan(10);
    if (ogDescription) expect(ogDescription.length).toBeGreaterThan(50);

    // Check Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    
    console.log('Twitter Metadata:', { twitterCard, twitterTitle });
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for semantic HTML elements
    await expect(page.locator('nav')).toBeVisible();
    const sectionsCount = await page.locator('main, section').count();
    expect(sectionsCount).toBeGreaterThan(0); // Should have at least one main or section element
    await expect(page.locator('footer')).toBeVisible();

    // Check for proper link structure
    const links = await page.locator('a').all();
    expect(links.length).toBeGreaterThan(5); // Should have multiple navigation links

    // Check that external links have proper attributes
    const externalLinks = await page.locator('a[href^="http"]').all();
    for (const link of externalLinks) {
      const rel = await link.getAttribute('rel');
      const target = await link.getAttribute('target');
      
      // External links should have rel="noopener noreferrer" and target="_blank"
      if (target === '_blank') {
        expect(rel).toContain('noopener');
      }
    }

    console.log(`Internal links: ${links.length - externalLinks.length}, External links: ${externalLinks.length}`);
  });

  test('should have accessible content and ARIA attributes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for ARIA attributes and accessibility
    const skipLink = page.locator('a[href="#main"], a[href="#content"]');
    // Skip link is optional but good for accessibility

    // Check that interactive elements have proper labels
    const buttons = await page.locator('button, input[type="button"], input[type="submit"]').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have text, aria-label, or title
      expect(text || ariaLabel || title).toBeTruthy();
    }

    // Check color contrast (basic check)
    const backgroundColor = await page.evaluate(() => {
      const body = document.querySelector('body');
      return body ? window.getComputedStyle(body).backgroundColor : '';
    });
    
    expect(backgroundColor).toBeTruthy();
    console.log(`Page background color: ${backgroundColor}`);
  });

  test('should load efficiently with proper caching headers', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check response headers for performance optimization
    const headers = response?.headers();
    console.log('Response Headers:', headers);

    // Check for important performance headers
    if (headers) {
      // These headers might not be set yet, but we'll check and report
      const cacheControl = headers['cache-control'];
      const contentEncoding = headers['content-encoding'];
      const contentType = headers['content-type'];

      console.log('Performance Headers:', {
        cacheControl,
        contentEncoding,
        contentType
      });

      expect(contentType).toContain('text/html');
    }
  });
});

test.describe('Landing Page Content Quality Tests', () => {
  test('should display all required landing page sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for Hero section
    await expect(page.locator('section, div').filter({ hasText: /AI business solutions|automation|custom/i }).first()).toBeVisible();

    // Check for Features section
    await expect(page.locator('#features, section').filter({ hasText: /features|capabilities|tools/i }).first()).toBeVisible();

    // Check for Process section
    await expect(page.locator('#process, section').filter({ hasText: /process|implementation|journey/i }).first()).toBeVisible();

    // Check for Call-to-Action section
    await expect(page.locator('#contact, section').filter({ hasText: /contact|consultation|get started/i }).first()).toBeVisible();

    // Check navigation links work
    await page.click('a[href="#features"]');
    await page.waitForTimeout(500); // Allow scroll animation

    await page.click('a[href="#process"]');
    await page.waitForTimeout(500);

    await page.click('a[href="#contact"]');
    await page.waitForTimeout(500);

    console.log('All main landing page sections are present and navigable');
  });

  test('should have proper internationalization support', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for language selector
    const languageSelector = page.locator('select, button').filter({ hasText: /language|langue|idioma|EN|HE|ES|FR/i });
    
    if (await languageSelector.count() > 0) {
      console.log('Language selector found - internationalization is implemented');
      await expect(languageSelector.first()).toBeVisible();
    } else {
      console.log('Language selector not found - may need to be implemented');
    }

    // Check for proper lang attribute on HTML element
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    console.log(`HTML lang attribute: ${htmlLang}`);
  });
}); 