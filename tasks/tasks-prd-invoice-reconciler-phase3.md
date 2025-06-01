## Relevant Files

- `nextjs/src/lib/processors/base/BaseProcessor.ts` - Defines the abstract class and common interface for airline processors.
- `nextjs/src/lib/processors/types.ts` - Contains TypeScript interfaces for reconciliation data structures.
- `nextjs/src/lib/processors/utils/pdfExtractor.ts` - Utility providing a function to read PDF content, initially tailored to support Fly Dubai's layout-aware extraction needs.
- `nextjs/src/lib/processors/utils/pdfExtractor.test.ts` - Unit tests for `pdfExtractor.ts` using Fly Dubai sample.
- `nextjs/src/lib/processors/utils/excelExtractor.ts` - Utility for extracting data from the *standardized* Excel report files.
- `nextjs/src/lib/processors/utils/excelExtractor.test.ts` - Unit tests for `excelExtractor.ts`.
- `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts` - Contains the specific logic for Fly Dubai PDF invoice data extraction and reconciliation, referencing `app(1).py`.
- `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.test.ts` - Unit tests for `FlyDubaiProcessor.ts`.
- `nextjs/src/lib/processors/utils/reportGenerator.ts` - Utility for generating multi-sheet Excel reports; initially, the formatting logic will be specific to Fly Dubai.
- `nextjs/src/lib/processors/utils/reportGenerator.test.ts` - Unit tests for `reportGenerator.ts` focusing on Fly Dubai report.
- `nextjs/src/app/api/reconcile/route.ts` - API route handler for initiating reconciliation jobs (initially handling Fly Dubai).
- `tests/integration/api/reconcile.spec.ts` - Integration tests for the reconcile API route, focusing on Fly Dubai.
- `nextjs/src/app/api/download/[jobId]/route.ts` - API route handler for secure report downloads.
- `tests/integration/api/download.spec.ts` - Integration tests for the download API route.
- `nextjs/src/app/api/jobs/route.ts` - API route for fetching list of jobs and job status by ID.
- `tests/integration/api/jobs.spec.ts` - Integration tests for the jobs API route.
- `nextjs/src/app/app/invoice-reconciler/page.tsx` - Main UI page for the invoice reconciler.
- `nextjs/src/components/InvoiceReconciler/JobHistory.tsx` - Component to display job history and status.
- `tests/e2e/invoice-reconciler-flydubai.spec.ts` - End-to-end tests for the Fly Dubai reconciliation workflow.
- `supabase/migrations/[timestamp]_update_reconciliation_jobs_table.sql` - (If needed) Migration for `reconciliation_jobs`.

### Notes

- **Directory Navigation:**
  - **Next.js commands:** Run from `nextjs/` directory.
  - **Supabase commands:** Run from `supabase/` directory.
  - **PowerShell Syntax:** Use `cd nextjs; npm run dev`.
- **Testing:**
  - Unit tests alongside code files.
  - `npx jest [path]` for unit/integration tests.
  - `npx playwright test [path]` for E2E tests.
  - AI agent handles technical testing before user UAT.
- **Development Standards:**
  - **Supabase MCP:** Use for database operations.
  - **Row Level Security:** Enforce RLS.
  - **TypeScript:** Maintain full type safety.
  - **Focus:** This phase is SOLELY for implementing Fly Dubai. Other airlines will be added iteratively later.
  - **PDF Library for Fly Dubai:** Choice in `pdfExtractor.ts` must support `pdfplumber`-like layout-aware extraction for Fly Dubai, as per `app(1).py`.
  - **Storage:** 100MB/user quota. Reports: `user_id/invoice-reconciler/jobs/[job_id]/`.

## Tasks

