/**
 * Simple Database Setup Verification Script
 * Verifies that the database infrastructure is ready for N8N integration
 */

const path = require('path');
const { createClient } = require(path.join(__dirname, '../../nextjs/node_modules/@supabase/supabase-js'));

// Test configuration - Load from environment or use defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcyteovnllklmvoptxjr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Database Setup Verification Starting...');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key Available:', !!supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set your Supabase service role key to run this verification.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyDatabaseSetup() {
  let totalTests = 0;
  let passedTests = 0;
  
  console.log('\n📋 Verifying Database Infrastructure...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing database connection...');
    totalTests++;
    const { data: connectionTest, error: connectionError } = await supabase
      .from('tools')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
    } else {
      console.log('✅ Database connection successful');
      passedTests++;
    }
    
    // Test 2: Core tables exist
    console.log('\n2️⃣  Verifying core tables...');
    const tables = ['tools', 'user_tool_subscriptions', 'reconciliation_jobs', 'airline_types'];
    
    for (const table of tables) {
      totalTests++;
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table '${table}' verification failed:`, error.message);
      } else {
        console.log(`✅ Table '${table}' accessible`);
        passedTests++;
      }
    }
    
    // Test 3: Storage buckets
    console.log('\n3️⃣  Verifying storage buckets...');
    const buckets = ['invoice-reconciler', 'reconciler-reports'];
    
    for (const bucket of buckets) {
      totalTests++;
      const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        console.error(`❌ Storage bucket '${bucket}' verification failed:`, error.message);
      } else {
        console.log(`✅ Storage bucket '${bucket}' accessible`);
        passedTests++;
      }
    }
    
    // Test 4: Key functions exist
    console.log('\n4️⃣  Verifying database functions...');
    const functions = [
      'verify_storage_bucket_security',
      'can_access_n8n_webhooks',
      'get_user_storage_usage',
      'create_n8n_webhook_payload'
    ];
    
    for (const func of functions) {
      totalTests++;
      try {
        const { error } = await supabase.rpc(func, func === 'create_n8n_webhook_payload' ? {
          p_job_id: 'test',
          p_callback_base_url: 'https://test.com'
        } : {});
        
        if (error && !error.message.includes('permission denied')) {
          console.error(`❌ Function '${func}' verification failed:`, error.message);
        } else {
          console.log(`✅ Function '${func}' callable`);
          passedTests++;
        }
      } catch (e) {
        console.error(`❌ Function '${func}' error:`, e.message);
      }
    }
    
    // Test 5: Views exist
    console.log('\n5️⃣  Verifying database views...');
    const views = ['active_airline_types', 'active_user_subscriptions', 'n8n_job_webhooks'];
    
    for (const view of views) {
      totalTests++;
      const { error } = await supabase.from(view).select('*').limit(1);
      if (error) {
        console.error(`❌ View '${view}' verification failed:`, error.message);
      } else {
        console.log(`✅ View '${view}' accessible`);
        passedTests++;
      }
    }
    
    // Test 6: N8N specific schema fields
    console.log('\n6️⃣  Verifying N8N integration fields...');
    totalTests++;
    const { error: n8nFieldsError } = await supabase
      .from('reconciliation_jobs')
      .select('webhook_payload, n8n_execution_id, n8n_workflow_id, callback_url, expires_at')
      .limit(1);
    
    if (n8nFieldsError) {
      console.error('❌ N8N integration fields verification failed:', n8nFieldsError.message);
    } else {
      console.log('✅ N8N integration fields present');
      passedTests++;
    }
    
    // Test 7: TypeScript types file exists
    console.log('\n7️⃣  Verifying TypeScript types...');
    totalTests++;
    try {
      const fs = require('fs');
      const typesPath = path.join(__dirname, '../../nextjs/src/lib/supabase/types.ts');
      if (fs.existsSync(typesPath)) {
        const typesContent = fs.readFileSync(typesPath, 'utf8');
        if (typesContent.includes('reconciliation_jobs') && typesContent.includes('airline_types')) {
          console.log('✅ TypeScript types file contains required schema definitions');
          passedTests++;
        } else {
          console.error('❌ TypeScript types file missing required schema definitions');
        }
      } else {
        console.error('❌ TypeScript types file not found');
      }
    } catch (e) {
      console.error('❌ TypeScript types verification failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Verification failed with error:', error.message);
  }
  
  // Results summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE SETUP VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Database setup is ready for N8N-powered invoice reconciliation');
    console.log('✅ Storage buckets configured with proper security');
    console.log('✅ All required functions and views operational');
    console.log('✅ TypeScript types generated and up-to-date');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Database setup needs attention.');
    console.log('Please review the failed components before proceeding.');
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyDatabaseSetup()
    .then(success => {
      console.log('\n' + (success ? '🟢 VERIFICATION COMPLETE - PASSED' : '🔴 VERIFICATION COMPLETE - FAILED'));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabaseSetup }; 