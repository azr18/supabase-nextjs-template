# Storage Bucket Policy Configuration Guide

## Overview

This document provides instructions for manually configuring Row Level Security (RLS) policies for the `invoice-reconciler` storage bucket in the Supabase Dashboard.

## Background

Due to Supabase's security model, storage bucket policies cannot be created directly through SQL migrations. Instead, they must be configured through the Supabase Dashboard interface.

The required helper functions have been created via migration and are available:
- `public.check_user_owns_storage_object(object_name text)`
- `public.check_user_has_tool_access_for_storage(bucket_name text)`
- `public.validate_invoice_reconciler_file_path(object_name text)`
- `public.check_storage_quota_before_upload(bucket_name text, file_size bigint)`

## Manual Configuration Steps

### 1. Access Storage Policies

1. Open the Supabase Dashboard
2. Navigate to **Storage** > **Policies**
3. Select the `invoice-reconciler` bucket

### 2. Create Storage Policies

Create the following policies for the `invoice-reconciler` bucket:

#### Policy 1: Users can view own objects
- **Policy Name**: `Users can view own objects in invoice-reconciler`
- **Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'invoice-reconciler' 
AND auth.uid() IS NOT NULL 
AND public.check_user_owns_storage_object(name) 
AND public.check_user_has_tool_access_for_storage(bucket_id)
```

#### Policy 2: Users can upload objects
- **Policy Name**: `Users can upload objects to invoice-reconciler`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'invoice-reconciler' 
AND auth.uid() IS NOT NULL 
AND owner = auth.uid() 
AND public.check_user_owns_storage_object(name) 
AND public.check_user_has_tool_access_for_storage(bucket_id) 
AND public.validate_invoice_reconciler_file_path(name) 
AND public.check_storage_quota_before_upload(bucket_id, COALESCE((metadata->>'size')::bigint, 0))
```

#### Policy 3: Users can update own objects
- **Policy Name**: `Users can update own objects in invoice-reconciler`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **Using Expression**:
```sql
bucket_id = 'invoice-reconciler' 
AND auth.uid() IS NOT NULL 
AND owner = auth.uid() 
AND public.check_user_owns_storage_object(name) 
AND public.check_user_has_tool_access_for_storage(bucket_id)
```
- **With Check Expression**:
```sql
bucket_id = 'invoice-reconciler' 
AND auth.uid() IS NOT NULL 
AND owner = auth.uid() 
AND public.check_user_owns_storage_object(name) 
AND public.check_user_has_tool_access_for_storage(bucket_id) 
AND public.validate_invoice_reconciler_file_path(name)
```

#### Policy 4: Users can delete own objects
- **Policy Name**: `Users can delete own objects in invoice-reconciler`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'invoice-reconciler' 
AND auth.uid() IS NOT NULL 
AND owner = auth.uid() 
AND public.check_user_owns_storage_object(name) 
AND public.check_user_has_tool_access_for_storage(bucket_id)
```

## File Organization Structure

The policies enforce the following file organization structure:

```
user_id/
├── saved_invoices/
│   ├── fly-dubai/
│   │   └── invoice-files.pdf
│   ├── tap/
│   │   └── invoice-files.pdf
│   └── [other-airlines]/
│       └── invoice-files.pdf
├── jobs/
│   ├── job-id-1/
│   │   └── report.xlsx
│   └── job-id-2/
│       └── report.xlsx
└── reports/
    └── generated-reports.xlsx
```

## Security Features

The configured policies provide:

✅ **User Isolation**: Users can only access files in their own directory (`user_id/`)

✅ **Subscription Validation**: Only users with active subscriptions to the invoice-reconciler tool can access the bucket

✅ **Path Validation**: Enforces proper file organization with allowed subdirectories (`saved_invoices`, `jobs`, `reports`)

✅ **Quota Enforcement**: Prevents uploads that would exceed the 100MB per-user limit

✅ **File Type Validation**: Controlled through bucket-level MIME type restrictions

## Testing

After configuring the policies, test the following scenarios:

1. **User Isolation**: Verify users cannot access files belonging to other users
2. **Subscription Requirement**: Verify users without active subscriptions cannot access the bucket
3. **Path Validation**: Verify invalid file paths are rejected
4. **Quota Enforcement**: Verify large file uploads are rejected when they would exceed the quota
5. **File Operations**: Verify authenticated users can upload, view, update, and delete their own files

## Troubleshooting

If policies are not working as expected:

1. Verify all helper functions exist and are accessible to the `authenticated` role
2. Check that the bucket `invoice-reconciler` exists
3. Ensure RLS is enabled on the storage.objects table (should be enabled by default)
4. Verify policy syntax in the Supabase Dashboard
5. Check the Supabase logs for policy evaluation errors

## Verification Commands

Run these SQL commands to verify the helper functions are working:

```sql
-- Test path validation
SELECT public.validate_invoice_reconciler_file_path('user-id/saved_invoices/fly-dubai/file.pdf');

-- Test quota checking (should return true for small files)
SELECT public.check_storage_quota_before_upload('invoice-reconciler', 1000000);

-- Test user ownership validation
SELECT public.check_user_owns_storage_object('user-id/file.pdf');
``` 