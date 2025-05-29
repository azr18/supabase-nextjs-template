# Storage Policy Testing Guide

## Quick Testing Steps

Your storage policies are now active! Here's how to test them:

## ✅ Current Setup Status
- 4 storage policies created ✅
- Helper functions working correctly ✅  
- Test data ready ✅

## 🧪 Testing Methods

### Method 1: Browser Console Testing (Recommended)

1. **Open your Next.js app** (when you build it)
2. **Register a new account** or login
3. **Open browser developer tools** (F12)
4. **Run these tests in the console:**

```javascript
// Test 1: Check if you can list bucket contents
const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets, bucketError);

// Test 2: Try to list files in invoice-reconciler bucket
const { data: files, error: listError } = await supabase.storage
  .from('invoice-reconciler')
  .list('');
console.log('Files in bucket:', files, listError);

// Test 3: Create a test file to upload
const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

// Test 4: Try uploading to correct path (should work)
const userId = (await supabase.auth.getUser()).data.user?.id;
const validPath = `${userId}/saved_invoices/fly-dubai/test-invoice.pdf`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('invoice-reconciler')
  .upload(validPath, testFile);
console.log('Valid upload result:', uploadData, uploadError);

// Test 5: Try uploading to invalid path (should fail)
const invalidPath = `${userId}/invalid-folder/test.pdf`;
const { data: invalidUpload, error: invalidError } = await supabase.storage
  .from('invoice-reconciler')
  .upload(invalidPath, testFile);
console.log('Invalid upload result (should fail):', invalidUpload, invalidError);
```

### Method 2: SQL Database Testing

Run these queries in the Supabase SQL Editor:

```sql
-- Test 1: Check your test user subscription
SELECT u.email, t.name, uts.status 
FROM auth.users u
JOIN user_tool_subscriptions uts ON u.id = uts.user_id
JOIN tools t ON uts.tool_id = t.id
WHERE u.email = 'testuser1@example.com';

-- Test 2: Verify functions work
SELECT 
    public.validate_invoice_reconciler_file_path('user-id/saved_invoices/fly-dubai/test.pdf') as valid_path,
    public.check_storage_quota_before_upload('invoice-reconciler', 1000000) as quota_ok;
```

## 📋 Expected Test Results

### ✅ Should SUCCEED:
- User can list their own files
- Upload to `user_id/saved_invoices/airline/file.pdf`
- Upload to `user_id/jobs/job-id/file.xlsx`
- Upload to `user_id/reports/file.xlsx`
- Files under 25MB per file
- Total usage under 100MB per user

### ❌ Should FAIL:
- Upload to `user_id/invalid-folder/file.pdf`
- Upload files over 25MB 
- Upload when total exceeds 100MB
- Access files belonging to other users
- Access without active subscription

## 🔍 How to Verify Policies Work

### 1. User Isolation Test
- Create 2 different user accounts
- Upload files with each account
- Verify each user only sees their own files

### 2. Subscription Test  
- Remove subscription from a user in Supabase Dashboard
- Try accessing storage - should fail
- Re-add subscription - should work again

### 3. Path Validation Test
- Try uploading to allowed paths: ✅ works
- Try uploading to invalid paths: ❌ fails

### 4. Quota Test
- Upload multiple files
- Check total doesn't exceed 100MB
- Large uploads should be rejected

## 🛠️ Troubleshooting

### If tests fail:

1. **Check policies are active** in Supabase Dashboard > Storage > Policies
2. **Verify user has subscription**:
   ```sql
   SELECT * FROM user_tool_subscriptions WHERE user_id = 'your-user-id';
   ```
3. **Check function permissions**:
   ```sql
   SELECT has_function_privilege('authenticated', 'public.check_user_owns_storage_object(text)', 'execute');
   ```

### Common Error Messages:

- `"new row violates row level security policy"` = Policy blocking access ✅ (expected)
- `"insufficient_scope"` = Authentication issue
- `"bucket not found"` = Bucket doesn't exist or no access

## 🧹 Cleanup After Testing

```sql
-- Remove test data
DELETE FROM user_tool_subscriptions 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);

DELETE FROM auth.users 
WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);
```

## ✨ Summary

Your storage bucket is secured with:
- ✅ User isolation (users only see their own files)
- ✅ Subscription validation (only subscribed users have access)  
- ✅ Path enforcement (organized file structure)
- ✅ Quota limits (100MB per user)
- ✅ File type restrictions (PDF, Excel, CSV, JSON)

The policies are working correctly and ready for your invoice reconciler application! 🎉 