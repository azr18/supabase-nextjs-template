"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, FileText, Upload, Lock, CheckCircle, Info, ArrowRight, ArrowLeft, Plane, Clock, Loader2, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { hasToolAccess, getToolSubscriptionStatus } from '@/lib/supabase/queries/tools';
import AirlineSelector, { AIRLINES } from '@/components/InvoiceReconciler/AirlineSelector';
import InvoiceManager from '@/components/InvoiceReconciler/InvoiceManager';
import FileUpload from '@/components/InvoiceReconciler/FileUpload';
import { createSPAClient } from '@/lib/supabase/client';
import type { SavedInvoice } from '@/lib/supabase/types';

// Tool slug for subscription validation
const TOOL_SLUG = 'invoice-reconciler';

// Enhanced access status interface with more detailed error information
interface AccessStatus {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastChecked: Date | null;
  subscriptionStatus: string | null;
  // Enhanced error details
  errorCode?: 'NO_SUBSCRIPTION' | 'EXPIRED' | 'INACTIVE' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'UNKNOWN';
  canRetry: boolean;
  nextRetryIn?: number;
}

// Enhanced state management for step-by-step workflow
interface WorkflowState {
  currentStep: 'airline-selection' | 'invoice-upload' | 'report-upload' | 'processing' | 'completed';
  selectedAirline: string | null;
  selectedAirlineData: {
    id: string;
    name: string;
    code: string;
    description: string;
    status: 'active' | 'coming-soon';
  } | null;
  // Invoice selection state
  selectedInvoiceId: string | null;
  // New file upload state
  selectedFile: File | null;
  // Report file state
  reportFile: File | null;
  reportFileId: string | null; // For uploaded report file path
  isValidSelection: boolean;
  canProceed: boolean;
  validationError: string | null;
  // Loading states for airline selection operations
  isLoadingAirlines: boolean;
  isProcessingSelection: boolean;
  // Processing state
  isProcessingReconciliation: boolean;
  currentJobId: string | null;
}

