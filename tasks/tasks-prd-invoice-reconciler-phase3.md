# Task List: Invoice Reconciler Tool Implementation (Phase 2 - Fly Dubai Backend & Reporting)

Based on PRD: `docs/prd-supabase-saas-invoice-reconciler.md` (updated to reflect `pdfplumber` usage in source Python script `app(1).py`)

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

## Summarized Completed Work

**Foundation Work (Tasks 1-5) ✅:**
Complete database schema (tools, subscriptions, invoices, jobs, airlines), RLS policies, Supabase storage (100MB quota), Google OAuth + email/password authentication, subscription-based route protection, professional landing page, production-ready customer dashboard (ToolCard, RecentJobs), and manual admin subscription management.

**Dashboard UI Redesign (Task 6.0) ✅:**
Comprehensive visual theme consistency applied across the dashboard, login/register pages, and app layout, aligning with the "My Agent" branding and blue gradient scheme of the landing page. All functionality preserved. Automated visual regression and Playwright tests created and passed.

**Core Invoice Reconciler Interface & Airline Selection (Task 7.0) ✅:**
Main UI for the Invoice Reconciler tool is complete. This includes the main page, a functional `AirlineSelector` component (supporting Fly Dubai and other listed airlines), airline selection state management, dynamic UI updates, airline-specific instruction display, invoice selection validation, subscription checks, loading states, error handling, and associated automated tests.

**File Management & Storage System for Invoice Reconciler (Task 8.0) ✅:**
Robust file handling capabilities are implemented. This includes `FileUpload` components for PDF invoices and Excel reports (with drag-and-drop), client-side validation (type, 25MB size limit), file hash generation (SHA-256) and duplicate detection utilities, Supabase storage integration for organized file uploads, a functional `InvoiceManager` component for displaying/filtering/deleting saved invoices, progress indicators, user feedback, and enforcement of the 100MB per-user storage quota. Associated automated tests are complete.

## Detailed Tasks: Fly Dubai Reconciler Implementation (Backend & Reporting)

### 9.0 Invoice Reconciler - Reconciliation Processing Engine (Fly Dubai Focus)

- [ ] 9.1 Create `BaseProcessor.ts` abstract class in `nextjs/src/lib/processors/base/` with a common processing interface (e.g., `process(invoiceFileBuffer: Buffer, reportFileBuffer: Buffer): Promise<ReconciliationResult>`).
    - [ ] 9.1.1 Define `ReconciliationResult` interface (e.g., `{ success: boolean; data?: any; reportBuffer?: Buffer; error?: string; }`).
- [ ] 9.2 PDF Data Extraction Utility (`nextjs/src/lib/processors/utils/pdfExtractor.ts`)
  - [ ] 9.2.1 Research and select the most suitable Node.js PDF library to replicate `pdfplumber`'s layout-aware text extraction capabilities as used in `app(1).py` (e.g., `extract_text(x_tolerance=2, layout=True)` for Fly Dubai PDFs). Consider libraries like `pdfjs-dist` (Mozilla's PDF.js) or other alternatives that provide detailed text positioning and page structure information.
  - [ ] 9.2.2 Implement a wrapper/utility function in `pdfExtractor.ts` using the chosen library. This function should take a PDF buffer and return page-by-page text content along with any necessary layout information (e.g., text coordinates, line breaks that respect layout) required by `FlyDubaiProcessor.ts`.
- [ ] 9.3 Excel Data Extraction Utility (`nextjs/src/lib/processors/utils/excelExtractor.ts`)
  - [ ] 9.3.1 Define the standardized Excel report structure based on `app(1).py` (e.g., header on row 8, key columns: `awbprefix`, `awbsuffix`, `chargewt`, `frt_cost_rate`, `total_cost`). Document this expected structure.
  - [ ] 9.3.2 Implement logic in `excelExtractor.ts` using `exceljs` to read the standardized Excel report according to the defined structure, returning data as an array of objects. Ensure proper handling of data types.
