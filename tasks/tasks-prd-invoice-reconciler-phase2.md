# Task List: Invoice Reconciler Tool Implementation (Phase 2)

Based on PRD: `docs/prd-supabase-saas-invoice-reconciler.md`

## From Original Task List

- **IMPORTANT - Directory Navigation:**
  - **Next.js commands (npm run dev, npm run build, etc.):** Must be run from `nextjs/` directory
  - **Supabase commands:** Run from `supabase/` directory  
  - **Database migrations:** Run from `supabase/` directory
  - **Root-level commands:** Only for project-wide operations like Playwright tests
  - **PowerShell Syntax:** Use `cd nextjs; npm run dev` or separate commands on new lines
- **Landing Page Gradient Color Scheme (for consistency across all sections):**
  - **Main Headlines:** `from-primary via-blue-600 to-violet-600`
  - **Primary Buttons/CTAs:** `from-gray-800 via-blue-500 to-blue-600`
  - **Secondary Buttons:** `from-blue-600 via-violet-500 to-violet-700`
  - **Feature Icons/Cards:** Progressive gradient flow through blue-violet-purple spectrum:
    - `from-gray-800 via-blue-500 to-blue-600`
    - `from-blue-600 via-blue-500 to-violet-500`
    - `from-blue-500 via-violet-500 to-violet-600`
    - `from-violet-500 via-violet-600 to-purple-600`
    - `from-violet-600 via-purple-500 to-purple-600`
    - `from-purple-500 via-purple-600 to-violet-700`
  - **Background Sections:** `from-gray-800 via-blue-500 to-blue-600` for main sections
  - **Text Colors on Gradients:** `text-white` for icons, `text-blue-100` for descriptive text
  - **Hover Effects:** `hover:scale-105`, `hover:shadow-xl`, `border-blue-200` for consistency
- **Navigation Bar Design:** "My Agent" branded navigation with modern responsive design, featuring blue gradient theme throughout, mobile hamburger menu, smooth animations, and clean anchor link navigation
- **Process Section Design:** Sophisticated brainpool.ai-inspired visual design with meaningful icons for each step, 3D-style step number boxes, enhanced visual hierarchy, phase badges, glow effects, hover animations, and modern timeline section
- **Agentic Testing:** AI agent handles all technical testing including:
  - **Unit Tests:** Component and utility function testing (Jest/Vitest)
  - **Integration Tests:** API endpoint and database integration testing
  - **End-to-End Tests:** Playwright MCP for browser automation, user flows, and UI interactions
  - **Visual Tests:** Playwright for responsive design and visual regression testing
- **User Testing:** User only performs business acceptance testing (does it meet requirements?) after agent completes all technical testing
- Use `npx jest [optional/path/to/test/file]` for unit/integration tests
- Use `npx playwright test [optional/test/file]` for end-to-end tests (handled by AI agent)
- Storage bucket policies must enforce 100MB per user quota
- All new database operations should leverage RLS policies for security
- **Testing Protocol:** Each sub-task marked "Test" means the AI agent should write and run automated tests (unit, integration, and Playwright e2e), then demonstrate functionality to user for acceptance

## Foundation Work Completed (Tasks 1-5 ✅)


**Database & Infrastructure:** Complete database schema with tools, user_tool_subscriptions, saved_invoices, reconciliation_jobs, and airline_types tables. All RLS policies implemented. Supabase storage bucket configured with 100MB quota enforcement.

**Authentication:** Google OAuth + email/password login fully integrated. Subscription-based route protection implemented.

**Landing Page:** Professional "My Agent" branded landing page with modern blue gradient design, responsive navigation, Hero/Features/Process/CTA sections, and internationalization structure.

**Customer Dashboard:** Production-ready dashboard replacing template demos. Features ToolCard component with subscription status indicators, RecentJobs component, loading states, error handling, and user settings integration.

**Subscription Management:** Manual admin subscription control via Supabase Studio. Comprehensive subscription validation, status badges, and access control system.

## Relevant Files

**Supabase Project Information:**
- **Project ID**: `hcyteovnllklmvoptxjr` (Active)
- **Region**: us-east-1
- **Organization**: By Nomi

