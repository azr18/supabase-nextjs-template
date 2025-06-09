## Relevant Files

- `nextjs/src/lib/processors/utils/pdfExtractor.ts` - This file currently uses `pdf.js-extract` and will be refactored to use `pdf-parse`.
- `nextjs/src/lib/processors/utils/pdfExtractor.test.ts` - Unit tests for `pdfExtractor.ts` will need to be updated to reflect changes and test `pdf-parse` integration.
- `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts` - This processor consumes the output of `pdfExtractor.ts`. It may need adjustments if the data structure from `pdf-parse` differs (e.g., how `PageTextData` is structured or if layout-aware extraction is handled differently).
- `package.json` (in `nextjs` directory) - To add `pdf-parse` and remove `pdf.js-extract`.

## Task List: Replace PDF Library (pdf.js-extract with pdf-parse)

- **[x] 1.0 Parent Task: Setup and Dependency Management**
    - **Goal:** Prepare the project for the new PDF library.
    - [x] 1.1 In `nextjs/package.json`, remove `pdf.js-extract` from dependencies.
    - [x] 1.2 In `nextjs/package.json`, add `pdf-parse` (latest stable version) to dependencies.
    - [x] 1.3 In `nextjs/package.json`, add `@types/pdf-parse` (latest stable version) to devDependencies if available and necessary for TypeScript.
    - [x] 1.4 Run `npm install` from the `nextjs` directory to update `package-lock.json` and install/remove packages.
    - [x] 1.5 Verify that `pdf.js-extract` is removed and `pdf-parse` is installed in `node_modules`.

- **[x] 2.0 Parent Task: Refactor `pdfExtractor.ts`**
    - **Goal:** Update the PDF extraction utility to use `pdf-parse`.
    - [x] 2.1 In `nextjs/src/lib/processors/utils/pdfExtractor.ts`, remove the import for `pdf.js-extract`.
    - [x] 2.2 Import `pdf-parse` (likely `import pdf from 'pdf-parse';`).
    - [x] 2.3 Analyze the existing `extractTextWithLayout(pdfBuffer: Buffer): Promise<PageTextData[]>` function. Understand its current output structure (`PageTextData[]`).
        - The current `PageTextData` is likely `{ pageNumber: number; lines: string[] }` or similar based on previous work.
    - [x] 2.4 Update the implementation of `extractTextWithLayout` to use `pdf-parse`.
        - `pdf-parse` typically returns an object with properties like `numpages`, `numrender`, `info`, `metadata`, `version`, and `text`. The `text` property contains the entire text content of the PDF.
        - It may also provide page-by-page information if configured, or you might need to infer page breaks if `pdf-parse` does not directly provide per-page structured lines like `pdf.js-extract` might have.
    - [x] 2.5 Adapt the output of `pdf-parse` to match the existing `PageTextData[]` structure as closely as possible. This is crucial to minimize changes in downstream consumers like `FlyDubaiProcessor.ts`.
        - If `pdf-parse` does not provide distinct lines or per-page text directly in a structured way, you may need to split its output text by newline characters (`
`) to simulate lines, and potentially by form feed characters (``) or other heuristics to simulate page breaks if necessary.
        - The goal is to make the new `extractTextWithLayout` a drop-in replacement in terms of its output contract, even if the internal mechanism changes.
    - [x] 2.6 Ensure the function still accepts a `Buffer` as input and returns a `Promise<PageTextData[]>`.
    - [x] 2.7 Add error handling for `pdf-parse` operations (e.g., if a PDF is corrupt or unparsable).

- **[x] 3.0 Parent Task: Update Unit Tests for `pdfExtractor.ts`**
    - **Goal:** Ensure the refactored PDF extraction utility works correctly.
    - [x] 3.1 Review `nextjs/src/lib/processors/utils/pdfExtractor.test.ts`.
    - [x] 3.2 Update any mock implementations if `pdf.js-extract` was mocked.
    - [x] 3.3 Adjust existing test cases to work with `pdf-parse`. The key is that *the output* of `extractTextWithLayout` should ideally remain the same, so tests asserting the structure and content of `PageTextData[]` might still be valid if the adaptation in step 2.5 was successful.
    - [x] 3.4 If the output structure *had* to change slightly despite best efforts in 2.5, update test assertions accordingly.
    - [x] 3.5 Add new test cases if necessary to cover specific behaviors or edge cases of `pdf-parse` (e.g., handling of encrypted PDFs if `pdf-parse` supports it differently, or different text layouts).
    - [x] 3.6 Run tests from the `nextjs` directory (e.g., `npm test -- pdfExtractor.test.ts`) and ensure all pass.

- **[x] 4.0 Parent Task: Review and Adjust `FlyDubaiProcessor.ts`**
    - **Goal:** Ensure the `FlyDubaiProcessor` still functions correctly with the potentially slightly different output from the refactored `pdfExtractor`.
    - [x] 4.1 Open `nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts`.
    - [x] 4.2 Review how `PageTextData[]` (the output of `extractTextWithLayout`) is consumed by `_extractAwbDataFromFlyDubaiPdf` and `_extractCcaDataFromFlyDubaiPdf`.
    - [x] 4.3 If the structure of `PageTextData[]` was perfectly preserved (Task 2.5), no changes might be needed here.
    - [x] 4.4 If there were subtle differences in how text lines or page breaks are represented in `PageTextData[]` after switching to `pdf-parse`, adjust the parsing logic (RegEx, iteration, etc.) within these Fly Dubai-specific extraction methods.
        - Pay close attention to line breaks, spacing, and page separation, as these can affect RegEx matching.
    - [x] 4.5 Test these adjustments by running the unit tests for `FlyDubaiProcessor.ts` (`npm test -- FlyDubaiProcessor.test.ts` from `nextjs` directory).

- **5.0 Parent Task: Integration Testing and System-Wide Checks**
    - **Goal:** Verify the entire reconciliation flow works with the new PDF library.
    - [ ] 5.1 Manually test the Fly Dubai reconciliation flow through the UI using sample files.
    - [ ] 5.2 Check the console for any new errors related to PDF processing.
    - [ ] 5.3 Verify the generated Fly Dubai report is correct.
    - [ ] 5.4 If E2E tests exist that cover PDF processing for Fly Dubai (e.g., `tests/e2e/invoice-reconciler-flydubai.spec.ts` if it were created), run them.

- **6.0 Parent Task: Documentation and Cleanup**
    - **Goal:** Finalize the changes.
    - [ ] 6.1 Update any JSDoc comments or inline documentation in `pdfExtractor.ts` to reflect the use of `pdf-parse`.
    - [ ] 6.2 Remove any dead code related to `pdf.js-extract`.
    - [ ] 6.3 Commit all changes with a clear message (e.g., "Refactor: Replace pdf.js-extract with pdf-parse for PDF processing"). 