- [ ] 9.4 Create `FlyDubaiProcessor.ts` class in `nextjs/src/lib/processors/flyDubai/` extending `BaseProcessor`.
- [ ] 9.5 Implement PDF data extraction logic specifically for Fly Dubai invoices within `FlyDubaiProcessor.ts`:
  - [ ] 9.5.1 Port all relevant **RegEx patterns** for AWB and CCA data from `app(1).py`'s `extract_awb_data` and `extract_cca_data` functions to JavaScript RegEx. Store these clearly within the processor.
  - [ ] 9.5.2 Implement a method within `FlyDubaiProcessor.ts` (e.g., `_extractAwbData`) that uses the `pdfExtractor.ts` utility. This method should replicate the logic from Python's `extract_awb_data` to process the layout-aware text, apply RegEx, and structure the extracted AWB data (e.g., into an array of AWB data objects). Include dynamic page range detection for AWB data.
  - [ ] 9.5.3 Implement a method within `FlyDubaiProcessor.ts` (e.g., `_extractCcaData`) that uses the `pdfExtractor.ts` utility. This method should replicate the logic from Python's `extract_cca_data` to process layout-aware text, apply RegEx, and structure the extracted CCA data. Include dynamic CCA page detection.
- [ ] 9.6 Implement the main reconciliation logic within the `process` method of `FlyDubaiProcessor.ts`:
  - [ ] 9.6.1 Call internal methods (`_extractAwbData`, `_extractCcaData`) to get structured data from the invoice PDF.
  - [ ] 9.6.2 Use `excelExtractor.ts` to get structured data from the report Excel file.
  - [ ] 9.6.3 Re-implement data cleaning, string manipulation (e.g., for currency, dates), and numeric conversion logic (similar to `pandas` operations in `app(1).py`) for the extracted AWB, CCA, and report data.
  - [ ] 9.6.4 Re-implement the merge/join logic: Combine cleaned AWB data with the cleaned report data based on AWB Prefix and Serial.
  - [ ] 9.6.5 Re-implement difference calculations (e.g., `Diff Net Due`) and discrepancy flagging logic based on `app(1).py`.
  - [ ] 9.6.6 Structure the final processed data (AWB, CCA, reconciled data) to be returned by the `process` method, suitable for report generation.
- [ ] 9.19 Implement/Update the main reconciliation API endpoint in `nextjs/src/app/api/reconcile/route.ts`.
  - [ ] 9.19.1 API accepts `airlineType`, `invoiceFileId`, `reportFileId` (and user context from auth).
  - [ ] 9.19.2 Implement logic to fetch corresponding file buffers from Supabase Storage using `invoiceFileId` and `reportFileId` (from `saved_invoices` table and job input).
  - [ ] 9.19.3 Implement dynamic processor instantiation (if `airlineType` is 'flydubai', instantiate `FlyDubaiProcessor`).
  - [ ] 9.19.4 Call the processor's `process` method with the file buffers.
- [ ] 9.20 Implement job creation and status updates in `nextjs/src/app/api/reconcile/route.ts`:
  - [ ] 9.20.1 Before processing, create a job record in `reconciliation_jobs` table with 'pending' or 'processing' status, linking to the `saved_invoice_id` and storing the report file path used for the job.
  - [ ] 9.20.2 After processing, update the job status to 'completed' or 'failed'. If successful, store the path/ID to the generated report file (from Task 10) in the job record.
- [ ] 9.21 Ensure status tracking in `reconciliation_jobs` table is comprehensive for various stages.
- [ ] 9.22 Implement robust error handling and logging within processors and the API. If processing fails, update job status to 'failed' with an error message.
- [ ] 9.23 Test: Create automated tests for `FlyDubaiProcessor.ts`.
    - [ ] 9.23.1 Prepare sample data: Use `2503013781418TLV010936_25-25.pdf` and a corresponding sample Excel report (that `app(1).py` processes successfully) as test fixtures.
    - [ ] 9.23.2 Write unit tests (Jest/Vitest) for individual methods within `FlyDubaiProcessor.ts` (e.g., `_extractAwbData`, `_extractCcaData`, data cleaning, merge logic, difference calculation). Assert correct output structures and values against expected results based on `app(1).py`.
- [ ] 9.28 Test: Write integration tests for the `POST /api/reconcile` endpoint for Fly Dubai. Mock file fetching, call the API, and verify job record creation/updates in the (test) database. Demonstrate Fly Dubai reconciliation workflow for user acceptance (API level initially).
- [ ] 9.29 Test: Update/Create Playwright end-to-end tests for the complete Fly Dubai reconciliation workflow (UI: select airline, upload files -> API call is triggered -> verify job status eventually becomes 'completed' in UI).
- [ ] 9.30 Test: Enhance Playwright tests to cover job status tracking UI updates (polling or real-time) and error handling scenarios specifically for Fly Dubai processing, then demonstrate processing engine and UI feedback for user acceptance.

