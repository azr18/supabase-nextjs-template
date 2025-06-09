import os
import pandas as pd
import pdfplumber
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter
from openpyxl.styles import PatternFill, Border, Side
from openpyxl.formatting.rule import FormulaRule

from pdf_extraction import extract_awb_data, extract_cca_data
from utils import safe_to_numeric, format_date, format_cca_date


def process_file(pdf_file_bytes, report_data_df=None):
    """
    Process a PDF file, merge with report data, and return the results as Excel bytes
    """
    print("Starting reconciliation process...")
    
    # Initialize result variables
    df_awb = pd.DataFrame()
    df_cca = pd.DataFrame()
    
    # --- Open PDF and extract data ---
    try:
        with pdfplumber.open(pdf_file_bytes) as pdf:
            df_awb = extract_awb_data(pdf)
            df_cca = extract_cca_data(pdf)
    except pdfplumber.exceptions.PDFSyntaxError as pdf_err:
        print(f"Error reading PDF structure in process_file: {pdf_err}")
        return {
            "invoices_rows": 0, "cca_rows": 0, "excel_file_bytes": None,
            "total_net_due_awb": 0.0, "error": str(pdf_err)
        }
    except Exception as e:
        print(f"An error occurred during PDF processing in process_file: {e}")
        return {
            "invoices_rows": 0, "cca_rows": 0, "excel_file_bytes": None,
            "total_net_due_awb": 0.0, "error": str(e)
        }

    df_awb_data_only = df_awb.copy()
    print(f"  -> Initial AWB data rows extracted: {len(df_awb_data_only)}")

    if df_awb.empty and df_cca.empty:
        print("Both extract_awb_data and extract_cca_data returned empty DataFrames.")
        return {
            "invoices_rows": 0, "cca_rows": 0, "excel_file_bytes": None,
            "total_net_due_awb": 0.0, "error": "No data extracted from PDF"
        }

    total_net_due_awb = 0.0
    df_awb_final = pd.DataFrame()
    df_awb_for_recon = pd.DataFrame()
    df_cca_final = pd.DataFrame()
    df_reconciliation = pd.DataFrame()

    # --- Process AWB Data ---
    if not df_awb_data_only.empty:
        # Process AWB data (calculations, column drops) before writing
        numeric_cols_awb = [
            'PP Freight Charge', 'PP Due Airline', 'CC Freight Charge', 'CC Due Agent',
            'CC Due Airline', 'Disc.', 'Agency Comm.', 'Taxes', 'Others', 'Net Due for AWB',
            'Net Yield Rate'
        ]
        
        print("  -> Converting AWB columns to numeric (on data_only)...")
        for col in numeric_cols_awb:
            if col in df_awb_data_only.columns:
                df_awb_data_only[col] = safe_to_numeric(df_awb_data_only[col])

        # Calculate totals based only on data rows
        valid_numeric_cols_awb = [col for col in numeric_cols_awb if col in df_awb_data_only.columns and pd.api.types.is_numeric_dtype(df_awb_data_only[col])]
        cols_to_drop_for_sum = ["AWB Number", "Flight Date", "Origin", "Destination", "Charge Weight", "AWB Serial Part1", "AWB Serial Part2", "Exchange Rate"]
        df_numeric_awb_data_only = df_awb_data_only.drop(columns=[col for col in cols_to_drop_for_sum if col in df_awb_data_only.columns], errors='ignore')

        totals_row_awb = {}
        if valid_numeric_cols_awb and not df_numeric_awb_data_only.empty:
            totals_awb = df_numeric_awb_data_only[valid_numeric_cols_awb].sum(numeric_only=True).to_dict()
            totals_row_awb = {col: totals_awb.get(col, '') for col in df_awb_data_only.columns}
            totals_row_awb["AWB Number"] = "Total"
            
            for col in cols_to_drop_for_sum:
                if col in totals_row_awb:
                    totals_row_awb[col] = ''
            
            if 'Net Due for AWB' in df_awb_data_only.columns and pd.api.types.is_numeric_dtype(df_awb_data_only['Net Due for AWB']):
                total_net_due_awb = df_awb_data_only['Net Due for AWB'].sum()
                print(f"  -> Calculated Total Net Due (data only): {total_net_due_awb}")
            else:
                total_net_due_awb = 0.0

            print("  -> Calculated totals row based on AWB data_only.")
        else:
            print("  -> AWB data_only empty or no valid numeric columns found for totaling.")
            if 'Net Due for AWB' in df_awb_data_only.columns and pd.api.types.is_numeric_dtype(df_awb_data_only['Net Due for AWB']):
               total_net_due_awb = df_awb_data_only['Net Due for AWB'].sum()

        # --- Apply Formatting and Splitting to df_awb_data_only ---
        if 'Flight Date' in df_awb_data_only.columns:
            df_awb_data_only['Flight Date'] = df_awb_data_only['Flight Date'].astype(str).apply(format_date)

        # Format Charge Weight (remove ' K' and convert to numeric)
        if 'Charge Weight' in df_awb_data_only.columns:
            df_awb_data_only['Charge Weight'] = df_awb_data_only['Charge Weight'].astype(str).str.replace(r'\s*K$', '', regex=True)
            df_awb_data_only['Charge Weight'] = safe_to_numeric(df_awb_data_only['Charge Weight'])

        # Split AWB Number
        if "AWB Number" in df_awb_data_only.columns:
            split_awb = df_awb_data_only["AWB Number"] \
                .astype(str) \
                .str.split(r'\s+', n=2, expand=True)
            df_awb_data_only['AWB Prefix'] = split_awb[0].fillna('').astype(str).str.strip()
            df_awb_data_only['AWB Serial'] = split_awb[1].fillna('').astype(str) + split_awb[2].fillna('').astype(str)
            df_awb_data_only['AWB Serial'] = df_awb_data_only['AWB Serial'].str.replace(r'\s+', '', regex=True).str.strip()
            
            if totals_row_awb:
                totals_row_awb['AWB Prefix'] = 'Total'
                totals_row_awb['AWB Serial'] = ''

        # Finalize DataFrames
        df_awb_for_recon = df_awb_data_only.copy()
        print(f"  -> Finalized df_awb_for_recon (data only). Shape: {df_awb_for_recon.shape}")

        df_awb_final_data = df_awb_data_only.drop(columns=["AWB Serial Part1", "AWB Serial Part2", "Exchange Rate", "AWB Number"], errors='ignore')
        if totals_row_awb:
            df_awb_final = pd.concat([df_awb_final_data, pd.DataFrame([totals_row_awb]).drop(columns=["AWB Serial Part1", "AWB Serial Part2", "Exchange Rate", "AWB Number"], errors='ignore')], ignore_index=True)
        else:
            df_awb_final = df_awb_final_data
        print(f"  -> Finalized df_awb_final (for Invoices sheet). Shape: {df_awb_final.shape}")

        # Reorder columns for AWB sheet 
        base_awb_cols = ['AWB Prefix', 'AWB Serial']
        existing_cols = [col for col in df_awb_final.columns if col not in ['AWB Prefix', 'AWB Serial']]
        awb_cols_order = base_awb_cols + existing_cols
        awb_cols_order = [col for col in awb_cols_order if col in df_awb_final.columns]
        df_awb_final = df_awb_final[awb_cols_order]

    # --- Process CCA Data ---
    if not df_cca.empty:
        if 'CCA Issue Date' in df_cca.columns:
            df_cca['CCA Issue Date'] = df_cca['CCA Issue Date'].astype(str).apply(format_cca_date)

        if 'AWB Prefix' in df_cca.columns:
            df_cca['AWB Prefix'] = df_cca['AWB Prefix'].astype(str)
        if 'AWB Serial' in df_cca.columns:
            df_cca['AWB Serial'] = df_cca['AWB Serial'].astype(str)

        df_cca_final = df_cca

        # Reorder columns to put Prefix/Serial near the start
        cca_cols_order = ['AWB Prefix', 'AWB Serial'] + [col for col in df_cca_final.columns if col not in ['AWB Prefix', 'AWB Serial']]
        cca_cols_order = [col for col in cca_cols_order if col in df_cca_final.columns]
        df_cca_final = df_cca_final[cca_cols_order]

    # --- Reconciliation Logic ---
    if report_data_df is not None and not report_data_df.empty and not df_awb_for_recon.empty:
        print("--- Starting Reconciliation Process ---")

        # Prepare Invoice Data for Merge
        invoice_cols_for_merge = ['AWB Prefix', 'AWB Serial', 'Charge Weight', 'Net Yield Rate', 'Net Due for AWB']
        df_awb_for_recon['AWB Prefix'] = df_awb_for_recon['AWB Prefix'].fillna('').astype(str).str.strip()
        df_awb_for_recon['AWB Serial'] = df_awb_for_recon['AWB Serial'].fillna('').astype(str).str.strip()

        df_awb_for_recon['Charge Weight'] = safe_to_numeric(df_awb_for_recon['Charge Weight'])
        df_awb_for_recon['Net Yield Rate'] = safe_to_numeric(df_awb_for_recon['Net Yield Rate'])
        df_awb_for_recon['Net Due for AWB'] = safe_to_numeric(df_awb_for_recon['Net Due for AWB'])

        df_invoice_subset = df_awb_for_recon[invoice_cols_for_merge]
        print(f"  -> Prepared Invoice subset for merge from df_awb_for_recon. Shape: {df_invoice_subset.shape}")

        # Prepare Report Data for Merge
        report_cols = ['awbprefix', 'awbsuffix', 'chargewt', 'frt_cost_rate', 'total_cost']
        if all(col in report_data_df.columns for col in report_cols):
            df_report_subset = report_data_df[report_cols].copy()

            print("  -> Normalizing report merge key strings...")
            for col in ['awbprefix', 'awbsuffix']:
                df_report_subset[col] = df_report_subset[col].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()

            # Rename columns for clarity and merging
            df_report_subset.rename(columns={
                'awbprefix': 'AWB Prefix',
                'awbsuffix': 'AWB Serial',
                'chargewt': 'Charge Weight (Report)',
                'frt_cost_rate': 'Net Yield Rate (Report)',
                'total_cost': 'Net Due (Report)'
            }, inplace=True)

            # Ensure numeric types for comparison columns
            df_report_subset['Charge Weight (Report)'] = safe_to_numeric(df_report_subset['Charge Weight (Report)'])
            df_report_subset['Net Yield Rate (Report)'] = safe_to_numeric(df_report_subset['Net Yield Rate (Report)'])
            df_report_subset['Net Due (Report)'] = safe_to_numeric(df_report_subset['Net Due (Report)'])

            print(f"  -> Prepared Report subset for merge. Shape before dedup: {df_report_subset.shape}")

            # Remove duplicates from report data
            initial_report_rows = len(df_report_subset)
            df_report_subset.drop_duplicates(subset=['AWB Prefix', 'AWB Serial'], keep='first', inplace=True)
            final_report_rows = len(df_report_subset)
            if initial_report_rows != final_report_rows:
                print(f"  -> Removed {initial_report_rows - final_report_rows} duplicate AWB entries from the report data.")
            print(f"  -> Shape after dedup: {df_report_subset.shape}")

            # Perform Left Merge
            print("  -> Performing left merge...")
            df_reconciliation = pd.merge(
                df_invoice_subset,
                df_report_subset,
                on=['AWB Prefix', 'AWB Serial'],
                how='left',
                suffixes=None
            )
            print(f"  -> Merge complete. Shape after merge: {df_reconciliation.shape}")

            # Rename columns for final output clarity
            df_reconciliation.rename(columns={
                'Charge Weight': 'Charge Weight (Invoice)',
                'Net Yield Rate': 'Net Yield Rate (Invoice)',
                'Net Due for AWB': 'Net Due (Invoice)'
            }, inplace=True)

            # Calculate Differences
            df_reconciliation['Diff Net Due'] = df_reconciliation['Net Due (Report)'].sub(df_reconciliation['Net Due (Invoice)'])
            print("  -> Calculated difference columns.")

            # Add Discrepancy Flag
            charge_weight_discrepancy = (
                (df_reconciliation['Charge Weight (Invoice)'].notna() & df_reconciliation['Charge Weight (Report)'].notna() &
                 (df_reconciliation['Charge Weight (Invoice)'].round(2) != df_reconciliation['Charge Weight (Report)'].round(2))) |
                (df_reconciliation['Charge Weight (Invoice)'].isna() & df_reconciliation['Charge Weight (Report)'].notna()) |
                (df_reconciliation['Charge Weight (Invoice)'].notna() & df_reconciliation['Charge Weight (Report)'].isna())
            )
            net_yield_rate_discrepancy = (
                (df_reconciliation['Net Yield Rate (Invoice)'].notna() & df_reconciliation['Net Yield Rate (Report)'].notna() &
                 (df_reconciliation['Net Yield Rate (Invoice)'].round(5) != df_reconciliation['Net Yield Rate (Report)'].round(5))) |
                (df_reconciliation['Net Yield Rate (Invoice)'].isna() & df_reconciliation['Net Yield Rate (Report)'].notna()) |
                (df_reconciliation['Net Yield Rate (Invoice)'].notna() & df_reconciliation['Net Yield Rate (Report)'].isna())
            )
            net_due_discrepancy = (
                 (df_reconciliation['Diff Net Due'].notna() & (df_reconciliation['Diff Net Due'].round(2) != 0))
            )

            discrepancy = charge_weight_discrepancy | net_yield_rate_discrepancy | net_due_discrepancy
            df_reconciliation['Discrepancy Found'] = discrepancy
            print("  -> Added 'Discrepancy Found' column.")

            # Reorder Reconciliation Columns
            recon_cols_order = [
                 'AWB Prefix', 'AWB Serial',
                 'Charge Weight (Invoice)', 'Charge Weight (Report)',
                 'Net Yield Rate (Invoice)', 'Net Yield Rate (Report)',
                 'Net Due (Invoice)', 'Net Due (Report)', 'Diff Net Due',
                 'Discrepancy Found'
             ]
            recon_cols_order = [col for col in recon_cols_order if col in df_reconciliation.columns]
            df_reconciliation = df_reconciliation[recon_cols_order]

            # Identify AWBs with Net Due Discrepancies
            discrepancy_awbs = set()
            if 'Diff Net Due' in df_reconciliation.columns and 'AWB Prefix' in df_reconciliation.columns and 'AWB Serial' in df_reconciliation.columns:
                recon_data_only = df_reconciliation[df_reconciliation['AWB Prefix'] != 'Total'].copy()
                discrepancy_rows = recon_data_only[
                    recon_data_only['Diff Net Due'].notna() & 
                    (recon_data_only['Diff Net Due'].round(2) != 0)
                ]
                if not discrepancy_rows.empty:
                    discrepancy_awbs = set(zip(
                        discrepancy_rows['AWB Prefix'].astype(str),
                        discrepancy_rows['AWB Serial'].astype(str)
                    ))
                    print(f"  -> Identified {len(discrepancy_awbs)} AWBs with non-zero Net Due difference for invoice highlighting.")

            # Add Totals Row to Reconciliation Data
            cols_to_sum_rec = [
                'Charge Weight (Invoice)', 'Charge Weight (Report)',
                'Net Due (Invoice)', 'Net Due (Report)', 'Diff Net Due'
            ]
            valid_cols_to_sum = [col for col in cols_to_sum_rec if col in df_reconciliation.columns and pd.api.types.is_numeric_dtype(df_reconciliation[col])]
            
            if valid_cols_to_sum and not df_reconciliation.empty:
                totals_rec = df_reconciliation[valid_cols_to_sum].sum(numeric_only=True).to_dict()
                totals_row_rec = {col: '' for col in df_reconciliation.columns}
                totals_row_rec.update(totals_rec)
                totals_row_rec['AWB Prefix'] = 'Total'
                df_reconciliation = pd.concat([df_reconciliation, pd.DataFrame([totals_row_rec])], ignore_index=True)
                print("  -> Added calculated totals row to Reconciliation DataFrame.")

        else:
            print("  -> Report DataFrame missing required columns for reconciliation. Skipping reconciliation.")

    elif report_data_df is None or report_data_df.empty:
         print("--- No report data provided or report data is empty. Skipping reconciliation. ---")
    elif df_awb_for_recon.empty:
         print("--- Invoice data (AWB) is empty. Skipping reconciliation. ---")

    # Generate Excel file and return results
    try:
        excel_bytes = create_excel_file(df_awb_final, df_cca_final, df_reconciliation, df_awb_for_recon)
        
        invoices_rows_count = 0
        if not df_awb_final.empty:
            invoices_rows_count = len(df_awb_final)
            if 'Total' in df_awb_final['AWB Prefix'].values:
                invoices_rows_count -= 1
                 
        cca_rows_count = 0
        if not df_cca_final.empty:
            cca_rows_count = len(df_cca_final)
            if 'Total' in df_cca_final['CCA Ref. No'].values:
                cca_rows_count -= 1

        return {
            "invoices_rows": invoices_rows_count,
            "cca_rows": cca_rows_count,
            "excel_file_bytes": excel_bytes,
            "total_net_due_awb": total_net_due_awb
        }

    except Exception as e:
        print(f"Error creating Excel file: {e}")
        return {
            "invoices_rows": 0,
            "cca_rows": 0, 
            "excel_file_bytes": None,
            "total_net_due_awb": total_net_due_awb,
            "error": str(e)
        }


