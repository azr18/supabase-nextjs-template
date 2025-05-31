'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, Clock, CalendarDays, Settings } from 'lucide-react';

// Welcome section skeleton
export function WelcomeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
    </Card>
  );
}

// Tool card skeleton matching the ToolCard component layout
export function ToolCardSkeleton() {
  return (
    <Card className="transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Skeleton className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        
        <div className="mt-2 space-y-1">
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}

// Tools section skeleton
export function ToolsSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          My Tools
        </CardTitle>
        <CardDescription>
          Access your subscribed business automation tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ToolCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent jobs skeleton matching the RecentJobs component
export function RecentJobsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Account settings skeleton
export function AccountSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account preferences and security</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-blue-50 rounded-full">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <WelcomeSkeleton />
      <ToolsSectionSkeleton />
      <RecentJobsSkeleton />
      <AccountSettingsSkeleton />
    </div>
  );
} 