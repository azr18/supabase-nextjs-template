import { test, expect } from '@playwright/test';

test.describe('Multi-Factor Authentication (MFA)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase responses for consistent testing
    await page.route('**/auth/v1/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      // Mock successful authentication
      if (url.includes('/token') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock_access_token',
            user: { 
              id: 'mock_user_id', 
              email: 'test@example.com',
              aal: 'aal1'
            }
          })
        });
        return;
      }
      
      // Mock user session
      if (url.includes('/user') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { 
              id: 'mock_user_id', 
              email: 'test@example.com'
            }
          })
        });
        return;
      }
      
      // Continue with actual request for other routes
      await route.continue();
    });
  });

  test.describe('MFA Setup in User Settings', () => {
    test('displays MFA setup section in user settings', async ({ page }) => {
      // Navigate to user settings
      await page.goto('/app/user-settings');
      
      // Check for MFA section
      await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
      await expect(page.locator('text=Add an additional layer of security')).toBeVisible();
    });

    test('shows empty state when no MFA factors exist', async ({ page }) => {
      // Mock empty MFA factors list
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            all: [],
            totp: []
          })
        });
      });

      await page.goto('/app/user-settings');
      
      // Check empty state message
      await expect(page.locator('text=Protect your account with two-factor authentication')).toBeVisible();
      await expect(page.locator('text=Add New Authentication Method')).toBeVisible();
    });

    test('displays existing MFA factors when they exist', async ({ page }) => {
      // Mock existing MFA factor
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            all: [{
              id: 'factor-123',
              friendly_name: 'My Authenticator App',
              factor_type: 'totp',
              status: 'verified',
              created_at: '2024-01-01T00:00:00Z'
            }],
            totp: [{
              id: 'factor-123',
              friendly_name: 'My Authenticator App',
              factor_type: 'totp',
              status: 'verified',
              created_at: '2024-01-01T00:00:00Z'
            }]
          })
        });
      });

      await page.goto('/app/user-settings');
      
      // Check existing factor display
      await expect(page.locator('text=My Authenticator App')).toBeVisible();
      await expect(page.locator('text=Verified')).toBeVisible();
    });
  });

  test.describe('MFA Enrollment Process', () => {
    test('completes MFA enrollment flow successfully', async ({ page }) => {
      // Mock empty factors initially
      await page.route('**/auth/v1/factors**', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: [],
              totp: []
            })
          });
        } else {
          await route.continue();
        }
      });

      // Mock enrollment endpoint
      await page.route('**/auth/v1/factors**', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'factor-123',
              totp: {
                qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
              }
            })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/app/user-settings');
      
      // Start enrollment
      await page.click('text=Add New Authentication Method');
      
      // Fill in friendly name
      await page.fill('input[placeholder*="Enter a name"]', 'My Test Authenticator');
      await page.click('text=Continue');
      
      // Check QR code display
      await expect(page.locator('text=Scan this QR code')).toBeVisible();
      await expect(page.locator('img')).toBeVisible(); // QR code image
    });

    test('validates friendly name input', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            all: [],
            totp: []
          })
        });
      });

      await page.goto('/app/user-settings');
      
      // Start enrollment without name
      await page.click('text=Add New Authentication Method');
      await page.click('text=Continue');
      
      // Check validation error
      await expect(page.locator('text=Please provide a name')).toBeVisible();
    });

    test('handles enrollment errors gracefully', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: [],
              totp: []
            })
          });
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                message: 'Enrollment failed'
              }
            })
          });
        }
      });

      await page.goto('/app/user-settings');
      
      await page.click('text=Add New Authentication Method');
      await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
      await page.click('text=Continue');
      
      // Check error handling
      await expect(page.locator('text=Enrollment failed')).toBeVisible();
    });
  });

  test.describe('MFA Verification Process', () => {
    test('completes MFA verification successfully', async ({ page }) => {
      // Mock enrollment and challenge/verify endpoints
      let enrollmentCompleted = false;
      
      await page.route('**/auth/v1/factors**', async route => {
        const method = route.request().method();
        
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: enrollmentCompleted ? [{
                id: 'factor-123',
                friendly_name: 'Test Device',
                factor_type: 'totp',
                status: 'verified',
                created_at: '2024-01-01T00:00:00Z'
              }] : [],
              totp: enrollmentCompleted ? [{
                id: 'factor-123',
                friendly_name: 'Test Device',
                factor_type: 'totp',
                status: 'verified',
                created_at: '2024-01-01T00:00:00Z'
              }] : []
            })
          });
        } else if (method === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'factor-123',
              totp: {
                qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
              }
            })
          });
        }
      });

      // Mock challenge endpoint
      await page.route('**/auth/v1/factors/*/challenge**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'challenge-123'
          })
        });
      });

      // Mock verify endpoint
      await page.route('**/auth/v1/factors/*/verify**', async route => {
        enrollmentCompleted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'verified_token'
          })
        });
      });

      await page.goto('/app/user-settings');
      
      // Complete enrollment flow
      await page.click('text=Add New Authentication Method');
      await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
      await page.click('text=Continue');
      
      // Enter verification code
      await page.fill('input[placeholder*="Enter 6-digit code"]', '123456');
      await page.click('text=Verify and Complete Setup');
      
      // Check success
      await expect(page.locator('text=Test Device')).toBeVisible();
    });

    test('handles verification errors', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'factor-123',
              totp: {
                qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
              }
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: [],
              totp: []
            })
          });
        }
      });

      await page.route('**/auth/v1/factors/*/challenge**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'challenge-123'
          })
        });
      });

      await page.route('**/auth/v1/factors/*/verify**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Invalid verification code'
            }
          })
        });
      });

      await page.goto('/app/user-settings');
      
      await page.click('text=Add New Authentication Method');
      await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
      await page.click('text=Continue');
      
      await page.fill('input[placeholder*="Enter 6-digit code"]', '000000');
      await page.click('text=Verify and Complete Setup');
      
      // Check error message
      await expect(page.locator('text=Invalid verification code')).toBeVisible();
    });
  });

  test.describe('MFA Factor Management', () => {
    test('allows removal of existing MFA factors', async ({ page }) => {
      let factorsExist = true;
      
      await page.route('**/auth/v1/factors**', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: factorsExist ? [{
                id: 'factor-123',
                friendly_name: 'My Device',
                factor_type: 'totp',
                status: 'verified',
                created_at: '2024-01-01T00:00:00Z'
              }] : [],
              totp: factorsExist ? [{
                id: 'factor-123',
                friendly_name: 'My Device',
                factor_type: 'totp',
                status: 'verified',
                created_at: '2024-01-01T00:00:00Z'
              }] : []
            })
          });
        }
      });

      // Mock unenroll endpoint
      await page.route('**/auth/v1/factors/*/unenroll**', async route => {
        factorsExist = false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      });

      await page.goto('/app/user-settings');
      
      // Check existing factor
      await expect(page.locator('text=My Device')).toBeVisible();
      
      // Remove factor
      await page.click('text=Remove');
      
      // Verify removal
      await expect(page.locator('text=Add New Authentication Method')).toBeVisible();
    });
  });

  test.describe('MFA Authentication Flow', () => {
    test('redirects to 2FA page when MFA is required', async ({ page }) => {
      // Mock login that requires MFA
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock_token',
            user: {
              id: 'user_id',
              email: 'test@example.com'
            }
          })
        });
      });

      // Mock AAL check showing MFA required
      await page.route('**/auth/v1/factors/*/challenge**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            aal1: { id: 'aal1' },
            aal2: { id: 'aal2' },
            nextLevel: 'aal2',
            currentLevel: 'aal1'
          })
        });
      });

      await page.goto('/auth/login');
      
      // Login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      // Should redirect to 2FA
      await expect(page).toHaveURL(/.*\/auth\/2fa/);
    });

    test('displays MFA verification page correctly', async ({ page }) => {
      // Mock MFA factors for verification
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totp: [{
              id: 'factor-123',
              friendly_name: 'My Authenticator',
              factor_type: 'totp',
              status: 'verified',
              created_at: '2024-01-01T00:00:00Z'
            }]
          })
        });
      });

      await page.goto('/auth/2fa');
      
      // Check 2FA page elements
      await expect(page.locator('text=Two-Factor Authentication Required')).toBeVisible();
      await expect(page.locator('text=Please enter the verification code')).toBeVisible();
      await expect(page.locator('input[placeholder*="Enter 6-digit code"]')).toBeVisible();
    });

    test('completes MFA verification during login', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totp: [{
              id: 'factor-123',
              friendly_name: 'My Authenticator',
              factor_type: 'totp',
              status: 'verified',
              created_at: '2024-01-01T00:00:00Z'
            }]
          })
        });
      });

      await page.route('**/auth/v1/factors/*/challenge**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'challenge-123'
          })
        });
      });

      await page.route('**/auth/v1/factors/*/verify**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'verified_token'
          })
        });
      });

      await page.goto('/auth/2fa');
      
      // Enter verification code
      await page.fill('input[placeholder*="Enter 6-digit code"]', '123456');
      await page.click('button:has-text("Verify")');
      
      // Should redirect to app
      await expect(page).toHaveURL(/.*\/app/);
    });
  });

  test.describe('MFA Accessibility and UX', () => {
    test('has proper accessibility attributes', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            all: [],
            totp: []
          })
        });
      });

      await page.goto('/app/user-settings');
      
      // Check accessibility features
      const mfaSection = page.locator('text=Two-Factor Authentication (2FA)').locator('..');
      await expect(mfaSection).toBeVisible();
      
      // Check for proper heading structure
      await expect(page.locator('h1, h2, h3').filter({ hasText: 'User Settings' })).toBeVisible();
    });

    test('provides clear user feedback during operations', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        const method = route.request().method();
        
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              all: [],
              totp: []
            })
          });
        } else if (method === 'POST') {
          // Simulate slow enrollment
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'factor-123',
              totp: {
                qr_code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
              }
            })
          });
        }
      });

      await page.goto('/app/user-settings');
      
      await page.click('text=Add New Authentication Method');
      await page.fill('input[placeholder*="Enter a name"]', 'Test Device');
      await page.click('text=Continue');
      
      // Check loading state
      await expect(page.locator('text=Processing')).toBeVisible();
    });

    test('displays responsive design across device sizes', async ({ page }) => {
      await page.route('**/auth/v1/factors**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            all: [],
            totp: []
          })
        });
      });

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/app/user-settings');
      
      await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/app/user-settings');
      
      await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible();
    });
  });
}); 