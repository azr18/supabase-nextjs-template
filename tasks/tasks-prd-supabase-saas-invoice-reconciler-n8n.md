# Task List: Supabase-Based SaaS Platform Core & N8N-Powered Invoice Reconciler MVP

Based on PRD: `docs/prd-supabase-saas-invoice-reconciler-n8n.md`

## Overview

This task list reflects the architectural change from in-app reconciliation processing to an N8N-powered external workflow approach. The key differences from the original approach include:

**Simplified Architecture:**
- External N8N workflows handle all reconciliation processing logic
- App focuses on file upload, webhook triggering, and temporary report management  
- No complex airline-specific processors or reconciliation logic in the app
- Simplified database schema without persistent invoice storage or complex job management
- Temporary report storage with automatic 48-hour cleanup

**Core Workflow:**
1. User selects airline type
2. User uploads PDF invoice file
3. User uploads Excel report file  
4. User submits request
5. App stores files temporarily and triggers N8N webhook
6. N8N workflow processes files and returns reconciliation report
7. User downloads temporary report (48-hour expiry)

**N8N Integration Points:**
- Webhook trigger with job details and file paths
- Status callback endpoints for real-time updates
- Report delivery callback for completed processing
- Secure file access patterns for N8N workflows

## Relevant Files

**Database & Infrastructure:**
- `supabase/migrations/20250529103900_create_tools_table.sql` - Basic tools table (COMPLETED)
- `supabase/migrations/20250529104500_create_user_tool_subscriptions_table.sql` - Subscription management (COMPLETED)
- `supabase/migrations/20250529105500_create_reconciliation_jobs_table_n8n.sql` - N8N-focused jobs table with webhook integration fields (COMPLETED)
- `supabase/migrations/20250529110000_create_airline_types_table.sql` - Airline configurations (COMPLETED)
- `supabase/migrations/20250529110500_setup_rls_policies_tools_subscriptions.sql` - Core RLS policies (COMPLETED)
- `supabase/migrations/20250529111500_setup_rls_policies_reconciliation_jobs_n8n.sql` - N8N job policies (COMPLETED)
- `supabase/migrations/20250529114000_create_invoice_reconciler_storage_bucket.sql` - Temporary file storage (COMPLETED)
- `supabase/migrations/20250529114500_create_reconciler_reports_storage_bucket.sql` - Temporary report storage (COMPLETED)
- `supabase/migrations/20250529115000_configure_storage_bucket_rls_policies.sql` - RLS policies for storage buckets (COMPLETED)
- `supabase/migrations/20250529116000_create_database_constraints_referential_integrity.sql` - Database constraints (COMPLETED)
- `nextjs/src/lib/supabase/types.ts` - Generated TypeScript types (COMPLETED)
- `tests/database/verify-database-setup.js` - Database verification script (COMPLETED)
- `tests/database/database-verification-results.md` - Comprehensive verification report (COMPLETED)

**N8N Integration with Signed URLs:**
- `nextjs/src/lib/n8n/webhookClient.ts` - N8N webhook integration client with signed URL generation
- `nextjs/src/lib/n8n/signedUrlGenerator.ts` - Secure signed URL generation utility
- `nextjs/src/lib/n8n/statusUpdates.ts` - Status update handlers
- `nextjs/src/app/api/reconcile-n8n/route.ts` - Webhook trigger endpoint with signed URLs
- `nextjs/src/app/api/n8n-callback/route.ts` - N8N callback handler
- `nextjs/src/app/api/download-temp/[jobId]/route.ts` - Temporary download endpoint
- `nextjs/src/app/api/regenerate-urls/[jobId]/route.ts` - Regenerate expired signed URLs endpoint
- `docs/n8n-integration-guide.md` - N8N setup and integration documentation
- `docs/n8n-file-integration-architecture.md` - Signed URL architecture documentation (COMPLETED)
- `docs/n8n-workflow-diagram.md` - Visual workflow diagram with Mermaid chart (COMPLETED)

**User Interface:**
- `nextjs/src/app/app/invoice-reconciler/page.tsx` - Main tool page with sequential workflow
- `nextjs/src/components/InvoiceReconciler/AirlineSelector.tsx` - Airline dropdown
- `nextjs/src/components/InvoiceReconciler/FileUploadSequential.tsx` - Step-by-step upload workflow
- `nextjs/src/components/InvoiceReconciler/JobStatus.tsx` - Real-time N8N status tracking
- `nextjs/src/components/InvoiceReconciler/TemporaryReportDownload.tsx` - Download with expiry warnings

**Testing:**
- `tests/integration/n8n-webhook-integration.test.ts` - Webhook simulation tests
- `tests/e2e/invoice-reconciler-n8n.spec.ts` - End-to-end N8N workflow tests
- `tests/e2e/n8n-webhook-integration.spec.ts` - Webhook integration tests
- `tests/integration/codebase-cleanup-verification.test.js` - Automated verification that removed code doesn't break functionality

