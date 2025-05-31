"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Settings, Wrench, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { ToolCard } from '@/components/Dashboard/ToolCard';
import { RecentJobs } from '@/components/Dashboard/RecentJobs';
import { SubscriptionStatusSummary } from '@/components/Dashboard/SubscriptionStatusSummary';
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
    const [isRetrying, setIsRetrying] = useState(false);

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

    const handleSubscriptionUpdate = useCallback((toolId: string, subscription: any) => {
        setTools(prevTools => 
            prevTools.map(tool => 
                tool.id === toolId 
                    ? { ...tool, subscription }
                    : tool
            )
        );
    }, []);

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
                <div className="mb-4 p-3 bg-gradient-to-br from-violet-50 via-blue-50 to-blue-100 border border-violet-200 rounded-lg flex items-center gap-2 shadow-lg">
                    <WifiOff className="h-4 w-4 text-violet-600" />
                    <span className="text-sm text-violet-700">
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
                    return <WifiOff className="h-12 w-12 text-violet-500 mx-auto" />;
                case ErrorType.AUTH:
                    return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
                case ErrorType.SERVER:
                    return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
                default:
                    return <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />;
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
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] sm:bg-[size:30px_30px] md:bg-[size:40px_40px] lg:bg-[size:50px_50px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
                
                {/* Responsive Container with proper spacing */}
                <div className="relative space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="dashboard-content">
                    {renderNetworkStatus()}

                    {/* Welcome Section with Error Boundary */}
                    <ErrorBoundary
                        fallback={
                            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">Unable to load welcome section</span>
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    >
                        {user ? (
                            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="welcome-card">
                                <CardHeader className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 text-white rounded-t-lg">
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl">Welcome, {user?.email?.split('@')[0]}! 👋</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-blue-100 text-sm sm:text-base">
                                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                                        Member for {daysSinceRegistration} days
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ) : (
                            <WelcomeSkeleton />
                        )}
                    </ErrorBoundary>

                    {/* Subscription Status Summary with enhanced responsive design */}
                    <ErrorBoundary
                        fallback={
                            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">Unable to load subscription status</span>
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    >
                        <SubscriptionStatusSummary 
                            tools={tools}
                            isLoading={toolsLoading}
                            onRefresh={handleRetryTools}
                        />
                    </ErrorBoundary>

                    {/* My Tools Section with Enhanced Responsive Layout */}
                    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="tools-section">
                        <CardHeader className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-600 text-white rounded-t-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                                        <Wrench className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                        <span className="truncate">My Tools</span>
                                    </CardTitle>
                                    <CardDescription className="text-blue-100 text-sm sm:text-base">
                                        Access your subscribed business automation tools
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!isOnline && <WifiOff className="h-4 w-4 text-orange-300" />}
                                    {toolsError && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRetryTools}
                                            disabled={toolsLoading}
                                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white text-xs sm:text-sm"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${toolsLoading ? 'animate-spin' : ''}`} />
                                            <span className="hidden sm:inline ml-1">Retry</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {toolsLoading ? (
                                <ToolsSectionSkeleton />
                            ) : toolsError ? (
                                renderToolsErrorState()
                            ) : tools.length === 0 ? (
                                <div className="flex items-center justify-center p-6 sm:p-8 text-center">
                                    <div className="space-y-3 max-w-sm mx-auto">
                                        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-600 inline-block shadow-lg">
                                            <Wrench className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">No tools available</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Contact your administrator to get access to business tools
                                        </p>
                                        <Link href="/app/user-settings">
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                className="mt-2"
                                            >
                                                Contact Support
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3" data-testid="tools-grid">
                                    {tools.map((tool) => (
                                        <ErrorBoundary
                                            key={tool.id}
                                            fallback={
                                                <Card className="p-4 bg-white/60 backdrop-blur-sm border border-white/20">
                                                    <div className="flex items-center gap-2 text-amber-600">
                                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span className="text-sm">Tool unavailable</span>
                                                    </div>
                                                </Card>
                                            }
                                        >
                                            <ToolCard tool={tool} onSubscriptionUpdate={handleSubscriptionUpdate} />
                                        </ErrorBoundary>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Jobs Section with Enhanced Responsive Design */}
                    {user?.id && (
                        <ErrorBoundary
                            fallback={
                                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <CardHeader className="bg-gradient-to-r from-violet-500 via-violet-600 to-purple-600 text-white rounded-t-lg">
                                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                            <AlertCircle className="h-5 w-5 text-orange-300 flex-shrink-0" />
                                            Recent Jobs
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6">
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

                    {/* Enhanced Account Settings Section with Improved Responsive Grid */}
                    <ErrorBoundary
                        fallback={
                            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">Account settings temporarily unavailable</span>
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    >
                        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="settings-section">
                            <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                                    <Settings className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                    Account Settings
                                </CardTitle>
                                <CardDescription className="text-purple-100 text-sm sm:text-base">
                                    Manage your account preferences and security settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                {/* Responsive Settings Grid - Stack on mobile, 2 cols on tablet, 3 cols on desktop */}
                                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" data-testid="settings-grid">
                                    {/* Full User Settings */}
                                    <Link
                                        href="/app/user-settings"
                                        className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 transition-all duration-300 group hover:shadow-lg hover:scale-105"
                                    >
                                        <div className="p-2 bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                                            <Settings className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-sm sm:text-base truncate">User Settings</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Comprehensive account management</p>
                                        </div>
                                    </Link>

                                    {/* Quick Password Change */}
                                    <Link
                                        href="/app/user-settings#password"
                                        className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 transition-all duration-300 group hover:shadow-lg hover:scale-105"
                                    >
                                        <div className="p-2 bg-gradient-to-br from-blue-600 via-violet-500 to-violet-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                                            <Settings className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-sm sm:text-base truncate">Change Password</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Update your account password</p>
                                        </div>
                                    </Link>

                                    {/* Quick MFA Setup - Full width on mobile */}
                                    <Link
                                        href="/app/user-settings#mfa"
                                        className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 transition-all duration-300 group hover:shadow-lg hover:scale-105 sm:col-span-2 lg:col-span-1"
                                    >
                                        <div className="p-2 bg-gradient-to-br from-violet-600 via-violet-700 to-purple-600 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                                            <Settings className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-sm sm:text-base truncate">Security (MFA)</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">Two-factor authentication setup</p>
                                        </div>
                                    </Link>
                                </div>
                                
                                {/* Enhanced Account Summary with Responsive Layout */}
                                <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Account Status</h4>
                                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                Registered as {user?.email || 'Loading...'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:text-right gap-2">
                                            <span className="inline-block px-3 py-1 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 via-violet-500 to-violet-600 text-white rounded-full shadow-sm w-fit">
                                                Active
                                            </span>
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
            </div>
        </ErrorBoundary>
    );
}