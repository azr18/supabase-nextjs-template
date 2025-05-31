# PRD: Supabase-Based SaaS Platform Core & Multi-Invoice Reconciler MVP

## 1. Introduction/Overview

This document outlines the requirements for building the core Multi-Tool SaaS Platform and integrating its first Minimum Viable Product (MVP) tool: the Multi-Invoice Reconciler. The platform aims to provide a secure, scalable environment for businesses to access various automated tool solutions. The initial focus is to establish the foundational SaaS functionalities (user management, subscriptions, customer dashboard) using the Razikus Supabase Next.js template, and then integrate the Multi-Invoice Reconciler as the first operational tool supporting multiple airline invoice types.

The platform will leverage the existing Supabase Next.js template's authentication system (including OAuth), user management, and file storage capabilities while replacing the existing demos with production-ready business tools. Subscription management will be performed manually by administrators via Supabase Studio, with payments handled externally through invoicing.

The goal is to create a platform that simplifies complex business processes, starting with automated invoice reconciliation for multiple airlines (Fly Dubai, TAP, Philippines Airlines, Air India, El Al), making it accessible and manageable for customers through a user-friendly interface with dynamic invoice type selection.

## 2. Goals

*   **Platform Goals (MVP):**
    *   Leverage the Razikus Supabase Next.js template as the foundation for secure multi-tenant SaaS infrastructure.
    *   Implement robust user registration, login, and session management using Supabase Auth with Google OAuth provider integration.
    *   Replace existing template demos with a production-ready customer dashboard for accessing subscribed tools and managing basic account settings.
    *   Implement manual subscription management system via Supabase Studio for administrators to control tool access.
    *   Create a clear pathway for customers to access and use subscribed tools with external invoicing for payments.
    *   Establish Supabase storage bucket architecture for secure, organized file management across multiple tools.
    *   Develop a professional landing page that promotes the SaaS platform's value proposition without revealing specific tools.

*   **Multi-Invoice Reconciler Tool Goals (MVP):**
    *   Provide a unified interface with dropdown selection for different airline invoice types (Fly Dubai, TAP, Philippines Airlines, Air India, El Al).
    *   Enable customers to persistently save PDF invoices by airline type, eliminating the need for repeated uploads of the same invoices.
    *   Implement intelligent duplicate detection to prevent storage of identical invoices and provide users with clear feedback about existing files.
    *   Allow customers to choose between existing saved invoices or upload new invoices for each reconciliation job, improving workflow efficiency.
    *   Enable customers to securely upload Excel report files (standardized format) for each supported airline's reconciliation process using Supabase storage buckets.
    *   Automate the reconciliation process based on airline-specific logic, using modular serverless backend functions.
    *   Support conversion of existing Python reconciliation scripts for Fly Dubai and TAP.
    *   Provide customers with downloadable Excel reports detailing reconciliation results, including discrepancies, formatted per airline requirements.
    *   Ensure accurate data extraction and processing for reliable reconciliation outcomes across all supported airlines.

*   **Project Management Goals:**
    *   Provide clear, actionable requirements suitable for a junior developer to implement features incrementally, managed via agentic coding.
    *   Ensure the PRD focuses on the "what" and "why," allowing development flexibility on the "how" within the chosen technical stack.
    *   Design a modular architecture that allows easy addition of new airline invoice processors and future business tools.

## 3. User Stories

*   **Customer User:**
    1.  "As a Customer User, I want to easily register for an account on the platform using my email and password, or through Google OAuth so that I can explore and access available tools."
    2.  "As a Customer User, I want to securely log into the platform using my credentials or Google OAuth so that I can access my dashboard and the tools I am subscribed to."
    3.  "As a Customer User, upon logging in, I want to see a dashboard that clearly lists the tools I have access to, so I can easily navigate to the tool I need."
    4.  "As a Customer User, when I select the Invoice Reconciler tool, I want to see a dropdown selector to choose which airline invoice type I'm reconciling (Fly Dubai, TAP, Philippines Airlines, etc.) so that I can access the appropriate processing logic."
    5.  "As a Customer User, after selecting an airline type, I want to see a list of my previously uploaded invoices for that airline so that I can reuse existing invoices without re-uploading them."
    6.  "As a Customer User, I want to be able to choose between an existing saved invoice or upload a new invoice for my reconciliation job so that I can efficiently manage my workflow."
    7.  "As a Customer User, when uploading a new invoice, I want the system to detect if I've already uploaded the same file and notify me to prevent duplicate storage and confusion."
    8.  "As a Customer User, after selecting or uploading an invoice, I want to be presented with a file upload interface for the Excel report file (standardized format for all airlines) so that I can complete the reconciliation setup."
    9.  "As a Customer User, I want to receive feedback on the status of my file uploads and reconciliation jobs (e.g., pending, processing, completed, error) so I am informed about the progress."
    10. "As a Customer User, I want to download the generated reconciliation report in Excel format from the platform once processing is complete so that I can review the findings and use them for my accounting."
    11. "As a Customer User, I want to be able to manage my saved invoices (view, delete) to keep my invoice library organized and up-to-date."

