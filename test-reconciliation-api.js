// Simple test script to check reconciliation API
const testReconciliationAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/reconcile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        airlineType: 'flydubai',
        invoiceFileId: 'test-invoice-id',
        reportFileId: 'test-report-id'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const result = await response.text(); // Use text() instead of json() to see raw response
    console.log('Response body (raw):', result);
    
    // Try to parse as JSON to see if it's valid JSON
    try {
      const jsonResult = JSON.parse(result);
      console.log('Parsed JSON:', jsonResult);
    } catch (parseError) {
      console.log('Failed to parse as JSON:', parseError.message);
      console.log('This indicates the API is returning HTML or plain text instead of JSON');
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

testReconciliationAPI(); 