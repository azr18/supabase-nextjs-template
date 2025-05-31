'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Tool = Database['public']['Tables']['tools']['Row'];
type UserToolSubscription = Database['public']['Tables']['user_tool_subscriptions']['Row'];

interface ToolWithSubscription extends Tool {
  subscription?: UserToolSubscription | null;
}

interface ToolCardProps {
  tool: ToolWithSubscription;
  className?: string;
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const subscription = tool.subscription;
  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  const hasAccess = isActive || isTrial;

  const getStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="outline">No Access</Badge>;
    }

    switch (subscription.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'trial':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100">Inactive</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const getTrialInfo = () => {
    if (!isTrial || !subscription?.trial_ends_at) return null;
    
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 0) {
      return <span className="text-xs text-blue-600">{daysLeft} days left</span>;
    }
    return <span className="text-xs text-red-600">Trial expired</span>;
  };

  const getExpirationInfo = () => {
    if (!isActive || !subscription?.expires_at) return null;
    
    const expirationDate = new Date(subscription.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft > 0) {
      return <span className="text-xs text-orange-600">Expires in {daysLeft} days</span>;
    }
    return null;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${hasAccess ? 'hover:scale-[1.02]' : 'opacity-75'} ${className}`}>
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
          {!hasAccess && <Lock className="h-4 w-4 text-gray-400" />}
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
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {hasAccess ? (
          <Link href={`/app/${tool.slug}`} className="w-full">
            <Button 
              className="w-full group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="sm"
            >
              Open Tool
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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