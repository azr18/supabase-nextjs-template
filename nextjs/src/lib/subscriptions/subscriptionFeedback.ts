import { CheckCircle, AlertTriangle, XCircle, Clock, Zap, Lock, Info } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { Database } from '@/lib/supabase/types';

type UserToolSubscription = Database['public']['Tables']['user_tool_subscriptions']['Row'];

export interface SubscriptionStatus {
  status: 'active' | 'trial' | 'expired' | 'inactive' | null;
  toolName: string;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  hasAccess: boolean;
}

export interface SubscriptionFeedbackOptions {
  showToast?: boolean;
  showInline?: boolean;
  autoHide?: boolean;
  duration?: number;
  includeActions?: boolean;
}

/**
 * Comprehensive subscription feedback system
 * Provides toast notifications, status messages, and user guidance
 */
export class SubscriptionFeedbackManager {
  private static readonly DEFAULT_DURATION = 5000;
  private static readonly EXPIRING_SOON_THRESHOLD = 7; // days
  private static readonly TRIAL_ENDING_THRESHOLD = 3; // days

  /**
   * Show subscription status feedback to user
   */
  static showSubscriptionStatus(
    status: SubscriptionStatus,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      autoHide = true,
      duration = this.DEFAULT_DURATION
    } = options;

    if (!showToast) return;

    const feedback = this.getStatusFeedback(status);
    
