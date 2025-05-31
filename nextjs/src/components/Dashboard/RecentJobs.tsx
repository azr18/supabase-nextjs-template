'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, AlertCircle, CheckCircle, PlayCircle, RefreshCw, Loader2, WifiOff, AlertTriangle, X } from 'lucide-react';
import { 
  getRecentJobsForUser, 
  JobWithToolInfo, 
  getJobStatusInfo, 
  getAirlineDisplayName, 
  formatDuration, 
  getRelativeTime 
} from '@/lib/supabase/queries/jobs';
import { createSPAClient } from '@/lib/supabase/client';

// Error types for better error handling
enum JobsErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  SERVER = 'server',
  DOWNLOAD = 'download',
  UNKNOWN = 'unknown'
}

interface JobsError {
  type: JobsErrorType;
  message: string;
  details?: string;
  action?: string;
}

interface RecentJobsProps {
  userId: string;
  limit?: number;
  className?: string;
}

export function RecentJobs({ userId, limit = 5, className }: RecentJobsProps) {
  const [jobs, setJobs] = useState<JobWithToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<JobsError | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry when coming back online if there was a network error
      if (error?.type === JobsErrorType.NETWORK) {
        setTimeout(() => fetchRecentJobs(true), 1000);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      if (!error) {
        setError({
          type: JobsErrorType.NETWORK,
          message: 'You appear to be offline',
          details: 'Recent jobs data may be outdated',
          action: 'retry'
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // Enhanced error classification
  const classifyError = (error: any): JobsError => {
    // Network/connectivity errors
    if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
      return {
        type: JobsErrorType.NETWORK,
        message: 'Connection problem detected',
        details: 'Please check your internet connection and try again',
        action: 'retry'
      };
    }

    // Authentication errors
    if (error.code === 'UNAUTHORIZED' || error.status === 401) {
      return {
        type: JobsErrorType.AUTH,
        message: 'Session expired',
        details: 'Please log in again to view your recent jobs',
        action: 'login'
      };
    }

    // Permission errors
    if (error.code === 'FORBIDDEN' || error.status === 403) {
      return {
        type: JobsErrorType.PERMISSION,
        message: 'Access not authorized',
        details: 'You may not have permission to view job history',
        action: 'contact'
      };
    }

    // Server errors
    if (error.status >= 500 || error.code?.includes('PGRST') || error.message?.includes('server')) {
      return {
        type: JobsErrorType.SERVER,
        message: 'Server temporarily unavailable',
        details: 'Our servers are experiencing issues. Recent jobs data may be temporarily unavailable.',
        action: 'retry'
      };
    }

    // Default unknown error
    return {
      type: JobsErrorType.UNKNOWN,
      message: 'Something went wrong',
      details: error.message || 'An unexpected error occurred while loading your recent jobs',
      action: 'retry'
    };
  };

  // Fetch recent jobs with retry capability and enhanced error handling
  const fetchRecentJobs = useCallback(async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isRetry) {
        setRetryAttempt(prev => prev + 1);
        // Progressive delay for retries
        const delay = Math.min(500 * retryAttempt, 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const recentJobs = await getRecentJobsForUser(userId, limit);
      setJobs(recentJobs);
      setLastUpdateTime(new Date());
      
      // Reset retry counter on success
      if (isRetry) {
        setRetryAttempt(0);
      }
    } catch (err) {
      console.error('Error fetching recent jobs:', err);
      const jobsError = classifyError(err);
      setError(jobsError);

      // Log error for analytics/monitoring
      if (process.env.NODE_ENV === 'production') {
        console.error('Jobs error logged:', {
          error: jobsError,
          userId,
          retryAttempt,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, limit, retryAttempt]);

  useEffect(() => {
    if (userId) {
      fetchRecentJobs();
    }
  }, [userId, fetchRecentJobs]);

  const handleRetry = () => {
    fetchRecentJobs(true);
  };

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'retry':
        handleRetry();
        break;
      case 'login':
        window.location.href = '/auth/login';
        break;
      case 'contact':
        window.location.href = '/app/user-settings';
        break;
      case 'refresh':
        window.location.reload();
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-violet-600" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-violet-600" />;
    }
  };

  const handleDownload = async (job: JobWithToolInfo) => {
    if (!job.result_file_path) return;

    try {
      setDownloadingJobId(job.id);
      setDownloadError(null);

      // Check if user is online before attempting download
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Please check your internet connection and try again.');
      }

      const supabase = createSPAClient();
      const { data, error } = await supabase.storage
        .from('invoice-reconciler')
        .createSignedUrl(job.result_file_path, 60); // 1 minute expiry

      if (error) {
        console.error('Error creating download URL:', error);
        
        // Classify download errors
        if (error.message?.includes('not found')) {
          throw new Error('File not found. The result file may have been moved or deleted.');
        } else if (error.message?.includes('access')) {
          throw new Error('Access denied. You may not have permission to download this file.');
        } else {
          throw new Error('Unable to prepare download. Please try again or contact support.');
        }
      }

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = `reconciliation-${job.airline_type}-${new Date(job.created_at).toLocaleDateString()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clear any previous download errors on success
      setDownloadError(null);
    } catch (err) {
      console.error('Download failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Download failed. Please try again.';
      setDownloadError(errorMessage);
      
      // Auto-clear download error after 5 seconds
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloadingJobId(null);
    }
  };

  const renderErrorState = () => {
    if (!error) return null;

    const getErrorIcon = () => {
      if (error.type === JobsErrorType.NETWORK) {
        return <AlertCircle className="h-12 w-12 text-violet-500 mx-auto" />;
      }
      
      if (error.type === JobsErrorType.PERMISSION) {
        return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
      }
      
      return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
    };

    const getActionButton = () => {
      switch (error.action) {
        case 'login':
          return (
            <Button
              onClick={() => handleErrorAction('login')}
              className="flex items-center gap-2"
            >
              Go to Login
            </Button>
          );
        case 'contact':
          return (
            <Button
              variant="outline"
              onClick={() => handleErrorAction('contact')}
            >
              Contact Support
            </Button>
          );
        default:
          return (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleErrorAction('retry')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          );
      }
    };

    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="space-y-4 max-w-md">
          {getErrorIcon()}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">{error.message}</p>
            <p className="text-xs text-blue-600">{error.details}</p>
            {retryAttempt > 0 && (
              <p className="text-xs text-blue-500">
                Retry attempt: {retryAttempt}
              </p>
            )}
            {lastUpdateTime && (
              <p className="text-xs text-blue-500">
                Last successful update: {lastUpdateTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {getActionButton()}
            {error.action === 'retry' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleErrorAction('refresh')}
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={`group transition-all duration-500 hover:shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-300 overflow-hidden ${className}`}>
        {/* Gradient overlay for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent font-bold">Recent Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border-2 border-blue-100 rounded-xl bg-gradient-to-r from-blue-50/50 to-violet-50/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gradient-to-r from-blue-200 to-violet-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gradient-to-r from-blue-200 to-violet-200 rounded"></div>
                      <div className="h-3 w-24 bg-gradient-to-r from-blue-200 to-violet-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-gradient-to-r from-blue-200 to-violet-200 rounded-full"></div>
                    <div className="h-8 w-20 bg-gradient-to-r from-blue-200 to-violet-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`group transition-all duration-500 hover:shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-300 overflow-hidden ${className}`}>
        {/* Gradient overlay for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent font-bold">Recent Jobs</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {renderErrorState()}
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={`group transition-all duration-500 hover:shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-300 overflow-hidden ${className}`}>
        {/* Gradient overlay for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent font-bold">Recent Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 w-fit mx-auto">
                <Clock className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">No recent jobs found</p>
                <p className="text-xs text-blue-600">
                  Start using our tools to see your job history here
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`group transition-all duration-500 hover:shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 hover:border-blue-300 overflow-hidden ${className}`}>
      {/* Enhanced gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03] pointer-events-none transition-all duration-500" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent font-bold text-lg">Recent Jobs</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
            {retryAttempt > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center gap-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {/* Download Error Alert */}
        {downloadError && (
          <div className="mb-4 p-3 bg-gradient-to-r from-red-50 via-red-100 to-pink-50 border-2 border-red-200 rounded-xl flex items-start gap-2 shadow-sm">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{downloadError}</p>
              <button
                onClick={() => setDownloadError(null)}
                className="h-auto p-1 hover:bg-red-100 text-red-600 transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Network Status Warning */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-gradient-to-r from-violet-50 via-blue-50 to-blue-100 border-2 border-violet-200 rounded-xl flex items-center gap-2 shadow-sm">
            <WifiOff className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-violet-700 font-medium">
              You're currently offline. Job downloads may not be available.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((job) => {
            const statusInfo = getJobStatusInfo(job.status);
            const airlineName = getAirlineDisplayName(job.airline_type);
            const isDownloading = downloadingJobId === job.id;
            
            return (
              <div 
                key={job.id} 
                className="group/job flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-blue-100 rounded-xl hover:border-blue-200 hover:border-violet-200 bg-gradient-to-r from-blue-50/30 to-violet-50/30 hover:from-blue-50/50 hover:to-violet-50/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 group-hover/job:shadow-md transition-all duration-300 flex-shrink-0">
                    {getStatusIcon(job.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <p className="text-sm font-semibold truncate text-gray-900 group-hover/job:text-blue-700 transition-colors duration-300">
                        {job.job_name}
                      </p>
                      <Badge 
                        variant={statusInfo.variant}
                        className={`${statusInfo.className} font-medium border-0 shadow-sm hover:shadow-md transition-shadow duration-300 w-fit`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-blue-600 font-medium">
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent truncate">{airlineName}</span>
                      <span className="truncate">{getRelativeTime(job.created_at)}</span>
                      {job.actual_duration_minutes && (
                        <span className="truncate">Duration: {formatDuration(job.actual_duration_minutes)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center sm:ml-4">
                  {job.status === 'completed' && job.result_file_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(job)}
                      disabled={isDownloading || !isOnline}
                      className="h-8 px-3 hover:scale-105 hover:shadow-lg text-xs sm:text-sm"
                      title={!isOnline ? "Cannot download while offline" : "Download result file"}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1 sm:mr-0" />
                          <span className="sm:hidden">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 sm:mr-0 mr-1" />
                          <span className="sm:hidden">Download</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  {job.tool && (
                    <Link href={`/app/${job.tool.slug}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-xs sm:text-sm text-blue-600 hover:scale-105 font-semibold"
                      >
                        <span className="truncate">Open Tool</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length > 5 && (
          <div className="mt-6 pt-4 border-t-2 border-blue-100 text-center">
            <Link href="/app/jobs">
              <Button 
                variant="outline" 
                size="sm"
              >
                View All Jobs
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentJobs; 