**Database Schema (Completed):**
- `supabase/migrations/20241230130700_create_tools_table.sql` - Tool definitions and configurations
- `supabase/migrations/20241230130701_create_user_tool_subscriptions.sql` - User subscription tracking
- `supabase/migrations/20241230130702_create_saved_invoices_table.sql` - Invoice storage with metadata and airline relationships
- `supabase/migrations/20241230130703_create_reconciliation_jobs_table.sql` - Job tracking with status and file references
- `supabase/migrations/20241230130704_create_airline_types_table.sql` - Airline configurations for processing rules
- `supabase/migrations/20241230130705_create_rls_policies_tools.sql` - Row-level security for tools and subscriptions
- `supabase/migrations/20241230130706_create_rls_policies_invoices.sql` - User isolation policies for invoice data
- `supabase/migrations/20241230130707_create_rls_policies_jobs.sql` - Access control for reconciliation jobs
- `supabase/migrations/20241230130708_create_storage_bucket.sql` - Invoice file storage with organization structure
- `supabase/migrations/20241230130709_create_storage_policies.sql` - File access and upload permissions
- `supabase/migrations/20241230130710_create_storage_quota.sql` - 100MB per user storage enforcement
- `nextjs/src/lib/supabase/types.ts` - Generated TypeScript types for complete schema

**Foundation Components (Completed):**
- `nextjs/src/app/app/page.tsx` - Customer dashboard with subscription status summary
- `nextjs/src/components/Dashboard/ToolCard.tsx` - Tool access cards with subscription validation
- `nextjs/src/components/Dashboard/RecentJobs.tsx` - Job history display component
- `nextjs/src/lib/supabase/queries/tools.ts` - Database query utilities for tools and subscriptions
- `nextjs/src/lib/supabase/queries/jobs.ts` - Database query utilities for reconciliation jobs

**Invoice Reconciler Implementation Files:**
- `nextjs/src/app/app/invoice-reconciler/page.tsx` - Main invoice reconciler tool page with subscription validation, blue gradient theme, loading states, access control, and placeholder sections for airline selection and file management
- `nextjs/src/components/InvoiceReconciler/AirlineSelector.tsx` - Airline dropdown selector component
- `nextjs/src/components/InvoiceReconciler/InvoiceManager.tsx` - Saved invoices management component
- `nextjs/src/components/InvoiceReconciler/FileUpload.tsx` - File upload interface component
- `nextjs/src/components/InvoiceReconciler/JobHistory.tsx` - Job history display component
- `nextjs/src/lib/fileUtils/duplicateDetection.ts` - File hash and duplicate detection utilities
- `nextjs/src/lib/fileUtils/storageManager.ts` - Supabase storage management utilities
- `nextjs/src/app/api/reconcile/route.ts` - Main reconciliation API endpoint
- `nextjs/src/lib/processors/base/BaseProcessor.ts` - Base class for airline processors
- `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts` - Fly Dubai reconciliation processor
- `nextjs/src/lib/processors/tap/TapProcessor.ts` - TAP reconciliation processor
- `nextjs/src/lib/processors/philippines/PhilippinesProcessor.ts` - Philippines Airlines processor
- `nextjs/src/lib/processors/airIndia/AirIndiaProcessor.ts` - Air India processor
- `nextjs/src/lib/processors/elAl/ElAlProcessor.ts` - El Al processor
- `nextjs/src/lib/processors/utils/pdfExtractor.ts` - PDF data extraction utilities
- `nextjs/src/lib/processors/utils/excelExtractor.ts` - Excel data extraction utilities
- `nextjs/src/lib/processors/utils/reportGenerator.ts` - Excel report generation utilities
- `nextjs/src/app/api/jobs/route.ts` - Job management API endpoints
- `nextjs/src/app/api/invoices/route.ts` - Saved invoices management API
- `nextjs/src/app/api/download/[jobId]/route.ts` - Secure file download endpoint

