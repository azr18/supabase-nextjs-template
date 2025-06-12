# PRD: Supabase-Based SaaS Platform Core & N8N-Powered Invoice Reconciler MVP

## 1. Introduction/Overview

This document outlines the requirements for building the core Multi-Tool SaaS Platform and integrating its first Minimum Viable Product (MVP) tool: the N8N-Powered Invoice Reconciler. The platform aims to provide a secure, scalable environment for businesses to access various automated tool solutions. The initial focus is to establish the foundational SaaS functionalities (user management, subscriptions, customer dashboard) using the Razikus Supabase Next.js template, and then integrate the Invoice Reconciler as the first operational tool that leverages external n8n workflows for processing.

The platform will leverage the existing Supabase Next.js template's authentication system (including OAuth), user management, and file storage capabilities while replacing the existing demos with production-ready business tools. Subscription management will be performed manually by administrators via Supabase Studio, with payments handled externally through invoicing.

The Invoice Reconciler tool provides a streamlined interface for users to upload airline invoices and reports, which are then processed by sophisticated n8n workflows. The system uses a hybrid implementation approach: starting with direct file retrieval for rapid MVP development, then upgrading to secure signed URL file transfer for production deployment. This architecture separates the user interface from the complex reconciliation logic while providing a clear migration path from development to production security, allowing for easier maintenance, updates, and scalability while providing a seamless user experience.

## 2. Goals

*   **Platform Goals (MVP):**
    *   Leverage the Razikus Supabase Next.js template as the foundation for secure multi-tenant SaaS infrastructure.
    *   Implement robust user registration, login, and session management using Supabase Auth with Google OAuth provider integration.
    *   Replace existing template demos with a production-ready customer dashboard for accessing subscribed tools and managing basic account settings.
    *   Implement manual subscription management system via Supabase Studio for administrators to control tool access.
    *   Create a clear pathway for customers to access and use subscribed tools with external invoicing for payments.
    *   Establish Supabase storage bucket architecture for secure, organized file management across multiple tools.
    *   Develop a professional landing page that promotes the SaaS platform's value proposition without revealing specific tools.

*   **N8N-Powered Invoice Reconciler Tool Goals (MVP):**
    *   Provide a unified interface with dropdown selection for different airline invoice types (Fly Dubai, TAP, Philippines Airlines, Air India, El Al).
    *   Enable customers to upload PDF invoices and Excel report files through a simple, guided workflow.
    *   Securely store uploaded files in Supabase storage buckets with proper organization and access control.
    *   Implement hybrid file access: direct file retrieval for MVP development, upgrading to signed URLs for production security.
    *   Trigger external n8n workflows via webhook integration containing file paths/URLs and metadata based on implementation phase.
    *   Enable n8n workflows to access files through Supabase direct access (MVP) or signed URLs (production).
    *   Receive processed reconciliation reports from n8n workflows and provide secure download links to users.
    *   Implement temporary storage for reconciliation reports with automatic cleanup after download or timeout.
    *   Provide clear status feedback throughout the upload, processing, and download workflow.
    *   Ensure reliable webhook communication with proper error handling and retry mechanisms for file access.

*   **Project Management Goals:**
    *   Provide clear, actionable requirements suitable for a junior developer to implement features incrementally, managed via agentic coding.
    *   Ensure the PRD focuses on the "what" and "why," allowing development flexibility on the "how" within the chosen technical stack.
    *   Design a modular architecture that allows easy addition of new airline types and future business tools.
    *   Separate concerns between frontend interface and backend processing logic through n8n integration.

## 3. User Stories