**Files/Directories Removed (Previous Implementation - COMPLETED):**
- ✅ `python-pdf-service/` - Entire Python PDF processing service directory (removed)
- ✅ `nextjs/src/lib/processors/` - All airline-specific processor implementations (removed)
- ✅ `nextjs/src/app/api/reconcile/route.ts` - Old reconciliation API endpoint (removed)
- ✅ `nextjs/src/app/api/reconcile-simple/route.ts` - Simplified reconciliation endpoint (removed)
- ✅ `nextjs/src/app/api/invoices/route.ts` - Old invoice management API endpoint (removed)
- ✅ `nextjs/src/components/InvoiceReconciler/InvoiceManager.tsx` - Old invoice management component (removed)
- ✅ `nextjs/src/components/InvoiceReconciler/FileUpload.tsx` - Old file upload component (removed)
- ✅ `nextjs/src/components/InvoiceReconciler/JobHistory.tsx` - Old job history component (removed)
- ✅ `nextjs/src/lib/fileUtils/duplicateDetection.ts` - Duplicate detection (removed)
- ✅ Test files specific to removed processors and components (removed)
- ✅ References to removed code in documentation files (cleaned up)
- ✅ All cleanup verified with automated tests

## Tasks

- [x] 0.0 Codebase Cleanup - Remove Previous Invoice Tool Implementation
  - [x] 0.1 Remove Python PDF service directory (`python-pdf-service/`)
  - [x] 0.2 Remove existing airline-specific processors directory (`nextjs/src/lib/processors/`)
  - [x] 0.3 Remove existing invoice reconciler API routes that conflict with N8N approach
  - [x] 0.4 Remove existing complex reconciliation logic and utilities
  - [x] 0.5 Clean up any temporary or test files from previous implementation
  - [x] 0.6 Remove any existing invoice reconciler components that won't be reused
  - [x] 0.7 Update package.json to remove dependencies only used by removed components
  - [x] 0.8 Review and remove any database migrations specific to old approach that conflict with N8N approach
  - [x] 0.9 Clean up any references to removed code in existing files
  - [x] 0.10 Create automated tests to verify removed code doesn't break existing functionality, then demonstrate clean codebase for user acceptance
  - [x] 0.11 Complete Docker setup cleanup - remove all remaining Python service references from deployment scripts, environment files, and nginx configuration
  - [x] 0.12 Create clean Docker setup for N8N approach with docker-compose.yml, local testing script, and Hetzner deployment guide

- [x] 1.0 Database Schema & Infrastructure Setup (N8N-Focused)
  - [x] 1.1 Create database migration file for `tools` table with basic schema
  - [x] 1.2 Create database migration file for `user_tool_subscriptions` table with foreign keys
  - [x] 1.3 Create database migration file for `reconciliation_jobs` table with N8N integration fields (webhook_payload, status, result_file_path, expires_at)
  - [x] 1.4 Create database migration file for `airline_types` table with configuration
  - [x] 1.5 Create RLS policies migration for `tools` and `user_tool_subscriptions` tables
  - [x] 1.6 Create RLS policies migration for `reconciliation_jobs` table with N8N integration support
  - [x] 1.7 Create Supabase storage bucket `invoice-reconciler` with structure for temporary job files
  - [x] 1.8 Create Supabase storage bucket `reconciler-reports` for temporary report storage
  - [x] 1.9 Configure storage bucket RLS policies for user isolation and temporary access
  - [x] 1.10 Configure storage bucket quota enforcement (250MB per user) with automatic cleanup (SKIPPED - No restraint needed)
  - [x] 1.11 Create database constraints for referential integrity
  - [x] 1.12 Generate TypeScript types for new database schema
  - [x] 1.13 Create automated tests for database setup, then demonstrate schema in Supabase Studio for user acceptance

- [ ] 2.0 N8N-Powered Invoice Reconciler - Core Interface
  - [ ] 2.1 Create main invoice reconciler page component with N8N workflow integration
  - [ ] 2.2 Create AirlineSelector component with dropdown for 5 airlines
  - [ ] 2.3 Add airline selection state management to main page
  - [ ] 2.4 Create sequential file upload interface: Step 1 (Select Airline) → Step 2 (Upload PDF) → Step 3 (Upload Excel) → Step 4 (Submit)
  - [ ] 2.5 Add visual progress indicators for the 4-step workflow
  - [ ] 2.6 Create validation logic requiring both files before submission
  - [ ] 2.7 Add loading states for file upload operations
  - [ ] 2.8 Add error handling for file upload functionality
  - [ ] 2.9 Implement subscription validation for invoice reconciler tool access
  - [ ] 2.10 Create automated tests for airline selection and upload workflow, then demonstrate interface for user acceptance