*   **Platform Admin (Manual/Supabase Studio for MVP):**
    1.  "As a Platform Admin, I want to be able to manually manage which tools a customer is subscribed to and their subscription status via Supabase Studio so that they have correct access based on their external payment/agreement."
    2.  "As a Platform Admin, I want to view user activity and tool usage through the Supabase dashboard so that I can monitor platform utilization and support users effectively."

## 4. Functional Requirements

### 4.1 Core SaaS Platform Requirements (MVP)

**User Authentication & Authorization (Leveraging Supabase Template):**
1.  FR1.1: The system **must** allow new users to register for an account using an email address and password, leveraging the existing Supabase Auth setup.
2.  FR1.2: The system **must** support Google OAuth authentication for easier user onboarding.
3.  FR1.3: The system **must** validate user registration input (e.g., valid email format, password complexity) using Supabase Auth validation.
4.  FR1.4: The system **must** allow registered users to log in securely using their email and password or Google OAuth.
5.  FR1.5: The system **must** manage user sessions using Supabase Auth session management.
6.  FR1.6: The system **must** provide a way for users to log out and invalidate their session.
7.  FR1.7: The system **must** have a mechanism for password reset using Supabase Auth functionality.
8.  FR1.8: The system **must** protect routes/pages that require authentication, redirecting unauthenticated users to a login page.
9.  FR1.9: The system **must** support Multi-Factor Authentication (MFA) capabilities provided by the Supabase template for enhanced security.

**Customer Dashboard (Replacing Template Demos):**
1.  FR2.1: Upon successful login, the user **must** be directed to a Customer Dashboard page that replaces the existing template demos.
2.  FR2.2: The Customer Dashboard **must** display a list of tools the authenticated user is currently subscribed to and has active access to.
3.  FR2.3: Each listed tool on the dashboard **must** be presented as a modern card or clearly actionable item that navigates the user to the specific page for that tool.
4.  FR2.4: The dashboard **must** provide access to basic account settings including password change and Multi-Factor Authentication setup using the template's existing user settings functionality.
5.  FR2.5: The dashboard **must** display recent job history and status across all tools the user has access to.
6.  FR2.6: The platform landing page (pre-login) **must** present a professional SaaS platform promoting custom AI business solutions for marketing, sales, and finance operations, showcasing competitive advantages, key benefits, customer testimonials, clear value proposition emphasizing custom-built tools to suit each customer's needs, and prominent call-to-action buttons, without revealing specific tools or detailed functionality.

**Tool Access & Subscription Management (MVP):**
1.  FR3.1: The system **must** have a database schema to track customer tool subscriptions and their status (e.g., active, inactive, trial) via new custom tables.
2.  FR3.2: The system **must** support manual subscription management by administrators via Supabase Studio for MVP, allowing assignment and modification of tool access.
3.  FR3.3: Access to a tool's specific page/functionality **must** be restricted to users with an active subscription for that tool, enforced via Row Level Security (RLS) policies.
4.  FR3.4: The system **must** maintain subscription status fields for external payment tracking through manual invoicing processes.

**File Management (Supabase Storage Buckets):**
1.  FR3.5: The system **must** implement Supabase storage buckets organized by tool type (e.g., `invoice-reconciler` bucket) for secure file management.
2.  FR3.6: The system **must** enforce RLS policies on storage buckets to ensure users can only access their own files within subscribed tools.
3.  FR3.7: The system **must** organize files within buckets using a clear structure: `user_id/tool_name/job_id/` for easy management and retrieval.
4.  FR3.8: The system **must** enforce a 100MB storage quota per user across all tools and files.