*   **Customer User:**
    1.  "As a Customer User, I want to easily register for an account on the platform using my email and password, or through Google OAuth so that I can explore and access available tools."
    2.  "As a Customer User, I want to securely log into the platform using my credentials or Google OAuth so that I can access my dashboard and the tools I am subscribed to."
    3.  "As a Customer User, upon logging in, I want to see a dashboard that clearly lists the tools I have access to, so I can easily navigate to the tool I need."
    4.  "As a Customer User, when I select the Invoice Reconciler tool, I want to see a dropdown selector to choose which airline invoice type I'm reconciling (Fly Dubai, TAP, Philippines Airlines, etc.) so that I can access the appropriate processing logic."
    5.  "As a Customer User, after selecting an airline type, I want to upload my PDF invoice file through a clear and intuitive interface with progress indicators."
    6.  "As a Customer User, after uploading the invoice, I want to upload my Excel report file (standardized format) to complete the reconciliation setup."
    7.  "As a Customer User, I want to receive clear feedback about the status of my file uploads, including validation results and any errors."
    8.  "As a Customer User, after uploading both files, I want to submit my reconciliation request and receive confirmation that processing has started."
    9.  "As a Customer User, I want to see real-time status updates about my reconciliation job (uploaded, processing, completed, error) so I know when my results are ready."
    10. "As a Customer User, when my reconciliation is complete, I want to download the generated Excel reconciliation report immediately through a secure download link."
    11. "As a Customer User, I want to be informed about how long my reconciliation report will be available for download before it's automatically removed."

*   **Platform Admin (Manual/Supabase Studio for MVP):**
    1.  "As a Platform Admin, I want to be able to manually manage which tools a customer is subscribed to and their subscription status via Supabase Studio so that they have correct access based on their external payment/agreement."
    2.  "As a Platform Admin, I want to view user activity and tool usage through the Supabase dashboard so that I can monitor platform utilization and support users effectively."
    3.  "As a Platform Admin, I want to monitor webhook activity and n8n integration health to ensure reliable processing."

*   **N8N Workflow (External System):**
    1.  "As an N8N Workflow, I want to receive webhook requests with file references and airline type so that I can process the reconciliation using the appropriate logic."
    2.  "As an N8N Workflow, I want to access uploaded files from Supabase storage buckets to perform reconciliation processing."
    3.  "As an N8N Workflow, I want to return the processed reconciliation report to the platform for user download."

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

### 4.2 N8N-Powered Invoice Reconciler Tool Requirements (MVP)

**Tool Interface & Airline Selection:**
1.  FR4.1: When a subscribed user navigates to the Invoice Reconciler tool page, they **must** be presented with a dropdown selector to choose the airline invoice type they want to reconcile.
2.  FR4.2: The dropdown **must** include the following airline options: Fly Dubai, TAP, Philippines Airlines, Air India, and El Al.
3.  FR4.3: Upon selecting an airline type, the interface **must** display a guided upload workflow for PDF invoice and Excel report files.
4.  FR4.4: The system **must** provide clear instructions that invoice formats are airline-specific while Excel report format is standardized across all airlines.

**File Upload Interface (Supabase Storage Integration):**
1.  FR4.5: The system **must** provide a sequential upload interface: first PDF invoice upload, then Excel report upload.
2.  FR4.6: The system **must** validate uploaded files for basic criteria (e.g., file type, size limits up to 25MB per file) on the client-side and backend before processing.
3.  FR4.7: The system **must** securely store uploaded files in the `invoice-reconciler` Supabase storage bucket, organized by user and job instance.
4.  FR4.8: The system **must** provide upload progress indicators and success/error feedback using the template's existing notification system.
5.  FR4.9: The system **must** generate unique job IDs for each reconciliation request to organize files and track processing status.
6.  FR4.10: The system **must** validate that both required files (PDF invoice and Excel report) are uploaded before allowing submission.

**N8N Webhook Integration (Hybrid Approach):**
1.  FR4.11: Upon successful file upload and submission, the system **must** trigger an n8n webhook with payload containing:
    *   Job ID (unique identifier)
    *   User ID (for access control)
    *   Airline type (for processing logic selection)
    *   File access information (file paths for MVP, signed URLs for production)
    *   File metadata (names, mime types, sizes, storage bucket)
    *   Processing configuration for the selected airline
    *   Callback URLs for status updates and result delivery
2.  FR4.12: **MVP Implementation**: The system **must** support direct file access by providing file paths and allowing n8n to use Supabase service key for file retrieval.
3.  FR4.13: **Production Implementation**: The system **must** support signed URL generation (2-hour expiry) for secure, temporary file access without permanent credentials.
4.  FR4.14: The system **must** implement webhook authentication to ensure secure communication with n8n workflows.
5.  FR4.15: The system **must** handle webhook failures gracefully with retry mechanisms and clear error messaging to users.
6.  FR4.16: The system **must** provide mechanisms to switch between direct file access and signed URL approaches without major code changes.
7.  FR4.17: The system **must** provide status endpoints that n8n workflows can use to update job progress and completion status.
8.  FR4.18: The system **must** accept processed reconciliation reports from n8n workflows via callback endpoints.

