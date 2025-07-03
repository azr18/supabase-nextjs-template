#!/usr/bin/env python3
import subprocess
import sys
import os

# Test with the correct report filename from ls output
invoice_file = "/files/2506013781418TLV025668_25-25.pdf"
report_file = "/files/ AllDataReport_2025-05-30_to_2025-06-17_0557220075.xls"  # Note the leading space!
output_file = "/files/test_reconciliation_fixed.json"

print(f"Testing reconciliation with CORRECTED filenames:")
print(f"  Invoice: {invoice_file}")
print(f"  Report: {report_file}")
print(f"  Output: {output_file}")

# Check if files exist
if not os.path.exists(invoice_file):
    print(f"ERROR: Invoice file not found: {invoice_file}")
    
if not os.path.exists(report_file):
    print(f"ERROR: Report file not found: {report_file}")
    # List available AllData files
    try:
        all_files = os.listdir('/files')
        alldata_files = [f for f in all_files if 'AllData' in f]
        print(f"Available AllData files:")
        for f in alldata_files:
            print(f"  - {f}")
    except:
        pass
    sys.exit(1)

print("Both files exist! Running reconciliation...")

# Run the process
cmd = [
    "python3", "/files/process_invoice.py",
    invoice_file,
    report_file, 
    output_file,
    "test_fixed"
]

print(f"Command: python3 /files/process_invoice.py [invoice] [report] [output] test_fixed")
result = subprocess.run(cmd, capture_output=True, text=True)

print(f"Exit code: {result.returncode}")
if result.stdout:
    print(f"Output preview (first 500 chars):\n{result.stdout[:500]}...")
if result.stderr:
    print(f"STDERR:\n{result.stderr}")

# Check result JSON
if os.path.exists(output_file):
    with open(output_file, 'r') as f:
        result_json = f.read()
        print(f"Result JSON:\n{result_json}")
        
# Check if Excel file was created and has reconciliation data
if result.returncode == 0:
    import json
    try:
        result_data = json.loads(result_json)
        if result_data.get('success') and 'output_file' in result_data:
            excel_file = result_data['output_file']
            print(f"\nChecking Excel file: {excel_file}")
            
            # Check reconciliation sheet
            import pandas as pd
            try:
                df_rec = pd.read_excel(excel_file, sheet_name='Reconciliation')
                print(f"Reconciliation sheet shape: {df_rec.shape}")
                if not df_rec.empty:
                    print("✅ SUCCESS: Reconciliation data found!")
                    print("Sample reconciliation data:")
                    print(df_rec.head())
                else:
                    print("❌ STILL EMPTY: Reconciliation sheet has no data")
            except Exception as e:
                print(f"Error reading reconciliation sheet: {e}")
    except:
        pass 