- [ ] 3.0 N8N Integration - File Management & Webhook System (MVP: Direct File Access)
  - [ ] 3.1 Create FileUploadSequential component for PDF then Excel workflow
  - [ ] 3.2 Add drag-and-drop functionality to upload components
  - [ ] 3.3 Implement client-side file validation (type, size up to 25MB)
  - [ ] 3.4 Create Supabase storage upload utility with job-specific organization
  - [ ] 3.5 Create unique job ID generation for each reconciliation request
  - [ ] 3.6 Implement upload progress indicators and success/error feedback
  - [ ] 3.7 Create N8N webhook client with authentication and retry logic
  - [ ] 3.8 Create N8N webhook payload builder with file paths, metadata, and airline configuration (MVP version)
  - [ ] 3.9 Create N8N webhook trigger API endpoint with direct file path access
  - [ ] 3.10 Configure N8N service key access to Supabase storage buckets for MVP
  - [ ] 3.11 Implement webhook failure handling with user feedback
  - [ ] 3.12 Create storage quota tracking and enforcement
  - [ ] 3.13 Create automated tests for file upload and N8N webhook triggering with direct file access
  - [ ] 3.14 Create Playwright tests for drag-and-drop file upload interactions
  - [ ] 3.15 Create Playwright tests for file validation and webhook integration, then demonstrate complete upload and trigger system for user acceptance

- [ ] 4.0 N8N Integration - Status Tracking & Report Management
  - [ ] 4.1 Create job status tracking with states: "uploading", "submitted", "processing", "completed", "failed"
  - [ ] 4.2 Create JobStatus component for real-time status display
  - [ ] 4.3 Create N8N callback endpoint for status updates
  - [ ] 4.4 Create N8N callback endpoint for report delivery
  - [ ] 4.5 Implement status update processing and database updates
  - [ ] 4.6 Create temporary report storage management
  - [ ] 4.7 Create TemporaryReportDownload component with expiration warnings
  - [ ] 4.8 Create secure temporary download API endpoint
  - [ ] 4.9 Implement automatic cleanup of expired reports (48 hours)
  - [ ] 4.10 Create job management API endpoints for N8N integration
  - [ ] 4.11 Add real-time status updates in UI
  - [ ] 4.12 Create download tracking and re-download capability
  - [ ] 4.13 Create automated tests for status tracking and report management
  - [ ] 4.14 Create Playwright tests for job status updates and download workflows
  - [ ] 4.15 Create Playwright end-to-end tests for complete N8N integration workflow, then demonstrate complete status tracking and report system for user acceptance

- [ ] 5.0 N8N Integration Documentation & Testing
  - [ ] 5.1 Create comprehensive N8N integration guide documentation for MVP (direct file access)
  - [ ] 5.2 Document webhook payload specifications with file paths for N8N workflows
  - [ ] 5.3 Document callback URL specifications for status updates
  - [ ] 5.4 Document N8N Supabase node configuration for direct file access
  - [ ] 5.5 Create webhook authentication documentation
  - [ ] 5.6 Create N8N workflow requirements documentation for MVP
  - [ ] 5.7 Create integration testing with N8N webhook simulation using direct file access
  - [ ] 5.8 Create error scenario testing for webhook failures and file access issues
  - [ ] 5.9 Create performance testing for file upload and webhook processing
  - [ ] 5.10 Create end-to-end integration tests simulating complete N8N workflows, then demonstrate N8N integration documentation and testing for user acceptance

- [ ] 6.0 Production Security Upgrade (Post-MVP) - Signed URLs Implementation
  - [ ] 6.1 Create signed URL generation utility for secure file access
  - [ ] 6.2 Update N8N webhook payload builder to support signed URLs
  - [ ] 6.3 Create API endpoint for regenerating expired signed URLs
  - [ ] 6.4 Implement signed URL expiration monitoring and alerts
  - [ ] 6.5 Update N8N workflows to use HTTP download nodes instead of Supabase nodes
  - [ ] 6.6 Document signed URL architecture and security model
  - [ ] 6.7 Create migration guide from direct file access to signed URLs
  - [ ] 6.8 Update integration tests for signed URL approach
  - [ ] 6.9 Performance test signed URL generation and N8N download speeds
  - [ ] 6.10 Create monitoring and alerting for URL expiration issues, then demonstrate production-ready security implementation

## Notes

- **Codebase Cleanup Required:** Before implementing N8N approach, all previous invoice tool implementation must be removed including:
  - Python PDF service and related Docker configurations
  - Existing airline-specific processors (FlyDubai, TAP, etc.)
  - Complex reconciliation API routes and logic
  - Unused dependencies and test files
  - Any conflicting database schemas or migrations
- **Simplified Architecture:** This approach removes all complex reconciliation processing from the app, focusing on file handling and webhook integration
- **Hybrid Implementation:** MVP uses direct file retrieval for speed, production upgrades to signed URLs for security
- **MVP Approach:** N8N uses Supabase service key for direct file access, faster to implement and test
- **Production Security:** Upgrade path to signed URLs (2-hour expiry) eliminates need for permanent credentials in production
- **N8N Requirements:** External N8N workflows must handle all airline-specific processing logic with configurable file access patterns
- **Temporary Storage:** Reports are temporarily stored for 48 hours with automatic cleanup
- **Real-time Updates:** Status tracking through N8N callback endpoints provides user feedback
- **Migration Path:** Clear upgrade path from MVP direct access to production signed URLs
- **Testing Focus:** Emphasis on webhook integration testing with both direct access and signed URL approaches
