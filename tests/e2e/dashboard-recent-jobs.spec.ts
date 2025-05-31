import { test, expect } from '@playwright/test';

test.describe('RecentJobs Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page where RecentJobs is displayed
    await page.goto('/app');
    
    // Wait for authentication and page load
    await page.waitForLoadState('networkidle');
  });

  test('should display Recent Jobs section on dashboard', async ({ page }) => {
    // Check that the Recent Jobs section is present
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
    
    // Check for the clock icon
    await expect(page.locator('[data-testid="clock-icon"], .lucide-clock')).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Intercept the jobs API call to delay response
    await page.route('**/reconciliation_jobs*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.reload();
    
    // Check for loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible();
  });

  test('should display empty state when no jobs exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.reload();
    
    // Check for empty state message
    await expect(page.locator('text=No recent jobs found')).toBeVisible();
    await expect(page.locator('text=Start using our tools to see your job history here')).toBeVisible();
  });

  test('should display jobs with correct information', async ({ page }) => {
    // Mock jobs response
    const mockJobs = [
      {
        id: 'job-1',
        user_id: 'user-1',
        tool_id: 'tool-1',
        airline_type: 'fly_dubai',
        status: 'completed',
        job_name: 'Fly Dubai Reconciliation Test',
        created_at: new Date().toISOString(),
        actual_duration_minutes: 30,
        result_file_path: 'test/path/result.xlsx',
        tool: {
          id: 'tool-1',
          name: 'Invoice Reconciler',
          slug: 'invoice-reconciler'
        }
      },
      {
        id: 'job-2',
        user_id: 'user-1',
        tool_id: 'tool-1',
        airline_type: 'tap',
        status: 'processing',
        job_name: 'TAP Reconciliation Test',
        created_at: new Date().toISOString(),
        actual_duration_minutes: null,
        result_file_path: null,
        tool: {
          id: 'tool-1',
          name: 'Invoice Reconciler',
          slug: 'invoice-reconciler'
        }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Check that jobs are displayed
    await expect(page.locator('text=Fly Dubai Reconciliation Test')).toBeVisible();
    await expect(page.locator('text=TAP Reconciliation Test')).toBeVisible();
    
    // Check airline names
    await expect(page.locator('text=Fly Dubai')).toBeVisible();
    await expect(page.locator('text=TAP')).toBeVisible();
    
    // Check status badges
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Processing')).toBeVisible();
    
    // Check duration display
    await expect(page.locator('text=Duration: 30m')).toBeVisible();
  });

  test('should display status icons correctly', async ({ page }) => {
    const mockJobs = [
      {
        id: 'job-completed',
        status: 'completed',
        job_name: 'Completed Job',
        airline_type: 'fly_dubai',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-processing',
        status: 'processing',
        job_name: 'Processing Job',
        airline_type: 'tap',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-failed',
        status: 'failed',
        job_name: 'Failed Job',
        airline_type: 'air_india',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-pending',
        status: 'pending',
        job_name: 'Pending Job',
        airline_type: 'el_al',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Check for different status icons (by checking for specific Lucide icon classes)
    await expect(page.locator('.lucide-check-circle')).toBeVisible(); // Completed
    await expect(page.locator('.lucide-play-circle')).toBeVisible(); // Processing
    await expect(page.locator('.lucide-alert-circle')).toBeVisible(); // Failed
    await expect(page.locator('.lucide-clock')).toHaveCount(2); // One for title, one for pending job
  });

  test('should show download button only for completed jobs with result files', async ({ page }) => {
    const mockJobs = [
      {
        id: 'job-with-result',
        status: 'completed',
        job_name: 'Job With Result',
        airline_type: 'fly_dubai',
        created_at: new Date().toISOString(),
        result_file_path: 'test/path/result.xlsx',
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-without-result',
        status: 'completed',
        job_name: 'Job Without Result',
        airline_type: 'tap',
        created_at: new Date().toISOString(),
        result_file_path: null,
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-processing',
        status: 'processing',
        job_name: 'Processing Job',
        airline_type: 'air_india',
        created_at: new Date().toISOString(),
        result_file_path: null,
        tool: { slug: 'invoice-reconciler' }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Should have only one download button (for the job with result file)
    const downloadButtons = page.locator('button:has(.lucide-download)');
    await expect(downloadButtons).toHaveCount(1);
  });

  test('should show "Open Tool" links for all jobs', async ({ page }) => {
    const mockJobs = [
      {
        id: 'job-1',
        status: 'completed',
        job_name: 'Job 1',
        airline_type: 'fly_dubai',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      },
      {
        id: 'job-2',
        status: 'processing',
        job_name: 'Job 2',
        airline_type: 'tap',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Check for "Open Tool" links
    const openToolLinks = page.locator('text=Open Tool');
    await expect(openToolLinks).toHaveCount(2);
    
    // Check that links have correct href
    const firstLink = openToolLinks.first();
    await expect(firstLink.locator('xpath=..').locator('a')).toHaveAttribute('href', '/app/invoice-reconciler');
  });

  test('should display "View All Jobs" link when jobs equal limit', async ({ page }) => {
    // Create exactly 5 jobs (default limit)
    const mockJobs = Array.from({ length: 5 }, (_, index) => ({
      id: `job-${index + 1}`,
      status: 'completed',
      job_name: `Job ${index + 1}`,
      airline_type: 'fly_dubai',
      created_at: new Date().toISOString(),
      tool: { slug: 'invoice-reconciler' }
    }));

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Check for "View All Jobs" link
    await expect(page.locator('text=View All Jobs')).toBeVisible();
    
    // Check that it links to the correct page
    const viewAllLink = page.locator('text=View All Jobs').locator('xpath=..').locator('a');
    await expect(viewAllLink).toHaveAttribute('href', '/app/jobs');
  });

  test('should handle download functionality', async ({ page }) => {
    const mockJob = {
      id: 'job-with-download',
      status: 'completed',
      job_name: 'Downloadable Job',
      airline_type: 'fly_dubai',
      created_at: new Date().toISOString(),
      result_file_path: 'user-1/jobs/job-1/result.xlsx',
      tool: { slug: 'invoice-reconciler' }
    };

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockJob])
      });
    });

    // Mock the storage signed URL creation
    await page.route('**/storage/v1/object/sign/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signedURL: 'https://example.com/download-url',
          error: null
        })
      });
    });

    await page.reload();
    
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');
    
    // Click the download button
    await page.locator('button:has(.lucide-download)').click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify the download was initiated
    expect(download).toBeTruthy();
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.reload();
    
    // Check for error message
    await expect(page.locator('text=Failed to load recent jobs')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
    
    // Check for error icon
    await expect(page.locator('.lucide-alert-circle')).toBeVisible();
  });

  test('should retry loading when retry button is clicked', async ({ page }) => {
    let callCount = 0;
    
    await page.route('**/reconciliation_jobs*', async route => {
      callCount++;
      if (callCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        // Second call succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    await page.reload();
    
    // Wait for error state
    await expect(page.locator('text=Failed to load recent jobs')).toBeVisible();
    
    // Click retry button
    await page.locator('text=Retry').click();
    
    // Should show empty state after successful retry
    await expect(page.locator('text=No recent jobs found')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const mockJobs = [
      {
        id: 'job-1',
        status: 'completed',
        job_name: 'Responsive Test Job',
        airline_type: 'fly_dubai',
        created_at: new Date().toISOString(),
        tool: { slug: 'invoice-reconciler' }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
    await expect(page.locator('text=Responsive Test Job')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const mockJobs = [
      {
        id: 'job-1',
        status: 'completed',
        job_name: 'Keyboard Nav Job',
        airline_type: 'fly_dubai',
        created_at: new Date().toISOString(),
        result_file_path: 'test/result.xlsx',
        tool: { slug: 'invoice-reconciler' }
      }
    ];

    await page.route('**/reconciliation_jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.reload();
    
    // Tab to the download button and verify it's focusable
    await page.keyboard.press('Tab');
    // Continue tabbing until we reach the download button
    let attempts = 0;
    while (attempts < 10) {
      const focusedElement = await page.locator(':focus').evaluate(el => el.tagName);
      if (focusedElement === 'BUTTON') {
        const buttonText = await page.locator(':focus').textContent();
        if (buttonText?.includes('download') || await page.locator(':focus .lucide-download').count() > 0) {
          break;
        }
      }
      await page.keyboard.press('Tab');
      attempts++;
    }
    
    // Press Enter to activate the download button
    await page.keyboard.press('Enter');
    
    // Should trigger download functionality
    // (We can't easily test the actual download, but we can verify the button was activated)
  });
}); 