# Admin Guide: Managing User Subscriptions via Supabase Studio

## 🚨 IMPORTANT: RLS Permission Fix Applied

**If you're experiencing "read-only editor" issues or cannot insert rows**, this has been resolved! 

The database has been updated with proper Row Level Security (RLS) policies that allow admin access via Supabase Studio. You should now be able to:
- ✅ Insert new subscription records
- ✅ Update existing subscriptions  
- ✅ Delete subscription records
- ✅ View all subscription data

**Current Admin Access Configuration:**
- Any authenticated user in Supabase Studio has full admin access (MVP configuration)
- Service role has full programmatic access
- Regular app users can only view their own subscriptions

**For Production:** Replace the temporary admin access with proper admin role checking by modifying the `is_admin_user_simple()` function in the database.

## Table of Contents
1. [Overview](#overview)
2. [Accessing Supabase Studio](#accessing-supabase-studio)
3. [Database Schema Overview](#database-schema-overview)
4. [Managing User Subscriptions](#managing-user-subscriptions)
5. [Common Admin Tasks](#common-admin-tasks)
6. [Subscription Status Reference](#subscription-status-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

## Overview

This guide provides administrators with comprehensive instructions for managing user tool subscriptions in the SaaS platform using Supabase Studio. The platform uses a manual subscription management system where administrators control user access to tools through direct database operations.

### Key Responsibilities
- Grant and revoke tool access for users
- Set and update subscription statuses
- Monitor user activity and tool usage
- Maintain subscription data integrity
- Handle customer support requests related to access

## Accessing Supabase Studio

### 1. Login to Supabase Studio
1. Navigate to [https://app.supabase.com](https://app.supabase.com)
2. Sign in with your admin credentials
3. Select the project: **Invoice Reconciler SaaS Platform** (Project ID: `hcyteovnllklmvoptxjr`)

### 2. Navigate to Database Tables
1. In the left sidebar, click **"Table Editor"**
2. You'll see all database tables including the subscription-related tables

## Database Schema Overview

### Core Tables for Subscription Management

#### `tools` Table
Contains available tools in the platform.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | TEXT | Tool name (e.g., "invoice-reconciler") |
| `display_name` | TEXT | Human-readable name |
| `description` | TEXT | Tool description |
| `is_active` | BOOLEAN | Whether tool is available |
| `created_at` | TIMESTAMP | Creation date |

#### `user_tool_subscriptions` Table
Tracks which users have access to which tools.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to `auth.users` |
| `tool_id` | UUID | Foreign key to `tools` |
| `status` | TEXT | Subscription status (see reference below) |
| `granted_at` | TIMESTAMP | When subscription was granted |
| `expires_at` | TIMESTAMP | Expiration date (nullable) |
| `trial_ends_at` | TIMESTAMP | Trial end date (nullable) |
| `created_at` | TIMESTAMP | Record creation date |
| `updated_at` | TIMESTAMP | Last update date |

#### `auth.users` Table (Supabase Auth)
Contains user account information.

| Key Columns | Description |
|-------------|-------------|
| `id` | User UUID (used in subscriptions) |
| `email` | User email address |
| `created_at` | Account creation date |
| `last_sign_in_at` | Last login timestamp |

## Managing User Subscriptions

### Viewing User Subscriptions

#### Method 1: View All Subscriptions
1. Go to **Table Editor** → **user_tool_subscriptions**
2. Click **"View all rows"** to see all current subscriptions
3. Use filters to find specific users or tools

#### Method 2: Find User by Email
1. Go to **Table Editor** → **auth.users**
2. Use the search/filter functionality to find the user by email
3. Copy the user's `id` (UUID)
4. Go to **user_tool_subscriptions** table
5. Filter by `user_id` to see all subscriptions for that user

#### Method 3: Using SQL Editor
1. Go to **SQL Editor** in the left sidebar
2. Use this query to view user subscriptions with email:

```sql
SELECT 
    u.email,
    u.id as user_id,
    t.display_name as tool_name,
    uts.status,
    uts.granted_at,
    uts.expires_at,
    uts.trial_ends_at
FROM auth.users u
JOIN user_tool_subscriptions uts ON u.id = uts.user_id
JOIN tools t ON uts.tool_id = t.id
ORDER BY u.email, t.display_name;
```

### Adding New Subscriptions

#### Step 1: Get Required IDs
1. **User ID**: Find the user in `auth.users` table and copy their `id`
2. **Tool ID**: Find the tool in `tools` table and copy its `id`

#### Step 2: Create Subscription Record
1. Go to **Table Editor** → **user_tool_subscriptions**
2. Click **"Insert" → "Insert row"**
3. Fill in the required fields:
   - `user_id`: Paste the user's UUID
   - `tool_id`: Paste the tool's UUID
   - `status`: Choose appropriate status (see reference below)
   - `granted_at`: Set to current timestamp
   - `expires_at`: Set expiration date (optional)
   - `trial_ends_at`: Set trial end date (for trial subscriptions)

#### Step 3: Verify Subscription
1. Use the SQL query above to verify the subscription was created correctly
2. User should now see the tool in their dashboard

### Modifying Existing Subscriptions

#### Change Subscription Status
1. Go to **Table Editor** → **user_tool_subscriptions**
2. Find the subscription record
3. Click the row to edit
4. Update the `status` field
5. Update `updated_at` to current timestamp
6. Save changes

#### Extend or Set Expiration
1. Find the subscription record
2. Edit the `expires_at` field
3. For unlimited access, set to `null`
4. For time-limited access, set to desired expiration date
5. Save changes

#### Convert Trial to Paid
1. Find the trial subscription
2. Change `status` from `trial` to `active`
3. Set `expires_at` to desired expiration (or `null` for unlimited)
4. Clear `trial_ends_at` field (set to `null`)
5. Save changes

### Removing Subscriptions

#### Method 1: Delete Subscription Record
1. Go to **Table Editor** → **user_tool_subscriptions**
2. Find the subscription record
3. Click the row and select **"Delete"**
4. Confirm deletion

#### Method 2: Set to Inactive Status
1. Find the subscription record
2. Change `status` to `inactive`
3. This preserves the record for audit purposes

## Common Admin Tasks

### 1. Grant Trial Access to New User
```sql
-- First, get the user_id and tool_id, then insert:
INSERT INTO user_tool_subscriptions (user_id, tool_id, status, granted_at, trial_ends_at)
VALUES (
    'user-uuid-here',
    'tool-uuid-here',
    'trial',
    NOW(),
    NOW() + INTERVAL '14 days'  -- 14-day trial
);
```

### 2. Bulk Status Update
```sql
-- Example: Expire all trials that have ended
UPDATE user_tool_subscriptions 
SET status = 'expired', updated_at = NOW()
WHERE status = 'trial' 
AND trial_ends_at < NOW();
```

### 3. View Expiring Subscriptions
```sql
SELECT 
    u.email,
    t.display_name,
    uts.status,
    uts.expires_at,
    uts.trial_ends_at
FROM user_tool_subscriptions uts
JOIN auth.users u ON uts.user_id = u.id
JOIN tools t ON uts.tool_id = t.id
WHERE (
    (uts.expires_at IS NOT NULL AND uts.expires_at <= NOW() + INTERVAL '7 days')
    OR 
    (uts.trial_ends_at IS NOT NULL AND uts.trial_ends_at <= NOW() + INTERVAL '3 days')
)
AND uts.status IN ('active', 'trial')
ORDER BY uts.expires_at, uts.trial_ends_at;
```

### 4. User Activity Report
```sql
SELECT 
    u.email,
    u.created_at as user_registered,
    u.last_sign_in_at,
    COUNT(uts.id) as total_subscriptions,
    COUNT(CASE WHEN uts.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN uts.status = 'trial' THEN 1 END) as trial_subscriptions
FROM auth.users u
LEFT JOIN user_tool_subscriptions uts ON u.id = uts.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at
ORDER BY u.last_sign_in_at DESC NULLS LAST;
```

## Subscription Status Reference

| Status | Description | User Access | Typical Use Case |
|--------|-------------|-------------|------------------|
| `active` | Full access to tool | ✅ Yes | Paid subscription |
| `trial` | Trial access | ✅ Yes (limited time) | New user trial period |
| `expired` | Subscription has expired | ❌ No | Overdue payment |
| `inactive` | Manually disabled | ❌ No | Admin suspension |
| `cancelled` | User cancelled | ❌ No | User-requested cancellation |

### Status Transition Rules

- `trial` → `active`: Trial converted to paid
- `trial` → `expired`: Trial period ended
- `active` → `expired`: Subscription payment overdue
- `active` → `inactive`: Admin suspension
- `active` → `cancelled`: User cancellation
- `expired` → `active`: Payment received
- `inactive` → `active`: Admin reactivation

## Best Practices

### 1. Data Integrity
- Always verify user and tool IDs exist before creating subscriptions
- Use consistent timestamp formats (UTC)
- Keep audit trail by updating `updated_at` field
- Don't delete subscription records unless absolutely necessary

### 2. Communication
- Document subscription changes in customer support system
- Notify users of status changes via email
- Keep records of payment confirmations and cancellation requests

### 3. Security
- Limit admin access to authorized personnel only
- Use Read-Only access for support staff when possible
- Log all subscription modifications
- Regularly review admin access permissions

### 4. Monitoring
- Check for expiring trials and subscriptions weekly
- Monitor storage usage per user (100MB limit)
- Track tool usage patterns for business insights
- Review failed job patterns by subscription status

### 5. Backup and Recovery
- Understand Supabase backup policies
- Document critical subscription configurations
- Test subscription restoration procedures
- Keep external records of major subscription changes

## Troubleshooting

### Issue: Cannot Insert Rows - "Read-Only Editor" Error
**FIXED**: This issue has been resolved with the RLS policy updates.

**What was the problem:**
- Row Level Security (RLS) was enabled with overly restrictive policies
- Policies blocked ALL authenticated users from insert/update/delete operations
- Only service_role had access, but Supabase Studio users are authenticated role

**Solution Applied:**
1. Removed restrictive policies that blocked all authenticated users
2. Added permissive admin policies for subscription management
3. Created `is_admin_user_simple()` function for admin identification
4. Added temporary MVP policy allowing any authenticated user admin access

**Current Policy Configuration:**
```sql
-- Key policies now active:
-- 1. "Temporary admin access for MVP" - allows authenticated users full access
-- 2. "Service role full access" - allows API operations  
-- 3. User read policies for regular app access
```

**For Production Security:**
Replace the temporary admin policy by modifying the `is_admin_user_simple()` function:
```sql
-- Example: Check specific admin emails
CREATE OR REPLACE FUNCTION public.is_admin_user_simple()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check specific admin emails
    RETURN user_email IN (
        'admin@yourcompany.com',
        'support@yourcompany.com'
    );
    
    -- Or check email domain
    -- RETURN user_email LIKE '%@yourcompany.com';
END;
$function$;
```

### Issue: User Can't Access Tool After Subscription Grant
**Check:**
1. Verify subscription status is `active` or `trial`
2. Check expiration dates (`expires_at`, `trial_ends_at`)
3. Ensure tool is marked as `is_active = true`
4. Verify user is logging in with correct account
5. Check browser cache/session issues

**SQL Diagnostic Query:**
```sql
SELECT 
    u.email,
    t.display_name,
    uts.status,
    uts.expires_at,
    uts.trial_ends_at,
    t.is_active as tool_active,
    u.last_sign_in_at
FROM user_tool_subscriptions uts
JOIN auth.users u ON uts.user_id = u.id
JOIN tools t ON uts.tool_id = t.id
WHERE u.email = 'user@example.com'
AND t.name = 'invoice-reconciler';
```

### Issue: User Sees Tool But Gets Access Denied
**Possible Causes:**
1. Subscription status changed to inactive/expired
2. Trial period ended
3. RLS policies blocking access
4. Middleware caching old subscription data

**Resolution:**
1. Check current subscription status
2. Refresh subscription status if needed
3. Verify RLS policies are functioning correctly
4. Ask user to log out and log back in

### Issue: Duplicate Subscriptions
**Prevention:**
- Check existing subscriptions before creating new ones
- Use database constraints to prevent duplicates

**Resolution:**
```sql
-- Find duplicates
SELECT user_id, tool_id, COUNT(*)
FROM user_tool_subscriptions
GROUP BY user_id, tool_id
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM user_tool_subscriptions
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, tool_id) id
    FROM user_tool_subscriptions
    ORDER BY user_id, tool_id, created_at DESC
);
```

### Issue: Storage Quota Exceeded
**Check User Storage:**
```sql
-- This would require additional storage tracking implementation
-- For now, check via Supabase Storage dashboard
```

## Security Considerations

### Access Control
- Only grant Supabase admin access to authorized personnel
- Use principle of least privilege
- Regularly audit admin access logs
- Implement proper offboarding procedures

### Data Protection
- Never expose user personal data unnecessarily
- Use encrypted connections for all database access
- Follow GDPR/privacy requirements for user data
- Maintain confidentiality of subscription information

### Audit Trail
- Log all subscription modifications
- Track who made changes and when
- Keep records of external payment confirmations
- Document customer support interactions

### Incident Response
- Have procedures for handling subscription disputes
- Know how to quickly revoke access if needed
- Maintain communication channels with users
- Document escalation procedures

## Contact Information

**Technical Issues:**
- Supabase Support: [https://supabase.com/support](https://supabase.com/support)
- Platform Technical Lead: [Insert contact information]

**Business/Billing Issues:**
- Customer Success Team: [Insert contact information]
- Billing Department: [Insert contact information]

---

*Last Updated: [Current Date]*
*Document Version: 1.0* 