### 4.2 Multi-Invoice Reconciler Tool Requirements (MVP)

**Tool Interface & Airline Selection:**
1.  FR4.1: When a subscribed user navigates to the Invoice Reconciler tool page, they **must** be presented with a dropdown selector to choose the airline invoice type they want to reconcile.
2.  FR4.2: The dropdown **must** include the following airline options: Fly Dubai, TAP, Philippines Airlines, Air India, and El Al.
3.  FR4.3: Upon selecting an airline type, the interface **must** dynamically update to display existing saved invoices for that airline and provide an option to upload a new invoice.
4.  FR4.4: The system **must** display existing invoices for the selected airline in a clear, organized list showing filename, upload date, and file size.
5.  FR4.5: The system **must** provide a clear interface for users to select an existing invoice or choose to upload a new invoice file.
6.  FR4.6: The system **must** validate that a user has either selected an existing invoice or uploaded a new invoice before allowing report file upload and processing.

**Dynamic File Upload Interface (Supabase Storage Integration):**
1.  FR4.7: For each supported airline, the system **must** display appropriate file upload interfaces for PDF invoices (airline-specific formats) and Excel report files (standardized format across all airlines).
2.  FR4.8: The system **must** provide clear instructions that invoice formats are airline-specific while Excel report format is standardized across all airlines.
3.  FR4.9: The system **must** validate uploaded files for basic criteria (e.g., file type, size limits up to 25MB per file) on the client-side and backend before processing.
4.  FR4.10: The system **must** securely store uploaded files in the `invoice-reconciler` Supabase storage bucket, organized by user, airline type, and reconciliation job instance.
5.  FR4.11: The system **must** provide upload progress indicators and success/error feedback using the template's existing notification system.

**Invoice Persistence & Duplicate Detection:**
1.  FR4.12: The system **must** persistently save uploaded PDF invoices in a dedicated storage structure organized by user and airline type (e.g., `user_id/airline_type/`) for future reuse.
2.  FR4.13: The system **must** generate and store a cryptographic hash (e.g., SHA-256) for each uploaded invoice to enable reliable duplicate detection.
3.  FR4.14: The system **must** detect duplicate invoices by comparing file hash, filename, and file size before saving new uploads.
4.  FR4.15: When a duplicate invoice is detected, the system **must** notify the user and provide options to either use the existing invoice or replace it with the new upload.
5.  FR4.16: The system **must** store invoice metadata including original filename, upload date, file size, and airline type in a dedicated database table.
6.  FR4.17: The system **must** provide users with the ability to view, manage, and delete their saved invoices through the interface, filtered by selected airline type.
7.  FR4.18: The system **must** ensure that when a saved invoice is deleted, both the database record and the physical file are removed from storage.
8.  FR4.19: The system **must** track which saved invoices are used in reconciliation jobs to prevent accidental deletion of invoices with job dependencies.

**Modular Reconciliation Processing (Backend):**
1.  FR5.1: Upon successful invoice selection/upload and report upload, the system **must** trigger the appropriate airline-specific backend reconciliation function based on the selected airline type.
2.  FR5.2: The backend function **must** retrieve the selected saved invoice and uploaded report file from the Supabase storage bucket based on the user's job and airline type.
3.  FR5.3: For Fly Dubai and TAP, the system **must** support conversion and integration of existing Python reconciliation scripts into the Next.js/TypeScript environment.
4.  FR5.4: For Philippines Airlines, Air India, and El Al, the system **must** support development of new reconciliation logic based on their specific invoice formats and the standardized report format.
5.  FR5.5: Each airline processor **must** extract data from airline-specific PDF invoices using appropriate libraries (e.g., `pdf-parse`, `pdfplumber`).
6.  FR5.6: Each airline processor **must** extract data from standardized Excel reports using appropriate libraries (e.g., `exceljs`, `xlsx`).
7.  FR5.7: Each airline processor **must** perform reconciliation logic specific to that airline's invoice format, comparing invoice data against report data and identifying matches and discrepancies.
8.  FR5.8: The system **must** handle common data variations and potential errors during extraction and processing gracefully for each airline type, implementing airline-specific configuration parameters as needed during development.
9.  FR5.9: The system **must** log reconciliation job progress and status updates to the database for user tracking and admin monitoring.

