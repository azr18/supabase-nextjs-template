import base64
import json
import requests
import os
from io import BytesIO

def test_pdf_only():
    """Test the /reconcile endpoint with just a PDF file"""
    
    # Test fixture path
    pdf_path = "../nextjs/tests/fixtures/1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf"
    
    # Check if file exists
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return False
    
    print("Loading test PDF...")
    
    # Read and encode PDF file
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    print(f"PDF file size: {len(pdf_bytes)} bytes")
    
    # Prepare request payload (PDF only)
    payload = {
        "pdf_file": pdf_base64
        # No excel_file - testing PDF-only processing
    }
    
    print("Sending request to /reconcile endpoint (PDF only)...")
    
    # Send request to Flask service
    try:
        response = requests.post(
            'http://localhost:5000/reconcile',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=300  # 5 minute timeout for processing
        )
        
        print(f"Response status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF processing successful!")
            print(f"  Invoice rows: {result.get('invoices_rows', 0)}")
            print(f"  CCA rows: {result.get('cca_rows', 0)}")
            print(f"  Total Net Due AWB: {result.get('total_net_due_awb', 0.0)}")
            
            # Save the result Excel file
            if result.get('excel_file'):
                print("  Saving result Excel file...")
                excel_result_bytes = base64.b64decode(result['excel_file'])
                
                # Save to test output file
                output_path = "test_pdf_only_output.xlsx"
                with open(output_path, 'wb') as f:
                    f.write(excel_result_bytes)
                
                print(f"  ✅ Excel file saved to: {output_path}")
                print(f"  Excel file size: {len(excel_result_bytes)} bytes")
                
                # Try to verify Excel structure
                try:
                    import pandas as pd
                    excel_file = BytesIO(excel_result_bytes)
                    
                    # Read all sheets
                    sheet_names = pd.ExcelFile(excel_file).sheet_names
                    print(f"  Excel sheets found: {sheet_names}")
                    
                    expected_sheets = ["Summary", "Reconciliation", "Invoices", "CCA"]
                    
                    # Check each sheet
                    for sheet in expected_sheets:
                        if sheet in sheet_names:
                            try:
                                df = pd.read_excel(excel_file, sheet_name=sheet)
                                print(f"    ✅ {sheet} sheet: {len(df)} rows, {len(df.columns)} columns")
                            except Exception as e:
                                print(f"    ⚠️  Error reading {sheet} sheet: {e}")
                        else:
                            print(f"    ⚠️  {sheet} sheet missing")
                        
                except ImportError:
                    print("  ⚠️  pandas not available for Excel verification")
                except Exception as e:
                    print(f"  ⚠️  Error verifying Excel structure: {e}")
                
                return True
            else:
                print("  ⚠️  No Excel file in response")
                return False
        else:
            print(f"❌ Request failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"Raw response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing PDF-Only Processing ===")
    print()
    
    success = test_pdf_only()
    if success:
        print("🎉 PDF-only test passed successfully!")
    else:
        print("❌ PDF-only test failed") 