**Status Tracking & User Feedback:**
1.  FR4.16: The system **must** track reconciliation job status through the following states: "uploading", "submitted", "processing", "completed", "failed".
2.  FR4.17: The system **must** provide real-time status updates to users through the interface, showing current processing stage.
3.  FR4.18: The system **must** display estimated processing times based on airline type and file sizes.
4.  FR4.19: The system **must** provide clear error messages when processing fails, including guidance for resolution when possible.
5.  FR4.20: The system **must** notify users when their reconciliation report is ready for download.

**Temporary Report Management:**
1.  FR4.21: The system **must** temporarily store completed reconciliation reports received from n8n workflows for user download.
2.  FR4.22: The system **must** provide secure download links for reconciliation reports using Supabase signed URLs with time-limited access.
3.  FR4.23: The system **must** automatically clean up temporary reconciliation reports after 48 hours or after successful download, whichever comes first.
4.  FR4.24: The system **must** inform users about the temporary nature of report storage and download time limits.
5.  FR4.25: The system **must** allow users to re-download reports within the time limit without reprocessing.

### 4.3 Database Schema Requirements

1.  FR5.1: The system **must** create new tables extending the existing Supabase template schema:
    *   `tools` - Available tools in the platform
    *   `user_tool_subscriptions` - User access to specific tools with status
    *   `reconciliation_jobs` - Job tracking for invoice reconciliation with n8n integration
    *   `airline_types` - Supported airline configurations
2.  FR5.2: The `reconciliation_jobs` table **must** include fields for user_id, airline_type, job_id, status, webhook_payload, file_paths, signed_urls_payload, result_file_path, webhook_triggered_at, n8n_execution_id, n8n_workflow_id, callback_url, created_at, updated_at, expires_at.
3.  FR5.3: The system **must** implement appropriate RLS policies for data security and multi-tenancy on all new tables.
4.  FR5.4: The system **must** maintain referential integrity between users, subscriptions, and job records.
5.  FR5.5: The system **must** implement database constraints to prevent duplicate active jobs for the same user.

### 4.4 Admin Capabilities (MVP - Manual)

1.  FR6.1: A Platform Admin **must** be able to manually view and manage customer tool subscriptions via Supabase Studio. This includes:
    *   Assigning a tool subscription to a customer
    *   Setting a subscription status (e.g., active/inactive/trial)
    *   Viewing user activity and job history
2.  FR6.2: Admins **must** be able to monitor storage usage and file management across all users and tools via Supabase dashboard.
3.  FR6.3: Admins **must** be able to view webhook activity logs and n8n integration health metrics.
4.  FR6.4: Admins **must** be able to manually trigger cleanup of expired temporary files and job records.
5.  FR6.5: Admins **must** be able to view processing statistics including success rates, average processing times, and common error patterns.

## 5. Non-Goals (Out of Scope for MVP)

