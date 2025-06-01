/**
 * Unit tests for File Hash Generation Utility
 */

const { describe, test, expect, beforeEach, afterEach, jest: jestGlobal } = require('@jest/globals');

// Import the functions to test
// Note: Using require for consistency with existing test patterns
const {
  generateFileHash,
  generateFileIdentifiers,
  generateQuickFileHash,
  isValidSHA256Hash,
  compareFileIdentifiers,
  formatFileSize,
  HashGenerationError
} = require('../../../../nextjs/src/lib/fileUtils/hashGenerator.js');

// Mock crypto.subtle for testing environment
const mockCrypto = {
  subtle: {
    digest: jestGlobal.fn()
  }
};

// Setup global crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('Hash Generation Utility', () => {
  // Mock file creation helper
  const createMockFile = (
    content,
    filename = 'test.pdf',
    type = 'application/pdf',
    lastModified = Date.now()
  ) => {
    const contentBuffer = new TextEncoder().encode(content);
    const blob = new Blob([content], { type });
    const file = new File([blob], filename, { type, lastModified });
    
    // Mock arrayBuffer method
    Object.defineProperty(file, 'arrayBuffer', {
      value: jestGlobal.fn().mockResolvedValue(contentBuffer.buffer),
      writable: true
    });
    
    // Mock slice method for quick hash testing
    Object.defineProperty(file, 'slice', {
      value: jestGlobal.fn((start, end) => {
        const slicedContent = content.slice(start, end);
        const slicedContentBuffer = new TextEncoder().encode(slicedContent);
        const slicedBlob = new Blob([slicedContent], { type });
        const slicedFile = new File([slicedBlob], filename, { type, lastModified });
        Object.defineProperty(slicedFile, 'arrayBuffer', {
          value: jestGlobal.fn().mockResolvedValue(slicedContentBuffer.buffer),
          writable: true
        });
        return slicedFile;
      }),
      writable: true
    });
    
    return file;
  };

  beforeEach(() => {
    jestGlobal.clearAllMocks();
    
    // Mock crypto.subtle.digest to return a consistent hash based on input
    mockCrypto.subtle.digest.mockImplementation((algorithm, data) => {
      // Create a hash based on the actual data content for more realistic testing
      const dataArray = new Uint8Array(data);
      const mockHash = new Uint8Array(32); // SHA-256 is 32 bytes
      
      // Fill with values based on input content to ensure different content = different hash
      let seed = 0;
      for (let i = 0; i < dataArray.length; i++) {
        seed += dataArray[i];
      }
      
      for (let i = 0; i < 32; i++) {
        mockHash[i] = (seed + i * dataArray.length) % 256;
      }
      
      return Promise.resolve(mockHash.buffer);
    });
  });

  describe('generateFileHash', () => {
    test('should generate a SHA-256 hash for a file', async () => {
      const file = createMockFile('test content');
      
      const hash = await generateFileHash(file);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64); // SHA-256 hash is 64 hex characters
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.anything());
      expect(mockCrypto.subtle.digest).toHaveBeenCalledTimes(1);
    });

    test('should generate consistent hashes for identical content', async () => {
      const file1 = createMockFile('identical content');
      const file2 = createMockFile('identical content');
      
      const hash1 = await generateFileHash(file1);
      const hash2 = await generateFileHash(file2);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different content', async () => {
      const file1 = createMockFile('content one');
      const file2 = createMockFile('content two');
      
      const hash1 = await generateFileHash(file1);
      const hash2 = await generateFileHash(file2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty files', async () => {
      const file = createMockFile('');
      
      const hash = await generateFileHash(file);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    test('should throw error when file reading fails', async () => {
      const file = createMockFile('test content');
      file.arrayBuffer = jestGlobal.fn().mockRejectedValue(new Error('File read error'));
      
      await expect(generateFileHash(file)).rejects.toThrow('Failed to generate hash for file: test.pdf');
    });

    test('should throw error when crypto operation fails', async () => {
      const file = createMockFile('test content');
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Crypto error'));
      
      await expect(generateFileHash(file)).rejects.toThrow('Failed to generate hash for file: test.pdf');
    });
  });

  describe('generateFileIdentifiers', () => {
    test('should generate complete file identifiers', async () => {
      const lastModified = Date.now();
      const file = createMockFile('test content', 'invoice.pdf', 'application/pdf', lastModified);
      
      const identifiers = await generateFileIdentifiers(file);
      
      expect(identifiers).toEqual({
        hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        filename: 'invoice.pdf',
        size: file.size,
        type: 'application/pdf',
        lastModified
      });
    });

    test('should include hash from generateFileHash', async () => {
      const file = createMockFile('test content');
      
      const identifiers = await generateFileIdentifiers(file);
      const directHash = await generateFileHash(file);
      
      expect(identifiers.hash).toBe(directHash);
    });

    test('should handle file identifier generation errors', async () => {
      const file = createMockFile('test content');
      file.arrayBuffer = jestGlobal.fn().mockRejectedValue(new Error('File error'));
      
      await expect(generateFileIdentifiers(file)).rejects.toThrow('Failed to generate identifiers for file: test.pdf');
    });
  });

  describe('generateQuickFileHash', () => {
    test('should use full hash for small files', async () => {
      const file = createMockFile('small content'); // Less than 64KB
      
      const quickHash = await generateQuickFileHash(file);
      const fullHash = await generateFileHash(file);
      
      expect(quickHash).toBe(fullHash);
    });

    test('should use sampling for large files', async () => {
      // Create a large file content (more than 64KB)
      const largeContent = 'x'.repeat(100 * 1024); // 100KB
      const file = createMockFile(largeContent);
      
      const quickHash = await generateQuickFileHash(file);
      
      expect(quickHash).toBeDefined();
      expect(quickHash).toHaveLength(64);
      expect(file.slice).toHaveBeenCalledTimes(3); // Beginning, middle, end chunks
    });

    test('should use custom sample size', async () => {
      const largeContent = 'x'.repeat(200 * 1024); // 200KB
      const file = createMockFile(largeContent);
      const customSampleSize = 32 * 1024; // 32KB
      
      await generateQuickFileHash(file, customSampleSize);
      
      expect(file.slice).toHaveBeenCalledTimes(3);
      // Each chunk should be 32KB / 3 ≈ 10.67KB
      const expectedChunkSize = Math.floor(customSampleSize / 3);
      expect(file.slice).toHaveBeenCalledWith(0, expectedChunkSize);
    });

    test('should handle quick hash generation errors', async () => {
      const file = createMockFile('test content');
      // Mock slice to throw an error when called
      file.slice = jestGlobal.fn().mockImplementation(() => {
        throw new Error('Slice error');
      });
      
      // For small files, the function uses the full file, not slicing
      // So let's make it a large file to trigger slicing
      Object.defineProperty(file, 'size', {
        value: 100 * 1024, // 100KB to trigger slicing
        writable: true
      });
      
      await expect(generateQuickFileHash(file)).rejects.toThrow('Failed to generate quick hash for file: test.pdf');
    });
  });

  describe('isValidSHA256Hash', () => {
    test('should validate correct SHA-256 hash format', () => {
      const validHash = 'a'.repeat(64); // 64 hex characters
      
      expect(isValidSHA256Hash(validHash)).toBe(true);
    });

    test('should validate mixed case hex characters', () => {
      const validHash = 'A1b2C3d4'.repeat(8); // 64 mixed case hex characters
      
      expect(isValidSHA256Hash(validHash)).toBe(true);
    });

    test('should reject hash with wrong length', () => {
      const shortHash = 'a'.repeat(32); // Too short
      const longHash = 'a'.repeat(128); // Too long
      
      expect(isValidSHA256Hash(shortHash)).toBe(false);
      expect(isValidSHA256Hash(longHash)).toBe(false);
    });

    test('should reject hash with invalid characters', () => {
      const invalidHash = 'g'.repeat(64); // 'g' is not a hex character
      
      expect(isValidSHA256Hash(invalidHash)).toBe(false);
    });

    test('should reject empty or null hash', () => {
      expect(isValidSHA256Hash('')).toBe(false);
      expect(isValidSHA256Hash(null)).toBe(false);
      expect(isValidSHA256Hash(undefined)).toBe(false);
    });
  });

  describe('compareFileIdentifiers', () => {
    const baseIdentifiers = {
      hash: 'a'.repeat(64),
      filename: 'test.pdf',
      size: 1024,
      type: 'application/pdf',
      lastModified: 1234567890
    };

    test('should return true for identical hashes', () => {
      const identifiers1 = { ...baseIdentifiers };
      const identifiers2 = { ...baseIdentifiers, filename: 'different.pdf' }; // Different filename but same hash
      
      expect(compareFileIdentifiers(identifiers1, identifiers2)).toBe(true);
    });

    test('should return true for identical metadata when hashes differ', () => {
      const identifiers1 = { ...baseIdentifiers, hash: 'a'.repeat(64) };
      const identifiers2 = { ...baseIdentifiers, hash: 'b'.repeat(64) };
      
      expect(compareFileIdentifiers(identifiers1, identifiers2)).toBe(true);
    });

    test('should return false for different files', () => {
      const identifiers1 = { ...baseIdentifiers };
      const identifiers2 = { ...baseIdentifiers, size: 2048, hash: 'b'.repeat(64) };
      
      expect(compareFileIdentifiers(identifiers1, identifiers2)).toBe(false);
    });

    test('should handle partial differences correctly', () => {
      const identifiers1 = { ...baseIdentifiers };
      const identifiers2 = { ...baseIdentifiers, lastModified: 9876543210, hash: 'b'.repeat(64) };
      
      expect(compareFileIdentifiers(identifiers1, identifiers2)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    test('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048575)).toBe('1024 KB');
    });

    test('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
    });

    test('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    test('should format terabytes correctly', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB');
    });
  });

  describe('HashGenerationError', () => {
    test('should create error with message', () => {
      const error = new HashGenerationError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('HashGenerationError');
      expect(error.fileName).toBeUndefined();
    });

    test('should create error with message and filename', () => {
      const error = new HashGenerationError('Test error', 'test.pdf');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('HashGenerationError');
      expect(error.fileName).toBe('test.pdf');
    });

    test('should be instance of Error', () => {
      const error = new HashGenerationError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HashGenerationError);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete workflow for duplicate detection', async () => {
      const content = 'invoice content for duplicate detection';
      const file1 = createMockFile(content, 'invoice1.pdf');
      const file2 = createMockFile(content, 'invoice2.pdf'); // Same content, different name
      
      const identifiers1 = await generateFileIdentifiers(file1);
      const identifiers2 = await generateFileIdentifiers(file2);
      
      expect(compareFileIdentifiers(identifiers1, identifiers2)).toBe(true);
      expect(isValidSHA256Hash(identifiers1.hash)).toBe(true);
      expect(isValidSHA256Hash(identifiers2.hash)).toBe(true);
    });

    test('should handle large file quick hash workflow', async () => {
      const largeContent = 'large file content '.repeat(10000); // Create large content
      const file = createMockFile(largeContent);
      
      const quickHash = await generateQuickFileHash(file);
      const identifiers = await generateFileIdentifiers(file);
      
      expect(isValidSHA256Hash(quickHash)).toBe(true);
      expect(isValidSHA256Hash(identifiers.hash)).toBe(true);
      expect(formatFileSize(file.size)).toContain('KB');
    });
  });
}); 