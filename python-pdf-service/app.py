import base64
import io
import traceback
from flask import Flask, request, jsonify
import pandas as pd

from reconciliation import process_file

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/reconcile', methods=['POST'])
def reconcile():
    """
    Main reconciliation endpoint that accepts PDF and Excel files and returns processed Excel
    Expected JSON payload:
    {
        "pdf_file": "base64_encoded_pdf_content",
        "excel_file": "base64_encoded_excel_content" (optional)
    }
    """
    try:
        # Parse JSON request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract PDF file
        pdf_base64 = data.get('pdf_file')
        if not pdf_base64:
            return jsonify({"error": "pdf_file is required"}), 400
        
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            pdf_file_obj = io.BytesIO(pdf_bytes)
        except Exception as e:
            return jsonify({"error": f"Invalid PDF base64 data: {str(e)}"}), 400
        
        # Extract Excel report file (optional)
        report_data_df = None
        excel_base64 = data.get('excel_file')
        if excel_base64:
            try:
                excel_bytes = base64.b64decode(excel_base64)
                excel_file_obj = io.BytesIO(excel_bytes)
                
                # Read Excel file into DataFrame
                # Try different engines for .xls and .xlsx files
                try:
                    # First try openpyxl for .xlsx files
                    report_data_df = pd.read_excel(excel_file_obj, engine='openpyxl')
                except:
                    # If that fails, try xlrd for .xls files
                    excel_file_obj.seek(0)  # Reset file pointer
                    report_data_df = pd.read_excel(excel_file_obj, engine='xlrd')
                
                # Normalize column names (lowercase and strip)
                report_data_df.columns = report_data_df.columns.str.lower().str.strip()
                
                print(f"Loaded Excel report with {len(report_data_df)} rows and columns: {list(report_data_df.columns)}")
                
            except Exception as e:
                return jsonify({"error": f"Invalid Excel base64 data or file format: {str(e)}"}), 400
        
        # Process the files using the reconciliation logic
        print("Starting reconciliation process...")
        result = process_file(pdf_file_obj, report_data_df)
        
        # Check for errors in processing
        if 'error' in result:
            return jsonify({
                "error": result['error'],
                "invoices_rows": result.get('invoices_rows', 0),
                "cca_rows": result.get('cca_rows', 0),
                "total_net_due_awb": result.get('total_net_due_awb', 0.0)
            }), 500
        
        # Encode the Excel file as base64 for response
        excel_base64_result = None
        if result.get('excel_file_bytes'):
            excel_base64_result = base64.b64encode(result['excel_file_bytes']).decode('utf-8')
        
        response_data = {
            "success": True,
            "invoices_rows": result.get('invoices_rows', 0),
            "cca_rows": result.get('cca_rows', 0),
            "total_net_due_awb": result.get('total_net_due_awb', 0.0),
            "excel_file": excel_base64_result
        }
        
        print(f"Reconciliation completed successfully. Invoice rows: {result.get('invoices_rows', 0)}, CCA rows: {result.get('cca_rows', 0)}")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in reconcile endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "success": False
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("Starting Flask PDF Reconciliation Service...")
    print("Endpoints available:")
    print("  GET  /health - Health check")
    print("  POST /reconcile - Process PDF and Excel files for reconciliation")
    app.run(host='0.0.0.0', port=5000, debug=True) 