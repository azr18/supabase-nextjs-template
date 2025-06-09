import base64
import json
import requests
import os
from io import BytesIO

def test_reconcile_endpoint():
    """Test the /reconcile endpoint with sample files"""
    
    # Test fixture paths
    pdf_path = "../nextjs/tests/fixtures/1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf"
    excel_path = "../nextjs/tests/fixtures/AllDataReport_2025-01-01_to_2025-06-15_0333000901.xls"
    
    # Check if files exist
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return False
    
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return False
    
    print("Loading test files...")
    
    # Read and encode PDF file
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    # Read and encode Excel file
    with open(excel_path, 'rb') as f:
        excel_bytes = f.read()
        excel_base64 = base64.b64encode(excel_bytes).decode('utf-8')
    
    print(f"PDF file size: {len(pdf_bytes)} bytes")
    print(f"Excel file size: {len(excel_bytes)} bytes")
    
    # Prepare request payload
    payload = {
        "pdf_file": pdf_base64,
        "excel_file": excel_base64
    }
    
    print("Sending request to /reconcile endpoint...")
    
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
            print("✅ Reconciliation successful!")
            print(f"  Invoice rows: {result.get('invoices_rows', 0)}")
            print(f"  CCA rows: {result.get('cca_rows', 0)}")
            print(f"  Total Net Due AWB: {result.get('total_net_due_awb', 0.0)}")
            
            # Save the result Excel file
            if result.get('excel_file'):
                print("  Saving result Excel file...")
                excel_result_bytes = base64.b64decode(result['excel_file'])
                
                # Save to test output file
                output_path = "test_reconcile_output.xlsx"
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
                    missing_sheets = [sheet for sheet in expected_sheets if sheet not in sheet_names]
                    
                    if not missing_sheets:
                        print("  ✅ All expected sheets present!")
                        
                        # Check each sheet has data
                        for sheet in expected_sheets:
                            try:
                                df = pd.read_excel(excel_file, sheet_name=sheet)
                                print(f"    {sheet} sheet: {len(df)} rows, {len(df.columns)} columns")
                            except Exception as e:
                                print(f"    ⚠️  Error reading {sheet} sheet: {e}")
                        
                    else:
                        print(f"  ⚠️  Missing sheets: {missing_sheets}")
                    
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

def test_health_endpoint():
    """Test the /health endpoint"""
    try:
        response = requests.get('http://localhost:5000/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                print("✅ Health endpoint working correctly")
                return True
        print(f"❌ Health endpoint failed: {response.status_code}")
        return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Python PDF Reconciliation Service ===")
    print()
    
    print("1. Testing health endpoint...")
    health_ok = test_health_endpoint()
    print()
    
    if health_ok:
        print("2. Testing reconcile endpoint...")
        reconcile_ok = test_reconcile_endpoint()
        print()
        
        if reconcile_ok:
            print("🎉 All tests passed successfully!")
        else:
            print("❌ Reconcile test failed")
    else:
        print("❌ Health test failed - skipping reconcile test")
        print("Make sure the Flask service is running: python app.py") 