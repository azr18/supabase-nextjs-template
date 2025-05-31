import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp,
  Zap,
  Shield
} from 'lucide-react';
import { ToolWithSubscription } from '@/lib/supabase/queries/tools';
import { Database } from '@/lib/supabase/types';

type UserToolSubscription = Database['public']['Tables']['user_tool_subscriptions']['Row'];

interface SubscriptionStatusSummaryProps {
  tools: ToolWithSubscription[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

interface SubscriptionSummary {
  total: number;
  active: number;
  trial: number;
  expired: number;
  inactive: number;
  noAccess: number;
  expiringSoon: number;
}

export function SubscriptionStatusSummary({ 
  tools, 
  isLoading = false, 
  onRefresh,
  className 
}: SubscriptionStatusSummaryProps) {
  const [summary, setSummary] = useState<SubscriptionSummary>({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    inactive: 0,
    noAccess: 0,
    expiringSoon: 0
  });

  // Calculate subscription summary
  useEffect(() => {
    const newSummary: SubscriptionSummary = {
      total: tools.length,
      active: 0,
      trial: 0,
      expired: 0,
      inactive: 0,
      noAccess: 0,
      expiringSoon: 0
    };

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    tools.forEach(tool => {
      const subscription = tool.subscription;
      
      if (!subscription) {
        newSummary.noAccess++;
        return;
      }

      // Check if subscription has expired based on dates, regardless of status field
      let isExpiredByDate = false;
      let isExpiringSoon = false;
      
      if (subscription.status === 'active' && subscription.expires_at) {
        const expirationDate = new Date(subscription.expires_at);
        isExpiredByDate = expirationDate <= now;
        isExpiringSoon = !isExpiredByDate && expirationDate <= sevenDaysFromNow;
      } else if (subscription.status === 'trial' && subscription.trial_ends_at) {
        const trialEnd = new Date(subscription.trial_ends_at);
        isExpiredByDate = trialEnd <= now;
        isExpiringSoon = !isExpiredByDate && trialEnd <= sevenDaysFromNow;
      }

      // Override status classification if expired by date
      if (isExpiredByDate) {
        newSummary.expired++;
      } else {
        switch (subscription.status) {
          case 'active':
            newSummary.active++;
            break;
          case 'trial':
            newSummary.trial++;
            break;
          case 'expired':
            newSummary.expired++;
            break;
          case 'inactive':
            newSummary.inactive++;
            break;
          default:
            newSummary.noAccess++;
        }
      }

      // Count expiring soon (only for non-expired subscriptions)
      if (isExpiringSoon) {
        newSummary.expiringSoon++;
      }
    });

    setSummary(newSummary);
  }, [tools]);

  const getOverallStatus = () => {
    if (summary.total === 0) return { status: 'none', message: 'No tools available', color: 'gray' };
    if (summary.active === summary.total) return { status: 'excellent', message: 'All tools active', color: 'green' };
    if (summary.active + summary.trial === summary.total) return { status: 'good', message: 'All tools accessible', color: 'green' };
    if (summary.active > 0 || summary.trial > 0) return { status: 'partial', message: 'Some tools accessible', color: 'yellow' };
    return { status: 'poor', message: 'No active subscriptions', color: 'red' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-violet-600" />;
      case 'poor':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const overallStatus = getOverallStatus();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Subscription Status
          </CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
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
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(overallStatus.status)}
              Subscription Status
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{overallStatus.message}</span>
              {summary.expiringSoon > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {summary.expiringSoon} expiring soon
                </Badge>
              )}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {summary.total === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No tools configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Active Subscriptions */}
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 bg-clip-text text-transparent">{summary.active}</div>
              <div className="text-xs text-blue-700 font-medium">Active</div>
            </div>

            {/* Trial Subscriptions */}
            <div className="text-center p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200 hover:from-violet-100 hover:to-violet-200 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-5 w-5 text-violet-600" />
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500 bg-clip-text text-transparent">{summary.trial}</div>
              <div className="text-xs text-violet-700 font-medium">Trial</div>
            </div>

            {/* Expired/Inactive */}
            <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-1">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{summary.expired + summary.inactive}</div>
              <div className="text-xs text-red-700 font-medium">Expired/Inactive</div>
            </div>

            {/* No Access */}
            <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-1">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-600">{summary.noAccess}</div>
              <div className="text-xs text-gray-700 font-medium">No Access</div>
            </div>
          </div>
        )}

        {/* Detailed breakdown for larger screens */}
        {summary.total > 0 && (
          <div className="mt-4 hidden md:block">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Tools: {summary.total}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"></div>
                  Accessible: {summary.active + summary.trial}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                  Unavailable: {summary.expired + summary.inactive + summary.noAccess}
                </span>
              </div>
            </div>
            
            {summary.expiringSoon > 0 && (
              <div className="mt-2 p-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {summary.expiringSoon} subscription{summary.expiringSoon > 1 ? 's' : ''} expiring within 7 days
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionStatusSummary; 