- [x] **1.0 Parent Task: Establish Backend Processing Foundation (for Fly Dubai initially)**
    - **Goal:** Create the basic building blocks and definitions that the Fly Dubai reconciliation process (and future airline processors) will use.
    - [x] 1.1 Create/Update `nextjs/src/lib/processors/types.ts` to define shared data structures.
        - [x] 1.1.1 Define `AwbData` interface (structure for Air Waybill information, informed by Fly Dubai's needs from `app(1).py`).
        - [x] 1.1.2 Define `CcaData` interface (structure for Cargo Charges Correction Advice information, informed by Fly Dubai's needs from `app(1).py`).
        - [x] 1.1.3 Define `ProcessedReportData` interface (structure for data from the *standardized* Excel report, common to all airlines).
        - [x] 1.1.4 Define `ReconciliationInput` interface (e.g., `{ invoiceFileBuffer: Buffer, reportFileBuffer: Buffer, airlineType: 'flydubai' | 'tap' | ... }`).
        - [x] 1.1.5 Define `ReconciliationResult` interface (e.g., `{ success: boolean; processedInvoiceData?: { awb: AwbData[], cca: CcaData[] }; processedReportData?: ProcessedReportData[]; reconciledData?: any[]; generatedReportBuffer?: Buffer; error?: string; }`).
    - [x] 1.2 Create `nextjs/src/lib/processors/base/BaseProcessor.ts` with an abstract class `BaseProcessor`.
        - [x] 1.2.1 Define an abstract method `process(input: ReconciliationInput): Promise<ReconciliationResult>` in `BaseProcessor`.

- [x] **2.0 Parent Task: Develop File Extraction Utilities (Tailored for Fly Dubai's Initial Needs)**
    - **Goal:** Build tools to get data out of PDF invoice files and Excel report files. The PDF extractor will be initially built and tested to serve Fly Dubai's specific requirements. The Excel extractor is for the standardized report.
    - [x] 2.1 Implement PDF Data Extraction Utility (`nextjs/src/lib/processors/utils/pdfExtractor.ts`):
        - [x] 2.1.1 Research and select the best Node.js PDF library (e.g., `pdfjs-dist`) to read PDFs in a way that supports the layout-aware text extraction needed for Fly Dubai (similar to `pdfplumber` in `app(1).py`). Install it.
        - [x] 2.1.2 Create `extractTextWithLayout(pdfBuffer: Buffer): Promise<PageTextData[]>` function. This function will provide structured page content specifically consumable by the `FlyDubaiProcessor`. (Define `PageTextData` interface like `{ pageNumber: number; lines: string[] }` or a structure from the chosen library suitable for Fly Dubai's parsing).
        - [x] 2.1.3 Test: Write unit tests for `extractTextWithLayout` using a sample Fly Dubai PDF, ensuring the output facilitates Fly Dubai's specific parsing logic.
    - [x] 2.2 Implement Standardized Excel Report Data Extraction Utility (`nextjs/src/lib/processors/utils/excelExtractor.ts`):
        - [x] 2.2.1 Create `extractDataFromExcel(excelBuffer: Buffer, headerRow: number, columnMappings?: Record<string, string>): Promise<ProcessedReportData[]>` function using `exceljs`. This utility is for the *standardized report format* common to all airlines.
        - [x] 2.2.2 Ensure it correctly reads the standardized report format (header usually on 8th row) and handles data type conversions and basic cleaning.
        - [x] 2.2.3 Test: Write unit tests for `extractDataFromExcel` using a sample standardized Excel report.

- [x] **3.0 Parent Task: Implement Fly Dubai Specific PDF Invoice Data Extraction**
    - **Goal:** Implement the logic to read and understand the unique format of *Fly Dubai PDF invoices*, using the PDF utility (from Task 2) and logic derived from `app(1).py`.
    - [x] 3.1 Create `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts` (it will extend `BaseProcessor`).
    - [x] 3.2 Port Fly Dubai specific RegEx patterns from `app(1).py` (for AWB and CCA data) into `FlyDubaiProcessor.ts`. These RegEx patterns are unique to Fly Dubai's invoice structure.
    - [x] 3.3 Implement `_extractAwbDataFromFlyDubaiPdf(pagesTextData: PageTextData[]): AwbData[]` method in `FlyDubaiProcessor.ts`.
        - This will apply the Fly Dubai RegEx patterns to the structured text (output from `pdfExtractor.ts`) to find and structure Fly Dubai's Air Waybill data.
        - This includes implementing Fly Dubai's specific logic for dynamic AWB page range detection, as detailed in `app(1).py`.
    - [x] 3.4 Implement `_extractCcaDataFromFlyDubaiPdf(pagesTextData: PageTextData[]): CcaData[]` method in `FlyDubaiProcessor.ts`.
        - This will apply Fly Dubai RegEx patterns to find and structure Fly Dubai's Cargo Charges Correction Advice data.
        - This includes implementing Fly Dubai's specific logic for dynamic CCA page detection, as detailed in `app(1).py`.
    - [x] 3.5 Test: Write unit tests for these Fly Dubai-specific extraction methods using sample data derived from a Fly Dubai PDF.

- [x] **4.0 Parent Task: Develop Fly Dubai Specific Reconciliation Logic**
    - **Goal:** Implement the core "brain" for *Fly Dubai* that compares its extracted invoice data with the standardized Excel report data to find matches and differences, based on the logic in `app(1).py`.
    - [x] 4.1 Implement the main `process(input: ReconciliationInput): Promise<ReconciliationResult>` method in `FlyDubaiProcessor.ts`.
        - [x] 4.1.1 Call the generic `pdfExtractor.extractTextWithLayout` (Task 2.1) and then the Fly Dubai-specific `_extractAwbDataFromFlyDubaiPdf` and `_extractCcaDataFromFlyDubaiPdf` (Task 3) to get Fly Dubai invoice data.
        - [x] 4.1.2 Call the generic `excelExtractor.extractDataFromExcel` (Task 2.2) to get data from the standardized report.
        - [x] 4.1.3 Implement data cleaning and type conversion logic for Fly Dubai AWB, CCA, and the report data, precisely mirroring the specific data handling logic in `app(1).py`.
        - [x] 4.1.4 Implement the merge/join logic as per `app(1).py` to combine Fly Dubai AWB data with standardized report data based on AWB Prefix/Serial numbers.
        - [x] 4.1.5 Implement difference calculations (e.g., "Difference in Net Due amount") and discrepancy flagging based on Fly Dubai's rules as defined in `app(1).py`.
        - [x] 4.1.6 Prepare the final structured result, including all Fly Dubai processed data and reconciliation findings, ready for report generation.
    - [x] 4.2 Test: Write unit tests for the Fly Dubai data cleaning, merging, and difference calculation logic using sample Fly Dubai data, asserting against expected outcomes from `app(1).py`.

- [x] **5.0 Parent Task: Create Fly Dubai Specific Excel Reconciliation Report**
    - **Goal:** Build the system to create the final multi-sheet Excel reconciliation report specifically formatted for *Fly Dubai*, replicating the output and formatting of `app(1).py`.
    - [x] 5.1 Create/Update `nextjs/src/lib/processors/utils/reportGenerator.ts`.
    - [x] 5.2 Define the exact sheet structure (Summary, Reconciliation, Invoices, CCA) and column layouts for *Fly Dubai reports*, based on `app(1).py`'s output.
    - [x] 5.3 Implement `generateFlyDubaiReport(data: { awbData: AwbData[], ccaData: CcaData[], reconciledData: any[], summaryMetrics: any }): Promise<Buffer>` function within `reportGenerator.ts`.
        - [x] 5.3.1 Generate "Summary" sheet with key totals and metrics relevant to Fly Dubai reconciliation, as per `app(1).py`.
        - [x] 5.3.2 Generate "Reconciliation" sheet showing side-by-side data and differences, as per Fly Dubai's requirements and `app(1).py`'s output.
        - [x] 5.3.3 Generate "Invoices" sheet with processed Fly Dubai AWB data, matching `app(1).py`.
        - [x] 5.3.4 Generate "CCA" sheet with processed Fly Dubai CCA data, matching `app(1).py`.
        - [x] 5.3.5 Apply *Fly Dubai-specific formatting* (table styles, column widths, conditional formatting for highlighting discrepancies and other details) to all sheets, precisely mimicking `app(1).py`'s `openpyxl` output.
    - [x] 5.4 Update `FlyDubaiProcessor.ts`'s `process` method: after successful Fly Dubai reconciliation, calculate summary metrics (as done in `app(1).py`), call `generateFlyDubaiReport`, and include the Excel file (as a buffer) in its result.
    - [x] 5.5 Test: Write unit tests for `generateFlyDubaiReport`. Check if the output Excel (parsed back) has correct sheets, headers, and key data matching `app(1).py`'s output.

- [x] **6.0 Parent Task: Build Backend API for Reconciliation & Job Management (for Fly Dubai)**
    - **Goal:** Create the server-side endpoints that the website will call to start a Fly Dubai reconciliation, track its progress, and manage jobs.
    - [x] 6.1 Implement Main Reconciliation API Endpoint (`nextjs/src/app/api/reconcile/route.ts`):
        - [x] 6.1.1 Create `POST` handler to receive `airlineType` (which will be 'flydubai' for this phase), `invoiceFileId`, and `reportFileId`. Check user authentication.
        - [x] 6.1.2 Fetch the actual PDF invoice and Excel report files from Supabase Storage.
        - [x] 6.1.3 If `airlineType` is 'flydubai', instantiate `FlyDubaiProcessor`. (Add a placeholder/error for other airline types for now).
    - [x] 6.2 Implement Job Management Logic within the Reconciliation API:
        - [x] 6.2.1 Before processing: Create a "job" record in the database (`reconciliation_jobs` table) with "processing" status, linking to the invoice and input report, and specifying 'flydubai' as airline type.
        - [x] 6.2.2 After successful processing: Upload the generated Fly Dubai Excel report (from Task 5) to Supabase Storage and update the job record with "completed" status and the report's storage path.
        - [x] 6.2.3 If processing fails: Update job record to "failed" and save an error message.
        - [x] 6.2.4 Send back the job ID to the website.
    - [x] 6.3 Implement API Endpoints for Job Status & History:
        - [x] 6.3.1 Create `GET /api/jobs/[jobId]/route.ts` for the website to ask for the status of a specific job.
        - [x] 6.3.2 Create `GET /api/jobs/route.ts` for the website to get a list of the user's recent reconciliation jobs.
    - [x] 6.4 Test: Write integration tests for these API endpoints, checking database interactions and responses, specifically for the Fly Dubai scenario.

- [ ] **7.0 Parent Task: Enable Secure Report Downloads (for Fly Dubai Reports)**
    - **Goal:** Create a secure way for users to download their completed Fly Dubai reconciliation reports from the website.
    - [ ] 7.1 Create/Update Download API Endpoint (`nextjs/src/app/api/download/[jobId]/route.ts`):
        - [ ] 7.1.1 Create `GET` handler that takes a `jobId`. Check user authentication and if they own the job.
        - [ ] 7.1.2 If job is "completed", get the report's storage path from the database.
        - [ ] 7.1.3 Generate a secure, temporary download link (signed URL) from Supabase Storage for that report.
        - [ ] 7.1.4 Send this link to the website so it can start the download.
    - [ ] 7.2 Test: Write integration tests for this download API, testing with a Fly Dubai job ID.

- [ ] **8.0 Parent Task: Integrate Backend with Frontend for Fly Dubai Workflow**
    - **Goal:** Connect all the backend pieces to the existing website UI, so users can perform a full Fly Dubai reconciliation from selecting the airline to downloading the report.
    - [ ] 8.1 Update Invoice Reconciler UI (`nextjs/src/app/app/invoice-reconciler/page.tsx`) to call the `POST /api/reconcile` endpoint when the user selects "Fly Dubai" and initiates a reconciliation.
    - [ ] 8.2 Add UI feedback for Fly Dubai job submission (e.g., "Fly Dubai reconciliation job started...").
    - [ ] 8.3 Update Job History UI (`nextjs/src/components/InvoiceReconciler/JobHistory.tsx`) to:
        - [ ] 8.3.1 Fetch and display job list from `GET /api/jobs`, showing airline type (Fly Dubai).
        - [ ] 8.3.2 Regularly check/update status of "processing" Fly Dubai jobs using `GET /api/jobs/[jobId]`.
        - [ ] 8.3.3 Show download links for "completed" Fly Dubai jobs, pointing to the download API (`GET /api/download/[jobId]`).
        - [ ] 8.3.4 Display user-friendly error messages for "failed" Fly Dubai jobs.

- [ ] **9.0 Parent Task: Conduct Comprehensive Automated Testing & UAT for Fly Dubai**
    - **Goal:** Ensure the entire Fly Dubai reconciliation process works correctly from end-to-end and meets user requirements.
    - [ ] 9.1 Test: Verify all unit tests (for extractors used by Fly Dubai, `FlyDubaiProcessor`, and `generateFlyDubaiReport`) pass.
    - [ ] 9.2 Test: Verify all integration tests (for API endpoints handling the Fly Dubai scenario) pass.
    - [ ] 9.3 Test: Create/Update End-to-End (E2E) tests using Playwright (`tests/e2e/invoice-reconciler-flydubai.spec.ts`):
        - [ ] 9.3.1 Simulate a user logging in, navigating, selecting "Fly Dubai", uploading sample Fly Dubai invoice and report files.
        - [ ] 9.3.2 Verify the UI shows the job processing and then completing for the Fly Dubai job.
        - [ ] 9.3.3 Verify the download link works and a Fly Dubai report file is downloaded.
        - [ ] 9.3.4 Test error scenarios specific to Fly Dubai processing (e.g., bad Fly Dubai PDF, incorrect report format for standard part) and check for correct UI feedback.
    - [ ] 9.4 User Acceptance Testing (UAT): Demonstrate the full, working Fly Dubai reconciliation workflow to the user for their final approval and sign-off.