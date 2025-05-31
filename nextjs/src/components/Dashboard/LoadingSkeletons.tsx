'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, Clock, CalendarDays, Settings } from 'lucide-react';

// Welcome section skeleton
export function WelcomeSkeleton() {
  return (
    <Card className="bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-200/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
            <Skeleton className="h-6 w-6 bg-blue-100/70" />
          </div>
          <Skeleton className="h-6 w-40 bg-gradient-to-r from-blue-200/60 via-blue-300/40 to-blue-200/60" />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <Skeleton className="h-4 w-24 bg-gradient-to-r from-blue-100/60 via-blue-200/40 to-blue-100/60" />
        </div>
      </CardHeader>
    </Card>
  );
}

// Tool card skeleton matching the ToolCard component layout
export function ToolCardSkeleton() {
  return (
    <Card className="transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-white via-blue-50/20 to-white border-blue-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Skeleton className="h-6 w-6 bg-blue-100/70" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 bg-gradient-to-r from-blue-200/60 via-blue-300/40 to-blue-200/60" />
              <div className="px-2 py-1 bg-gradient-to-r from-blue-100/50 to-violet-100/50 rounded-full">
                <Skeleton className="h-4 w-16 bg-gradient-to-r from-blue-300/50 via-violet-300/30 to-blue-300/50" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-gradient-to-r from-blue-100/60 via-blue-200/40 to-blue-100/60" />
          <Skeleton className="h-3 w-3/4 bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50" />
        </div>
        
        <div className="mt-3 space-y-1">
          <Skeleton className="h-3 w-20 bg-gradient-to-r from-violet-100/60 via-violet-200/40 to-violet-100/60" />
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full p-2 bg-gradient-to-r from-gray-100/50 via-blue-100/30 to-gray-100/50 rounded-lg">
          <Skeleton className="h-8 w-full bg-gradient-to-r from-gray-800/20 via-blue-500/20 to-blue-600/20" />
        </div>
      </CardFooter>
    </Card>
  );
}

// Tools section skeleton
export function ToolsSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ToolCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

// Recent jobs skeleton matching the RecentJobs component
export function RecentJobsSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-violet-500 via-violet-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <div className="p-1 bg-white/20 rounded-md">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-white">
            Recent Jobs
          </span>
        </CardTitle>
        <CardDescription className="text-violet-100 text-sm sm:text-base">
          Your latest tool processing jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-blue-200/50 rounded-lg bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md flex-shrink-0">
                  <Skeleton className="h-4 w-4 bg-blue-100/70" />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-32 sm:w-40 bg-gradient-to-r from-blue-200/60 via-blue-300/40 to-blue-200/60" />
                  <Skeleton className="h-3 w-24 sm:w-32 bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="px-2 py-1 bg-gradient-to-r from-blue-100/50 to-violet-100/50 rounded-full">
                  <Skeleton className="h-6 w-16 sm:w-20 bg-gradient-to-r from-blue-300/50 via-violet-300/30 to-blue-300/50" />
                </div>
                <div className="p-1 bg-gradient-to-r from-gray-100/50 via-blue-100/30 to-gray-100/50 rounded-md">
                  <Skeleton className="h-8 w-16 sm:w-20 bg-gradient-to-r from-gray-800/20 via-blue-500/20 to-blue-600/20" />
                </div>
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
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
          <div className="p-1 bg-white/20 rounded-md">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-white">
            Account Settings
          </span>
        </CardTitle>
        <CardDescription className="text-purple-100 text-sm sm:text-base">
          Manage your account preferences and security
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-4 border border-blue-200/50 rounded-lg bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30 hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md flex-shrink-0">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <Skeleton className="h-4 w-20 sm:w-24 bg-gradient-to-r from-blue-200/60 via-blue-300/40 to-blue-200/60" />
                <Skeleton className="h-3 w-32 sm:w-40 bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Account Summary Skeleton */}
        <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-24 sm:w-32 bg-gradient-to-r from-blue-200/60 via-blue-300/40 to-blue-200/60 mb-2" />
              <Skeleton className="h-3 w-40 sm:w-48 bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50" />
            </div>
            <div className="flex flex-col sm:text-right gap-2">
              <Skeleton className="h-6 w-16 sm:w-20 bg-gradient-to-r from-blue-300/50 via-violet-300/30 to-blue-300/50 rounded-full" />
              <Skeleton className="h-3 w-24 sm:w-32 bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50" />
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] sm:bg-[size:30px_30px] md:bg-[size:40px_40px] lg:bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      
      <div className="relative space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <WelcomeSkeleton />
        <ToolsSectionSkeleton />
        <RecentJobsSkeleton />
        <AccountSettingsSkeleton />
      </div>
    </div>
  );
} 