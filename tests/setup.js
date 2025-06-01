// Jest setup file for configuring test environment

// Mock TextEncoder and TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock File and Blob if not available
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(blobParts = [], options = {}) {
      this.size = 0;
      this.type = options.type || '';
      
      // Calculate size from blobParts
      if (blobParts) {
        for (const part of blobParts) {
          if (typeof part === 'string') {
            this.size += new TextEncoder().encode(part).length;
          } else if (part instanceof ArrayBuffer) {
            this.size += part.byteLength;
          } else if (part instanceof Uint8Array) {
            this.size += part.length;
          }
        }
      }
    }
  };
}

// Mock crypto if not available
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    subtle: {
      digest: jest.fn()
    }
  };
} 