**Output & Results Display:**
1.  FR6.1: Each airline processor **must** generate a multi-sheet Excel report summarizing the reconciliation, formatted according to airline-specific requirements, including:
    *   A summary sheet with key metrics.
    *   A reconciliation sheet showing side-by-side comparisons and highlighted discrepancies.
    *   Sheets for processed invoice data and relevant detailed data.
2.  FR6.2: The generated Excel report **must** use conditional formatting to highlight discrepancies clearly, with formatting rules appropriate to each airline's requirements.
3.  FR6.3: The backend function **must** save the generated Excel report to the Supabase storage bucket, linked to the specific reconciliation job and airline type.
4.  FR6.4: The Customer Dashboard and tool page **must** display the status of reconciliation jobs (e.g., pending, in-progress, completed, failed with error) with airline type identification.
5.  FR6.5: Once a job is completed, the user **must** be able to download the generated Excel reconciliation report from the platform via secure signed URLs.
6.  FR6.6: The system **must** maintain a job history showing past reconciliations with airline type, date, status, and download links.

### 4.3 Database Schema Requirements

1.  FR7.1: The system **must** create new tables extending the existing Supabase template schema:
    *   `tools` - Available tools in the platform
    *   `user_tool_subscriptions` - User access to specific tools with status
    *   `saved_invoices` - Persistent storage of user invoices with metadata and duplicate detection fields
    *   `reconciliation_jobs` - Job tracking for invoice reconciliation, referencing saved invoices and report files
    *   `airline_types` - Supported airline configurations
2.  FR7.2: The `saved_invoices` table **must** include fields for user_id, airline_type, filename, file_hash, file_path, file_size, metadata, created_at, and updated_at.
3.  FR7.3: The `reconciliation_jobs` table **must** reference saved invoices via foreign key rather than storing file paths directly, and include report_file_path for job-specific report files.
4.  FR7.4: All new tables **must** implement appropriate RLS policies for data security and multi-tenancy.
5.  FR7.5: The system **must** maintain referential integrity between users, subscriptions, saved invoices, and job records.
6.  FR7.6: The system **must** implement database constraints to prevent duplicate invoice hashes for the same user and airline combination.

### 4.4 Admin Capabilities (MVP - Manual)

1.  FR8.1: A Platform Admin **must** be able to manually view and manage customer tool subscriptions via Supabase Studio. This includes:
    *   Assigning a tool subscription to a customer
    *   Setting a subscription status (e.g., active/inactive/trial)
    *   Viewing user activity and job history
2.  FR8.2: Admins **must** be able to monitor storage usage and file management across all users and tools via Supabase dashboard.
3.  FR8.3: Admins **must** be able to view and manage saved invoices, including identifying and resolving duplicate detection issues.
4.  FR8.4: Admins **must** be able to monitor invoice storage patterns and implement cleanup procedures for orphaned or unused invoice files.
5.  FR8.5: Admins **must** be able to view invoice usage statistics, including which invoices are most frequently used for reconciliation jobs.

## 5. Non-Goals (Out of Scope for MVP)

*   **Integrated Payment Processing:** Payment processing via the website is out of scope for MVP. Payments will be processed externally through invoicing.
*   **Automated Subscription Provisioning:** Automated provisioning of tool access based on payments is a post-MVP goal.
*   **Advanced Admin Interface UI:** A dedicated web-based Admin Interface for managing users, subscriptions, and tools is out of scope for MVP. (Admin actions are manual via Supabase Studio).
*   **Team Accounts/Roles:** Complex team structures, role-based access control (RBAC) beyond basic user authentication, and organization-level subscriptions are out of scope for MVP.
*   **Additional Business Tools:** Integration of non-reconciliation business tools is out of scope for MVP. The focus is on the Multi-Invoice Reconciler as the first tool.
*   **Advanced File Management UI:** A comprehensive file management system within the dashboard beyond basic job history and download capabilities is out of scope for MVP.
*   **Real-time Collaboration Features:** Any real-time collaboration on reconciliation or data is out of scope.
*   **Advanced Analytics and Reporting:** Complex reporting and analytics within the customer dashboard beyond basic job history is out of scope for MVP.
*   **Mobile Applications:** Native mobile applications (iOS/Android) are out of scope.
*   **Template Demo Preservation:** The existing file management and task management demos from the template will be removed and replaced with production tools.
*   **Automatic Airline Detection:** Automatically detecting airline type from uploaded files is out of scope; users must manually select the airline type.
*   **Invoice Organization Features:** Folders, tagging systems, and advanced invoice organization features are out of scope for MVP.

