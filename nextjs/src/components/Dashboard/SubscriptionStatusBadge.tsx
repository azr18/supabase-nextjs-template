import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle, Zap, Lock } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type UserToolSubscription = Database['public']['Tables']['user_tool_subscriptions']['Row'];

interface SubscriptionStatusBadgeProps {
  subscription?: UserToolSubscription | null;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  className?: string;
}

export function SubscriptionStatusBadge({ 
  subscription, 
  variant = 'default',
  showIcon = true,
  className 
}: SubscriptionStatusBadgeProps) {
  
  const getStatusInfo = () => {
    if (!subscription) {
      return {
        status: 'No Access',
        icon: Lock,
        badgeVariant: 'outline' as const,
        className: 'text-gray-600 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200',
        color: 'gray'
      };
    }

    switch (subscription.status) {
      case 'active':
        return {
          status: variant === 'compact' ? 'Active' : 'Active Subscription',
          icon: CheckCircle,
          badgeVariant: 'default' as const,
          className: 'bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-blue-700 text-white border-0 shadow-md',
          color: 'blue'
        };
      
      case 'trial':
        return {
          status: variant === 'compact' ? 'Trial' : 'Trial Period',
          icon: Zap,
          badgeVariant: 'secondary' as const,
          className: 'bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500 hover:from-blue-600 hover:via-blue-700 hover:to-violet-600 text-white border-0 shadow-md',
          color: 'blue'
        };
      
      case 'expired':
        return {
          status: variant === 'compact' ? 'Expired' : 'Subscription Expired',
          icon: XCircle,
          badgeVariant: 'destructive' as const,
          className: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md',
          color: 'red'
        };
      
      case 'inactive':
        return {
          status: variant === 'compact' ? 'Inactive' : 'Inactive Subscription',
          icon: AlertTriangle,
          badgeVariant: 'outline' as const,
          className: 'text-orange-600 border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
          color: 'orange'
        };
      
      default:
        return {
          status: subscription.status || 'Unknown',
          icon: AlertTriangle,
          badgeVariant: 'outline' as const,
          className: 'text-gray-600 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200',
          color: 'gray'
        };
    }
  };

  const getTimeInfo = () => {
    if (!subscription) return null;

    const now = new Date();
    
    // Trial ending soon
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 7 && daysLeft > 0) {
        return `${daysLeft}d left`;
      } else if (daysLeft <= 0) {
        return 'Expired';
      }
    }
    
    // Active subscription expiring soon
    if (subscription.status === 'active' && subscription.expires_at) {
      const expirationDate = new Date(subscription.expires_at);
      const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 7 && daysLeft > 0) {
        return `${daysLeft}d left`;
      } else if (daysLeft <= 0) {
        return 'Expired';
      }
    }
    
    return null;
  };

  const statusInfo = getStatusInfo();
  const timeInfo = getTimeInfo();
  const IconComponent = statusInfo.icon;

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {showIcon && <IconComponent className="h-3 w-3" />}
        <Badge variant={statusInfo.badgeVariant} className={`text-xs ${statusInfo.className} transition-all duration-300 hover:scale-105`}>
          {statusInfo.status}
          {timeInfo && ` (${timeInfo})`}
        </Badge>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <IconComponent className="h-4 w-4" />}
        <div className="flex flex-col">
          <Badge variant={statusInfo.badgeVariant} className={`${statusInfo.className} transition-all duration-300 hover:scale-105`}>
            {statusInfo.status}
          </Badge>
          {timeInfo && (
            <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeInfo}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {showIcon && <IconComponent className="h-3 w-3" />}
      <Badge variant={statusInfo.badgeVariant} className={`${statusInfo.className} transition-all duration-300 hover:scale-105`}>
        {statusInfo.status}
        {timeInfo && ` (${timeInfo})`}
      </Badge>
    </div>
  );
}

export default SubscriptionStatusBadge; 