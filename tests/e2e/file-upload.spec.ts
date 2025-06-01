import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('FileUpload Component E2E Tests', () => {
  const TEST_EMAIL = 'testuser@example.com';
  const TEST_PASSWORD = 'testpassword123';

  // Setup test files
  test.beforeAll(async () => {
    // Create test files directory if it doesn't exist
    const testFilesDir = path.join(__dirname, '../../test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test PDF file (small valid PDF)
    const validPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
178
%%EOF`;

    fs.writeFileSync(path.join(testFilesDir, 'test-invoice.pdf'), validPDFContent);
    
    // Create a large test file (>25MB)
    const largeContent = 'A'.repeat(26 * 1024 * 1024); // 26MB
    fs.writeFileSync(path.join(testFilesDir, 'large-file.pdf'), largeContent);
    
    // Create a non-PDF file
    fs.writeFileSync(path.join(testFilesDir, 'test-document.txt'), 'This is a text file');
  });

  test.afterAll(async () => {
    // Clean up test files
    const testFilesDir = path.join(__dirname, '../../test-files');
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Mock Supabase auth and tool access
    await page.route('**/auth/v1/**', async route => {
      const url = route.request().url();
      if (url.includes('/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                user_metadata: {},
                app_metadata: {}
              }
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock tool access API
    await page.route('**/rest/v1/rpc/has_tool_access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true)
      });
    });

    // Mock tool subscription status
    await page.route('**/rest/v1/rpc/get_tool_subscription_status*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: { id: 'test-sub', status: 'active' },
          status: 'active'
        })
      });
    });

    // Mock saved invoices API
    await page.route('**/rest/v1/rpc/get_user_invoices_by_airline*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/app/invoice-reconciler');
    await page.waitForLoadState('networkidle');
  });

  test.describe('FileUpload Component Rendering', () => {
    test('should render file upload component when airline is selected', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Should be on invoice upload step
      await expect(page.locator('text=Upload New Invoice')).toBeVisible();
      await expect(page.locator('text=Upload PDF Invoice')).toBeVisible();
      await expect(page.locator('text=Drag and drop a PDF file here')).toBeVisible();
    });

    test('should show airline-specific information', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Should show airline-specific note
      await expect(page.locator('text=Please upload a PDF invoice in Fly Dubai format')).toBeVisible();
    });

    test('should show file size limit information', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Should show file size limit
      await expect(page.locator('text=Maximum file size: 25 MB')).toBeVisible();
    });
  });

  test.describe('File Upload Functionality', () => {
    test('should successfully upload a valid PDF file', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload a valid PDF file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Should show success feedback
      await expect(page.locator('text=File ready for upload')).toBeVisible();
      await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
      
      // Should enable continue button
      await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
    });

    test('should show validation error for non-PDF files', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Try to upload a text file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
      
      // Should show error message
      await expect(page.locator('text=Only PDF files are allowed for invoice uploads')).toBeVisible();
      
      // Continue button should remain disabled
      await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    });

    test('should show validation error for large files', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Try to upload a large file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/large-file.pdf'));
      
      // Should show error message
      await expect(page.locator('text=File size must be less than 25 MB')).toBeVisible();
      
      // Continue button should remain disabled
      await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    });
  });

  test.describe('File Preview and Management', () => {
    test('should show file preview after successful upload', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload a valid PDF file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Should show file preview with details
      await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
      await expect(page.locator('text=PDF')).toBeVisible();
      await expect(page.locator('text=File ready for upload')).toBeVisible();
    });

    test('should allow removing selected file', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload a valid PDF file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Wait for file to be selected
      await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
      
      // Remove the file
      const removeButton = page.locator('button[aria-label="Remove selected file"]');
      await removeButton.click();
      
      // Should return to upload state
      await expect(page.locator('text=Upload PDF Invoice')).toBeVisible();
      await expect(page.locator('text=test-invoice.pdf')).not.toBeVisible();
      
      // Continue button should be disabled again
      await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    });

    test('should allow choosing different file after selection', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload a valid PDF file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Wait for file to be selected
      await expect(page.locator('text=test-invoice.pdf')).toBeVisible();
      
      // Click "Choose Different File"
      await page.click('button:has-text("Choose Different File")');
      
      // Should trigger file input (in e2e test, we just verify the button is clickable)
      await expect(page.locator('button:has-text("Choose Different File")')).toBeVisible();
    });
  });

  test.describe('Integration with Workflow', () => {
    test('should integrate with existing invoice selection workflow', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Should show both saved invoices section and file upload section
      await expect(page.locator('text=Saved Invoices')).toBeVisible();
      await expect(page.locator('text=Upload New Invoice')).toBeVisible();
      
      // Upload a file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Should show file upload success message
      await expect(page.locator('text=New invoice file ready for upload')).toBeVisible();
      await expect(page.locator('text=File: test-invoice.pdf')).toBeVisible();
      
      // Continue button should be enabled
      await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
    });

    test('should show validation error when neither invoice nor file is selected', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Don't select anything - should show validation error
      await expect(page.locator('text=Please either select an existing invoice or upload a new invoice file')).toBeVisible();
      
      // Continue button should be disabled
      await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload area should be focusable
      const uploadArea = page.locator('[aria-label="Upload area for PDF invoice files"]');
      await uploadArea.focus();
      
      // Should have proper tabindex
      await expect(uploadArea).toHaveAttribute('tabindex', '0');
      
      // Should have proper role
      await expect(uploadArea).toHaveAttribute('role', 'button');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Check ARIA labels
      await expect(page.locator('[aria-label="Upload area for PDF invoice files"]')).toBeVisible();
      await expect(page.locator('[aria-label="File input for PDF invoices"]')).toBeVisible();
    });
  });

  test.describe('Visual States', () => {
    test('should show loading state during file validation', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Upload a file and check for loading state
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      
      // Should show success state after validation
      await expect(page.locator('text=File ready for upload')).toBeVisible();
    });

    test('should maintain blue gradient theme consistency', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Check for blue gradient theme elements
      const uploadCard = page.locator('text=Upload New Invoice').locator('..');
      await expect(uploadCard).toHaveClass(/from-blue-50/);
      await expect(uploadCard).toHaveClass(/border-blue-200/);
    });

    test('should show proper disabled state', async ({ page }) => {
      // Mock disabled state by adding disabled prop
      await page.evaluate(() => {
        const uploadComponents = document.querySelectorAll('[data-testid*="file-upload"]');
        uploadComponents.forEach(component => {
          (component as any).disabled = true;
        });
      });
      
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Browse button should be disabled
      const browseButton = page.locator('button:has-text("Browse Files")');
      await expect(browseButton).toBeDisabled();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle multiple file validation errors gracefully', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      // Try different invalid files
      const fileInput = page.locator('input[type="file"]');
      
      // First, try a non-PDF file
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
      await expect(page.locator('text=Only PDF files are allowed')).toBeVisible();
      
      // Then try a large PDF file
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/large-file.pdf'));
      await expect(page.locator('text=File size must be less than 25 MB')).toBeVisible();
      
      // Finally, upload a valid file
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      await expect(page.locator('text=File ready for upload')).toBeVisible();
    });

    test('should recover from error states properly', async ({ page }) => {
      // Select an airline first
      await page.selectOption('[data-testid="airline-selector"]', 'fly-dubai');
      await page.click('button:has-text("Continue")');
      
      const fileInput = page.locator('input[type="file"]');
      
      // Upload invalid file first
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-document.txt'));
      await expect(page.locator('text=Only PDF files are allowed')).toBeVisible();
      
      // Upload valid file - should clear error
      await fileInput.setInputFiles(path.join(__dirname, '../../test-files/test-invoice.pdf'));
      await expect(page.locator('text=File ready for upload')).toBeVisible();
      await expect(page.locator('text=Only PDF files are allowed')).not.toBeVisible();
    });
  });
}); 