## 6. Design Considerations

*   **UI/UX:** Leverage the existing Supabase template design system, `shadcn/ui` components, and Tailwind CSS for a clean, modern, and responsive user interface.
*   **Landing Page:** Professional SaaS marketing page that showcases:
    *   Clear value proposition for custom AI business solutions targeting marketing, sales, and finance operations
    *   Key platform benefits and competitive advantages of custom-built automation tools
    *   Customer testimonials and success stories from businesses that have implemented custom AI solutions
    *   Emphasis that each tool is custom built to suit individual customer needs and business processes
    *   Professional design with strong calls-to-action for consultation and getting started
    *   Contact information and consultation booking flow
    *   Does NOT reveal specific tools, detailed functionality, or pricing information
    *   Focuses on business transformation through custom AI automation solutions across marketing, sales, and finance divisions
*   **Customer Dashboard (Replacing Template Demos):**
    *   Replace existing demo content with production-ready tool access interface
    *   Main navigation should be simple and focused on tools
    *   Prominently display a section titled "My Tools" or "Available Tools"
    *   Each tool should be a clear card or link leading to its dedicated page
    *   Include access to basic account settings (password change, MFA setup) using template's existing UI
    *   Display a list of recent reconciliation jobs and their status with airline type identification
*   **Multi-Invoice Reconciler Tool Page:**
    *   Prominent dropdown selector for airline type at the top of the page
    *   Invoice selection interface showing existing saved invoices for the selected airline with options to choose existing or upload new
    *   Clear visual indicators for invoice status (saved, duplicate detected, in use)
    *   File upload interface for report files (emphasize standardized format)
    *   Clear instructions distinguishing airline-specific invoice formats from standardized report format
    *   Progress indicators during upload and processing using template's existing components
    *   Invoice management section allowing users to view and delete saved invoices for selected airline
    *   Clear way to download the resulting Excel report
    *   Job history showing airline type and invoice used for each reconciliation
*   **Authentication Flow:** Leverage template's existing auth UI with Google OAuth prominently displayed alongside email/password options.
*   **Feedback:** Utilize the template's existing notification/toast system for user feedback (e.g., successful upload, reconciliation started, error messages).
*   **Testing Strategy:** Comprehensive automated testing approach:
    *   **Unit Testing:** Jest/Vitest for component and utility function testing
    *   **Integration Testing:** API endpoint and database integration testing
    *   **End-to-End Testing:** Playwright MCP for browser automation, user flow testing, and UI interaction validation
    *   **Visual Testing:** Playwright for visual regression testing and responsive design validation
    *   **User Acceptance Testing:** Business owner validates functionality after technical testing completion

## 7. Technical Considerations

*   **Primary Stack:** Razikus Supabase Next.js template (Next.js 15, React 19, Supabase Auth, Supabase Database, Supabase Storage, Tailwind CSS, shadcn/ui).
*   **Backend Logic:** Next.js API Routes for SaaS core logic and modular airline-specific reconciliation processing.
*   **Database:** PostgreSQL via Supabase with new custom tables for tools, subscriptions, and jobs, extending the existing template schema.
*   **Authentication:** Supabase Auth with email/password and Google OAuth.
*   **Development Approach:** Agent coder should utilize Supabase MCP (Model Context Protocol) whenever possible for enhanced database operations and integrations.
*   **Testing Strategy:** Comprehensive automated testing approach:
    *   **Unit Testing:** Jest/Vitest for component and utility function testing
    *   **Integration Testing:** API endpoint and database integration testing
    *   **End-to-End Testing:** Playwright MCP for browser automation, user flow testing, and UI interaction validation
    *   **Visual Testing:** Playwright for visual regression testing and responsive design validation
    *   **User Acceptance Testing:** Business owner validates functionality after technical testing completion
