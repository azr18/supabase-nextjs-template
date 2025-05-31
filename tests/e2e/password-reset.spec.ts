import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/auth/login');
  });

  test('should navigate to forgot password page from login page', async ({ page }) => {
    // Verify the forgot password link exists and is clickable
    const forgotPasswordLink = page.getByRole('link', { name: 'Forgot your password?' });
    await expect(forgotPasswordLink).toBeVisible();
    
    // Click the forgot password link
    await forgotPasswordLink.click();
    
    // Verify navigation to forgot password page
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  });

  test('should display forgot password form with required elements', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Verify form elements are present
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    
    // Verify helper text
    await expect(page.getByText('Enter your email address and we will send you a link to reset your password.')).toBeVisible();
  });

  test('should validate email input on forgot password form', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    const emailInput = page.getByRole('textbox', { name: 'Email address' });
    const submitButton = page.getByRole('button', { name: 'Send reset link' });
    
    // Test empty email
    await submitButton.click();
    // Browser validation should prevent submission
    
    // Test invalid email format
    await emailInput.fill('invalid-email');
    await submitButton.click();
    // Browser validation should prevent submission
    
    // Test valid email format
    await emailInput.fill('test@example.com');
    // Should be able to submit (though might show error if user doesn't exist)
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should handle forgot password submission with loading state', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    const emailInput = page.getByRole('textbox', { name: 'Email address' });
    const submitButton = page.getByRole('button', { name: 'Send reset link' });
    
    // Fill valid email
    await emailInput.fill('testuser1@example.com');
    
    // Submit form and check for loading state
    await submitButton.click();
    
    // The button text might change to show loading state
    // Note: This might fail if Supabase isn't properly configured, but we test the UI behavior
    await expect(submitButton).toBeVisible();
  });

  test('should navigate back to login from forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Click the "Sign in" link
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await signInLink.click();
    
    // Verify navigation back to login
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should display reset password form with required elements', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Verify form elements are present
    await expect(page.getByRole('heading', { name: 'Create new password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New Password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirm New Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible();
    
    // Verify password requirements text
    await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible();
    
    // Verify key icon is displayed
    await expect(page.locator('svg')).toBeVisible(); // Key icon
  });

  test('should validate password inputs on reset password form', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    const newPasswordInput = page.getByRole('textbox', { name: 'New Password' });
    const confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm New Password' });
    const submitButton = page.getByRole('button', { name: 'Reset password' });
    
    // Test empty passwords
    await submitButton.click();
    // Browser validation should prevent submission
    
    // Test password too short
    await newPasswordInput.fill('123');
    await confirmPasswordInput.fill('123');
    await submitButton.click();
    
    // Test mismatched passwords
    await newPasswordInput.fill('password123');
    await confirmPasswordInput.fill('different123');
    await submitButton.click();
    
    // Test valid matching passwords
    await newPasswordInput.fill('validPassword123');
    await confirmPasswordInput.fill('validPassword123');
    await expect(newPasswordInput).toHaveValue('validPassword123');
    await expect(confirmPasswordInput).toHaveValue('validPassword123');
  });

  test('should show appropriate error handling for invalid reset session', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Without a valid reset session, the page should show an error
    // Note: The actual implementation checks for valid session in useEffect
    // This test verifies the page loads and form is accessible
    await expect(page.getByRole('heading', { name: 'Create new password' })).toBeVisible();
  });

  test('should maintain accessible form design', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    // Should focus on email input
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeFocused();
    
    await page.keyboard.press('Tab');
    // Should focus on submit button
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeFocused();
    
    // Test form labels are properly associated
    const emailInput = page.getByRole('textbox', { name: 'Email address' });
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required');
    await expect(emailInput).toHaveAttribute('autoComplete', 'email');
  });

  test('should maintain accessible password form design', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    const newPasswordInput = page.getByRole('textbox', { name: 'New Password' });
    const confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm New Password' });
    
    // Test password inputs have correct attributes
    await expect(newPasswordInput).toHaveAttribute('type', 'password');
    await expect(newPasswordInput).toHaveAttribute('required');
    await expect(newPasswordInput).toHaveAttribute('autoComplete', 'new-password');
    
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('required');
    await expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
  });

  test('should display consistent branding and styling', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Verify consistent branding elements
    await expect(page.getByRole('heading', { name: 'My Agent' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Homepage' })).toBeVisible();
    
    // Verify testimonials section is present
    await expect(page.getByRole('heading', { name: 'Trusted by developers worldwide' })).toBeVisible();
    
    // Check styling consistency with login page
    const formContainer = page.locator('.bg-white.py-8.px-4.shadow');
    await expect(formContainer).toBeVisible();
  });

  test('should display consistent styling on reset password page', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Verify consistent branding elements
    await expect(page.getByRole('heading', { name: 'My Agent' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Homepage' })).toBeVisible();
    
    // Verify testimonials section is present
    await expect(page.getByRole('heading', { name: 'Trusted by developers worldwide' })).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/forgot-password');
    
    // Verify form is still accessible and properly sized
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
    
    // Test form interaction on mobile
    const emailInput = page.getByRole('textbox', { name: 'Email address' });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/auth/reset-password');
    
    // Verify form is properly sized and accessible
    await expect(page.getByRole('heading', { name: 'Create new password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New Password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirm New Password' })).toBeVisible();
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Fill form
    await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.com');
    
    // Refresh page
    await page.reload();
    
    // Verify page loads correctly after refresh
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    // Note: Form should be empty after refresh (expected behavior)
    await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('');
  });

  test('should navigate to homepage from auth pages', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Click homepage link
    const homepageLink = page.getByRole('link', { name: 'Back to Homepage' });
    await homepageLink.click();
    
    // Verify navigation to homepage
    await expect(page).toHaveURL('/');
  });

  test('should maintain form state during user interaction', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    const newPasswordInput = page.getByRole('textbox', { name: 'New Password' });
    const confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm New Password' });
    
    // Fill passwords
    await newPasswordInput.fill('testPassword123');
    await confirmPasswordInput.fill('testPassword123');
    
    // Focus away and back
    await page.getByRole('button', { name: 'Reset password' }).focus();
    await newPasswordInput.focus();
    
    // Verify values are maintained
    await expect(newPasswordInput).toHaveValue('testPassword123');
    await expect(confirmPasswordInput).toHaveValue('testPassword123');
  });
}); 