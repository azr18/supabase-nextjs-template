/**
 * Database Setup Verification Tests
 * 
 * This test suite verifies that all database infrastructure components
 * are properly configured for the N8N-powered invoice reconciler.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('=== Database Setup Verification Tests ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key Available:', !!supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client with service role for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test utility functions
function expectSuccess(result, testName) {
  if (result.error) {
    console.error(`❌ ${testName} FAILED:`, result.error.message);
    return false;
  }
  console.log(`✅ ${testName} PASSED`);
  return true;
}

function expectDefined(value, testName) {
  if (value === undefined || value === null) {
    console.error(`❌ ${testName} FAILED: Value is null or undefined`);
    return false;
  }
  console.log(`✅ ${testName} PASSED`);
  return true;
}

// Main test runner
async function runDatabaseSetupTests() {
  let totalTests = 0;
  let passedTests = 0;
  
  console.log('\n🔍 Testing Core Tables Schema...');
  
  // Test 1: Tools table
  totalTests++;
  const toolsResult = await supabase.from('tools').select('*').limit(1);
  if (expectSuccess(toolsResult, 'Tools table accessibility')) {
    passedTests++;
    
    // Test tool insertion
    totalTests++;
    const insertResult = await supabase
      .from('tools')
      .insert({
        name: 'DB Verification Tool',
        slug: 'db-verification-tool',
        description: 'Test tool for database verification',
        status: 'active'
      })
      .select()
      .single();
    
    if (expectSuccess(insertResult, 'Tool insertion with constraints')) {
      passedTests++;
      // Clean up
      await supabase.from('tools').delete().eq('id', insertResult.data.id);
    }
  }
  
  // Test 2: User tool subscriptions table
  totalTests++;
  const subscriptionsResult = await supabase.from('user_tool_subscriptions').select('*').limit(1);
  if (expectSuccess(subscriptionsResult, 'User tool subscriptions table accessibility')) {
    passedTests++;
  }
  
  // Test 3: Reconciliation jobs table with N8N fields
  totalTests++;
  const jobsResult = await supabase
    .from('reconciliation_jobs')
    .select('webhook_payload, n8n_execution_id, n8n_workflow_id, callback_url, expires_at, result_file_path')
    .limit(1);
  if (expectSuccess(jobsResult, 'Reconciliation jobs table with N8N fields')) {
    passedTests++;
  }
  
  // Test 4: Airline types table
  totalTests++;
  const airlinesResult = await supabase.from('airline_types').select('*').limit(1);
  if (expectSuccess(airlinesResult, 'Airline types table accessibility')) {
    passedTests++;
    
    // Test airline insertion
    totalTests++;
    const airlineInsert = await supabase
      .from('airline_types')
      .insert({
        code: 'DBTEST',
        display_name: 'DB Test Airlines',
        short_name: 'DBTest',
        country: 'Test Country',
        currency: 'USD',
        order_index: 999
      })
      .select()
      .single();
    
    if (expectSuccess(airlineInsert, 'Airline type insertion')) {
      passedTests++;
      // Clean up
      await supabase.from('airline_types').delete().eq('id', airlineInsert.data.id);
    }
  }
  
  console.log('\n🔐 Testing Storage Buckets...');
  
  // Test 5: Invoice reconciler bucket
  totalTests++;
  const invoiceBucket = await supabase.storage.from('invoice-reconciler').list('', { limit: 1 });
  if (expectSuccess(invoiceBucket, 'Invoice reconciler storage bucket')) {
    passedTests++;
  }
  
  // Test 6: Reconciler reports bucket
  totalTests++;
  const reportsBucket = await supabase.storage.from('reconciler-reports').list('', { limit: 1 });
  if (expectSuccess(reportsBucket, 'Reconciler reports storage bucket')) {
    passedTests++;
  }
  
  // Test 7: Storage bucket security
  totalTests++;
  const bucketSecurity = await supabase.rpc('verify_storage_bucket_security');
  if (expectSuccess(bucketSecurity, 'Storage bucket security verification')) {
    passedTests++;
    
    const bucketIds = bucketSecurity.data.map(bucket => bucket.bucket_id);
    if (bucketIds.includes('invoice-reconciler') && bucketIds.includes('reconciler-reports')) {
      console.log('✅ Both required storage buckets found with security policies');
    } else {
      console.error('❌ Missing required storage buckets in security verification');
    }
  }
  
  console.log('\n⚡ Testing Database Functions...');
  
  // Test 8: N8N webhook functions
  totalTests++;
  const webhookAccess = await supabase.rpc('can_access_n8n_webhooks');
  if (expectSuccess(webhookAccess, 'N8N webhook access function')) {
    passedTests++;
  }
  
  // Test 9: Storage quota functions
  totalTests++;
  const storageUsage = await supabase.rpc('get_user_storage_usage');
  if (expectSuccess(storageUsage, 'Storage usage function')) {
    passedTests++;
  }
  
  // Test 10: Airline configuration function
  totalTests++;
  const { data: testAirline } = await supabase
    .from('airline_types')
    .insert({
      code: 'FUNCTEST',
      display_name: 'Function Test Airlines',
      short_name: 'FuncTest',
      country: 'Test Country',
      currency: 'USD'
    })
    .select()
    .single();
  
  if (testAirline) {
    const airlineConfig = await supabase.rpc('get_airline_config', { airline_code: 'FUNCTEST' });
    if (expectSuccess(airlineConfig, 'Airline configuration function')) {
      passedTests++;
    }
    // Clean up
    await supabase.from('airline_types').delete().eq('id', testAirline.id);
  }
  
  console.log('\n📊 Testing Views and Relationships...');
  
  // Test 11: Active airline types view
  totalTests++;
  const activeAirlines = await supabase.from('active_airline_types').select('*').limit(5);
  if (expectSuccess(activeAirlines, 'Active airline types view')) {
    passedTests++;
  }
  
  // Test 12: Active user subscriptions view
  totalTests++;
  const activeSubscriptions = await supabase.from('active_user_subscriptions').select('*').limit(5);
  if (expectSuccess(activeSubscriptions, 'Active user subscriptions view')) {
    passedTests++;
  }
  
  // Test 13: N8N job webhooks view
  totalTests++;
  const n8nWebhooks = await supabase.from('n8n_job_webhooks').select('*').limit(5);
  if (expectSuccess(n8nWebhooks, 'N8N job webhooks view')) {
    passedTests++;
  }
  
  console.log('\n🔍 Testing Data Integrity...');
  
  // Test 14: Referential integrity
  totalTests++;
  const integrityCheck = await supabase.rpc('validate_referential_integrity');
  if (expectSuccess(integrityCheck, 'Referential integrity validation')) {
    passedTests++;
    
    const issuesFound = integrityCheck.data.some(issue => issue.issue_count > 0);
    if (!issuesFound) {
      console.log('✅ No referential integrity issues found');
    } else {
      console.warn('⚠️ Some referential integrity issues detected');
      integrityCheck.data.forEach(issue => {
        if (issue.issue_count > 0) {
          console.warn(`  - ${issue.table_name}: ${issue.issue_count} issues`);
        }
      });
    }
  }
  
  // Test 15: Cleanup functions
  totalTests++;
  const cleanupTest = await supabase.rpc('cleanup_orphaned_records');
  if (expectSuccess(cleanupTest, 'Cleanup functions availability')) {
    passedTests++;
  }
  
  console.log('\n🔒 Testing Security Configuration...');
  
  // Test 16: Unique constraints
  totalTests++;
  const { data: duplicateTestTool } = await supabase
    .from('tools')
    .insert({
      name: 'Duplicate Test Tool',
      slug: 'duplicate-test-tool',
      status: 'active'
    })
    .select()
    .single();
  
  if (duplicateTestTool) {
    const duplicateAttempt = await supabase
      .from('tools')
      .insert({
        name: 'Duplicate Test Tool', // Same name should fail
        slug: 'duplicate-test-tool-2',
        status: 'active'
      });
    
    if (duplicateAttempt.error && duplicateAttempt.error.code === '23505') {
      console.log('✅ Unique constraint enforcement working');
      passedTests++;
    } else {
      console.error('❌ Unique constraint enforcement failed');
    }
    
    // Clean up
    await supabase.from('tools').delete().eq('id', duplicateTestTool.id);
  }
  
  console.log('\n🚀 Testing N8N Integration Readiness...');
  
  // Test 17: N8N webhook payload creation
  totalTests++;
  const webhookPayload = await supabase.rpc('create_n8n_webhook_payload', {
    p_job_id: 'test-verification-job',
    p_callback_base_url: 'https://test.example.com'
  });
  if (expectSuccess(webhookPayload, 'N8N webhook payload creation')) {
    passedTests++;
    if (typeof webhookPayload.data === 'object') {
      console.log('✅ Webhook payload is properly formatted JSON object');
    }
  }
  
  // Final results
  console.log('\n' + '='.repeat(50));
  console.log('📊 DATABASE SETUP VERIFICATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Database setup is ready for N8N integration.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Please review the database setup.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDatabaseSetupTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runDatabaseSetupTests,
  supabase
}; 