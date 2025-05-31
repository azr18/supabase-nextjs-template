'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  WelcomeSkeleton,
  ToolCardSkeleton,
  ToolsSectionSkeleton,
  RecentJobsSkeleton,
  AccountSettingsSkeleton,
  DashboardSkeleton
} from '@/components/Dashboard/LoadingSkeletons';

export default function TestSkeletonsPage() {
  const [activeDemo, setActiveDemo] = useState<string>('all');

  const demos = [
    { id: 'all', name: 'Full Dashboard', component: <DashboardSkeleton /> },
    { id: 'welcome', name: 'Welcome Section', component: <WelcomeSkeleton /> },
    { id: 'tools', name: 'Tools Section', component: <ToolsSectionSkeleton /> },
    { id: 'toolcard', name: 'Tool Card', component: <ToolCardSkeleton /> },
    { id: 'jobs', name: 'Recent Jobs', component: <RecentJobsSkeleton /> },
    { id: 'settings', name: 'Account Settings', component: <AccountSettingsSkeleton /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 via-blue-700 to-violet-600 bg-clip-text text-transparent">
              Loading Skeleton Components Demo
            </CardTitle>
            <p className="text-blue-600/70">
              Demonstrating the updated loading skeleton components with blue gradient theme
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {demos.map((demo) => (
                <Button
                  key={demo.id}
                  variant={activeDemo === demo.id ? 'default' : 'outline'}
                  onClick={() => setActiveDemo(demo.id)}
                  className="transition-all duration-300"
                >
                  {demo.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {activeDemo === 'all' ? (
            <DashboardSkeleton />
          ) : (
            <div className="max-w-4xl mx-auto">
              {demos.find(demo => demo.id === activeDemo)?.component}
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Blue Gradient Theme Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Visual Enhancements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Blue gradient backgrounds on cards</li>
                  <li>• Gradient skeleton elements</li>
                  <li>• Enhanced hover effects (scale, shadow)</li>
                  <li>• Consistent blue color scheme</li>
                  <li>• Smooth transitions (300ms duration)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Theme Consistency</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Primary gradient: gray-800 → blue-500 → blue-600</li>
                  <li>• Secondary gradient: blue-600 → violet-500 → violet-700</li>
                  <li>• Icon containers with blue gradients</li>
                  <li>• Blue border accents (blue-200/50)</li>
                  <li>• Gradient text for headings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 