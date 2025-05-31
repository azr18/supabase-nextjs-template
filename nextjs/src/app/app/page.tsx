"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Settings, Wrench, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { ToolCard } from '@/components/Dashboard/ToolCard';
import { RecentJobs } from '@/components/Dashboard/RecentJobs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  WelcomeSkeleton, 
  ToolsSectionSkeleton,
  DashboardSkeleton 
} from '@/components/Dashboard/LoadingSkeletons';
import { getToolsWithSubscriptions, ToolWithSubscription } from '@/lib/supabase/queries/tools';

// Error types for better error handling
enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

interface DashboardError {
  type: ErrorType;
  message: string;
  details?: string;
  action?: string;
}

export default function DashboardContent() {
    const { loading, user } = useGlobal();
    const [tools, setTools] = useState<ToolWithSubscription[]>([]);
    const [toolsLoading, setToolsLoading] = useState(true);
    const [toolsError, setToolsError] = useState<DashboardError | null>(null);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [isOnline, setIsOnline] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-retry when coming back online if there was an error
            if (toolsError?.type === ErrorType.NETWORK) {
                setTimeout(() => fetchTools(true), 1000);
            }
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            if (!toolsError) {
                setToolsError({
                    type: ErrorType.NETWORK,
                    message: 'You appear to be offline',
                    details: 'Please check your internet connection',
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
    }, [toolsError]);

    // Enhanced error classification
    const classifyError = (error: unknown): DashboardError => {
        const hasProperty = (obj: unknown, prop: string): boolean => {
            return typeof obj === 'object' && obj !== null && prop in obj;
        };

        // Network/connectivity errors
        if (!navigator.onLine || 
            hasProperty(error, 'code') && (error as any).code === 'NETWORK_ERROR' || 
            error instanceof Error && error.message?.includes('fetch')) {
            return {
                type: ErrorType.NETWORK,
                message: 'Connection problem detected',
                details: 'Please check your internet connection and try again',
                action: 'retry'
            };
        }

        // Authentication errors
        if (hasProperty(error, 'code') && (error as any).code === 'UNAUTHORIZED' || 
            hasProperty(error, 'status') && (error as any).status === 401) {
            return {
                type: ErrorType.AUTH,
                message: 'Session expired',
                details: 'Please log in again to continue',
                action: 'login'
            };
        }

        // Permission errors
        if (hasProperty(error, 'code') && (error as any).code === 'FORBIDDEN' || 
            hasProperty(error, 'status') && (error as any).status === 403) {
            return {
                type: ErrorType.PERMISSION,
                message: 'Access not authorized',
                details: 'You may not have permission to access this data',
                action: 'contact'
            };
        }

        // Server errors
        if (hasProperty(error, 'status') && (error as any).status >= 500 || 
            hasProperty(error, 'code') && typeof (error as any).code === 'string' && (error as any).code.includes('PGRST') || 
            error instanceof Error && error.message?.includes('server')) {
            return {
                type: ErrorType.SERVER,
                message: 'Server temporarily unavailable',
                details: 'Our servers are experiencing issues. Please try again in a moment.',
                action: 'retry'
            };
        }

        // Default unknown error
        return {
            type: ErrorType.UNKNOWN,
            message: 'Something went wrong',
            details: error instanceof Error ? error.message : 'An unexpected error occurred while loading your tools',
            action: 'retry'
        };
    };

    // Enhanced fetch tools with better error handling
    const fetchTools = useCallback(async (isRetry: boolean = false) => {
        if (!user?.id) return;
        
        try {
            setToolsLoading(true);
            setToolsError(null);
            
            if (isRetry) {
                setRetryAttempt(prev => prev + 1);
                // Progressive delay for retries
                const delay = Math.min(500 * retryAttempt, 3000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const userTools = await getToolsWithSubscriptions(user.id);
            setTools(userTools);
            setLastUpdateTime(new Date());
            
            // Reset retry counter on success
            if (isRetry) {
                setRetryAttempt(0);
            }
        } catch (error) {
            console.error('Error fetching tools:', error);
            const dashboardError = classifyError(error);
            setToolsError(dashboardError);

            // Log error for analytics/monitoring
            if (process.env.NODE_ENV === 'production') {
                // In production, you could send to error tracking service
                console.error('Dashboard error logged:', {
                    error: dashboardError,
                    userId: user.id,
                    retryAttempt,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            }
        } finally {
            setToolsLoading(false);
        }
    }, [user?.id, retryAttempt]);

    useEffect(() => {
        if (user?.id) {
            fetchTools();
        }
    }, [user?.id, fetchTools]);

    const handleRetryTools = () => {
        fetchTools(true);
    };

    const handleErrorAction = (action: string) => {
        switch (action) {
            case 'retry':
                handleRetryTools();
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

    const getDaysSinceRegistration = () => {
        if (!user?.registered_at) return 0;
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - user.registered_at.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderNetworkStatus = () => {
        if (!isOnline) {
            return (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                        You're currently offline. Some features may not be available.
                    </span>
                </div>
            );
        }
        return null;
    };

    const renderToolsErrorState = () => {
        if (!toolsError) return null;

        const getErrorIcon = () => {
            switch (toolsError.type) {
                case ErrorType.NETWORK:
                    return <WifiOff className="h-12 w-12 text-orange-500 mx-auto" />;
                case ErrorType.AUTH:
                    return <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />;
                case ErrorType.SERVER:
                    return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
                default:
                    return <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />;
            }
        };

        const getActionButton = () => {
            switch (toolsError.action) {
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
                            onClick={() => handleErrorAction('retry')}
                            disabled={toolsLoading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${toolsLoading ? 'animate-spin' : ''}`} />
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
                        <p className="text-sm font-medium text-gray-900">{toolsError.message}</p>
                        <p className="text-xs text-gray-600">{toolsError.details}</p>
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
                        {toolsError.action === 'retry' && (
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

    // Global loading state (user authentication)
    if (loading) {
        return <DashboardSkeleton />;
    }

    const daysSinceRegistration = getDaysSinceRegistration();

    return (
        <ErrorBoundary
            onError={(error, errorInfo) => {
                console.error('Dashboard component error:', error, errorInfo);
                // In production, send to error tracking service
            }}
        >
            <div className="space-y-6 p-6">
                {renderNetworkStatus()}

                {/* Welcome Section with Error Boundary */}
                <ErrorBoundary
                    fallback={
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">Unable to load welcome section</span>
                                </div>
                            </CardContent>
                        </Card>
                    }
                >
                    {user ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Welcome, {user?.email?.split('@')[0]}! 👋</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Member for {daysSinceRegistration} days
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <WelcomeSkeleton />
                    )}
                </ErrorBoundary>

                {/* My Tools Section with Enhanced Error Handling */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    My Tools
                                </CardTitle>
                                <CardDescription>
                                    Access your subscribed business automation tools
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isOnline && <WifiOff className="h-4 w-4 text-orange-500" />}
                                {toolsError && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRetryTools}
                                        disabled={toolsLoading}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${toolsLoading ? 'animate-spin' : ''}`} />
                                        Retry
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {toolsLoading ? (
                            <ToolsSectionSkeleton />
                        ) : toolsError ? (
                            renderToolsErrorState()
                        ) : tools.length === 0 ? (
                            <div className="flex items-center justify-center p-8 text-center">
                                <div className="space-y-3">
                                    <Wrench className="h-12 w-12 text-gray-400 mx-auto" />
                                    <p className="text-sm text-gray-600">No tools available</p>
                                    <p className="text-xs text-gray-500">
                                        Contact your administrator to get access to business tools
                                    </p>
                                    <Link href="/app/user-settings">
                                        <Button variant="outline" size="sm">
                                            Contact Support
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {tools.map((tool) => (
                                    <ErrorBoundary
                                        key={tool.id}
                                        fallback={
                                            <Card className="p-4">
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm">Tool unavailable</span>
                                                </div>
                                            </Card>
                                        }
                                    >
                                        <ToolCard tool={tool} />
                                    </ErrorBoundary>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Jobs Section with Error Boundary */}
                {user?.id && (
                    <ErrorBoundary
                        fallback={
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                        Recent Jobs
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 text-center text-sm text-gray-600">
                                        Unable to load recent jobs. Please refresh the page or contact support.
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    >
                        <RecentJobs 
                            userId={user.id} 
                            limit={5}
                            className="w-full"
                        />
                    </ErrorBoundary>
                )}

                {/* Quick Actions with Error Boundary */}
                <ErrorBoundary
                    fallback={
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">Account settings temporarily unavailable</span>
                                </div>
                            </CardContent>
                        </Card>
                    }
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Settings
                            </CardTitle>
                            <CardDescription>Manage your account preferences and security settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Full User Settings */}
                                <Link
                                    href="/app/user-settings"
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Settings className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">User Settings</h3>
                                        <p className="text-sm text-gray-500">Comprehensive account management</p>
                                    </div>
                                </Link>

                                {/* Quick Password Change */}
                                <Link
                                    href="/app/user-settings#password"
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors">
                                        <Settings className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Change Password</h3>
                                        <p className="text-sm text-gray-500">Update your account password</p>
                                    </div>
                                </Link>

                                {/* Quick MFA Setup */}
                                <Link
                                    href="/app/user-settings#mfa"
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
                                        <Settings className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Security (MFA)</h3>
                                        <p className="text-sm text-gray-500">Two-factor authentication setup</p>
                                    </div>
                                </Link>
                            </div>
                            
                            {/* Account Summary */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Account Status</h4>
                                        <p className="text-sm text-gray-600">
                                            Registered as {user?.email || 'Loading...'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-green-600">Active</p>
                                        <p className="text-xs text-gray-500">
                                            Member for {daysSinceRegistration} {daysSinceRegistration === 1 ? 'day' : 'days'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </ErrorBoundary>
            </div>
        </ErrorBoundary>
    );
}