**Testing Files:**
- `tests/unit/` - Unit test files for components and utilities
- `tests/integration/` - Integration test files for API endpoints
- `tests/e2e/` - Playwright end-to-end test files
- `tests/e2e/invoice-reconciler.spec.ts` - Invoice reconciler tool Playwright tests
- `tests/e2e/file-upload.spec.ts` - File upload workflow Playwright tests
- `tests/e2e/dashboard-visual-consistency.spec.ts` - Comprehensive visual consistency tests across device sizes with blue gradient theme validation, component alignment checks, typography testing, accessibility verification, and visual regression testing

**Dashboard Redesign Testing Results (Task 6.16):**
- ✅ **Visual Theme Consistency:** Blue gradient design successfully implemented across all pages (landing, login, register)
- ✅ **Branding Consistency:** "My Agent" branding properly applied throughout the application
- ✅ **Responsive Design:** Mobile and desktop layouts working correctly with consistent blue gradient theme
- ✅ **Route Protection:** Authentication-based access control functioning properly
- ✅ **Navigation:** Clean navigation with hamburger menu on mobile, proper responsive behavior
- ✅ **Loading States:** Application loads correctly on development server (port 3002)
- ✅ **Authentication Pages:** Login and register pages display proper blue gradient styling with Google OAuth integration
- ✅ **Landing Page:** Professional SaaS landing page with comprehensive blue gradient design, multiple CTAs, and lead generation forms

**Demonstrated Functionality:**
- Landing page with full blue gradient theme and "My Agent" branding
- Responsive design working on mobile (375x667) and desktop viewports
- Login and register pages with consistent styling and Google OAuth integration
- Route protection redirecting unauthenticated users to login
- Navigation and user interface elements properly styled with blue gradient theme
- Professional business presentation suitable for client demonstrations

### Notes

- **Directory Navigation:** 
  - **Next.js commands:** Run from `nextjs/` directory (`cd nextjs; npm run dev`)
  - **Supabase commands:** Run from `supabase/` directory
  - **PowerShell Syntax:** Use `;` not `&&` for command chaining
- **Development Standards:**
  - **Supabase MCP:** Use Supabase MCP (Model Context Protocol) for all database operations
  - **Row Level Security:** All new tables and storage require RLS policies
  - **TypeScript:** Full type safety with generated types from Supabase schema
  - **Testing:** AI agent handles all technical testing before user demonstration
  - **Storage:** Enforce 100MB per user quota, organize by user/tool/job structure
- **Supported Airlines:** Fly Dubai, TAP, Philippines Airlines, Air India, El Al
- **File Limits:** 25MB per file upload, PDF invoices (airline-specific), Excel reports (standardized)
- **Testing Protocol:** AI runs automated tests (unit, integration, Playwright e2e), then demonstrates to user for acceptance

## Tasks

- [ ] 6.0 Dashboard UI Redesign - Visual Theme Consistency - World Class UI Design
  - [x] 6.1 Update dashboard page background and container styling to match landing page blue gradient theme
  - [x] 6.2 Redesign ToolCard component styling with blue gradient accents while preserving all functionality
  - [x] 6.3 Update ToolCard hover effects and transitions to match landing page interaction patterns
  - [x] 6.4 Redesign RecentJobs component styling with consistent blue gradient theme elements
  - [x] 6.5 Update subscription status badges and indicators with blue gradient color scheme
  - [x] 6.6 Redesign Account Settings section cards to match landing page visual hierarchy
  - [x] 6.7 Update AppLayout navigation styling for visual consistency with landing page
  - [x] 6.8 Implement consistent button styling across dashboard using landing page gradient patterns
  - [x] 6.9 Update loading skeleton components to match new blue gradient theme
  - [x] 6.10 Ensure responsive design consistency across all dashboard components with new styling
  - [x] 6.11 Update branding consistency: Change "Invoice Reconciler SaaS Platform" to "My Agent" in login, register pages, and dashboard hamburger menu
  - [x] 6.12 Redesign login and register pages to match blue gradient theme (remove template quotes and pink design elements and replace with process elements from landing page)
  - [x] 6.13 Update error states and feedback components to match blue gradient theme
  - [x] 6.14 Create automated visual regression tests for dashboard redesign
  - [x] 6.15 Create Playwright tests for dashboard visual consistency across device sizes
  - [x] 6.16 Test dashboard functionality preservation after styling updates, then demonstrate redesigned dashboard for user acceptance