def create_excel_file(df_awb_final, df_cca_final, df_reconciliation, df_awb_for_recon):
    """
    Create Excel file with multiple sheets and return as bytes
    """
    from io import BytesIO
    
    print("Writing data to Excel file...")
    excel_buffer = BytesIO()
    
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        # Calculate Summary Data
        print("--- Preparing Summary Sheet Data ---")
        summary_data = {}
        
        if not df_awb_for_recon.empty:
            df_summary_input = df_awb_for_recon[df_awb_for_recon['AWB Prefix'] != 'Total'].copy()
            if not df_summary_input.empty:
                invoice_awb_count = len(df_summary_input)
                total_invoice_amount = df_summary_input['Net Due for AWB'].sum()
                total_charge_weight = df_summary_input['Charge Weight'].sum()
                avg_net_yield_rate = (total_invoice_amount / total_charge_weight) if total_charge_weight else 0.0
                
                summary_data['Invoice AWB Count'] = invoice_awb_count
                summary_data['Total Invoice Amount (Net Due)'] = total_invoice_amount
                summary_data['Total Invoice Charge Weight'] = total_charge_weight
                summary_data['Average Net Yield Rate'] = avg_net_yield_rate
                print(f"  -> Calculated Invoice Stats: Count={invoice_awb_count}, Amount={total_invoice_amount:.2f}")
            else:
                summary_data['Invoice AWB Count'] = 0
                summary_data['Total Invoice Amount (Net Due)'] = 0.0
                summary_data['Total Invoice Charge Weight'] = 0.0
                summary_data['Average Net Yield Rate'] = 0.0
        else:
            summary_data['Invoice AWB Count'] = 0

        # Calculate report totals from reconciliation dataframe
        if not df_reconciliation.empty and 'Net Due (Report)' in df_reconciliation.columns:
            df_rec_summary_input = df_reconciliation[df_reconciliation['AWB Prefix'] != 'Total'].copy()
            if not df_rec_summary_input.empty:
                total_report_cost = df_rec_summary_input['Net Due (Report)'].sum()
                difference_total_amount = total_report_cost - summary_data.get('Total Invoice Amount (Net Due)', 0.0)
                summary_data['Total Report Amount (for Matched AWBs)'] = total_report_cost
                summary_data['Difference (Report - Invoice)'] = difference_total_amount
                print(f"  -> Calculated Report Stats: Total Cost={total_report_cost:.2f}")
            else:
                summary_data['Total Report Amount (for Matched AWBs)'] = 0.0
                summary_data['Difference (Report - Invoice)'] = 0.0 - summary_data.get('Total Invoice Amount (Net Due)', 0.0)
        else:
            summary_data['Total Report Amount (for Matched AWBs)'] = 0.0

        # Create DataFrame for summary
        df_summary = pd.DataFrame(list(summary_data.items()), columns=['Metric', 'Value'])
        
        # Write sheets in specified order
        
        # 1. Summary Sheet
        df_summary.to_excel(writer, sheet_name="Summary", index=False)
        print("  -> Written summary data to 'Summary' sheet.")
        
        # 2. Reconciliation Sheet
        if not df_reconciliation.empty:
            df_reconciliation.to_excel(writer, sheet_name="Reconciliation", index=False)
            print(f"  -> Written {len(df_reconciliation)} rows to 'Reconciliation' sheet.")
        else:
            pd.DataFrame().to_excel(writer, sheet_name="Reconciliation", index=False)

        # 3. Invoices Sheet
        if not df_awb_final.empty:
            df_awb_final.to_excel(writer, sheet_name="Invoices", index=False)
            print(f"  -> Written {len(df_awb_final)} rows to 'Invoices' sheet.")
        else:
            pd.DataFrame().to_excel(writer, sheet_name="Invoices", index=False)

        # 4. CCA Sheet
        if not df_cca_final.empty:
            df_cca_final.to_excel(writer, sheet_name="CCA", index=False)
            print(f"  -> Written {len(df_cca_final)} rows to 'CCA' sheet.")
        else:
            pd.DataFrame().to_excel(writer, sheet_name="CCA", index=False)

    print("--- Excel File Created Successfully ---")
    excel_buffer.seek(0)
    return excel_buffer.getvalue() 