### 10.0 Invoice Reconciler - Results & Reporting System (Fly Dubai Focus)

- [ ] 10.1 Create Excel report generation utility (`nextjs/src/lib/processors/utils/reportGenerator.ts`) using `exceljs`.
  - [ ] 10.1.1 Define the multi-sheet Excel report structure for Fly Dubai based on `app(1).py` output (Sheets: Summary, Reconciliation, Invoices, CCA). Document column orders, data types, and expected content for each.
- [ ] 10.2 Implement a function in `reportGenerator.ts` (e.g., `generateFlyDubaiReport(processedData: any): Promise<Buffer>`) that takes the structured output from `FlyDubaiProcessor.process` and generates the multi-sheet Excel file as a Buffer.
- [ ] 10.3 Within `generateFlyDubaiReport`, implement conditional formatting to highlight discrepancies for Fly Dubai reports, mirroring `app(1).py`'s `openpyxl` formatting (e.g., yellow fill for rows, red/orange for specific mismatched cells, bright red with thick borders for `Diff Net Due`).
- [ ] 10.4 Within `generateFlyDubaiReport`, implement summary sheet generation, calculating and displaying metrics as in `app(1).py`.
- [ ] 10.5 Within `generateFlyDubaiReport`, implement reconciliation sheet generation, showing side-by-side comparisons and discrepancies, matching `app(1).py` output.
- [ ] 10.6 Within `generateFlyDubaiReport`, implement Fly Dubai-specific report formatting (table styles, column autofitting) for the "Invoices" and "CCA" sheets, as well as overall report aesthetics, to match `app(1).py` output.
- [ ] 10.7 Implement secure report file upload to Supabase Storage within the `POST /api/reconcile` route after successful report generation by `reportGenerator.ts`. Store the file path/ID in the `reconciliation_jobs` record.
- [ ] 10.8 Update/Create `JobHistory.tsx` component (or use `RecentJobs.tsx` if suitable) to display past reconciliations for the Invoice Reconciler tool, fetching data from `reconciliation_jobs`.
- [ ] 10.9 Ensure job status in `JobHistory.tsx` correctly reflects 'completed', 'failed', 'processing'.
- [ ] 10.10 Implement download links in `JobHistory.tsx` for completed jobs. These links should point to a new secure download API endpoint.
- [ ] 10.11 Create a secure file download API endpoint: `nextjs/src/app/api/download/[jobId]/route.ts`.
    - [ ] 10.11.1 This endpoint takes a `jobId`, verifies user ownership of the job (RLS).
    - [ ] 10.11.2 Retrieves the report file path from the `reconciliation_jobs` record.
    - [ ] 10.11.3 Generates a Supabase Storage signed URL for the report file and facilitates download.