- [x] 7.0 Invoice Reconciler - Core Interface & Airline Selection
  - [x] 7.1 Create main invoice reconciler page component with basic layout
  - [x] 7.2 Create AirlineSelector component with dropdown for 5 airlines
  - [x] 7.3 Add airline selection state management to main page
  - [x] 7.4 Implement dynamic interface updates based on airline selection
  - [x] 7.5 ~~Add airline-specific instruction text component~~ **REMOVED** - User requested removal of airline-specific instruction text component entirely
  - [x] 7.6 Create validation logic requiring invoice selection before proceeding to next step
  - [x] 7.8 Add error handling for airline selection functionality
  - [x] 7.9 Implement subscription validation for invoice reconciler tool access
  - [x] 7.10 Create automated tests for airline selection functionality, then demonstrate interface for user acceptance
  - [x] 7.11 Create Playwright tests for airline selector dropdown interactions
  - [x] 7.12 Create Playwright tests for dynamic interface updates and validation flows, then demonstrate airline selection interface for user acceptance

- [ ] 8.0 Invoice Reconciler - Invoice Selection & Management System (Step 2: Select or Upload Invoice)
  - [x] 8.1 Create saved invoices query utility for fetching user invoices by airline
  - [x] 8.2 Create InvoiceManager component to display saved invoices for selected airline
  - [x] 8.3 Implement saved invoice list with filename, upload date, file size display
  - [x] 8.4 Add invoice selection functionality (radio buttons or similar for choosing existing invoice)
  - [x] 8.5 Create FileUpload component for PDF invoices with basic upload functionality
  - [x] 8.6 Add drag-and-drop functionality to PDF upload component
  - [x] 8.7 Implement client-side file validation (PDF type, size up to 25MB)
  - [x] 8.8 Create file hash generation utility using SHA-256 for duplicate detection
  - [xg] 8.9 Create duplicate detection utility comparing hash/filename/size
  - [x] 8.10 Create Supabase storage upload utility with proper file organization (user_id/awhirline_type/)
  - [x] 8.11 Integrate InvoiceManager and FileUpload into step 2 workflow (select existing OR upload new)
  - [x] 8.12 Add delete functionality for saved invoices in InvoiceManager
  - [x] 8.13 Implement upload progress indicators and success/error feedback
  - [x] 8.14 Create storage quota tracking and enforcement (100MB per user)
  - [x] 8.15 Add validation logic to ensure either existing invoice selected OR new invoice uploaded
  - [x] 8.16 Create automated tests for invoice selection functionality
  - [x] 8.17 ~~Create automated tests for file upload and duplicate detection~~ (Skipped per user request)
  - [x] 8.18 Demonstrate invoice selection, upload, and management operations for user acceptance (Automated tests for management operations skipped per user request)
  - [x] 8.19 ~~Create Playwright tests for invoice selection workflow (existing vs new upload)~~ (Skipped per user request)
  - [x] 8.20 ~~Create Playwright tests for drag-and-drop file upload interactions~~ (Skipped per user request)
  - [x] 8.21 Demonstrate complete invoice selection system including duplicate detection and management flows for user acceptance (Playwright tests skipped per user request)

- [ ] 9.0 Invoice Reconciler - Excel Report Upload System (Step 3: Upload Excel Report)
  - [ ] 9.1 Create FileUpload component for Excel reports (standardized format)
  - [ ] 9.2 Add drag-and-drop functionality to Excel report upload component
  - [ ] 9.3 Implement client-side file validation for Excel files (type, size up to 25MB)
  - [ ] 9.4 Create Supabase storage upload utility for Excel reports (user_id/jobs/job_id/)
  - [ ] 9.5 Implement upload progress indicators and success/error feedback for Excel uploads
  - [ ] 9.6 Add validation logic requiring Excel report upload before proceeding to processing
  - [ ] 9.7 Create automated tests for Excel report upload functionality
  - [ ] 9.8 Create Playwright tests for Excel report upload workflow, then demonstrate Excel upload system for user acceptance

