"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, FileText, Upload, History, Lock, CheckCircle, Info, ArrowRight, ArrowLeft, Plane, Clock, Star, Loader2, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { hasToolAccess, getToolSubscriptionStatus } from '@/lib/supabase/queries/tools';
import AirlineSelector, { AIRLINES } from '@/components/InvoiceReconciler/AirlineSelector';

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
  isValidSelection: boolean;
  canProceed: boolean;
  validationError: string | null;
  // Loading states for airline selection operations
  isLoadingAirlines: boolean;
  isProcessingSelection: boolean;
}

export default function InvoiceReconcilerPage() {
  const { user, loading } = useGlobal();
  const router = useRouter();
  const { toast } = useToast();
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
    isValidSelection: false,
    canProceed: false,
    validationError: null,
    // Loading states for airline selection operations
    isLoadingAirlines: true, // Start with loading state
    isProcessingSelection: false
  });

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

    if (!loading && accessStatus.hasAccess) {
      loadAirlineData();
    }
  }, [loading, accessStatus.hasAccess]);

  // Check tool access on component mount
  useEffect(() => {
    async function checkAccess() {
      if (!user?.id) {
        setAccessStatus({
          hasAccess: false,
          isLoading: false,
          error: 'Please log in to access this tool',
          retryCount: 0,
          lastChecked: null,
          subscriptionStatus: null,
          errorCode: 'AUTH_ERROR',
          canRetry: true
        });
        return;
      }

      try {
        // Enhanced subscription validation with detailed status
        const statusResult = await getToolSubscriptionStatus(TOOL_SLUG, user.id);
        const hasAccess = await hasToolAccess(TOOL_SLUG, user.id);
        
        if (hasAccess) {
          setAccessStatus({
            hasAccess: true,
            isLoading: false,
            error: null,
            retryCount: 0,
            lastChecked: new Date(),
            subscriptionStatus: statusResult.status,
            canRetry: true
          });
        } else {
          // Classify the error type for better user experience
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
            retryCount: 0,
            lastChecked: new Date(),
            subscriptionStatus: statusResult.status,
            errorCode,
            canRetry: true
          });

          // Enhanced user feedback based on error type
          if (errorCode === 'NO_SUBSCRIPTION') {
            toast({
              title: "Subscription Required",
              description: "You need an active subscription to use the Invoice Reconciler tool.",
              variant: "destructive",
            });
          } else if (errorCode === 'EXPIRED') {
            toast({
              title: "Subscription Expired",
              description: "Your subscription has expired. Please contact support to renew.",
              variant: "destructive",
            });
          } else if (errorCode === 'INACTIVE') {
            toast({
              title: "Subscription Inactive",
              description: "Your subscription is inactive. Please contact support.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error checking tool access:', error);
        
        setAccessStatus({
          hasAccess: false,
          isLoading: false,
          error: 'Unable to verify access. Please try again.',
          retryCount: 0,
          lastChecked: null,
          subscriptionStatus: null,
          errorCode: 'NETWORK_ERROR',
          canRetry: true
        });

        toast({
          title: "Connection Error",
          description: "Unable to verify subscription status. Please check your connection and try again.",
          variant: "destructive",
        });
      }
    }

    if (!loading) {
      checkAccess();
    }
  }, [user?.id, loading, toast]);

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

  // Handle airline selection with enhanced validation feedback and loading states
  const handleAirlineChange = async (airlineId: string | null) => {
    // Start processing state
    setWorkflow(prev => ({
      ...prev,
      isProcessingSelection: true,
      validationError: null
    }));

    // Simulate processing time for airline selection validation (realistic for API calls)
    await new Promise(resolve => setTimeout(resolve, 800));

    const validation = validateAirlineSelection(airlineId);
    
    if (airlineId) {
      const selectedAirlineData = AIRLINES.find(airline => airline.id === airlineId);
      
      if (selectedAirlineData) {
        setWorkflow(prev => ({
          ...prev,
          selectedAirline: airlineId,
          selectedAirlineData,
          isValidSelection: validation.isValid,
          canProceed: validation.canProceed,
          validationError: validation.error,
          isProcessingSelection: false
        }));

        // Show enhanced airline selection feedback
        if (validation.canProceed) {
          toast({
            title: `${selectedAirlineData.name} Selected`,
            description: `Ready to proceed with ${selectedAirlineData.name} reconciliation`,
            variant: "default",
          });
        } else if (selectedAirlineData.status === 'coming-soon') {
          toast({
            title: `${selectedAirlineData.name} Coming Soon`,
            description: `${selectedAirlineData.name} reconciliation is not yet available`,
            variant: "destructive",
          });
        }
      }
    } else {
      setWorkflow(prev => ({
        ...prev,
        selectedAirline: null,
        selectedAirlineData: null,
        isValidSelection: false,
        canProceed: false,
        validationError: validation.error,
        isProcessingSelection: false
      }));
    }
  };

  // Enhanced navigation to next step with validation
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (workflow.currentStep === 'airline-selection') {
      const validation = validateAirlineSelection(workflow.selectedAirline);
      
      if (!validation.canProceed) {
        toast({
          title: "Selection Required",
          description: validation.error || "Please complete the current step before proceeding",
          variant: "destructive",
        });
        return;
      }
    }

    if (!workflow.canProceed) {
      toast({
        title: "Cannot Proceed",
        description: "Please complete the required selection for this step",
        variant: "destructive",
      });
      return;
    }

    switch (workflow.currentStep) {
      case 'airline-selection':
        setWorkflow(prev => ({ ...prev, currentStep: 'invoice-upload' }));
        toast({
          title: "Step 2: Invoice Upload",
          description: `Ready to upload ${workflow.selectedAirlineData?.name} invoice.`,
          variant: "default",
        });
        break;
      case 'invoice-upload':
        setWorkflow(prev => ({ ...prev, currentStep: 'report-upload' }));
        toast({
          title: "Step 3: Report Upload",
          description: "Ready to upload Excel report file.",
          variant: "default",
        });
        break;
      case 'report-upload':
        setWorkflow(prev => ({ ...prev, currentStep: 'processing' }));
        toast({
          title: "Processing Started",
          description: "Reconciliation process has begun.",
          variant: "default",
        });
        break;
    }
  };

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
  if (loading || accessStatus.isLoading) {
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
                      We'll help you get started with automated invoice reconciliation.
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
                        Click "Continue" to proceed to invoice upload
                      </p>
                    </div>
                  )}
                </div>
              )}

              {workflow.currentStep === 'invoice-upload' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl p-8 border border-blue-100">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <p className="text-gray-800 font-semibold text-lg">
                        Upload {workflow.selectedAirlineData?.name} Invoice
                      </p>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Drop your {workflow.selectedAirlineData?.name} PDF invoice here or click to browse
                    </p>
                    <div className="bg-white rounded-xl p-12 border-2 border-dashed border-blue-200 text-center hover:border-blue-300 transition-colors">
                      <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Invoice upload interface will be implemented here</p>
                      <p className="text-sm text-gray-500">
                        📄 PDF Invoice: {workflow.selectedAirlineData?.name}-specific format
                      </p>
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
                      Drop your Excel report here or click to browse
                    </p>
                    <div className="bg-white rounded-xl p-12 border-2 border-dashed border-green-200 text-center hover:border-green-300 transition-colors">
                      <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Excel report upload interface will be implemented here</p>
                      <p className="text-sm text-gray-500">
                        📊 Excel Report: Standardized format (same for all airlines)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {workflow.currentStep === 'processing' && (
                <div className="space-y-6">
                  {/* Processing Status */}
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl p-8 text-center">
                    <div className="animate-spin h-12 w-12 text-white mx-auto mb-6">
                      <RefreshCw className="h-12 w-12" />
                    </div>
                    <p className="text-white font-semibold text-xl mb-3">
                      Processing {workflow.selectedAirlineData?.name} Reconciliation
                    </p>
                    <p className="text-white/90">
                      Estimated completion: 5-7 minutes
                    </p>
                    
                    {/* Simple Processing Steps */}
                    <div className="mt-6 text-left bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-center">Processing Steps:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Extracting invoice data...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                          <span>Processing Excel report data...</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                          <span>Performing reconciliation analysis...</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                          <span>Generating detailed report...</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  {workflow.currentStep === 'airline-selection' && (workflow.isLoadingAirlines || workflow.isProcessingSelection) && (
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
                  
                  {/* Validation feedback for coming soon airlines */}
                  {workflow.selectedAirlineData && !workflow.canProceed && workflow.selectedAirlineData.status === 'coming-soon' && (
                    <>
                      <Button
                        disabled
                        className="bg-yellow-300 text-yellow-800 font-semibold px-10 py-3 text-base cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                      <p className="text-sm text-yellow-700 text-right">
                        {workflow.selectedAirlineData.name} reconciliation will be available soon
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