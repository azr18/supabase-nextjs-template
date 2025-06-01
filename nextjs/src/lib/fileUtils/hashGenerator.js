/**
 * File Hash Generation Utility
 * 
 * Provides SHA-256 hash generation for files to enable duplicate detection
 * and file integrity verification in the invoice reconciler system.
 */

/**
 * Generates a SHA-256 hash for a given file
 * @param {File} file - The File object to generate hash for
 * @returns {Promise<string>} - The SHA-256 hash as a hexadecimal string
 * @throws {Error} if file reading or hashing fails
 */
async function generateFileHash(file) {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Generate SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
    // Convert hash to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating file hash:', error);
    throw new Error(`Failed to generate hash for file: ${file.name}`);
  }
}

/**
 * Generates multiple file identifiers for comprehensive duplicate detection
 * @param {File} file - The File object to generate identifiers for
 * @returns {Promise<Object>} - Object containing hash, filename, size, type, and lastModified
 */
async function generateFileIdentifiers(file) {
  try {
    const hash = await generateFileHash(file);
    
    return {
      hash,
      filename: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  } catch (error) {
    console.error('Error generating file identifiers:', error);
    throw new Error(`Failed to generate identifiers for file: ${file.name}`);
  }
}

/**
 * Generates a quick hash for large files using a sample of the file content
 * This is useful for initial duplicate detection before full hash generation
 * @param {File} file - The File object to generate quick hash for
 * @param {number} sampleSize - Size of sample to use (default: 64KB)
 * @returns {Promise<string>} - The SHA-256 hash of the file sample
 */
async function generateQuickFileHash(file, sampleSize = 64 * 1024) {
  try {
    // For small files, use the entire file
    if (file.size <= sampleSize) {
      return generateFileHash(file);
    }
    
    // For large files, sample from beginning, middle, and end
    const chunkSize = Math.floor(sampleSize / 3);
    const middleStart = Math.floor((file.size - chunkSize) / 2);
    const endStart = file.size - chunkSize;
    
    // Read three chunks
    const beginningChunk = file.slice(0, chunkSize);
    const middleChunk = file.slice(middleStart, middleStart + chunkSize);
    const endChunk = file.slice(endStart, endStart + chunkSize);
    
    // Combine chunks
    const combinedBuffer = new ArrayBuffer(chunkSize * 3);
    const combinedView = new Uint8Array(combinedBuffer);
    
    const beginningBuffer = await beginningChunk.arrayBuffer();
    const middleBuffer = await middleChunk.arrayBuffer();
    const endBuffer = await endChunk.arrayBuffer();
    
    combinedView.set(new Uint8Array(beginningBuffer), 0);
    combinedView.set(new Uint8Array(middleBuffer), chunkSize);
    combinedView.set(new Uint8Array(endBuffer), chunkSize * 2);
    
    // Generate hash of combined sample
    const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating quick file hash:', error);
    throw new Error(`Failed to generate quick hash for file: ${file.name}`);
  }
}

/**
 * Validates if a hash string is a valid SHA-256 hash
 * @param {string} hash - The hash string to validate
 * @returns {boolean} - True if valid SHA-256 hash format
 */
function isValidSHA256Hash(hash) {
  // SHA-256 hash should be exactly 64 hexadecimal characters
  const sha256Regex = /^[a-f0-9]{64}$/i;
  return sha256Regex.test(hash);
}

/**
 * Compares two file identifiers to determine if they represent the same file
 * @param {Object} identifiers1 - First file identifiers
 * @param {Object} identifiers2 - Second file identifiers
 * @returns {boolean} - True if files are considered identical
 */
function compareFileIdentifiers(identifiers1, identifiers2) {
  // Primary comparison: hash
  if (identifiers1.hash === identifiers2.hash) {
    return true;
  }
  
  // Secondary comparison: filename, size, and type (for cases where hash might not be available)
  return (
    identifiers1.filename === identifiers2.filename &&
    identifiers1.size === identifiers2.size &&
    identifiers1.type === identifiers2.type &&
    identifiers1.lastModified === identifiers2.lastModified
  );
}

/**
 * Utility function to format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Error class for hash generation failures
 */
class HashGenerationError extends Error {
  constructor(message, fileName) {
    super(message);
    this.name = 'HashGenerationError';
    this.fileName = fileName;
  }
}

// Export functions for use in other modules
module.exports = {
  generateFileHash,
  generateFileIdentifiers,
  generateQuickFileHash,
  isValidSHA256Hash,
  compareFileIdentifiers,
  formatFileSize,
  HashGenerationError
}; 