- [ ] 10.0 Invoice Reconciler - Reconciliation Processing Engine (Step 4: Processing)
  - [ ] 10.1 Create BaseProcessor abstract class with common interface
  - [ ] 10.2 Create PDF data extraction utility using pdf-parse library
  - [ ] 10.3 Create Excel data extraction utility using exceljs library
  - [ ] 10.4 Create FlyDubaiProcessor class extending BaseProcessor
  - [ ] 10.5 Implement PDF data extraction logic for Fly Dubai invoices
  - [ ] 10.6 Implement reconciliation logic for Fly Dubai processor
  - [ ] 10.7 Create TapProcessor class extending BaseProcessor
  - [ ] 10.8 Implement PDF data extraction logic for TAP invoices
  - [ ] 10.9 Implement reconciliation logic for TAP processor
  - [ ] 10.10 Create PhilippinesProcessor class extending BaseProcessor
  - [ ] 10.11 Implement PDF data extraction logic for Philippines Airlines invoices
  - [ ] 10.12 Implement reconciliation logic for Philippines Airlines processor
  - [ ] 10.13 Create AirIndiaProcessor class extending BaseProcessor
  - [ ] 10.14 Implement PDF data extraction logic for Air India invoices
  - [ ] 10.15 Implement reconciliation logic for Air India processor
  - [ ] 10.16 Create ElAlProcessor class extending BaseProcessor
  - [ ] 10.17 Implement PDF data extraction logic for El Al invoices
  - [ ] 10.18 Implement reconciliation logic for El Al processor
  - [ ] 10.19 Create main reconciliation API endpoint structure
  - [ ] 10.20 Implement job queuing logic in reconciliation API
  - [ ] 10.21 Add status tracking to reconciliation jobs
  - [ ] 10.22 Implement error handling and logging for reconciliation processes
  - [ ] 10.23 Create automated tests for Fly Dubai processor with sample data
  - [ ] 10.24 Create automated tests for TAP processor with sample data
  - [ ] 10.25 Create automated tests for Philippines Airlines processor with sample data
  - [ ] 10.26 Create automated tests for Air India processor with sample data
  - [ ] 10.27 Create automated tests for El Al processor with sample data
  - [ ] 10.28 Run end-to-end automated tests for all airlines, then demonstrate reconciliation workflow for user acceptance
  - [ ] 10.29 Create Playwright end-to-end tests for complete reconciliation workflows
  - [ ] 10.30 Create Playwright tests for job status tracking and error handling scenarios, then demonstrate processing engine for user acceptance

- [ ] 11.0 Invoice Reconciler - Results & Reporting System (Step 5: Download Results)
  - [ ] 11.1 Create Excel report generation utility with basic structure
  - [ ] 11.2 Implement multi-sheet Excel report creation
  - [ ] 11.3 Add conditional formatting utility for highlighting discrepancies
  - [ ] 11.4 Create summary sheet generation for Excel reports
  - [ ] 11.5 Create reconciliation sheet generation with side-by-side comparisons
  - [ ] 11.6 Implement airline-specific report formatting
  - [ ] 11.7 Create secure file download system using Supabase signed URLs
  - [ ] 11.8 Create JobHistory component for displaying past reconciliations
  - [ ] 11.9 Implement job status tracking in JobHistory component
  - [ ] 11.10 Add download links to completed jobs in JobHistory
  - [ ] 11.11 Create job management API endpoint for status updates
  - [ ] 11.12 Create job management API endpoint for file retrieval
  - [ ] 11.13 Implement real-time job status updates in UI
  - [ ] 11.14 Add report metadata display to job history
  - [ ] 11.15 Create cleanup procedures for temporary files
  - [ ] 11.16 Create cleanup procedures for completed jobs
  - [ ] 11.17 Create automated tests for Excel report generation
  - [ ] 11.18 Create automated tests for file download functionality
  - [ ] 11.19 Create automated tests for job management operations, then demonstrate complete workflow for user acceptance
  - [ ] 11.20 Create Playwright tests for job history interactions and status updates
  - [ ] 11.21 Create Playwright tests for file download workflows
  - [ ] 11.22 Create Playwright end-to-end tests for complete reconciliation-to-download user journey, then demonstrate complete results system for user acceptance 