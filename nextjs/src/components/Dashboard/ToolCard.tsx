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

  // Get current subscription (use validated result if available, otherwise fallback to prop)
  const currentSubscription = validationState.result?.subscription || tool.subscription;
  const hasValidatedAccess = validationState.result?.hasAccess ?? null;
  
  // Enhanced access logic with validation result
  const getAccessStatus = () => {
    // If validation is in progress or failed, use original data
    if (validationState.error || !validationState.result) {
      const subscription = tool.subscription;
      const isActive = subscription?.status === 'active';
      const isTrial = subscription?.status === 'trial';
      return {
        hasAccess: isActive || isTrial,
        isActive,
        isTrial,
        subscription,
        source: 'fallback' as const
      };
    }

    // Use validated data
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
          <Badge variant="outline">No Access</Badge>
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

    let badge;
    switch (subscription.status) {
      case 'active':
        badge = <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
        break;
      case 'trial':
        badge = <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">Trial</Badge>;
        break;
      case 'expired':
        badge = <Badge variant="destructive">Expired</Badge>;
        break;
      case 'inactive':
        badge = <Badge variant="outline" className="bg-gray-100">Inactive</Badge>;
        break;
      default:
        badge = <Badge variant="outline">{subscription.status}</Badge>;
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
          <span className="text-xs text-blue-600">{daysLeft} days left</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-3 w-3 text-red-600" />
        <span className="text-xs text-red-600">Trial expired</span>
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
          <span className="text-xs text-orange-600">Expires in {daysLeft} days</span>
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
        <div className="text-xs text-gray-500 mt-1">
          {validationState.result.reason}
        </div>
      );
    }

    // Fallback reasons
    const { subscription } = accessStatus;
    if (!subscription) {
      return <div className="text-xs text-gray-500 mt-1">No subscription found</div>;
    }
    
    if (subscription.status === 'expired') {
      return <div className="text-xs text-gray-500 mt-1">Subscription has expired</div>;
    }
    
    if (subscription.status === 'inactive') {
      return <div className="text-xs text-gray-500 mt-1">Subscription is inactive</div>;
    }

    return <div className="text-xs text-gray-500 mt-1">Access not available</div>;
  };

  const handleRefreshStatus = async () => {
    await validateSubscription(true, true);
  };

  const handleToolAccess = () => {
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
        status: subscription.status as any,
        toolName: tool.name,
        daysRemaining,
        isExpiringSoon,
        hasAccess: accessStatus.hasAccess
      });
    }

    // Navigate to tool
    window.location.href = `/app/${tool.slug}`;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${accessStatus.hasAccess ? 'hover:scale-[1.02]' : 'opacity-75'} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {tool.icon && (
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              {getStatusBadge()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!accessStatus.hasAccess && <Lock className="h-4 w-4 text-gray-400" />}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshStatus}
                disabled={validationState.isValidating}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${validationState.isValidating ? 'animate-spin' : ''}`} />
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Refresh subscription status
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3">
        <CardDescription className="text-sm leading-relaxed">
          {tool.description || 'No description available'}
        </CardDescription>
        
        {/* Trial/Expiration Info */}
        <div className="mt-2 space-y-1">
          {getTrialInfo()}
          {getExpirationInfo()}
          {getAccessDeniedReason()}
        </div>

        {/* Validation Status Info */}
        {validationState.lastValidated && (
          <div className="text-xs text-gray-400 mt-2">
            Last verified: {validationState.lastValidated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {accessStatus.hasAccess ? (
          <Link href={`/app/${tool.slug}`} className="w-full">
            <Button 
              className="w-full group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="sm"
              disabled={validationState.isValidating}
            >
              {validationState.isValidating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Open Tool
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            className="w-full cursor-not-allowed" 
            disabled
            size="sm"
          >
            <Lock className="mr-2 h-4 w-4" />
            Access Required
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ToolCard; 