- [ ] 10.13 Implement real-time (or polling-based) job status updates in the UI (on the main tool page and in `JobHistory.tsx`) reflecting backend job progress.
- [ ] 10.14 Add report metadata display (e.g., original invoice filename, report generation date) to job history entries.
- [ ] 10.15 Create cleanup procedures for temporary files generated during processing on the server (if any; buffers might not need disk writes).
- [ ] 10.16 Define strategy for cleanup/archival of old `reconciliation_jobs` records and their associated report files in Supabase Storage (e.g., manual admin process or future automated policy).
- [ ] 10.17 Test: Create automated unit tests for `reportGenerator.ts` specifically for `generateFlyDubaiReport`.
    - [ ] 10.17.1 Using sample processed data (consistent with `FlyDubaiProcessor` output from task 9.23's tests), call `generateFlyDubaiReport`.
    - [ ] 10.17.2 Assert that the returned Buffer is a valid Excel file. (Can parse it back with `exceljs` to check sheet names, some key cell values, or compare against a reference Excel file generated by `app(1).py`).
- [ ] 10.18 Test: Create automated integration tests for the `GET /api/download/[jobId]` endpoint.
- [ ] 10.19 Test: Demonstrate the complete Fly Dubai results workflow (job completion, report generation, storage, UI update, download availability) for user acceptance.
- [ ] 10.20 Test: Enhance Playwright tests for `JobHistory.tsx` to include interactions with Fly Dubai job entries and verify status updates.
- [ ] 10.21 Test: Enhance Playwright tests for file download workflows specifically for successfully completed Fly Dubai reports from the UI.
- [ ] 10.22 Test: Consolidate Playwright end-to-end tests for the entire Fly Dubai user journey: Upload -> Process -> Job Status Updates -> View in History -> Download Report. Demonstrate this full cycle for user acceptance.

## Relevant Files

**Supabase Project Information:**
- **Project ID**: `hcyteovnllklmvoptxjr` (Active)
- **Region**: us-east-1
- **Organization**: By Nomi

**Database Schema (Completed):**
- `supabase/migrations/20241230130700_create_tools_table.sql`
- `supabase/migrations/20241230130701_create_user_tool_subscriptions.sql`
- `supabase/migrations/20241230130702_create_saved_invoices_table.sql`
- `supabase/migrations/20241230130703_create_reconciliation_jobs_table.sql`
- `supabase/migrations/20241230130704_create_airline_types_table.sql`
- `supabase/migrations/20241230130705_create_rls_policies_tools.sql`
- `supabase/migrations/20241230130706_create_rls_policies_invoices.sql`
- `supabase/migrations/20241230130707_create_rls_policies_jobs.sql`
- `supabase/migrations/20241230130708_create_storage_bucket.sql`
- `supabase/migrations/20241230130709_create_storage_policies.sql`
- `supabase/migrations/20241230130710_create_storage_quota.sql`
- `nextjs/src/lib/supabase/types.ts` - Generated TypeScript types

**Foundation Components (Completed):**
- `nextjs/src/app/app/page.tsx` - Customer dashboard
- `nextjs/src/components/Dashboard/ToolCard.tsx`
- `nextjs/src/components/Dashboard/RecentJobs.tsx`
- `nextjs/src/lib/supabase/queries/tools.ts`
- `nextjs/src/lib/supabase/queries/jobs.ts`

**Invoice Reconciler Foundational UI/File Mgmt (Completed):**
- `nextjs/src/app/app/invoice-reconciler/page.tsx`
- `nextjs/src/components/InvoiceReconciler/AirlineSelector.tsx`
- `nextjs/src/components/InvoiceReconciler/InvoiceManager.tsx`
- `nextjs/src/components/InvoiceReconciler/FileUpload.tsx`
- `nextjs/src/lib/fileUtils/duplicateDetection.ts`
- `nextjs/src/lib/fileUtils/storageManager.ts`
- `nextjs/src/app/api/invoices/route.ts`

**Invoice Reconciler Backend & Reporting (To be created/modified for Fly Dubai):**
- `nextjs/src/app/api/reconcile/route.ts`
- `nextjs/src/lib/processors/base/BaseProcessor.ts`
- `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts`
- `nextjs/src/lib/processors/utils/pdfExtractor.ts`
- `nextjs/src/lib/processors/utils/excelExtractor.ts`
- `nextjs/src/lib/processors/utils/reportGenerator.ts`
- `nextjs/src/app/api/jobs/route.ts` (primarily for fetching job statuses for UI)
- `nextjs/src/app/api/download/[jobId]/route.ts`
- `nextjs/src/components/InvoiceReconciler/JobHistory.tsx` (or updates to existing job display components)

**Testing Files (To be created/updated for Fly Dubai):**
- `tests/unit/processors/flyDubaiProcessor.spec.ts`
- `tests/unit/utils/pdfExtractor.spec.ts`
- `tests/unit/utils/excelExtractor.spec.ts`
- `tests/unit/utils/reportGenerator.spec.ts`
- `tests/integration/api/reconcile.spec.ts`
- `tests/integration/api/download.spec.ts`
- `tests/e2e/invoice-reconciler.spec.ts` (enhanced for Fly Dubai workflow)

### Notes

- **Directory Navigation:** (Same as original)
- **Development Standards:**
  - **Supabase MCP:** Use Supabase MCP for all database operations
  - **Row Level Security:** All new tables and storage require RLS policies
  - **TypeScript:** Full type safety with generated types
  - **Testing:** AI agent handles all technical testing before user demonstration
  - **Storage:** Enforce 100MB per user quota, organize by user/tool/job
- **Supported Airlines (Initial focus Fly Dubai):** Fly Dubai, TAP, Philippines Airlines, Air India, El Al
- **File Limits:** 25MB per file upload, PDF invoices (airline-specific), Excel reports (standardized)
- **Testing Protocol:** AI runs automated tests, then demonstrates to user for acceptance.