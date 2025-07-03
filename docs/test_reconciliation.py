#!/usr/bin/env python3
import subprocess
import sys
import os

# Test the reconciliation with proper files
invoice_file = "/files/2506013781418TLV025668_25-25.pdf"
report_file = "/files/AllDataReport_2025-05-30_to_2025-06-17_0557220075.xls"
output_file = "/files/test_reconciliation_result.json"

print(f"Testing reconciliation with:")
print(f"  Invoice: {invoice_file}")
print(f"  Report: {report_file}")
print(f"  Output: {output_file}")

# Check if files exist
if not os.path.exists(invoice_file):
    print(f"ERROR: Invoice file not found: {invoice_file}")
    sys.exit(1)
    
if not os.path.exists(report_file):
    print(f"ERROR: Report file not found: {report_file}")
    sys.exit(1)

# Run the process
cmd = [
    "python3", "/files/process_invoice.py",
    invoice_file,
    report_file, 
    output_file,
    "test123"
]

print(f"Running command: {' '.join(cmd)}")
result = subprocess.run(cmd, capture_output=True, text=True)

print(f"Exit code: {result.returncode}")
print(f"STDOUT:\n{result.stdout}")
if result.stderr:
    print(f"STDERR:\n{result.stderr}")

# Check result
if os.path.exists(output_file):
    with open(output_file, 'r') as f:
        print(f"Result JSON:\n{f.read()}") 