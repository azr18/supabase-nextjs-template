import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Lighthouse Performance Audit Tests
 * Comprehensive automated auditing for performance, SEO, accessibility, and best practices
 */

test.describe('Lighthouse Performance Audits', () => {
  let testResults: any = {
    performance: {},
    seo: {},
    accessibility: {},
    bestPractices: {}
  };

  test.afterAll(async () => {
    // Generate summary report
    const reportPath = path.join(process.cwd(), 'test-results', 'lighthouse-summary.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`Lighthouse audit summary saved to: ${reportPath}`);
  });

  test('should meet performance benchmarks via Chrome DevTools', async ({ page, browserName }) => {
    // Only run on Chromium for consistency with Lighthouse
    test.skip(browserName !== 'chromium', 'Lighthouse audit requires Chromium');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Enable performance monitoring
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('Runtime.enable');

    // Get performance metrics using Chrome DevTools Protocol
    const performanceMetrics = await client.send('Performance.getMetrics');
    const runtimeMetrics = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paintEntries = performance.getEntriesByType('paint');
          const resourceEntries = performance.getEntriesByType('resource');
          
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
            resourceCount: resourceEntries.length,
            totalResourceSize: resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0)
          };
        })()
      `,
      returnByValue: true
    });

    const metrics = runtimeMetrics.result.value;
    testResults.performance = metrics;

    console.log('Performance Metrics:', metrics);

    // Performance assertions
    expect(metrics.firstContentfulPaint).toBeLessThan(1800); // FCP under 1.8s
    expect(metrics.domContentLoaded).toBeLessThan(2000); // DCL under 2s
    expect(metrics.loadComplete).toBeLessThan(4000); // Load under 4s
    expect(metrics.totalResourceSize).toBeLessThan(3 * 1024 * 1024); // Under 3MB total

    await client.detach();
  });

  test('should pass accessibility standards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for basic accessibility requirements
    const accessibilityChecks = await page.evaluate(() => {
      const results = {
        hasLangAttribute: !!document.documentElement.lang,
        hasTitle: !!document.title && document.title.length > 0,
        hasMetaDescription: !!document.querySelector('meta[name="description"]'),
        hasHeadingStructure: document.querySelectorAll('h1').length === 1,
        imagesHaveAlt: Array.from(document.querySelectorAll('img')).every(img => img.hasAttribute('alt')),
        linksHaveText: Array.from(document.querySelectorAll('a')).every(link => 
          link.textContent?.trim() || link.getAttribute('aria-label') || link.getAttribute('title')
        ),
        buttonsHaveText: Array.from(document.querySelectorAll('button')).every(button =>
          button.textContent?.trim() || button.getAttribute('aria-label') || button.getAttribute('title')
        ),
        hasSkipLinks: !!document.querySelector('a[href^="#"]'),
        colorContrastBasic: window.getComputedStyle(document.body).color !== window.getComputedStyle(document.body).backgroundColor
      };

      return results;
    });

    testResults.accessibility = accessibilityChecks;
    console.log('Accessibility Checks:', accessibilityChecks);

    // Accessibility assertions
    expect(accessibilityChecks.hasLangAttribute).toBe(true);
    expect(accessibilityChecks.hasTitle).toBe(true);
    expect(accessibilityChecks.hasMetaDescription).toBe(true);
    expect(accessibilityChecks.hasHeadingStructure).toBe(true);
    expect(accessibilityChecks.imagesHaveAlt).toBe(true);
    expect(accessibilityChecks.linksHaveText).toBe(true);
    expect(accessibilityChecks.buttonsHaveText).toBe(true);
  });

  test('should meet SEO optimization standards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const seoChecks = await page.evaluate(() => {
      const title = document.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1Elements = document.querySelectorAll('h1');
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName);
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      const robotsMeta = document.querySelector('meta[name="robots"]');
      const openGraphTags = {
        title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        description: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        type: document.querySelector('meta[property="og:type"]')?.getAttribute('content'),
        url: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
        image: document.querySelector('meta[property="og:image"]')?.getAttribute('content')
      };
      const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');

      return {
        titleLength: title.length,
        titlePresent: title.length > 0,
        titleOptimal: title.length >= 10 && title.length <= 60,
        metaDescriptionLength: metaDescription.length,
        metaDescriptionPresent: metaDescription.length > 0,
        metaDescriptionOptimal: metaDescription.length >= 50 && metaDescription.length <= 160,
        h1Count: h1Elements.length,
        h1Optimal: h1Elements.length === 1,
        headingStructure: headings,
        hasCanonical: !!canonicalLink,
        hasRobotsMeta: !!robotsMeta,
        openGraph: openGraphTags,
        hasTwitterCard: !!twitterCard,
        internalLinksCount: document.querySelectorAll('a:not([href^="http"])').length,
        externalLinksCount: document.querySelectorAll('a[href^="http"]').length
      };
    });

    testResults.seo = seoChecks;
    console.log('SEO Checks:', seoChecks);

    // SEO assertions
    expect(seoChecks.titlePresent).toBe(true);
    expect(seoChecks.titleOptimal).toBe(true);
    expect(seoChecks.metaDescriptionPresent).toBe(true);
    expect(seoChecks.metaDescriptionOptimal).toBe(true);
    expect(seoChecks.h1Optimal).toBe(true);
    expect(seoChecks.internalLinksCount).toBeGreaterThan(3);
  });

  test('should follow web best practices', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for console errors
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    const bestPracticesChecks = await page.evaluate(() => {
      const results = {
        hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
        usesHTTPS: location.protocol === 'https:',
        hasDoctype: document.doctype?.name === 'html',
        hasCharset: !!document.querySelector('meta[charset], meta[http-equiv="Content-Type"]'),
        externalLinksSecure: Array.from(document.querySelectorAll('a[href^="http"][target="_blank"]')).every(link =>
          link.getAttribute('rel')?.includes('noopener') || link.getAttribute('rel')?.includes('noreferrer')
        ),
        imagesOptimized: Array.from(document.querySelectorAll('img')).every(img => 
          img.hasAttribute('width') || img.hasAttribute('height') || img.style.width || img.style.height
        ),
        hasErrorHandling: typeof window.onerror === 'function' || !!window.addEventListener,
        hasServiceWorker: 'serviceWorker' in navigator
      };

      return results;
    });

    const finalChecks = {
      ...bestPracticesChecks,
      consoleErrors: consoleMessages
    };

    testResults.bestPractices = finalChecks;

    console.log('Best Practices Checks:', finalChecks);

    // Best practices assertions
    expect(bestPracticesChecks.hasViewportMeta).toBe(true);
    expect(bestPracticesChecks.hasDoctype).toBe(true);
    expect(bestPracticesChecks.hasCharset).toBe(true);
    expect(bestPracticesChecks.externalLinksSecure).toBe(true);
    expect(consoleMessages.length).toBe(0); // No console errors
  });

  test('should have optimal mobile performance', async ({ browser }) => {
    // Test mobile-specific performance
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    });

    const mobilePage = await mobileContext.newPage();
    
    // Enable network throttling simulation
    const client = await mobileContext.newCDPSession(mobilePage);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms RTT
    });

    const startTime = Date.now();
    await mobilePage.goto('/', { waitUntil: 'networkidle' });
    const mobileLoadTime = Date.now() - startTime;

    const mobileMetrics = await mobilePage.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        loadTime: Date.now() - performance.timeOrigin,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });

    console.log('Mobile Performance:', { mobileLoadTime, ...mobileMetrics });

    // Mobile performance assertions
    expect(mobileLoadTime).toBeLessThan(6000); // 6 seconds on throttled connection
    expect(mobileMetrics.firstContentfulPaint).toBeLessThan(2500); // 2.5s FCP on mobile
    expect(mobileMetrics.viewportWidth).toBe(375);

    await client.detach();
    await mobileContext.close();
  });
}); 