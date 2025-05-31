'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, AlertCircle, CheckCircle, PlayCircle, RefreshCw, Loader2, WifiOff, AlertTriangle } from 'lucide-react';
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
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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
      switch (error.type) {
        case JobsErrorType.NETWORK:
          return <WifiOff className="h-12 w-12 text-orange-500 mx-auto" />;
        case JobsErrorType.AUTH:
          return <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />;
        case JobsErrorType.SERVER:
          return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
        default:
          return <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />;
      }
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
            <p className="text-xs text-gray-600">{error.details}</p>
            {retryAttempt > 0 && (
              <p className="text-xs text-gray-500">
                Retry attempt: {retryAttempt}
              </p>
            )}
            {lastUpdateTime && (
              <p className="text-xs text-gray-500">
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
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
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderErrorState()}
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <Clock className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">No recent jobs found</p>
              <p className="text-xs text-gray-500">
                Start using our tools to see your job history here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Jobs
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
            {retryAttempt > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Download Error Alert */}
        {downloadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{downloadError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDownloadError(null)}
              className="h-auto p-1 hover:bg-red-100"
            >
              ×
            </Button>
          </div>
        )}

        {/* Network Status Warning */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              You're offline. Downloads and updates may not work.
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
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(job.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {job.job_name}
                      </p>
                      <Badge 
                        variant={statusInfo.variant}
                        className={statusInfo.className}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{airlineName}</span>
                      <span>{getRelativeTime(job.created_at)}</span>
                      {job.actual_duration_minutes && (
                        <span>Duration: {formatDuration(job.actual_duration_minutes)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {job.status === 'completed' && job.result_file_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(job)}
                      disabled={isDownloading || !isOnline}
                      className="h-8 px-2"
                      title={!isOnline ? "Cannot download while offline" : "Download result file"}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  {job.tool && (
                    <Link href={`/app/${job.tool.slug}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        Open Tool
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length >= limit && (
          <div className="mt-4 pt-3 border-t text-center">
            <Link href="/app/jobs">
              <Button variant="outline" size="sm">
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