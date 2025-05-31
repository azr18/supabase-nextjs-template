'use client';

import React from 'react';
import { RecentJobs } from '@/components/Dashboard/RecentJobs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestRecentJobsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            RecentJobs Component Demo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Demonstration of the RecentJobs component with various job states and data
          </p>
        </div>

        {/* Component Features */}
        <Card>
          <CardHeader>
            <CardTitle>Component Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Status Indicators</h3>
                <div className="space-y-1">
                  <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Processing</Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                  <Badge variant="destructive">Failed</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Airline Types</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Fly Dubai</div>
                  <div>• TAP Airlines</div>
                  <div>• Philippines Airlines</div>
                  <div>• Air India</div>
                  <div>• El Al</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Features</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Download buttons for completed jobs</div>
                  <div>• &ldquo;Open Tool&rdquo; navigation links</div>
                  <div>• Duration tracking</div>
                  <div>• Relative time display</div>
                  <div>• Loading and error states</div>
                  <div>• Responsive design</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Component */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Default Limit (5 jobs) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Default View (5 jobs limit)</h2>
            <RecentJobs userId="demo-user" />
          </div>
          
          {/* Custom Limit (3 jobs) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Custom Limit (3 jobs)</h2>
            <RecentJobs userId="demo-user" limit={3} />
          </div>
        </div>

        {/* Component Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Usage</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<RecentJobs userId="user-123" />`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">With Custom Limit</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<RecentJobs userId="user-123" limit={10} />`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">With Custom Styling</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<RecentJobs 
  userId="user-123" 
  limit={5} 
  className="custom-styles" 
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Empty State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🕐</div>
                <p className="text-sm text-gray-600">No recent jobs found</p>
                <p className="text-xs text-gray-500">Start using our tools to see your job history here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loading State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-sm text-gray-600">Failed to load recent jobs</p>
                <button className="mt-2 px-3 py-1 text-xs border rounded hover:bg-gray-50">
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 