*   **Integrated Payment Processing:** Payment processing via the website is out of scope for MVP. Payments will be processed externally through invoicing.
*   **Automated Subscription Provisioning:** Automated provisioning of tool access based on payments is a post-MVP goal.
*   **Advanced Admin Interface UI:** A dedicated web-based Admin Interface for managing users, subscriptions, and tools is out of scope for MVP.
*   **Team Accounts/Roles:** Complex team structures, role-based access control (RBAC) beyond basic user authentication, and organization-level subscriptions are out of scope for MVP.
*   **Additional Business Tools:** Integration of non-reconciliation business tools is out of scope for MVP.
*   **Advanced File Management UI:** A comprehensive file management system within the dashboard beyond basic job history is out of scope for MVP.
*   **Real-time Collaboration Features:** Any real-time collaboration on reconciliation or data is out of scope.
*   **Advanced Analytics and Reporting:** Complex reporting and analytics within the customer dashboard beyond basic job history is out of scope for MVP.
*   **Mobile Applications:** Native mobile applications (iOS/Android) are out of scope.
*   **Template Demo Preservation:** The existing file management and task management demos from the template will be removed and replaced with production tools.
*   **Persistent Invoice Storage:** Saving invoices for reuse across multiple jobs is out of scope; each job requires fresh file uploads.
*   **Complex Reconciliation Logic:** All reconciliation processing logic is handled by external n8n workflows, not within the application.
*   **Invoice Management Features:** Organization, tagging, and management of historical invoices is out of scope.
*   **Previous Invoice Tool Implementation:** All existing invoice reconciler code, Python PDF service, airline-specific processors, and related infrastructure from the previous implementation will be removed to ensure a clean codebase for the N8N approach.

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
*   **N8N-Powered Invoice Reconciler Tool Page:**
    *   Prominent dropdown selector for airline type at the top of the page
    *   Sequential upload interface: Step 1 (Select Airline) → Step 2 (Upload PDF) → Step 3 (Upload Excel) → Step 4 (Submit & Process)
    *   Clear visual progress indicators showing current step and overall progress
    *   File upload interface with drag-and-drop functionality and progress bars
    *   Clear instructions distinguishing airline-specific invoice formats from standardized report format
    *   Real-time status updates during processing with estimated completion times
    *   Download interface for completed reports with clear expiration information
    *   Job history showing recent reconciliation attempts with airline type and status
*   **Authentication Flow:** Leverage template's existing auth UI with Google OAuth prominently displayed alongside email/password options.
*   **Feedback:** Utilize the template's existing notification/toast system for user feedback (e.g., successful upload, processing started, report ready, error messages).
*   **Testing Strategy:** Comprehensive automated testing approach:
    *   **Unit Testing:** Jest/Vitest for component and utility function testing
    *   **Integration Testing:** API endpoint and webhook integration testing
    *   **End-to-End Testing:** Playwright MCP for browser automation, user flow testing, and UI interaction validation
    *   **Visual Testing:** Playwright for visual regression testing and responsive design validation
    *   **User Acceptance Testing:** Business owner validates functionality after technical testing completion

## 7. Technical Considerations

*   **Primary Stack:** Razikus Supabase Next.js template (Next.js 15, React 19, Supabase Auth, Supabase Database, Supabase Storage, Tailwind CSS, shadcn/ui).
*   **Backend Logic:** Next.js API Routes for file handling, webhook integration, and status management. Complex reconciliation processing handled by external n8n workflows.
*   **Database:** PostgreSQL via Supabase with new custom tables for tools, subscriptions, and jobs, extending the existing template schema.
*   **Authentication:** Supabase Auth with email/password and Google OAuth.
*   **Development Approach:** Agent coder should utilize Supabase MCP (Model Context Protocol) whenever possible for enhanced database operations and integrations.
*   **Testing Strategy:** Comprehensive automated testing approach:
    *   **Unit Testing:** Jest/Vitest for component and utility function testing
    *   **Integration Testing:** API endpoint and webhook integration testing, including n8n webhook simulation
    *   **End-to-End Testing:** Playwright MCP for browser automation, user flow testing, and UI interaction validation
    *   **Visual Testing:** Playwright for visual regression testing and responsive design validation
    *   **User Acceptance Testing:** Business owner validates functionality after technical testing completion
*   **File Storage:** Supabase Storage buckets with organized structure:
    *   `invoice-reconciler` bucket with `user_id/jobs/job_id/` structure for job-specific file storage
    *   `reconciler-reports` bucket with `user_id/jobs/job_id/` structure for temporary report storage
    *   100MB storage quota per user enforcement with automatic cleanup of temporary files
*   **N8N Integration Architecture (Hybrid):**
    *   Webhook-based communication with configurable file access patterns
    *   **MVP Phase**: Direct file access using Supabase service key for rapid development
    *   **Production Phase**: Time-limited signed URLs (2-hour expiry) for secure file access without permanent credentials
    *   Flexible webhook payload supporting both file paths and signed URLs
    *   Secure authentication tokens for webhook requests
    *   Callback URLs for n8n workflows to update job status and deliver results
    *   Error handling and retry mechanisms for failed webhook communications
    *   Clear migration path from development to production security model