    toast({
      title: feedback.title,
      description: feedback.description,
      variant: feedback.variant,
      duration: autoHide ? duration : undefined,
    });
  }

  /**
   * Show subscription change notification
   */
  static showSubscriptionChange(
    toolName: string,
    oldStatus: string | null,
    newStatus: string,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      duration = this.DEFAULT_DURATION
    } = options;

    if (!showToast) return;

    const feedback = this.getChangeFeedback(toolName, oldStatus, newStatus);
    
    toast({
      title: feedback.title,
      description: feedback.description,
      variant: feedback.variant,
      duration,
    });
  }

  /**
   * Show subscription validation feedback
   */
  static showValidationFeedback(
    toolName: string,
    isValid: boolean,
    reason?: string,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      duration = this.DEFAULT_DURATION
    } = options;

    if (!showToast) return;

    if (isValid) {
      toast({
        title: "Subscription Verified",
        description: `Your access to ${toolName} has been confirmed.`,
        variant: "success",
        duration,
      });
    } else {
      toast({
        title: "Access Validation Failed",
        description: reason || `Unable to verify access to ${toolName}. Please try again.`,
        variant: "destructive",
        duration,
      });
    }
  }

  /**
   * Show expiration warning
   */
  static showExpirationWarning(
    subscriptions: Array<{
      toolName: string;
      status: string;
      daysRemaining: number;
      isTrialEnding?: boolean;
    }>,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      duration = 8000 // Longer duration for warnings
    } = options;

    if (!showToast || subscriptions.length === 0) return;

    const expiring = subscriptions.filter(s => !s.isTrialEnding);
    const trialsEnding = subscriptions.filter(s => s.isTrialEnding);

    // Show expiring subscriptions warning
    if (expiring.length > 0) {
      const toolNames = expiring.map(s => s.toolName).join(', ');
      const isPlural = expiring.length > 1;
      
      toast({
        title: `Subscription${isPlural ? 's' : ''} Expiring Soon`,
        description: `${toolNames} will expire in ${expiring[0].daysRemaining} day${expiring[0].daysRemaining !== 1 ? 's' : ''}. Renew to maintain access.`,
        variant: "warning",
        duration,
      });
    }

    // Show trial ending warning
    if (trialsEnding.length > 0) {
      const toolNames = trialsEnding.map(s => s.toolName).join(', ');
      const isPlural = trialsEnding.length > 1;
      
      toast({
        title: `Trial${isPlural ? 's' : ''} Ending Soon`,
        description: `Your trial${isPlural ? 's' : ''} for ${toolNames} will end in ${trialsEnding[0].daysRemaining} day${trialsEnding[0].daysRemaining !== 1 ? 's' : ''}. Subscribe to continue using.`,
        variant: "info",
        duration,
      });
    }
  }

  /**
   * Show access denied feedback
   */
  static showAccessDenied(
    toolName: string,
    reason: string,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      duration = 6000
    } = options;

    if (!showToast) return;

    toast({
      title: "Access Denied",
      description: `Cannot access ${toolName}. ${reason}`,
      variant: "destructive",
      duration,
    });
  }

  /**
   * Show successful subscription activation
   */
  static showSubscriptionActivated(
    toolName: string,
    options: SubscriptionFeedbackOptions = {}
  ) {
    const {
      showToast = true,
      duration = this.DEFAULT_DURATION
    } = options;

    if (!showToast) return;

    toast({
      title: "Subscription Activated",
      description: `Welcome! You now have access to ${toolName}.`,
      variant: "success",
      duration,
    });
  }

  /**
   * Get detailed status feedback for display
   */
  private static getStatusFeedback(status: SubscriptionStatus) {
    const { status: subscriptionStatus, toolName, daysRemaining, isExpiringSoon } = status;

    switch (subscriptionStatus) {
      case 'active':
        if (isExpiringSoon && daysRemaining) {
          return {
            title: "Subscription Expiring",
            description: `Your ${toolName} subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider renewing to maintain access.`,
            variant: "warning" as const
          };
        }
        return {
          title: "Active Subscription",
          description: `You have full access to ${toolName}.`,
          variant: "success" as const
        };

      case 'trial':
        if (isExpiringSoon && daysRemaining) {
          return {
            title: "Trial Ending Soon",
            description: `Your ${toolName} trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Subscribe to continue accessing this tool.`,
            variant: "info" as const
          };
        }
        return {
          title: "Trial Active",
          description: `You're currently trying ${toolName}. Enjoy exploring the features!`,
          variant: "info" as const
        };

      case 'expired':
        return {
          title: "Subscription Expired",
          description: `Your ${toolName} subscription has expired. Renew to regain access to this tool.`,
          variant: "destructive" as const
        };

      case 'inactive':
        return {
          title: "Subscription Inactive",
          description: `Your ${toolName} subscription is currently inactive. Contact support if this is unexpected.`,
          variant: "warning" as const
        };

      default:
        return {
          title: "No Access",
          description: `You don't have access to ${toolName}. Subscribe to start using this tool.`,
          variant: "default" as const
        };
    }
  }

  /**
   * Get feedback for subscription status changes
   */
  private static getChangeFeedback(toolName: string, oldStatus: string | null, newStatus: string) {
    // Activation scenarios
    if ((!oldStatus || oldStatus === 'expired' || oldStatus === 'inactive') && newStatus === 'active') {
      return {
        title: "Subscription Activated",
        description: `Great! You now have full access to ${toolName}.`,
        variant: "success" as const
      };
    }

    if ((!oldStatus || oldStatus === 'expired' || oldStatus === 'inactive') && newStatus === 'trial') {
      return {
        title: "Trial Started",
        description: `Your ${toolName} trial has begun. Explore all features!`,
        variant: "info" as const
      };
    }

    // Deactivation scenarios
    if ((oldStatus === 'active' || oldStatus === 'trial') && newStatus === 'expired') {
      return {
        title: "Subscription Expired",
        description: `Your ${toolName} subscription has expired. Renew to continue using this tool.`,
        variant: "destructive" as const
      };
    }

    if ((oldStatus === 'active' || oldStatus === 'trial') && newStatus === 'inactive') {
      return {
        title: "Subscription Deactivated",
        description: `Your ${toolName} subscription is now inactive. Contact support if this is unexpected.`,
        variant: "warning" as const
      };
    }

    // Trial to active
    if (oldStatus === 'trial' && newStatus === 'active') {
      return {
        title: "Subscription Upgraded",
        description: `Welcome! Your ${toolName} trial has been converted to a full subscription.`,
        variant: "success" as const
      };
    }

    // Default change notification
    return {
      title: "Subscription Updated",
      description: `Your ${toolName} subscription status has been updated to ${newStatus}.`,
      variant: "info" as const
    };
  }

  /**
   * Get subscription status summary for dashboard display
   */
  static getStatusSummary(subscriptions: UserToolSubscription[]) {
    const summary = {
      total: subscriptions.length,
      active: 0,
      trial: 0,
      expired: 0,
      inactive: 0,
      expiringSoon: 0,
      needsAttention: [] as Array<{
        toolName: string;
        status: string;
        daysRemaining?: number;
        action: string;
      }>
    };

    const now = new Date();

    subscriptions.forEach(subscription => {
      switch (subscription.status) {
        case 'active':
          summary.active++;
          // Check if expiring soon
          if (subscription.expires_at) {
            const expirationDate = new Date(subscription.expires_at);
            const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= this.EXPIRING_SOON_THRESHOLD && daysLeft > 0) {
              summary.expiringSoon++;
              summary.needsAttention.push({
                toolName: subscription.tool_id, // Would need tool name lookup
                status: 'expiring',
                daysRemaining: daysLeft,
                action: 'renew'
              });
            }
          }
          break;

        case 'trial':
          summary.trial++;
          // Check if trial ending soon
          if (subscription.trial_ends_at) {
            const trialEnd = new Date(subscription.trial_ends_at);
            const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= this.TRIAL_ENDING_THRESHOLD && daysLeft > 0) {
              summary.needsAttention.push({
                toolName: subscription.tool_id, // Would need tool name lookup
                status: 'trial_ending',
                daysRemaining: daysLeft,
                action: 'subscribe'
              });
            }
          }
          break;

        case 'expired':
          summary.expired++;
          summary.needsAttention.push({
            toolName: subscription.tool_id, // Would need tool name lookup
            status: 'expired',
            action: 'renew'
          });
          break;

        case 'inactive':
          summary.inactive++;
          summary.needsAttention.push({
            toolName: subscription.tool_id, // Would need tool name lookup
            status: 'inactive',
            action: 'contact_support'
          });
          break;
      }
    });

    return summary;
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(date: string): { text: string; isUrgent: boolean } {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return { text: 'Expired', isUrgent: true };
    } else if (daysLeft === 1) {
      return { text: '1 day left', isUrgent: true };
    } else if (daysLeft <= 7) {
      return { text: `${daysLeft} days left`, isUrgent: true };
    } else if (daysLeft <= 30) {
      return { text: `${daysLeft} days left`, isUrgent: false };
    } else {
      const months = Math.floor(daysLeft / 30);
      return { text: `${months} month${months > 1 ? 's' : ''} left`, isUrgent: false };
    }
  }
}