export default function InvoiceReconcilerPage() {
  const { user, loading: userLoading } = useGlobal();
  const router = useRouter();
  const { toast } = useToast();
  
  const supabaseClient = useMemo(() => {
    if (typeof window !== 'undefined') {
        try {
            return createSPAClient();
        } catch (e) {
            console.error("Failed to create Supabase browser client:", e);
            toast({ title: "Initialization Error", description: "Could not initialize critical services. Please refresh.", variant: "destructive" });
            return null; 
        }
    }
    return null;
  }, [toast]);

  const [accessStatus, setAccessStatus] = useState<AccessStatus>({
    hasAccess: false,
    isLoading: true,
    error: null,
    retryCount: 0,
    lastChecked: null,
    subscriptionStatus: null,
    canRetry: true
  });

  // Step-by-step workflow state
  const [workflow, setWorkflow] = useState<WorkflowState>({
    currentStep: 'airline-selection',
    selectedAirline: null,
    selectedAirlineData: null,
    selectedInvoiceId: null,
    selectedFile: null,
    reportFile: null,
    reportFileId: null,
    isValidSelection: false,
    canProceed: false,
    validationError: null,
    isLoadingAirlines: true,
    isProcessingSelection: false,
    isProcessingReconciliation: false,
    currentJobId: null
  });
  
  // Refetch key for InvoiceManager to force re-render/refetch
  const [invoiceManagerKey, setInvoiceManagerKey] = useState(Date.now());

  // Simulate initial airline data loading
  useEffect(() => {
    const loadAirlineData = async () => {
      // Simulate loading airline data (could be from API in real scenario)
      await new Promise(resolve => setTimeout(resolve, 1200));
      setWorkflow(prev => ({
        ...prev,
        isLoadingAirlines: false
      }));
    };

    if (!userLoading && accessStatus.hasAccess && workflow.isLoadingAirlines && supabaseClient) {
      loadAirlineData();
    }
  }, [userLoading, accessStatus.hasAccess, workflow.isLoadingAirlines, supabaseClient]);

  // Check tool access on component mount
  useEffect(() => {
    async function checkAccess() {
      if (userLoading || !supabaseClient) return;

      if (!user?.id) {
        setAccessStatus({
          hasAccess: false,
          isLoading: false,
          error: 'Please log in to access this tool',
          retryCount: 0,
          lastChecked: null,
          subscriptionStatus: null,
          errorCode: 'AUTH_ERROR',
          canRetry: false, 
        });
        // Optionally redirect or show login prompt
        // router.push('/auth/login'); 
        return;
      }

      setAccessStatus(prev => ({ ...prev, isLoading: true }));
      try {
        const statusResult = await getToolSubscriptionStatus(TOOL_SLUG, user.id);
        const hasAccess = statusResult.status === 'active' || statusResult.status === 'trialing'; // Example active statuses

        if (hasAccess) {
          setAccessStatus({
            hasAccess: true,
            isLoading: false,
            error: null,
            retryCount: 0,
            lastChecked: new Date(),
            subscriptionStatus: statusResult.status,
            canRetry: true,
          });
        } else {
          let errorCode: AccessStatus['errorCode'] = 'UNKNOWN';
          let errorMessage = 'You do not have access to this tool';
          if (!statusResult.subscription) {
            errorCode = 'NO_SUBSCRIPTION';
            errorMessage = 'No active subscription found for this tool';
          } else if (statusResult.status === 'expired') {
            errorCode = 'EXPIRED';
            errorMessage = 'Your subscription has expired';
          } else if (statusResult.status && ['inactive', 'paused', 'cancelled'].includes(statusResult.status)) {
            errorCode = 'INACTIVE';
            errorMessage = `Your subscription is ${statusResult.status}. Please contact support.`;
          }
          setAccessStatus({
            hasAccess: false,
            isLoading: false,
            error: errorMessage,
            retryCount: 0,
            lastChecked: new Date(),
            subscriptionStatus: statusResult.status,
            errorCode,
            canRetry: errorCode === 'NO_SUBSCRIPTION', // Allow retry (e.g. go to subscribe page) only if no sub
          });
          toast({ title: "Access Denied", description: errorMessage, variant: "destructive" });
        }
      } catch (error) {
        console.error('Error checking tool access:', error);
        setAccessStatus({
          hasAccess: false,
          isLoading: false,
          error: 'Unable to verify access. Please try again.',
          retryCount: accessStatus.retryCount + 1,
          lastChecked: new Date(),
          subscriptionStatus: null,
          errorCode: 'NETWORK_ERROR',
          canRetry: accessStatus.retryCount < 3,
        });
        toast({ title: "Error", description: "Could not verify tool access.", variant: "destructive" });
      }
    }

    checkAccess();
  }, [user, userLoading, toast, router, accessStatus.retryCount, supabaseClient]);

  // Enhanced retry logic with exponential backoff
  const retryAccessCheck = useCallback(async () => {
    if (!user?.id || !accessStatus.canRetry) return;

    const newRetryCount = accessStatus.retryCount + 1;
    const maxRetries = 3;
    
    if (newRetryCount > maxRetries) {
      setAccessStatus(prev => ({
        ...prev,
        canRetry: false,
        error: 'Maximum retry attempts reached. Please refresh the page or contact support.'
      }));
      
      toast({
        title: "Unable to Connect",
        description: "Unable to verify subscription after multiple attempts. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000);
    
    setAccessStatus(prev => ({
      ...prev,
      isLoading: true,
      retryCount: newRetryCount,
      nextRetryIn: delay
    }));

    // Show retry attempt feedback
    toast({
      title: "Retrying...",
      description: `Attempting to verify subscription (${newRetryCount}/${maxRetries})`,
      variant: "default",
    });

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const statusResult = await getToolSubscriptionStatus(TOOL_SLUG, user.id);
      const hasAccess = await hasToolAccess(TOOL_SLUG, user.id);
      
      if (hasAccess) {
        setAccessStatus({
          hasAccess: true,
          isLoading: false,
          error: null,
          retryCount: newRetryCount,
          lastChecked: new Date(),
          subscriptionStatus: statusResult.status,
          canRetry: true
        });
        
        toast({
          title: "Connection Restored",
          description: "Successfully verified subscription status.",
          variant: "default",
        });
      } else {
        // Re-classify error after retry
        let errorCode: AccessStatus['errorCode'] = 'UNKNOWN';
        let errorMessage = 'You do not have access to this tool';
        
        if (!statusResult.subscription) {
          errorCode = 'NO_SUBSCRIPTION';
          errorMessage = 'No active subscription found for this tool';
        } else if (statusResult.status === 'expired') {
          errorCode = 'EXPIRED';
          errorMessage = 'Your subscription has expired';
        } else if (statusResult.status === 'inactive') {
          errorCode = 'INACTIVE';
          errorMessage = 'Your subscription is currently inactive';
        }

        setAccessStatus({
          hasAccess: false,
          isLoading: false,
          error: errorMessage,
          retryCount: newRetryCount,
          lastChecked: new Date(),
          subscriptionStatus: statusResult.status,
          errorCode,
          canRetry: newRetryCount < maxRetries
        });
      }
    } catch (error) {
      console.error('Error in retry attempt:', error);
      
      setAccessStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Connection failed. Please try again.',
        errorCode: 'NETWORK_ERROR',
        canRetry: newRetryCount < maxRetries
      }));
    }
  }, [user?.id, accessStatus.retryCount, accessStatus.canRetry, toast]);

  // Enhanced airline validation
  const validateAirlineSelection = (airlineId: string | null): { isValid: boolean; canProceed: boolean; error: string | null } => {
    if (!airlineId) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Please select an airline to continue'
      };
    }

    const airlineData = AIRLINES.find(airline => airline.id === airlineId);
    
    if (!airlineData) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Invalid airline selection'
      };
    }

    if (airlineData.status !== 'active') {
      return {
        isValid: true,
        canProceed: false,
        error: `${airlineData.name} is coming soon and not yet available for reconciliation`
      };
    }

    return {
      isValid: true,
      canProceed: true,
      error: null
    };
  };

  // Invoice validation function
  const validateInvoiceSelection = useCallback((invoiceId: string | null = workflow.selectedInvoiceId, file: File | null = workflow.selectedFile): { isValid: boolean; canProceed: boolean; error: string | null } => {
    // Must have either an existing invoice selected OR a new file selected, but not both
    const hasInvoice = !!invoiceId;
    const hasFile = !!file;
    
    if (!hasInvoice && !hasFile) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Please either select an existing invoice or upload a new invoice file.'
      };
    }

    if (hasInvoice && hasFile) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Please choose either an existing invoice OR upload a new file, not both.'
      };
    }

    return {
      isValid: true,
      canProceed: true,
      error: null
    };
  }, [workflow.selectedInvoiceId, workflow.selectedFile]);

  // Report file validation function
  const validateReportSelection = useCallback((reportFile: File | null = workflow.reportFile): { isValid: boolean; canProceed: boolean; error: string | null } => {
    if (!reportFile) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Please upload an Excel report file to proceed.'
      };
    }

    // Validate file type
    const validExcelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/excel',
      'application/x-excel',
      'application/x-msexcel'
    ];

    if (!validExcelTypes.includes(reportFile.type) && !reportFile.name.toLowerCase().endsWith('.xlsx') && !reportFile.name.toLowerCase().endsWith('.xls')) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Please upload a valid Excel file (.xlsx or .xls).'
      };
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (reportFile.size > maxSize) {
      return {
        isValid: false,
        canProceed: false,
        error: 'Report file size must be less than 25MB.'
      };
    }

    return {
      isValid: true,
      canProceed: true,
      error: null
    };
  }, [workflow.reportFile]);

  // Handle airline selection with enhanced validation and state management
  const handleAirlineChange = useCallback(async (airlineId: string | null) => {
    setWorkflow(prev => ({
      ...prev,
      isProcessingSelection: true, // Indicate processing airline change
      selectedAirline: airlineId, // Store the selected airline identifier (e.g., its code or name)
      selectedAirlineData: null, // Clear previous airline data
      selectedInvoiceId: null, // Reset selected invoice
      selectedFile: null,      // Reset any selected file for upload
      validationError: null,
      canProceed: false,
    }));

    if (airlineId) {
      const airlineData = AIRLINES.find(a => a.id === airlineId);
      
      if (airlineData) {
        const validation = validateAirlineSelection(airlineId);
         if (airlineData.status === 'coming-soon') {
            toast({
                title: "Coming Soon!",
                description: `${airlineData.name} reconciliation is not yet available.`,
                variant: "default",
            });
            setWorkflow(prev => ({
                ...prev,
                selectedAirlineData: airlineData,
                isProcessingSelection: false,
                validationError: validation.error, // Use validation error
                canProceed: validation.canProceed, // Use validation canProceed
            }));
            return;
        }
        setWorkflow(prev => ({
          ...prev,
          selectedAirlineData: airlineData,
          // currentStep: 'invoice-upload', // DO NOT move to next step here
          isProcessingSelection: false,
          canProceed: validation.canProceed, // Set based on validation
          validationError: validation.error,
        }));
        // setInvoiceManagerKey(Date.now()); // This might not be needed here anymore, or moved to handleNextStep
      } else {
        setWorkflow(prev => ({
          ...prev,
          isProcessingSelection: false,
          validationError: "Selected airline data not found.",
          canProceed: false,
        }));
        toast({ title: "Error", description: "Selected airline data not found.", variant: "destructive" });
      }
    } else {
      setWorkflow(prev => ({
        ...prev,
        // currentStep: 'airline-selection', // Already in this step or should be handled by navigation
        isProcessingSelection: false,
        selectedAirline: null,
        selectedAirlineData: null,
        validationError: validateAirlineSelection(null).error, // Re-validate with null
        canProceed: false,
      }));
    }
  }, [toast]);

  // Callback for when FileUpload component successfully uploads and saves a new invoice
  const handleNewInvoiceUploaded = useCallback((newlySavedInvoice: SavedInvoice) => {
    toast({
      title: "New Invoice Added",
      description: `"${newlySavedInvoice.original_filename}" has been saved and is now selected.`,
      variant: "success",
    });
    setWorkflow(prev => {
      const validation = validateInvoiceSelection(newlySavedInvoice.id, null);
      return {
        ...prev,
        selectedInvoiceId: newlySavedInvoice.id,
        selectedFile: null,
        isValidSelection: validation.isValid,
        canProceed: validation.canProceed,
        validationError: validation.error,
      };
    });
    setInvoiceManagerKey(Date.now());
  }, [toast, validateInvoiceSelection]);

  // Overall validation logic for the current step (invoice selection/upload)
  useEffect(() => {
    if (workflow.currentStep === 'invoice-upload') {
      const isValid = !!workflow.selectedInvoiceId; // True if an existing or newly uploaded invoice is selected
      const error = isValid ? null : "Please select an existing invoice or upload a new one.";
      
      setWorkflow(prev => ({
        ...prev,
        isValidSelection: isValid,
        canProceed: isValid, // Can proceed if a valid invoice is selected/uploaded
        validationError: prev.selectedAirlineData && !isValid && !prev.isProcessingSelection ? error : prev.validationError,
      }));
    }
  }, [workflow.selectedInvoiceId, workflow.currentStep, workflow.selectedAirlineData, workflow.isProcessingSelection]);

  // Overall validation logic for report upload step
  useEffect(() => {
    if (workflow.currentStep === 'report-upload') {
      const validation = validateReportSelection(workflow.reportFile);
      
      setWorkflow(prev => ({
        ...prev,
        isValidSelection: validation.isValid,
        canProceed: validation.canProceed,
        validationError: validation.error,
      }));
    }
  }, [workflow.reportFile, workflow.currentStep, validateReportSelection]);
  
  const handleInvoiceSelect = (invoiceId: string) => {
    setWorkflow(prev => ({
      ...prev,
      selectedInvoiceId: invoiceId,
      selectedFile: null, // Clear file selection when selecting existing invoice
      ...validateInvoiceSelection(invoiceId, null)
    }));
  };

  // Handle report file selection
  const handleReportFileSelect = useCallback((file: File) => {
    const validation = validateReportSelection(file);
    setWorkflow(prev => ({
      ...prev,
      reportFile: file,
      reportFileId: null, // Reset file ID since we have a new file
      isValidSelection: validation.isValid,
      canProceed: validation.canProceed,
      validationError: validation.error
    }));

    if (validation.canProceed) {
      toast({
        title: "Report File Selected",
        description: `"${file.name}" is ready for processing.`,
        variant: "success",
      });
    } else {
      toast({
        title: "Invalid Report File",
        description: validation.error || "Please select a valid Excel file.",
        variant: "destructive",
      });
    }
  }, [toast, validateReportSelection]);

  // Upload report file to storage
  const uploadReportFile = useCallback(async (file: File): Promise<string | null> => {
    if (!supabaseClient || !user?.id) {
      toast({
        title: "Upload Error",
        description: "Unable to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/invoice-reconciler/reports/${timestamp}_${file.name}`;
      
      const { error } = await supabaseClient.storage
        .from('invoice-reconciler')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Report file upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload report file.",
          variant: "destructive",
        });
        return null;
      }

      return fileName;
    } catch (error: unknown) {
      console.error('Unexpected error uploading report file:', error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred while uploading the file.",
        variant: "destructive",
      });
      return null;
    }
  }, [supabaseClient, user?.id, toast]);

  // Call reconciliation API
  const startReconciliation = useCallback(async (invoiceFileId: string, reportFileId: string, airlineType: string): Promise<string | null> => {
    if (!supabaseClient) {
      toast({
        title: "Error",
        description: "Unable to start reconciliation. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const response = await fetch('/api/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airlineType,
          invoiceFileId,
          reportFileId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.jobId) {
        // Enhanced success feedback with airline-specific messaging
        if (airlineType === 'flydubai') {
          toast({
            title: "🚀 Fly Dubai Reconciliation Job Created",
            description: `Job ${result.jobId.substring(0, 8)}... has been successfully queued. The Fly Dubai processor will extract AWB and CCA data and perform detailed reconciliation analysis.`,
            variant: "success",
            duration: 7000,
          });
        } else {
          toast({
            title: "Reconciliation Started",
            description: `${airlineType} reconciliation job has been started successfully.`,
            variant: "success",
          });
        }
        return result.jobId;
      } else {
        throw new Error('No job ID returned from reconciliation API.');
      }
    } catch (error: unknown) {
      console.error('Error starting reconciliation:', error);
      
      // Enhanced error feedback with airline-specific messaging
      if (airlineType === 'flydubai') {
        toast({
          title: "🚫 Fly Dubai Reconciliation Error",
          description: `Failed to start Fly Dubai reconciliation: ${error instanceof Error ? error.message : "Please check your invoice and report files."}`,
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Reconciliation Failed",
          description: error instanceof Error ? error.message : "Failed to start reconciliation process.",
          variant: "destructive",
        });
      }
      return null;
    }
  }, [supabaseClient, toast]);

  // Enhanced navigation to next step with validation
  const handleNextStep = () => {
    if (workflow.currentStep === 'airline-selection') {
      const validation = validateAirlineSelection(workflow.selectedAirline);
      setWorkflow(prev => ({
        ...prev,
        validationError: validation.error,
        canProceed: validation.canProceed
      }));

      if (!validation.canProceed) {
        toast({
          title: "Selection Required",
          description: validation.error || "Please complete the current step before proceeding",
          variant: "destructive",
        });
        return;
      }

      setWorkflow(prev => ({
        ...prev,
        currentStep: 'invoice-upload',
        selectedInvoiceId: null,
        selectedFile: null,
        validationError: null,
        canProceed: false,
      }));
      setInvoiceManagerKey(Date.now()); 
      return; 
    }

    if (workflow.currentStep === 'invoice-upload') {
      const validation = validateInvoiceSelection();
      setWorkflow(prev => ({
        ...prev,
        validationError: validation.error,
        canProceed: validation.canProceed
      }));

      if (!validation.canProceed) {
        toast({
          title: "Invoice Required",
          description: validation.error || "Please select an invoice before proceeding",
          variant: "destructive",
        });
        return;
      }
      
      setWorkflow(prev => ({
        ...prev,
        currentStep: 'report-upload',
        reportFile: null,
        reportFileId: null,
        validationError: null,
        canProceed: false, // Next step (report upload) will need its own validation
      }));
      return;
    }

    if (workflow.currentStep === 'report-upload') {
      const reportValidation = validateReportSelection();
      setWorkflow(prev => ({
        ...prev,
        validationError: reportValidation.error,
        canProceed: reportValidation.canProceed
      }));

      if (!reportValidation.canProceed) {
        toast({
          title: "Report Required",
          description: reportValidation.error || "Please upload an Excel report file",
          variant: "destructive",
        });
        return;
      }

      // Start the reconciliation process if all data is available
      if (workflow.selectedAirlineData?.id && workflow.reportFile && workflow.selectedInvoiceId) {
        handleStartReconciliation();
        return;
      } else {
        // This else block will now catch cases where some data is genuinely missing,
        // rather than incorrectly flagging non-Fly Dubai airlines.
        toast({
          title: "Configuration Error",
          description: "Missing required data for reconciliation process. Ensure an airline, invoice, and report file are all selected and valid.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Default case if canProceed was true but step not handled above explicitly for progression logic
    if (!workflow.canProceed && workflow.currentStep !== 'completed') { // Check canProceed from state
       toast({
        title: "Cannot Proceed",
        description: workflow.validationError || "Please complete the current step correctly.",
        variant: "destructive",
      });
    }
  };

  // Handle starting the reconciliation process
  const handleStartReconciliation = useCallback(async () => {
    if (!workflow.reportFile || !workflow.selectedInvoiceId || !workflow.selectedAirlineData) {
      toast({
        title: "Missing Data",
        description: "Please ensure both invoice and report are ready.",
        variant: "destructive",
      });
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      isProcessingReconciliation: true,
      currentStep: 'processing',
      validationError: null
    }));

    try {
      // Enhanced upload feedback for Fly Dubai
      if (workflow.selectedAirlineData.id === 'flydubai') {
        toast({
          title: "🚀 Fly Dubai Reconciliation Starting",
          description: "Uploading your Excel report file for Fly Dubai processing...",
          variant: "default",
          duration: 4000,
        });
      } else {
        toast({
          title: "Uploading Report",
          description: "Uploading your Excel report file...",
          variant: "default",
        });
      }

      const reportFileId = await uploadReportFile(workflow.reportFile);
      if (!reportFileId) {
        throw new Error('Failed to upload report file');
      }

      setWorkflow(prev => ({
        ...prev,
        reportFileId
      }));

      // Enhanced reconciliation start feedback for Fly Dubai
      if (workflow.selectedAirlineData.id === 'flydubai') {
        toast({
          title: "✈️ Processing Fly Dubai Data",
          description: "Initiating Fly Dubai reconciliation engine. This typically takes 5-7 minutes to extract invoice data and perform detailed reconciliation analysis.",
          variant: "default",
          duration: 6000,
        });
      } else {
        toast({
          title: "Starting Reconciliation",
          description: `Initiating ${workflow.selectedAirlineData.name} reconciliation process...`,
          variant: "default",
        });
      }

      const jobId = await startReconciliation(
        workflow.selectedInvoiceId,
        reportFileId,
        workflow.selectedAirlineData.id
      );

      if (jobId) {
        setWorkflow(prev => ({
          ...prev,
          currentJobId: jobId,
          isProcessingReconciliation: false // The job is now running server-side
        }));

        // Enhanced success feedback for Fly Dubai job submission
        if (workflow.selectedAirlineData.id === 'flydubai') {
          toast({
            title: "🎯 Fly Dubai Job Started Successfully!",
            description: `Job ID: ${jobId.substring(0, 8)}... • Your Fly Dubai reconciliation is now processing. You can monitor progress in the Job History section.`,
            variant: "success",
            duration: 8000,
          });
        }
      } else {
        throw new Error('Failed to start reconciliation job');
      }
    } catch (error: unknown) {
      console.error('Error in handleStartReconciliation:', error);
      setWorkflow(prev => ({
        ...prev,
        isProcessingReconciliation: false,
        currentStep: 'report-upload', // Go back to previous step
        validationError: error instanceof Error ? error.message : 'Failed to start reconciliation process'
      }));
      
      // Enhanced error feedback for Fly Dubai
      if (workflow.selectedAirlineData?.id === 'flydubai') {
        toast({
          title: "❌ Fly Dubai Reconciliation Failed",
          description: `Unable to start Fly Dubai reconciliation: ${error instanceof Error ? error.message : "Please check your files and try again."}`,
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Reconciliation Failed",
          description: error instanceof Error ? error.message : "Unable to start reconciliation. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [workflow.reportFile, workflow.selectedInvoiceId, workflow.selectedAirlineData, uploadReportFile, startReconciliation, toast]);

  // Navigate to previous step
  const handlePreviousStep = () => {
    switch (workflow.currentStep) {
      case 'invoice-upload':
        setWorkflow(prev => ({ ...prev, currentStep: 'airline-selection' }));
        break;
      case 'report-upload':
        setWorkflow(prev => ({ ...prev, currentStep: 'invoice-upload' }));
        break;
      case 'processing':
        setWorkflow(prev => ({ ...prev, currentStep: 'report-upload' }));
        break;
    }
  };

  // Get step information with airline context
  const getStepInfo = () => {
    const airlineName = workflow.selectedAirlineData?.name || 'Selected Airline';
    
    switch (workflow.currentStep) {
      case 'airline-selection':
        return {
          step: 1,
          total: 4,
          title: 'Select Airline',
          description: 'Choose the airline for your invoice reconciliation'
        };
      case 'invoice-upload':
        return {
          step: 2,
          total: 4,
          title: `Upload ${airlineName} Invoice`,
          description: `Upload your ${airlineName} PDF invoice or select from saved invoices`
        };
      case 'report-upload':
        return {
          step: 3,
          total: 4,
          title: 'Upload Excel Report',
          description: 'Upload your Excel report file (standardized format)'
        };
      case 'processing':
        return {
          step: 4,
          total: 4,
          title: 'Processing',
          description: `Reconciling ${airlineName} invoice data`
        };
      default:
        return {
          step: 1,
          total: 4,
          title: 'Select Airline',
          description: 'Choose the airline for your invoice reconciliation'
        };
    }
  };

  // Loading state
  if (userLoading || accessStatus.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-100 to-violet-200 rounded-full">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-violet-600 bg-clip-text text-transparent mb-4">
                  {accessStatus.retryCount > 0 ? 'Retrying Connection...' : 'Verifying Access...'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {accessStatus.retryCount > 0 
                    ? `Attempting to verify subscription status (${accessStatus.retryCount}/3)`
                    : 'Please wait while we verify your subscription status'
                  }
                </p>
                
                {/* Loading progress indicators */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Checking authentication...</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Verifying subscription status...
                      </span>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-sm">Loading tool interface...</span>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    </div>
                  </div>
                </div>

                {/* Show retry information if applicable */}
                {accessStatus.retryCount > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Retry Attempt {accessStatus.retryCount}</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Connection issues detected. Retrying to ensure reliable access...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!accessStatus.hasAccess) {
    const getErrorIcon = () => {
      switch (accessStatus.errorCode) {
        case 'NO_SUBSCRIPTION':
          return <Shield className="h-8 w-8 text-blue-600" />;
        case 'EXPIRED':
          return <Clock className="h-8 w-8 text-orange-600" />;
        case 'INACTIVE':
          return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
        case 'NETWORK_ERROR':
          return <RefreshCw className="h-8 w-8 text-red-600" />;
        default:
          return <Lock className="h-8 w-8 text-red-600" />;
      }
    };

    const getErrorTitle = () => {
      switch (accessStatus.errorCode) {
        case 'NO_SUBSCRIPTION':
          return 'Subscription Required';
        case 'EXPIRED':
          return 'Subscription Expired';
        case 'INACTIVE':
          return 'Subscription Inactive';
        case 'NETWORK_ERROR':
          return 'Connection Error';
        case 'AUTH_ERROR':
          return 'Authentication Required';
        default:
          return 'Access Required';
      }
    };

    const getErrorDescription = () => {
      switch (accessStatus.errorCode) {
        case 'NO_SUBSCRIPTION':
          return 'You need an active subscription to access the Invoice Reconciler tool. Contact support to set up your subscription.';
        case 'EXPIRED':
          return 'Your subscription has expired. Please contact support to renew your access and continue using this tool.';
        case 'INACTIVE':
          return 'Your subscription is currently inactive. Please contact support to activate your subscription.';
        case 'NETWORK_ERROR':
          return 'Unable to verify your subscription status due to a connection issue. Please check your internet connection and try again.';
        case 'AUTH_ERROR':
          return 'Please log in to your account to access this tool.';
        default:
          return accessStatus.error || 'You do not have access to this tool.';
      }
    };

    const getHelpfulActions = () => {
      const actions = [];
      
      // Always show dashboard link
      actions.push(
        <Button 
          key="dashboard"
          asChild
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 shadow-lg"
        >
          <Link href="/app">
            Back to Dashboard
          </Link>
        </Button>
      );

      // Add retry button for network errors
      if (accessStatus.errorCode === 'NETWORK_ERROR' && accessStatus.canRetry) {
        actions.push(
          <Button 
            key="retry"
            onClick={retryAccessCheck}
            disabled={accessStatus.isLoading}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3"
          >
            {accessStatus.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </>
            )}
          </Button>
        );
      }

      // Add contact support for subscription issues
      if (['NO_SUBSCRIPTION', 'EXPIRED', 'INACTIVE'].includes(accessStatus.errorCode || '')) {
        actions.push(
          <Button 
            key="support"
            asChild
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50 font-semibold px-8 py-3"
          >
            <Link href="mailto:support@example.com" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Link>
          </Button>
        );
      }

      // Add refresh page option for persistent issues
      if (!accessStatus.canRetry || accessStatus.retryCount >= 3) {
        actions.push(
          <Button 
            key="refresh"
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        );
      }

      return actions;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-red-100 to-red-200 rounded-full">
                    {getErrorIcon()}
                  </div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-violet-600 bg-clip-text text-transparent mb-4">
                  {getErrorTitle()}
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                  {getErrorDescription()}
                </p>
                
                {/* Enhanced status information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-700">Subscription Status</p>
                      <p className={`mt-1 ${
                        accessStatus.subscriptionStatus === 'active' ? 'text-green-600' :
                        accessStatus.subscriptionStatus === 'expired' ? 'text-orange-600' :
                        accessStatus.subscriptionStatus === 'inactive' ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        {accessStatus.subscriptionStatus || 'Not Found'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-700">Last Checked</p>
                      <p className="text-gray-600 mt-1">
                        {accessStatus.lastChecked ? 
                          accessStatus.lastChecked.toLocaleTimeString() : 
                          'Not checked'
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-700">Retry Count</p>
                      <p className="text-gray-600 mt-1">
                        {accessStatus.retryCount}/3
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  {getHelpfulActions()}
                </div>

                {/* Additional help text for specific error types */}
                {accessStatus.errorCode === 'NO_SUBSCRIPTION' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Need a Subscription?</h4>
                    <p className="text-blue-700 text-sm">
                      Contact our support team to set up your Invoice Reconciler subscription. 
                      We&apos;ll help you get started with automated invoice reconciliation.
                    </p>
                  </div>
                )}

                {accessStatus.errorCode === 'NETWORK_ERROR' && !accessStatus.canRetry && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Connection Issues</h4>
                    <p className="text-yellow-700 text-sm">
                      If connection problems persist, please check your internet connection or 
                      try refreshing the page. Contact support if the issue continues.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const stepInfo = getStepInfo();

  // Main invoice reconciler interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent mb-4">
              Invoice Reconciler
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Multi-airline invoice reconciliation tool
            </p>
            
            {/* Progress Section */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2">
                Tool Active
              </Badge>
              <span className="text-sm text-gray-500 font-medium">
                Step {stepInfo.step} of {stepInfo.total}
              </span>
              
              {/* Progress Dots */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      step <= stepInfo.step
                        ? 'bg-gradient-to-r from-blue-500 to-violet-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Simple Airline Status Banner */}
            {workflow.selectedAirlineData && (
              <div className="bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl p-4 mb-6 shadow-lg">
                <div className="flex items-center justify-center gap-3">
                  <Plane className="h-6 w-6" />
                  <span className="text-lg font-semibold">
                    {workflow.selectedAirlineData.name} ({workflow.selectedAirlineData.code})
                  </span>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {workflow.selectedAirlineData.status === 'active' ? 'Active' : 'Coming Soon'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Single Main Card - Step-by-Step Flow */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-6 text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl bg-gradient-to-r from-gray-800 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-full text-lg font-bold">
                  {stepInfo.step}
                </span>
                {stepInfo.title}
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg mt-2">
                {stepInfo.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              
              {/* Step Content */}
              {workflow.currentStep === 'airline-selection' && (
                <div className="space-y-6">
                  <AirlineSelector
                    selectedAirline={workflow.selectedAirline}
                    onAirlineChange={handleAirlineChange}
                    disabled={workflow.isProcessingSelection}
                    isLoading={workflow.isLoadingAirlines}
                    isProcessing={workflow.isProcessingSelection}
                    loadingLabel="Loading airline options..."
                  />
                  
                  {/* Enhanced Validation Feedback */}
                  {workflow.validationError && !workflow.canProceed && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">
                          {workflow.validationError}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Selection Success Feedback */}
                  {workflow.selectedAirlineData && workflow.canProceed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          {workflow.selectedAirlineData.name} selected and ready for reconciliation
                        </p>
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        Click &quot;Continue&quot; to proceed to invoice upload
                      </p>
                    </div>
                  )}
                </div>
              )}

              {workflow.currentStep === 'invoice-upload' && (
                <div className="space-y-6">
                  <InvoiceManager
                    key={invoiceManagerKey}
                    selectedAirline={workflow.selectedAirline}
                    selectedInvoiceId={workflow.selectedInvoiceId}
                    onInvoiceSelect={handleInvoiceSelect}
                  />
                  
                  {/* Validation Feedback */}
                  {workflow.validationError && !workflow.canProceed && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">
                          {workflow.validationError}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Selection Success Feedback - Existing Invoice */}
                  {workflow.selectedInvoiceId && workflow.canProceed && !workflow.selectedFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          Saved invoice selected successfully
                        </p>
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        Click &quot;Continue&quot; to proceed to Excel report upload
                      </p>
                    </div>
                  )}

                  {/* File Upload Success Feedback */}
                  {workflow.selectedFile && workflow.canProceed && !workflow.selectedInvoiceId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          New invoice file ready for upload
                        </p>
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        File: {workflow.selectedFile.name} • Click &quot;Continue&quot; to proceed to Excel report upload
                      </p>
                    </div>
                  )}
                  
                  {/* Upload New Invoice Option - Placeholder for Task 8.5 */}
                  <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Upload className="h-6 w-6 text-blue-500" />
                      <p className="text-gray-800 font-semibold">
                        Or Upload New {workflow.selectedAirlineData?.name} Invoice
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-8 border-2 border-dashed border-blue-200 text-center hover:border-blue-300 transition-colors">
                      <FileUpload
                        supabase={supabaseClient!}
                        userId={user?.id}
                        selectedAirline={workflow.selectedAirlineData?.name || null}
                        selectedAirlineId={workflow.selectedAirlineData?.id || null}
                        onFileUploadComplete={handleNewInvoiceUploaded}
                        disabled={!supabaseClient || workflow.isProcessingSelection || !workflow.selectedAirlineData || workflow.selectedAirlineData.status !== 'active'}
                        className="h-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {workflow.currentStep === 'report-upload' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-100">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <p className="text-gray-800 font-semibold text-lg">
                        Upload Excel Report
                      </p>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Upload your standardized Excel report file. This format is the same for all airlines.
                    </p>
                    
                    {/* File Upload Interface */}
                    <div className="bg-white rounded-xl border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
                      <div 
                        className="p-12 text-center cursor-pointer"
                        onClick={() => document.getElementById('report-file-input')?.click()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            handleReportFileSelect(files[0]);
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => e.preventDefault()}
                      >
                        {workflow.reportFile ? (
                          <div className="space-y-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <div>
                              <p className="text-lg font-semibold text-green-800 mb-2">
                                File Ready: {workflow.reportFile.name}
                              </p>
                              <p className="text-sm text-green-600 mb-4">
                                Size: {(workflow.reportFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWorkflow(prev => ({
                                    ...prev,
                                    reportFile: null,
                                    reportFileId: null,
                                    canProceed: false,
                                    validationError: 'Please upload an Excel report file to proceed.'
                                  }));
                                }}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                Choose Different File
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <FileText className="h-16 w-16 text-green-400 mx-auto" />
                            <div>
                              <p className="text-lg font-semibold text-gray-700 mb-2">
                                Drop your Excel report here
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                or click to browse files
                              </p>
                              <p className="text-xs text-gray-400">
                                Supports .xlsx and .xls files up to 25MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        id="report-file-input"
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleReportFileSelect(file);
                          }
                        }}
                      />
                    </div>
                    
                    {/* Validation feedback for report upload */}
                    {workflow.validationError && workflow.currentStep === 'report-upload' && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <p className="text-red-800 font-medium">
                            {workflow.validationError}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Success feedback for report upload */}
                    {workflow.reportFile && workflow.canProceed && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-green-800 font-medium">
                            Excel report ready for processing
                          </p>
                        </div>
                        <p className="text-green-700 text-sm mt-2">
                          Click &quot;Start Reconciliation&quot; to begin processing your {workflow.selectedAirlineData?.name} data
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {workflow.currentStep === 'processing' && (
                <div className="space-y-6">
                  {/* Enhanced Processing Status for Fly Dubai */}
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl p-8 text-center">
                    <div className="animate-spin h-12 w-12 text-white mx-auto mb-6">
                      <RefreshCw className="h-12 w-12" />
                    </div>
                    
                    {workflow.selectedAirlineData?.id === 'flydubai' ? (
                      <>
                        <p className="text-white font-semibold text-xl mb-3">
                          🛩️ Processing Fly Dubai Reconciliation
                        </p>
                        <p className="text-white/90 mb-2">
                          Your Fly Dubai invoice and report are being analyzed
                        </p>
                        <p className="text-white/80 text-sm">
                          Estimated completion: 5-7 minutes • Job ID: {workflow.currentJobId ? workflow.currentJobId.substring(0, 8) + '...' : 'Generating...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-semibold text-xl mb-3">
                          Processing {workflow.selectedAirlineData?.name} Reconciliation
                        </p>
                        <p className="text-white/90">
                          Estimated completion: 5-7 minutes
                        </p>
                      </>
                    )}
                    
                    {/* Enhanced Processing Steps for Fly Dubai */}
                    <div className="mt-6 text-left bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-center">
                        {workflow.selectedAirlineData?.id === 'flydubai' ? 'Fly Dubai Processing Steps:' : 'Processing Steps:'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            {workflow.selectedAirlineData?.id === 'flydubai' 
                              ? 'Extracting AWB and CCA data from Fly Dubai invoice...' 
                              : 'Extracting invoice data...'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                          <span>
                            {workflow.selectedAirlineData?.id === 'flydubai' 
                              ? 'Processing standardized Excel report data...' 
                              : 'Processing Excel report data...'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                          <span>
                            {workflow.selectedAirlineData?.id === 'flydubai' 
                              ? 'Performing Fly Dubai-specific reconciliation analysis...' 
                              : 'Performing reconciliation analysis...'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                          <span>
                            {workflow.selectedAirlineData?.id === 'flydubai' 
                              ? 'Generating Fly Dubai reconciliation report with summary, AWB, and CCA sheets...' 
                              : 'Generating detailed report...'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Fly Dubai specific information */}
                    {workflow.selectedAirlineData?.id === 'flydubai' && (
                      <div className="mt-4 text-left bg-white/5 rounded-lg p-4 border border-white/20">
                        <h5 className="font-medium mb-2 text-center text-white/90">What we&apos;re processing:</h5>
                        <div className="space-y-1 text-xs text-white/80">
                          <div className="flex justify-between">
                            <span>• AWB (Air Waybill) data extraction</span>
                            <span>✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• CCA (Cargo Charges Correction) analysis</span>
                            <span>⏳</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Net due amount reconciliation</span>
                            <span>⏳</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Multi-sheet Excel report generation</span>
                            <span>⏳</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Processing Tips for Fly Dubai */}
                  {workflow.selectedAirlineData?.id === 'flydubai' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Fly Dubai Processing Info</h4>
                      </div>
                      <p className="text-blue-700 text-sm">
                        Your Fly Dubai reconciliation job is running in the background. You can safely navigate away and return later to check the results in the Job History section. 
                        The system will extract AWB and CCA data from your invoice and perform detailed reconciliation against your Excel report.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                <div>
                  {workflow.currentStep !== 'airline-selection' && (
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3 text-base"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {workflow.currentStep !== 'processing' && workflow.canProceed && !workflow.isLoadingAirlines && !workflow.isProcessingSelection && (
                    <Button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-10 py-3 text-base shadow-lg"
                    >
                      {workflow.currentStep === 'report-upload' ? 'Start Reconciliation' : 'Continue'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  )}
                  
                  {/* Loading states for airline selection */}
                  {(workflow.isLoadingAirlines || workflow.isProcessingSelection) && (
                    <Button
                      disabled
                      className="bg-blue-300 text-blue-700 font-semibold px-10 py-3 text-base cursor-not-allowed"
                    >
                      {workflow.isLoadingAirlines ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading Airlines...
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Selection...
                        </>
                      )}
                    </Button>
                  )}
                  
                  {!workflow.canProceed && workflow.currentStep === 'airline-selection' && !workflow.isLoadingAirlines && !workflow.isProcessingSelection && (
                    <>
                      <Button
                        disabled
                        className="bg-gray-300 text-gray-500 font-semibold px-10 py-3 text-base cursor-not-allowed"
                      >
                        Select Airline to Continue
                      </Button>
                      {workflow.validationError && (
                        <p className="text-sm text-red-600 text-right">
                          {workflow.validationError}
                        </p>
                      )}
                    </>
                  )}

                  {!workflow.canProceed && workflow.currentStep === 'invoice-upload' && !workflow.isLoadingAirlines && !workflow.isProcessingSelection && (
                    <>
                      <Button
                        disabled
                        className="bg-gray-300 text-gray-500 font-semibold px-10 py-3 text-base cursor-not-allowed"
                      >
                        Select Invoice to Continue
                      </Button>
                      {workflow.validationError && (
                        <p className="text-sm text-red-600 text-right">
                          {workflow.validationError}
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Validation feedback for coming soon airlines */}
                  {workflow.selectedAirlineData?.status === 'coming-soon' && workflow.currentStep === 'airline-selection' && (
                    <>
                      <Button
                        disabled
                        className="bg-yellow-300 text-yellow-800 font-semibold px-10 py-3 text-base cursor-not-allowed"
                      >
                        Coming Soon
                      </Button>
                      <p className="text-sm text-yellow-700 text-right">
                        {workflow.selectedAirlineData.name} support is under development
                      </p>
                    </>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
} 