*   **Webhook Security:** Implement proper authentication and validation for incoming webhook requests from n8n workflows.
*   **Row Level Security:** Implement comprehensive RLS policies on all new tables and storage buckets for data isolation and security.
*   **Error Handling:** Implement comprehensive error handling for file uploads, webhook communications, and processing failures with clear user feedback.
*   **Scalability:** Leverage serverless architecture for the web application while n8n handles the scalable processing of reconciliation workloads.
*   **Internationalization Readiness:** Structure the application to support future translation to multiple languages using Next.js internationalization features.

## 8. Success Metrics (MVP)

*   **User Adoption & Engagement:**
    *   Number of user registrations within the first month post-launch (both email/password and Google OAuth).
    *   Number of active users successfully using the Invoice Reconciler tool weekly/monthly across all supported airlines.
    *   Task completion rate: Percentage of users who start a reconciliation (any airline) and successfully download a report.
    *   Airline usage distribution: Which airlines are most frequently used by customers.
    *   Google OAuth adoption rate: Percentage of users choosing Google OAuth vs email/password registration.

*   **Tool Performance & Reliability:**
    *   Average processing time for reconciliation jobs across all supported airlines (measured from submission to n8n completion).
    *   Webhook success rate: Percentage of successful webhook communications between the application and n8n workflows.
    *   System uptime for the platform and webhook endpoints (target 99.5%+).
    *   File upload success rate and average upload times.
    *   Report download success rate within the 48-hour window.

*   **User Experience & Testing Quality:**
    *   End-to-end user flow completion rates measured via Playwright automated testing.
    *   UI interaction success rates across different browsers and device sizes.
    *   Visual consistency and responsive design validation through automated testing.
    *   User satisfaction score (e.g., via a simple 1-5 star rating or short survey after first successful reconciliation) for ease of use and perceived value across airline types.
    *   Low volume of support requests related to core platform functionality or webhook integration issues.
    *   User engagement with account settings and dashboard features.

*   **Platform Performance:**
    *   Storage usage and growth patterns across users and tools.
    *   Database performance and query efficiency with new schema.
    *   Manual admin overhead for subscription management (time spent per user setup).
    *   Storage quota utilization: Average and peak usage per user relative to 100MB limit.
    *   Temporary file cleanup efficiency and storage cost optimization.

*   **N8N Integration Health:**
    *   N8N workflow execution success rate across different airline types.
    *   Average response time for n8n webhook callbacks.
    *   Error rate and types of failures in n8n processing workflows.
    *   Monitoring of n8n workflow resource usage and performance.

## 9. Implementation Details

Based on the requirements clarification:

*   **File Size Limits:** 25MB per file upload
*   **OAuth Provider:** Google OAuth only (no GitHub)
*   **Pricing:** ILS ₪6,000 implementation fee, ₪1,000 per month subscription (for internal reference only - not displayed on landing page)
*   **N8N Workflow Integration:** External n8n instance handles all reconciliation processing logic
*   **Storage Quota:** 100MB per user across all tools and files
*   **File Upload Strategy:** Sequential upload process (airline selection → PDF upload → Excel upload → submit)
*   **Report Storage:** Temporary storage for 48 hours with automatic cleanup
*   **Webhook Configuration:** Secure webhook endpoints for n8n communication with proper authentication
*   **Development Guidelines:** Utilize Supabase MCP wherever possible for database operations and integrations
*   **Codebase Cleanup:** Remove all existing invoice reconciler implementation including:
    *   Python PDF service (`python-pdf-service/` directory)
    *   Existing airline-specific processors (`nextjs/src/lib/processors/` directory)
    *   Complex reconciliation logic and related utilities
    *   Any temporary or test files from previous implementation
    *   Database tables/migrations specific to the old approach (if any conflict with N8N approach)
*   **Future Considerations:** Platform should be structured to support internationalization for multiple language markets
*   **Signed URL File Access:** Time-limited (2-hour) signed URLs for secure file transfer without exposing Supabase credentials
*   **N8N Workflow Requirements:** N8N workflows must be capable of:
    *   Downloading files immediately upon webhook receipt using provided signed URLs
    *   Processing airline-specific invoice formats and standardized Excel reports
    *   Handling URL expiration gracefully and requesting new URLs if needed
    *   Returning processed reconciliation reports via webhook callbacks
    *   Providing status updates throughout the processing workflow 