/**
 * Convenience functions for common feedback scenarios
 */
export const subscriptionFeedback = {
  /**
   * Quick toast for subscription status
   */
  showStatus: (status: SubscriptionStatus, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showSubscriptionStatus(status, options);
  },

  /**
   * Quick toast for subscription changes
   */
  showChange: (toolName: string, oldStatus: string | null, newStatus: string, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showSubscriptionChange(toolName, oldStatus, newStatus, options);
  },

  /**
   * Quick toast for validation results
   */
  showValidation: (toolName: string, isValid: boolean, reason?: string, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showValidationFeedback(toolName, isValid, reason, options);
  },

  /**
   * Quick toast for access denied
   */
  showAccessDenied: (toolName: string, reason: string, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showAccessDenied(toolName, reason, options);
  },

  /**
   * Quick toast for successful activation
   */
  showActivated: (toolName: string, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showSubscriptionActivated(toolName, options);
  },

  /**
   * Show expiration warnings
   */
  showExpirationWarning: (subscriptions: Array<{
    toolName: string;
    status: string;
    daysRemaining: number;
    isTrialEnding?: boolean;
  }>, options?: SubscriptionFeedbackOptions) => {
    SubscriptionFeedbackManager.showExpirationWarning(subscriptions, options);
  },

  /**
   * Format time remaining
   */
  formatTime: (date: string) => {
    return SubscriptionFeedbackManager.formatTimeRemaining(date);
  },

  /**
   * Get status summary
   */
  getSummary: (subscriptions: UserToolSubscription[]) => {
    return SubscriptionFeedbackManager.getStatusSummary(subscriptions);
  }
};

export default SubscriptionFeedbackManager; 