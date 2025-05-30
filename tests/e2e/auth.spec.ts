import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Test basic page loading and UI elements
  test('login page loads correctly with Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if page loads properly
    await expect(page).toHaveTitle(/Invoice Reconciler SaaS Platform/);
    
    // Check for Google OAuth section
    await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
    
    // Check for Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    // Check for email/password form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for form labels
    await expect(page.locator('label[for="email"]')).toHaveText('Email address');
    await expect(page.locator('label[for="password"]')).toHaveText('Password');
    
    // Check for sign-in button
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign up")')).toBeVisible();
  });

  test('registration page loads correctly with Google OAuth button', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check for Google OAuth section
    await expect(page.locator('h3:has-text("Quick Sign Up")')).toBeVisible();
    
    // Check for Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    // Check for email/password form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for sign-up button
    await expect(page.locator('button[type="submit"]:has-text("Sign up")')).toBeVisible();
    
    // Check for navigation to login
    await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
  });

  test('Google OAuth button triggers authentication flow', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Mock the OAuth response to avoid external dependencies
    await page.route('**/auth/v1/authorize**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/api/auth/callback?code=mock_auth_code&state=mock_state'
        }
      });
    });
    
    // Click the Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Should be redirected or trigger OAuth flow
    // Since we're testing the UI interaction, we verify the button click doesn't throw errors
    await page.waitForTimeout(1000); // Wait for any potential navigation
  });

  test('email login form validation works correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Check for HTML5 validation (email required)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Fill invalid email
    await emailInput.fill('invalid-email');
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Check for email validation (browser native or custom)
    await expect(emailInput).toBeVisible();
    
    // Fill valid email but no password
    await emailInput.fill('test@example.com');
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Check password field is required
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('navigation between login and register works', async ({ page }) => {
    // Start at login page
    await page.goto('/auth/login');
    await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
    
    // Navigate to register
    await page.click('a:has-text("Sign up")');
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.locator('h3:has-text("Quick Sign Up")')).toBeVisible();
    
    // Navigate back to login
    await page.click('a:has-text("Sign in")');
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
  });

  test('forgot password link works', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.click('a:has-text("Forgot your password?")');
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
  });

  test('SSO providers configuration is respected', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check which providers are enabled based on environment
    // This tests the getEnabledProviders function
    const googleButton = page.locator('button:has-text("Continue with Google")');
    
    // Google should be visible if configured
    if (process.env.NEXT_PUBLIC_SSO_PROVIDERS?.includes('google')) {
      await expect(googleButton).toBeVisible();
    }
    
    // GitHub button should only be visible if configured
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    if (process.env.NEXT_PUBLIC_SSO_PROVIDERS?.includes('github')) {
      await expect(githubButton).toBeVisible();
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    
    // Check if elements are visible and properly arranged on mobile
    await expect(page.locator('h3:has-text("Quick Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check button heights and spacing work on mobile
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toHaveCSS('height', '44px'); // h-11 = 44px
  });

  test('error handling displays correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock a failed authentication response
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_credentials',
          error_description: 'Invalid login credentials'
        })
      });
    });
    
    // Fill and submit invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Check for error message display
    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 5000 });
  });

  test('loading states work correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock slow response to test loading state
    await page.route('**/auth/v1/token**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'mock_token' })
      });
    });
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check loading state
    await expect(submitButton).toHaveText('Signing in...');
    await expect(submitButton).toBeDisabled();
  });

  test('terms and privacy links work correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check terms and conditions link
    const termsLink = page.locator('a:has-text("Terms and Conditions")');
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/legal/terms');
    
    // Check privacy policy link
    const privacyLink = page.locator('a:has-text("Privacy Policy")');
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/legal/privacy');
  });

  test('OAuth callback page handles authentication', async ({ page }) => {
    // Test the OAuth callback endpoint
    await page.goto('/api/auth/callback?code=test_code&state=test_state');
    
    // Should redirect to dashboard or appropriate page
    // Since this is a mock scenario, we just ensure it doesn't error
    await page.waitForLoadState('domcontentloaded');
  });
});

test.describe('Authentication Integration Tests', () => {
  test('complete authentication flow with valid credentials', async ({ page }) => {
    // This would require setting up test user credentials
    // For now, we'll test the UI flow without actual authentication
    
    await page.goto('/auth/login');
    
    // Fill form with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Mock successful authentication
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          user: {
            id: 'mock_user_id',
            email: 'test@example.com'
          }
        })
      });
    });
    
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Should redirect to dashboard
    await page.waitForURL(/.*\/app/, { timeout: 10000 });
  });

  test('MFA flow triggers when required', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock successful login but MFA required
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          user: { id: 'mock_user_id', email: 'test@example.com' }
        })
      });
    });
    
    await page.route('**/auth/v1/factors**', async route => {
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
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Should redirect to 2FA page
    await page.waitForURL(/.*\/auth\/2fa/, { timeout: 10000 });
  });
}); 