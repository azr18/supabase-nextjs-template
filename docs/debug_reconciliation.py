#!/usr/bin/env python3
"""
Debug script to check reconciliation data in generated Excel files
"""
import pandas as pd
import sys
import os

def debug_excel_file(file_path):
    """Debug an Excel file to show what sheets and data exist"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    try:
        # Read all sheets
        all_sheets = pd.read_excel(file_path, sheet_name=None)
        
        print(f"File: {file_path}")
        print(f"Available sheets: {list(all_sheets.keys())}")
        print()
        
        for sheet_name, df in all_sheets.items():
            print(f"=== {sheet_name} Sheet ===")
            print(f"Shape: {df.shape}")
            print(f"Columns: {df.columns.tolist()}")
            if not df.empty:
                print("First few rows:")
                print(df.head(3))
            else:
                print("Sheet is EMPTY")
            print()
            
    except Exception as e:
        print(f"Error reading Excel file: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_reconciliation.py <excel_file_path>")
        sys.exit(1)
        
    debug_excel_file(sys.argv[1]) 