*   **File Storage:** Supabase Storage buckets with organized structure:
    *   `invoices` bucket with `user_id/airline_type/` structure for persistent invoice storage
    *   `reports` bucket with `user_id/jobs/job_id/` structure for job-specific report files and generated reconciliation reports
    *   Comprehensive duplicate detection using cryptographic file hashing
    *   100MB storage quota per user enforcement
*   **Modular Architecture:** Implement a plugin-like system where each airline has its own processor module (e.g., `processors/flyDubaiProcessor.ts`, `processors/tapProcessor.ts`, etc.).
*   **Python Script Integration:** For Fly Dubai and TAP, convert existing Python logic to TypeScript/Node.js, maintaining the same logic but optimized for the new environment.
*   **Serverless Functions:** Each airline reconciliation engine will run as serverless functions (Node.js based, as part of Next.js API routes).
*   **Row Level Security:** Implement comprehensive RLS policies on all new tables and storage buckets for data isolation and security.
*   **Error Handling:** Implement comprehensive error handling on both frontend and backend, providing clear feedback to users with airline-specific error contexts.
*   **Scalability:** Leverage serverless architecture and Supabase's scalability for handling multiple concurrent reconciliation jobs across different airlines.
*   **Internationalization Readiness:** Structure the application to support future translation to multiple languages using Next.js internationalization features.

## 8. Success Metrics (MVP)

*   **User Adoption & Engagement:**
    *   Number of user registrations within the first month post-launch (both email/password and Google OAuth).
    *   Number of active users successfully using the Multi-Invoice Reconciler tool weekly/monthly across all supported airlines.
    *   Task completion rate: Percentage of users who start a reconciliation (any airline) and successfully download a report.
    *   Airline usage distribution: Which airlines are most frequently used by customers.
    *   Google OAuth adoption rate: Percentage of users choosing Google OAuth vs email/password registration.

*   **Tool Performance & Accuracy:**
    *   Average processing time for reconciliation jobs across all supported airlines.
    *   Accuracy of reconciliation: Low number of user-reported errors in generated reports (target <1% error rate on core calculations for valid inputs) per airline type.
    *   System uptime for the platform and all airline processors (target 99.5%+).
    *   File upload success rate and average upload times.
    *   Invoice reuse rate: Percentage of reconciliation jobs using existing saved invoices vs. new uploads.
    *   Duplicate detection accuracy: Percentage of actual duplicates correctly identified and prevented from storage.

*   **User Experience & Testing Quality:**
    *   End-to-end user flow completion rates measured via Playwright automated testing.
    *   UI interaction success rates across different browsers and device sizes.
    *   Visual consistency and responsive design validation through automated testing.
    *   User satisfaction score (e.g., via a simple 1-5 star rating or short survey after first successful reconciliation) for ease of use and perceived value across airline types.
    *   Low volume of support requests related to core platform functionality or airline-specific reconciliation issues.
    *   User engagement with account settings and dashboard features.

*   **Platform Performance:**
    *   Storage usage and growth patterns across users and tools.
    *   Storage efficiency gains from invoice reuse and duplicate prevention.
    *   Database performance and query efficiency with new schema including saved invoices table.
    *   Manual admin overhead for subscription management (time spent per user setup).
    *   Storage quota utilization: Average and peak usage per user relative to 100MB limit.

## 9. Implementation Details

Based on the requirements clarification:

*   **File Size Limits:** 25MB per file upload
*   **OAuth Provider:** Google OAuth only (no GitHub)
*   **Pricing:** ILS ₪6,000 implementation fee, ₪1,000 per month subscription (for internal reference only - not displayed on landing page)
*   **Python Script Conversion:** Convert Fly Dubai and TAP scripts, maintaining existing logic but optimized for TypeScript/Node.js environment
*   **Storage Quota:** 100MB per user across all tools and files
*   **Invoice Management:** Users view invoices filtered by selected airline in dropdown selector
*   **File Format Strategy:** Airline-specific invoice formats, standardized Excel report format across all airlines
*   **Configuration Parameters:** Address airline-specific processing differences during individual airline processor development
*   **Development Guidelines:** Utilize Supabase MCP wherever possible for database operations and integrations
*   **Future Considerations:** Platform should be structured to support internationalization for multiple language markets 