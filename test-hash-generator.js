/**
 * Simple test script for hash generator utility
 */

const {
  generateFileHash,
  generateFileIdentifiers,
  generateQuickFileHash,
  isValidSHA256Hash,
  compareFileIdentifiers,
  formatFileSize,
  HashGenerationError
} = require('./nextjs/src/lib/fileUtils/hashGenerator.js');

// Mock crypto for Node.js environment
const crypto = require('crypto');
global.crypto = {
  subtle: {
    digest: async (algorithm, data) => {
      const hash = crypto.createHash('sha256');
      hash.update(Buffer.from(data));
      return hash.digest().buffer;
    }
  }
};

// Mock File class for testing
class MockFile {
  constructor(content, name, type = 'application/pdf') {
    this.content = content;
    this.name = name;
    this.type = type;
    this.size = content.length;
    this.lastModified = Date.now();
  }

  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }

  slice(start, end) {
    const slicedContent = this.content.slice(start, end);
    return new MockFile(slicedContent, this.name, this.type);
  }
}

async function runTests() {
  console.log('🧪 Testing Hash Generator Utility...\n');

  try {
    // Test 1: Basic hash generation
    console.log('1. Testing basic hash generation...');
    const file1 = new MockFile('test content', 'test.pdf');
    const hash1 = await generateFileHash(file1);
    console.log(`   ✅ Generated hash: ${hash1.substring(0, 16)}...`);
    console.log(`   ✅ Hash length: ${hash1.length} (expected: 64)`);

    // Test 2: Hash validation
    console.log('\n2. Testing hash validation...');
    const isValid = isValidSHA256Hash(hash1);
    console.log(`   ✅ Hash validation: ${isValid}`);

    // Test 3: File identifiers
    console.log('\n3. Testing file identifiers generation...');
    const identifiers = await generateFileIdentifiers(file1);
    console.log(`   ✅ Identifiers: ${JSON.stringify(identifiers, null, 2)}`);

    // Test 4: Duplicate detection
    console.log('\n4. Testing duplicate detection...');
    const file2 = new MockFile('test content', 'different.pdf'); // Same content, different name
    const identifiers2 = await generateFileIdentifiers(file2);
    const areDuplicates = compareFileIdentifiers(identifiers, identifiers2);
    console.log(`   ✅ Duplicate detection: ${areDuplicates} (expected: true)`);

    // Test 5: File size formatting
    console.log('\n5. Testing file size formatting...');
    console.log(`   ✅ 1024 bytes: ${formatFileSize(1024)}`);
    console.log(`   ✅ 1048576 bytes: ${formatFileSize(1048576)}`);
    console.log(`   ✅ 25MB: ${formatFileSize(25 * 1024 * 1024)}`);

    // Test 6: Quick hash for large files
    console.log('\n6. Testing quick hash for large files...');
    const largeContent = 'x'.repeat(100 * 1024); // 100KB
    const largeFile = new MockFile(largeContent, 'large.pdf');
    const quickHash = await generateQuickFileHash(largeFile);
    console.log(`   ✅ Quick hash: ${quickHash.substring(0, 16)}...`);

    // Test 7: Error handling
    console.log('\n7. Testing error handling...');
    try {
      const error = new HashGenerationError('Test error', 'test.pdf');
      console.log(`   ✅ Error created: ${error.name} - ${error.message}`);
    } catch (e) {
      console.log(`   ❌ Error test failed: ${e.message}`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the tests
runTests(); 