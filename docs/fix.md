# Invoice Reconciler Tool Debugging Plan

This document outlines the issues identified with the Invoice Reconciler tool and the proposed plan to address them.

## Issues Summary

1.  **File Upload Error:** After selecting a file for upload in Step 2, an error message "Failed to save invoice metadata" is displayed, even though the file appears to be successfully uploaded to the Supabase storage bucket.
2.  **Automatic Progression (Airline Selection):** In Step 1, the tool automatically progresses to Step 2 immediately after an airline is selected, without waiting for the user to click a submit or confirm button.
3.  **Console Errors:** The following stack trace is observed, likely related to the file upload error:
    ```
    FileUpload.useCallback[processPendingFile]@webpack-internal:///(app-pages-browser)/./src/components/InvoiceReconciler/FileUpload.tsx:210:27
    async*handleConfirmUpload@webpack-internal:///(app-pages-browser)/./src/components/InvoiceReconciler/FileUpload.tsx:339:13
    processDispatchQueue@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16146:37
    dispatchEventForPluginEventSystem/<@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16749:29
    batchedUpdates$1@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3130:42
    dispatchEventForPluginEventSystem@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16305:23
    dispatchEvent@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20400:44
    dispatchDiscreteEvent@webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20368:11
    ```

## Investigation and Resolution Plan

### 1. File Upload Error ("Failed to save invoice metadata")

*   **Affected File:** `nextjs/src/components/InvoiceReconciler/FileUpload.tsx`
*   **Key Functions:** `processPendingFile` (around line 210), `handleConfirmUpload` (around line 339).
*   **Investigation Steps:**
    1.  Review the logic within `processPendingFile` and `handleConfirmUpload` to understand how file metadata is constructed and saved.
    2.  Inspect the API endpoint responsible for saving invoice metadata. Check its request payload, response, and any server-side logs.
    3.  Verify that the Supabase table for invoice metadata has the correct schema and that the user's session has the necessary permissions (RLS policies) to insert data.
    4.  Examine how errors from the metadata saving process are caught and displayed to the user.
*   **Proposed Solution:**
    *   Correct the metadata saving logic, ensuring all required fields are present and valid.
    *   Update RLS policies if permission issues are found.
    *   Improve error handling to provide more specific feedback to the user if metadata saving fails.

### 2. Automatic Progression (Airline Selection)

*   **Affected Component(s):** The component responsible for Step 1 (Airline Selection) in the Invoice Reconciler, likely located within `nextjs/src/components/InvoiceReconciler/`.
*   **Investigation Steps:**
    1.  Identify the component managing the airline selection UI and its state.
    2.  Locate the event handler (e.g., `onChange` for the airline selector) that triggers the progression to Step 2.
    3.  Determine why this handler is causing immediate progression instead of waiting for a separate confirmation action.
*   **Proposed Solution:**
    *   Modify the component's state management and event handlers to ensure that progression to Step 2 only occurs when a dedicated "Next" or "Confirm Airline" button is clicked.
    *   Ensure that the selected airline is stored in the component's state and passed to the next step upon confirmation.

## Next Steps for Debugging Agent

1.  Start by examining `nextjs/src/components/InvoiceReconciler/FileUpload.tsx` to diagnose the metadata saving issue.
2.  Then, investigate the airline selection component to fix the automatic progression.
3.  Refer to the RLS policies in Supabase for relevant tables (`invoices`, `jobs`, or similar).
4.  Check API routes in `nextjs/src/app/api/` that handle invoice creation or metadata storage. 