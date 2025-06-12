const { describe, test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Codebase Cleanup Verification', () => {
  
  describe('Removed code should not exist', () => {
    test('python-pdf-service directory should not exist', () => {
      const pythonServicePath = path.join(process.cwd(), 'python-pdf-service');
      expect(fs.existsSync(pythonServicePath)).toBe(false);
    });

    test('processors directory should not exist', () => {
      const processorsPath = path.join(process.cwd(), 'nextjs/src/lib/processors');
      expect(fs.existsSync(processorsPath)).toBe(false);
    });

    test('reconcile-simple API route should not exist', () => {
      const reconcileSimplePath = path.join(process.cwd(), 'nextjs/src/app/api/reconcile-simple/route.ts');
      expect(fs.existsSync(reconcileSimplePath)).toBe(false);
    });

    test('InvoiceManager component should not exist', () => {
      const invoiceManagerPath = path.join(process.cwd(), 'nextjs/src/components/InvoiceReconciler/InvoiceManager.tsx');
      expect(fs.existsSync(invoiceManagerPath)).toBe(false);
    });

    test('duplicateDetection utility should not exist', () => {
      const duplicateDetectionPath = path.join(process.cwd(), 'nextjs/src/lib/fileUtils/duplicateDetection.ts');
      expect(fs.existsSync(duplicateDetectionPath)).toBe(false);
    });
  });

  describe('No references to removed code in existing files', () => {
    test('should not have FlyDubaiProcessor imports in existing files', async () => {
      const searchDir = path.join(process.cwd(), 'nextjs/src');
      const hasReferences = await searchForPattern(searchDir, /FlyDubaiProcessor/);
      expect(hasReferences).toBe(false);
    });

    test('should not have python-pdf-service references in existing files', async () => {
      const searchDir = process.cwd();
      const hasReferences = await searchForPattern(
        searchDir, 
        /python-pdf-service/,
        ['tasks/', 'docs/', 'test-results/'] // Allow in documentation
      );
      expect(hasReferences).toBe(false);
    });

    test('should not have processors/ directory references in source code', async () => {
      const searchDir = path.join(process.cwd(), 'nextjs/src');
      const hasReferences = await searchForPattern(searchDir, /processors\//);
      expect(hasReferences).toBe(false);
    });

    test('should not have reconcile-simple references in source code', async () => {
      const searchDir = path.join(process.cwd(), 'nextjs/src');
      const hasReferences = await searchForPattern(searchDir, /reconcile-simple/);
      expect(hasReferences).toBe(false);
    });

    test('should not have InvoiceManager imports in existing files', async () => {
      const searchDir = path.join(process.cwd(), 'nextjs/src');
      const hasReferences = await searchForPattern(searchDir, /InvoiceManager/);
      expect(hasReferences).toBe(false);
    });

    test('should not have duplicateDetection imports in existing files', async () => {
      const searchDir = path.join(process.cwd(), 'nextjs/src');
      const hasReferences = await searchForPattern(searchDir, /duplicateDetection/);
      expect(hasReferences).toBe(false);
    });
  });

  describe('Essential files still exist', () => {
    test('main Next.js app structure should exist', () => {
      const appPath = path.join(process.cwd(), 'nextjs/src/app');
      expect(fs.existsSync(appPath)).toBe(true);
    });

    test('Supabase configuration should exist', () => {
      const supabasePath = path.join(process.cwd(), 'nextjs/src/lib/supabase');
      expect(fs.existsSync(supabasePath)).toBe(true);
    });

    test('UI components should exist', () => {
      const componentsPath = path.join(process.cwd(), 'nextjs/src/components');
      expect(fs.existsSync(componentsPath)).toBe(true);
    });

    test('package.json should exist and be valid', () => {
      const packagePath = path.join(process.cwd(), 'nextjs/package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      expect(() => JSON.parse(packageContent)).not.toThrow();
    });
  });

  describe('Core functionality requirements', () => {
    test('authentication routes should exist', () => {
      const authPath = path.join(process.cwd(), 'nextjs/src/app/auth');
      expect(fs.existsSync(authPath)).toBe(true);
    });

    test('dashboard components should exist', () => {
      const dashboardPath = path.join(process.cwd(), 'nextjs/src/components/Dashboard');
      expect(fs.existsSync(dashboardPath)).toBe(true);
    });

    test('Supabase migrations should exist', () => {
      const migrationsPath = path.join(process.cwd(), 'supabase/migrations');
      expect(fs.existsSync(migrationsPath)).toBe(true);
    });
  });

  describe('Test files cleanup', () => {
    test('processor test files should not exist', () => {
      const testPaths = [
        'nextjs/test-awb-extraction.mjs',
        'nextjs/test-direct-awb-extraction.ts',
        'nextjs/tests/unit/processors/test-fly-dubai-extraction.test.ts',
        'nextjs/tests/unit/processors/test-pdf-only-extraction.test.ts',
        'nextjs/tests/unit/components/InvoiceReconciler/InvoiceManager.test.tsx'
      ];

      testPaths.forEach(testPath => {
        const fullPath = path.join(process.cwd(), testPath);
        expect(fs.existsSync(fullPath)).toBe(false);
      });
    });
  });
});

// Helper function to search for patterns in files
async function searchForPattern(dir, pattern, allowedDirs = []) {
  if (!fs.existsSync(dir)) {
    return false;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip if this is an allowed directory (like docs or tasks)
      const relativePath = path.relative(process.cwd(), fullPath);
      const isAllowed = allowedDirs.some(allowedDir => 
        relativePath.includes(allowedDir) || 
        relativePath.startsWith(allowedDir)
      );
      
      if (!isAllowed) {
        const found = await searchForPattern(fullPath, pattern, allowedDirs);
        if (found) return true;
      }
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (pattern.test(content)) {
          console.log(`Found pattern in: ${fullPath}`);
          return true;
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }
  
  return false;
} 