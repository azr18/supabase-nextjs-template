'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, RefreshCw, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useGlobal } from '@/lib/context/GlobalContext';
import { subscriptionFeedback } from '@/lib/subscriptions/subscriptionFeedback';

type Tool = Database['public']['Tables']['tools']['Row'];
type UserToolSubscription = Database['public']['Tables']['user_tool_subscriptions']['Row'];

interface ToolWithSubscription extends Tool {
  subscription?: UserToolSubscription | null;
}

interface ToolCardProps {
  tool: ToolWithSubscription;
  className?: string;
  onSubscriptionUpdate?: (toolId: string, subscription: UserToolSubscription | null) => void;
}

interface SubscriptionValidationResult {
  isValid: boolean;
  hasAccess: boolean;
  reason?: string;
  subscription?: UserToolSubscription | null;
}

export function ToolCard({ tool, className, onSubscriptionUpdate }: ToolCardProps) {
  const { user } = useGlobal();
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    lastValidated: Date | null;
    error: string | null;
    result: SubscriptionValidationResult | null;
  }>({
    isValidating: false,
    lastValidated: null,
    error: null,
    result: null
  });

  // Real-time subscription validation with feedback
  const validateSubscription = useCallback(async (showLoader: boolean = true, showFeedback: boolean = false) => {
    if (!user?.id) return;

    try {
      if (showLoader) {
        setValidationState(prev => ({ ...prev, isValidating: true, error: null }));
      }

      const response = await fetch(`/api/subscriptions?tool=${tool.slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data = await response.json();
      
      const result: SubscriptionValidationResult = {
        isValid: true,
        hasAccess: data.hasAccess,
        reason: data.reason,
        subscription: data.subscription
      };

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        lastValidated: new Date(),
        error: null,
        result
      }));

      // Show validation feedback if requested
      if (showFeedback) {
        subscriptionFeedback.showValidation(
          tool.name,
          result.isValid && result.hasAccess,
          result.reason
        );
      }

      // Check for subscription status changes
      const oldSubscription = tool.subscription;
      const newSubscription = data.subscription;
      
      if (oldSubscription?.status !== newSubscription?.status) {
        subscriptionFeedback.showChange(
          tool.name,
          oldSubscription?.status || null,
          newSubscription?.status || 'no_access'
        );
      }

      // Notify parent component of subscription update
      if (onSubscriptionUpdate && data.subscription !== tool.subscription) {
        onSubscriptionUpdate(tool.id, data.subscription);
      }

      return result;
    } catch (error) {
      console.error('Subscription validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        error: errorMessage,
        result: null
      }));

      // Show validation error feedback
      if (showFeedback) {
        subscriptionFeedback.showValidation(
          tool.name,
          false,
          errorMessage
        );
      }

      return null;
    }
  }, [user?.id, tool.slug, tool.id, tool.name, tool.subscription, onSubscriptionUpdate]);

  // Initial validation and periodic refresh
  useEffect(() => {
    if (user?.id) {
      // Initial validation
      validateSubscription(false);
      
      // Set up periodic refresh (every 5 minutes)
      const interval = setInterval(() => {
        validateSubscription(false);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user?.id, validateSubscription]);

  // Enhanced access logic with validation result
  const getAccessStatus = () => {
    // If validation is in progress or failed, use original data
    if (validationState.error || !validationState.result) {
      const subscription = tool.subscription;
      
      // Check if subscription exists and is active/trial
      if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trial')) {
        return {
          hasAccess: false,
          isActive: subscription?.status === 'active',
          isTrial: subscription?.status === 'trial',
          subscription,
          source: 'fallback' as const
        };
      }

      // Check expiration dates even for fallback
      const now = new Date();
      let isExpiredByDate = false;
      
      if (subscription.status === 'active' && subscription.expires_at) {
        isExpiredByDate = new Date(subscription.expires_at) <= now;
      } else if (subscription.status === 'trial' && subscription.trial_ends_at) {
        isExpiredByDate = new Date(subscription.trial_ends_at) <= now;
      }

      return {
        hasAccess: !isExpiredByDate, // Access denied if expired by date
        isActive: subscription?.status === 'active' && !isExpiredByDate,
        isTrial: subscription?.status === 'trial' && !isExpiredByDate,
        subscription,
        source: 'fallback' as const
      };
    }

    // Use validated data (this already has proper hasAccess from API)
    const subscription = validationState.result.subscription;
    const isActive = subscription?.status === 'active';
    const isTrial = subscription?.status === 'trial';
    
    return {
      hasAccess: validationState.result.hasAccess,
      isActive,
      isTrial,
      subscription,
      source: 'validated' as const
    };
  };

  const accessStatus = getAccessStatus();

  const getStatusBadge = () => {
    const { subscription } = accessStatus;
    
    if (!subscription) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700">No Access</Badge>
          {validationState.error && (
            <div className="relative group">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {validationState.error}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Check if subscription has expired based on dates, regardless of status field
    const now = new Date();
    let isExpiredByDate = false;
    
    if (subscription.status === 'active' && subscription.expires_at) {
      isExpiredByDate = new Date(subscription.expires_at) <= now;
    } else if (subscription.status === 'trial' && subscription.trial_ends_at) {
      isExpiredByDate = new Date(subscription.trial_ends_at) <= now;
    }

    let badge;
    // Override status if expired by date
    const effectiveStatus = isExpiredByDate ? 'expired' : subscription.status;
    
    switch (effectiveStatus) {
      case 'active':
        badge = <Badge variant="default" className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white border-0 shadow-md transition-all duration-300 hover:scale-105">Active</Badge>;
        break;
      case 'trial':
        badge = <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500 hover:from-blue-600 hover:via-blue-700 hover:to-violet-600 text-white border-0 shadow-md transition-all duration-300 hover:scale-105">Trial</Badge>;
        break;
      case 'expired':
        badge = <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md transition-all duration-300 hover:scale-105">Expired</Badge>;
        break;
      case 'inactive':
        badge = <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 hover:scale-105">Inactive</Badge>;
        break;
      default:
        badge = <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 hover:scale-105">{subscription.status}</Badge>;
    }

    return (
      <div className="flex items-center gap-2">
        {badge}
        {validationState.isValidating && (
          <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
        )}
        {validationState.error && (
          <div className="relative group">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {validationState.error}
            </div>
          </div>
        )}
        {accessStatus.source === 'validated' && !validationState.error && (
          <div className="relative group">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Status verified
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTrialInfo = () => {
    const { isTrial, subscription } = accessStatus;
    if (!isTrial || !subscription?.trial_ends_at) return null;
    
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 0) {
      return (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">{daysLeft} days left</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-3 w-3 text-red-600" />
        <span className="text-xs text-red-600 font-medium">Trial expired</span>
      </div>
    );
  };

  const getExpirationInfo = () => {
    const { isActive, subscription } = accessStatus;
    if (!isActive || !subscription?.expires_at) return null;
    
    const expirationDate = new Date(subscription.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft > 0) {
      return (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-orange-600" />
          <span className="text-xs text-orange-600 font-medium">Expires in {daysLeft} days</span>
        </div>
      );
    }
    return null;
  };

  const getAccessDeniedReason = () => {
    if (accessStatus.hasAccess) return null;
    
    // Use validation reason if available
    if (validationState.result?.reason) {
      return (
        <div className="text-xs text-gray-500 mt-1 font-medium">
          {validationState.result.reason}
        </div>
      );
    }

    // Fallback reasons
    const { subscription } = accessStatus;
    if (!subscription) {
      return <div className="text-xs text-gray-500 mt-1 font-medium">No subscription found</div>;
    }
    
    if (subscription.status === 'expired') {
      return <div className="text-xs text-gray-500 mt-1 font-medium">Subscription has expired</div>;
    }
    
    if (subscription.status === 'inactive') {
      return <div className="text-xs text-gray-500 mt-1 font-medium">Subscription is inactive</div>;
    }

    return <div className="text-xs text-gray-500 mt-1 font-medium">Access not available</div>;
  };

  const handleRefreshStatus = async () => {
    await validateSubscription(true, true);
  };

  return (
    <Card className={`group relative transition-all duration-500 hover:shadow-2xl ${accessStatus.hasAccess ? 'hover:scale-105 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30' : 'opacity-75 bg-gradient-to-br from-white to-gray-50'} border-2 ${accessStatus.hasAccess ? 'border-blue-200 hover:border-blue-300 hover:border-violet-300' : 'border-gray-200'} overflow-hidden ${className}`} data-testid="tool-card">
      {/* Enhanced gradient overlay for visual interest */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accessStatus.hasAccess ? 'from-blue-500/[0.02] via-violet-500/[0.02] to-purple-500/[0.01] group-hover:from-blue-500/[0.05] group-hover:via-violet-500/[0.05] group-hover:to-purple-500/[0.03]' : 'from-gray-500/[0.02] to-transparent'} pointer-events-none transition-all duration-500`} />
      
      <CardHeader className="pb-3 relative z-10">
        {/* Responsive header layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {tool.icon && (
              <div className={`p-2 sm:p-3 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl flex-shrink-0 ${
                accessStatus.hasAccess 
                  ? 'bg-gradient-to-br from-gray-800 via-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:via-violet-500 group-hover:to-violet-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <span className="text-lg sm:text-2xl text-white">{tool.icon}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 truncate">{tool.name}</CardTitle>
              <div className="mt-1">
                {getStatusBadge()}
              </div>
            </div>
          </div>
          
          {/* Status and refresh button */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start">
            {!accessStatus.hasAccess && <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            <div className="relative group/tooltip">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshStatus}
                disabled={validationState.isValidating}
                className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg flex-shrink-0 ${
                  accessStatus.hasAccess 
                    ? 'hover:border-blue-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${validationState.isValidating ? 'animate-spin' : ''} ${accessStatus.hasAccess ? 'text-blue-600' : 'text-gray-500'}`} />
              </Button>
              {/* Tooltip positioning for mobile */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-800 text-white rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg z-50">
                Refresh status
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 relative z-10">
        <CardDescription className="text-sm leading-relaxed text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300 line-clamp-3">
          {tool.description || 'No description available'}
        </CardDescription>
        
        {/* Trial/Expiration Info - Stack on mobile for better readability */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-1">
            {getTrialInfo()}
            {getExpirationInfo()}
          </div>
          {getAccessDeniedReason()}
        </div>

        {/* Validation Status Info */}
        {validationState.lastValidated && (
          <div className="text-xs text-gray-400 mt-3 font-medium truncate">
            Last verified: {validationState.lastValidated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 relative z-10">
        {accessStatus.hasAccess ? (
          <Link href={`/app/${tool.slug}`} className="w-full">
            <Button 
              className="w-full group/btn text-sm sm:text-base py-2 sm:py-3"
              size="sm"
              disabled={validationState.isValidating}
              onClick={() => {
                if (!accessStatus.hasAccess) {
                  subscriptionFeedback.showAccessDenied(
                    tool.name,
                    'You need an active subscription to access this tool.'
                  );
                  return;
                }

                // Show status feedback when accessing tool
                const { subscription } = accessStatus;
                if (subscription) {
                  const now = new Date();
                  let daysRemaining: number | undefined;
                  let isExpiringSoon = false;

                  if (subscription.status === 'trial' && subscription.trial_ends_at) {
                    const trialEnd = new Date(subscription.trial_ends_at);
                    daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    isExpiringSoon = daysRemaining <= 3;
                  } else if (subscription.status === 'active' && subscription.expires_at) {
                    const expirationDate = new Date(subscription.expires_at);
                    daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    isExpiringSoon = daysRemaining <= 7;
                  }

                  subscriptionFeedback.showStatus({
                    status: subscription.status as 'active' | 'trial' | 'expired' | 'inactive',
                    toolName: tool.name,
                    daysRemaining,
                    isExpiringSoon,
                    hasAccess: accessStatus.hasAccess
                  });
                }
              }}
            >
              {validationState.isValidating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span className="truncate">Verifying...</span>
                </>
              ) : (
                <>
                  <span className="truncate">Open Tool</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:scale-110 flex-shrink-0" />
                </>
              )}
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            className="w-full cursor-not-allowed bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-500 font-semibold text-sm sm:text-base py-2 sm:py-3" 
            disabled
            size="sm"
          >
            <Lock className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Access Required</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ToolCard; 