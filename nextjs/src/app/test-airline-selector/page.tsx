"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import AirlineSelector, { AIRLINES } from '@/components/InvoiceReconciler/AirlineSelector';

// Simplified state interface
interface InvoiceReconcilerState {
  selectedAirline: string | null;
  selectedInvoice: string | null;
  uploadedReport: File | null;
  isSubmitting: boolean;
}

export default function TestAirlineSelectorPage() {
  const [state, setState] = useState<InvoiceReconcilerState>({
    selectedAirline: null,
    selectedInvoice: null,
    uploadedReport: null,
    isSubmitting: false,
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');

  // Handle airline selection
  const handleAirlineSelection = (airlineId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedAirline: airlineId,
      selectedInvoice: null, // Reset invoice selection when airline changes
      uploadedReport: null,
    }));

    if (airlineId) {
      const airline = AIRLINES.find(a => a.id === airlineId);
      setFeedbackMessage(`${airline?.name} selected. Please upload or select an invoice below.`);
      setFeedbackType('success');
    } else {
      setFeedbackMessage('');
    }
  };

  // Handle saved invoice selection
  const handleSavedInvoiceSelection = (invoiceName: string) => {
    setState(prev => ({ ...prev, selectedInvoice: invoiceName }));
    setFeedbackMessage(`Saved invoice "${invoiceName}" selected successfully.`);
    setFeedbackType('success');
  };

  // Handle invoice file upload
  const handleInvoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, selectedInvoice: file.name }));
      setFeedbackMessage(`Invoice "${file.name}" uploaded successfully.`);
      setFeedbackType('success');
    }
  };

  // Mock file upload for demonstration
  const simulateReportUpload = () => {
    const mockFile = new File(['mock excel data'], 'reconciliation_report.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    setState(prev => ({ ...prev, uploadedReport: mockFile }));
    setFeedbackMessage(`Report "reconciliation_report.xlsx" uploaded successfully.`);
    setFeedbackType('success');
  };

  // Handle report file upload
  const handleReportUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, uploadedReport: file }));
      setFeedbackMessage(`Report "${file.name}" uploaded successfully.`);
      setFeedbackType('success');
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!state.selectedAirline || !state.selectedInvoice || !state.uploadedReport) {
      setFeedbackMessage('Please complete all steps before submitting.');
      setFeedbackType('error');
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));
    setFeedbackMessage('Processing reconciliation...');
    setFeedbackType('info');

    // Simulate processing
    setTimeout(() => {
      setState(prev => ({ ...prev, isSubmitting: false }));
      setFeedbackMessage('Reconciliation completed successfully! Download your report below.');
      setFeedbackType('success');
    }, 3000);
  };

  const selectedAirlineDetails = state.selectedAirline 
    ? AIRLINES.find(airline => airline.id === state.selectedAirline)
    : null;

  const canSubmit = state.selectedAirline && state.selectedInvoice && state.uploadedReport && !state.isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Invoice Reconciler
          </h1>
          <p className="text-blue-100 text-lg">
            Multi-airline invoice reconciliation tool
          </p>
        </div>

        {/* Step 1: Airline Selection */}
        <Card className="bg-white/10 backdrop-blur-sm border-blue-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              Select Airline
            </CardTitle>
            <CardDescription className="text-blue-100">
              Choose the airline for your invoice reconciliation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AirlineSelector
              selectedAirline={state.selectedAirline}
              onAirlineChange={handleAirlineSelection}
              disabled={state.isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Step 2: Invoice Selection (Only show if airline is selected) */}
        {state.selectedAirline && (
          <Card className="bg-white/10 backdrop-blur-sm border-blue-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                Upload {selectedAirlineDetails?.name} Invoice
              </CardTitle>
              <CardDescription className="text-blue-100">
                Upload a PDF invoice or select from saved invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload New Invoice */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Upload New Invoice</h4>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-blue-100 mb-3">
                    Drop your {selectedAirlineDetails?.name} PDF invoice here or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleInvoiceUpload}
                    className="hidden"
                    id="invoice-upload"
                    disabled={state.isSubmitting}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('invoice-upload')?.click()}
                    className="border-blue-300 text-blue-100 hover:bg-blue-500/20"
                    disabled={state.isSubmitting}
                  >
                    Choose File
                  </Button>
                </div>
                
                {state.selectedInvoice && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-400 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-200 text-sm">Invoice: {state.selectedInvoice}</span>
                  </div>
                )}
              </div>

              {/* Saved Invoices Section */}
              <div className="pt-4 border-t border-blue-300/30">
                <h4 className="text-white font-medium mb-3">Or Select Saved Invoice</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-100 hover:bg-blue-500/20 justify-start"
                    disabled={state.isSubmitting}
                    onClick={() => handleSavedInvoiceSelection(`${selectedAirlineDetails?.name}_invoice_2024_001.pdf`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {selectedAirlineDetails?.name}_invoice_2024_001.pdf
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-100 hover:bg-blue-500/20 justify-start"
                    disabled={state.isSubmitting}
                    onClick={() => handleSavedInvoiceSelection(`${selectedAirlineDetails?.name}_invoice_2024_002.pdf`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {selectedAirlineDetails?.name}_invoice_2024_002.pdf
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Report Upload (Only show if invoice is selected) */}
        {state.selectedAirline && state.selectedInvoice && (
          <Card className="bg-white/10 backdrop-blur-sm border-blue-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                Upload Excel Report
              </CardTitle>
              <CardDescription className="text-blue-100">
                Upload your Excel report file (standardized format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <p className="text-blue-100 mb-3">
                  Drop your Excel report here or click to browse
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleReportUpload}
                  className="hidden"
                  id="report-upload"
                  disabled={state.isSubmitting}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('report-upload')?.click()}
                  className="border-blue-300 text-blue-100 hover:bg-blue-500/20"
                  disabled={state.isSubmitting}
                >
                  Choose File
                </Button>
                <Button 
                  onClick={simulateReportUpload}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={state.isSubmitting}
                >
                  Demo Upload
                </Button>
              </div>
              
              {state.uploadedReport && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-400 rounded-lg mt-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-200 text-sm">Report: {state.uploadedReport.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Submit (Only show if all files are ready) */}
        {canSubmit && (
          <Card className="bg-white/10 backdrop-blur-sm border-blue-200 shadow-xl">
            <CardContent className="pt-6">
              <Button 
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-4 text-lg"
              >
                {state.isSubmitting ? 'Processing...' : 'Start Reconciliation'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <Card className={`bg-white/10 backdrop-blur-sm border shadow-xl ${
            feedbackType === 'success' ? 'border-green-400' :
            feedbackType === 'error' ? 'border-red-400' :
            'border-blue-200'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {feedbackType === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {feedbackType === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {feedbackType === 'info' && <AlertCircle className="w-5 h-5 text-blue-400" />}
                <span className="text-white">{feedbackMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 