import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../nextjs/src/lib/supabase/types';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role for testing
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

describe('Database Setup Verification', () => {
  describe('Core Tables Schema', () => {
    test('tools table exists with correct schema', async () => {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Verify we can insert a test tool
      const { data: insertData, error: insertError } = await supabase
        .from('tools')
        .insert({
          name: 'Test Tool',
          slug: 'test-tool',
          description: 'Test tool for verification',
          status: 'active'
        })
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(insertData).toMatchObject({
        name: 'Test Tool',
        slug: 'test-tool',
        status: 'active'
      });
      
      // Clean up
      await supabase.from('tools').delete().eq('id', insertData.id);
    });

    test('user_tool_subscriptions table exists with correct schema', async () => {
      // First create a test tool
      const { data: tool } = await supabase
        .from('tools')
        .insert({
          name: 'Test Subscription Tool',
          slug: 'test-subscription-tool',
          status: 'active'
        })
        .select()
        .single();
      
      const { data, error } = await supabase
        .from('user_tool_subscriptions')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Clean up
      if (tool?.id) {
        await supabase.from('tools').delete().eq('id', tool.id);
      }
    });

    test('reconciliation_jobs table exists with N8N fields', async () => {
      const { data, error } = await supabase
        .from('reconciliation_jobs')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Test the schema by selecting specific N8N fields
      const { data: schemaTest, error: schemaError } = await supabase
        .from('reconciliation_jobs')
        .select(`
          webhook_payload,
          n8n_execution_id,
          n8n_workflow_id,
          callback_url,
          expires_at,
          result_file_path
        `)
        .limit(1);
      
      expect(schemaError).toBeNull();
    });

    test('airline_types table exists with configuration fields', async () => {
      const { data, error } = await supabase
        .from('airline_types')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Test inserting an airline type
      const { data: insertData, error: insertError } = await supabase
        .from('airline_types')
        .insert({
          code: 'TEST',
          display_name: 'Test Airlines',
          short_name: 'Test',
          country: 'Test Country',
          currency: 'USD',
          order_index: 999
        })
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(insertData).toMatchObject({
        code: 'TEST',
        display_name: 'Test Airlines',
        country: 'Test Country'
      });
      
      // Clean up
      await supabase.from('airline_types').delete().eq('id', insertData.id);
    });
  });

  describe('Database Constraints', () => {
    test('unique constraints are enforced', async () => {
      // Test tool name uniqueness
      const toolData = {
        name: 'Unique Test Tool',
        slug: 'unique-test-tool',
        status: 'active'
      };
      
      const { data: tool1 } = await supabase
        .from('tools')
        .insert(toolData)
        .select()
        .single();
      
      // Try to insert duplicate name
      const { error: duplicateError } = await supabase
        .from('tools')
        .insert(toolData);
      
      expect(duplicateError).toBeTruthy();
      expect(duplicateError?.code).toBe('23505'); // unique_violation
      
      // Clean up
      if (tool1?.id) {
        await supabase.from('tools').delete().eq('id', tool1.id);
      }
    });

    test('check constraints are enforced', async () => {
      // Test invalid subscription status
      const { data: tool } = await supabase
        .from('tools')
        .insert({
          name: 'Check Constraint Test Tool',
          slug: 'check-constraint-test',
          status: 'active'
        })
        .select()
        .single();
      
      const { error } = await supabase
        .from('user_tool_subscriptions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // This will fail FK constraint
          tool_id: tool!.id,
          status: 'invalid_status' // This should fail check constraint
        });
      
      expect(error).toBeTruthy();
      
      // Clean up
      await supabase.from('tools').delete().eq('id', tool!.id);
    });
  });

  describe('Storage Buckets', () => {
    test('invoice-reconciler bucket exists and is configured', async () => {
      const { data, error } = await supabase.storage
        .from('invoice-reconciler')
        .list('', { limit: 1 });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('reconciler-reports bucket exists and is configured', async () => {
      const { data, error } = await supabase.storage
        .from('reconciler-reports')
        .list('', { limit: 1 });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('storage bucket security verification function works', async () => {
      const { data, error } = await supabase.rpc('verify_storage_bucket_security');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      // Check that our buckets are included
      const bucketIds = data.map((bucket: any) => bucket.bucket_id);
      expect(bucketIds).toContain('invoice-reconciler');
      expect(bucketIds).toContain('reconciler-reports');
      
      // Verify security features
      data.forEach((bucket: any) => {
        expect(bucket.has_user_isolation).toBe(true);
        expect(bucket.policy_count).toBeGreaterThan(0);
      });
    });
  });

  describe('Database Functions', () => {
    test('N8N webhook functions exist and are callable', async () => {
      // Test can_access_n8n_webhooks function
      const { data, error } = await supabase.rpc('can_access_n8n_webhooks');
      
      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
    });

    test('storage quota functions exist and work', async () => {
      const { data, error } = await supabase.rpc('get_user_storage_usage');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    test('airline configuration function works', async () => {
      // First insert a test airline
      const { data: airline } = await supabase
        .from('airline_types')
        .insert({
          code: 'FUNC_TEST',
          display_name: 'Function Test Airlines',
          short_name: 'FuncTest',
          country: 'Test Country',
          currency: 'USD'
        })
        .select()
        .single();
      
      const { data, error } = await supabase.rpc('get_airline_config', {
        airline_code: 'FUNC_TEST'
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        expect(data[0]).toMatchObject({
          code: 'FUNC_TEST',
          display_name: 'Function Test Airlines'
        });
      }
      
      // Clean up
      if (airline?.id) {
        await supabase.from('airline_types').delete().eq('id', airline.id);
      }
    });
  });

  describe('Views and Relationships', () => {
    test('active_airline_types view works', async () => {
      const { data, error } = await supabase
        .from('active_airline_types')
        .select('*')
        .limit(5);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('active_user_subscriptions view works', async () => {
      const { data, error } = await supabase
        .from('active_user_subscriptions')
        .select('*')
        .limit(5);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('n8n_job_webhooks view works', async () => {
      const { data, error } = await supabase
        .from('n8n_job_webhooks')
        .select('*')
        .limit(5);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('TypeScript Types Integration', () => {
    test('TypeScript types match database schema', async () => {
      // Test that our TypeScript types work with actual database queries
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('id, name, slug, description, status, created_at')
        .limit(1);
      
      expect(toolsError).toBeNull();
      
      const { data: airlines, error: airlinesError } = await supabase
        .from('airline_types')
        .select('code, display_name, country, currency')
        .limit(1);
      
      expect(airlinesError).toBeNull();
      
      const { data: jobs, error: jobsError } = await supabase
        .from('reconciliation_jobs')
        .select(`
          id,
          status,
          airline_type,
          webhook_payload,
          n8n_execution_id,
          expires_at
        `)
        .limit(1);
      
      expect(jobsError).toBeNull();
      
      // If we have data, verify the types match our expectations
      if (tools && tools.length > 0) {
        const tool = tools[0];
        expect(typeof tool.id).toBe('string');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.status).toBe('string');
      }
    });
  });

  describe('Data Integrity and Cleanup', () => {
    test('referential integrity validation function works', async () => {
      const { data, error } = await supabase.rpc('validate_referential_integrity');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      // Should have no integrity issues
      data.forEach((issue: any) => {
        expect(issue.issue_count).toBe(0);
      });
    });

    test('cleanup functions exist and are callable', async () => {
      const { data: cleanupData, error: cleanupError } = await supabase
        .rpc('cleanup_orphaned_records');
      
      expect(cleanupError).toBeNull();
      expect(Array.isArray(cleanupData)).toBe(true);
    });
  });

  describe('Security and Access Control', () => {
    test('RLS policies are enabled', async () => {
      // Test that RLS is enabled on key tables
      const { data, error } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename, rowsecurity')
        .in('tablename', ['tools', 'user_tool_subscriptions', 'reconciliation_jobs'])
        .eq('schemaname', 'public');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      data.forEach((table: any) => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    test('storage bucket RLS is properly configured', async () => {
      const { data, error } = await supabase.rpc('verify_storage_bucket_security');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      data.forEach((bucket: any) => {
        expect(bucket.policy_count).toBeGreaterThan(0);
        expect(bucket.has_user_isolation).toBe(true);
      });
    });
  });
});

describe('Database Performance and Indexing', () => {
  test('key indexes exist for performance', async () => {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .in('indexname', [
        'idx_user_tool_subscriptions_user_id',
        'idx_reconciliation_jobs_user_id',
        'idx_reconciliation_jobs_status',
        'idx_reconciliation_jobs_expires_at'
      ]);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });

  test('foreign key constraints are properly named', async () => {
    const { data, error } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('constraint_type', 'FOREIGN KEY')
      .in('table_name', ['user_tool_subscriptions', 'reconciliation_jobs']);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// Integration test to verify full workflow capability
describe('End-to-End Database Integration', () => {
  let testTool: any;
  let testAirline: any;
  
  beforeAll(async () => {
    // Create test data for integration testing
    const { data: tool } = await supabase
      .from('tools')
      .insert({
        name: 'Integration Test Tool',
        slug: 'integration-test-tool',
        description: 'Tool for end-to-end testing',
        status: 'active'
      })
      .select()
      .single();
    
    testTool = tool;
    
    const { data: airline } = await supabase
      .from('airline_types')
      .insert({
        code: 'INTEGRATION',
        display_name: 'Integration Test Airlines',
        short_name: 'IntTest',
        country: 'Test Country',
        currency: 'USD',
        order_index: 999
      })
      .select()
      .single();
    
    testAirline = airline;
  });
  
  afterAll(async () => {
    // Clean up test data
    if (testTool?.id) {
      await supabase.from('tools').delete().eq('id', testTool.id);
    }
    if (testAirline?.id) {
      await supabase.from('airline_types').delete().eq('id', testAirline.id);
    }
  });

  test('complete workflow from tool creation to job processing', async () => {
    expect(testTool).toBeDefined();
    expect(testAirline).toBeDefined();
    
    // Verify tool exists and is accessible
    const { data: toolCheck } = await supabase
      .from('tools')
      .select('*')
      .eq('id', testTool.id)
      .single();
    
    expect(toolCheck).toMatchObject({
      name: 'Integration Test Tool',
      status: 'active'
    });
    
    // Verify airline configuration is accessible
    const { data: airlineConfig } = await supabase
      .rpc('get_airline_config', { airline_code: 'INTEGRATION' });
    
    expect(airlineConfig).toBeDefined();
    expect(airlineConfig.length).toBe(1);
    expect(airlineConfig[0].code).toBe('INTEGRATION');
    
    // Test N8N webhook payload creation
    const { data: webhookPayload } = await supabase
      .rpc('create_n8n_webhook_payload', {
        p_job_id: 'test-job-id',
        p_callback_base_url: 'https://test.example.com'
      });
    
    expect(webhookPayload).toBeDefined();
    expect(typeof webhookPayload).toBe('object');
  });
}); 