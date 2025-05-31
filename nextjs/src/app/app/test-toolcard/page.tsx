'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ToolCard } from '@/components/Dashboard/ToolCard';
import { ToolWithSubscription } from '@/lib/supabase/queries/tools';

// Mock data for different tool subscription states
const mockTools: ToolWithSubscription[] = [
  {
    id: '1',
    name: 'Invoice Reconciler',
    description: 'Multi-airline invoice reconciliation tool supporting Fly Dubai, TAP, Philippines Airlines, Air India, and El Al. Automates the comparison between invoices and reports.',
    slug: 'invoice-reconciler',
    status: 'active',
    icon: '🧮',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: {
      id: 'sub1',
      user_id: 'user1',
      tool_id: '1',
      status: 'active',
      started_at: new Date().toISOString(),
      trial_ends_at: null,
      expires_at: null,
      external_subscription_id: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    name: 'Lead Generator',
    description: 'AI-powered lead generation tool that automatically discovers, researches, and scores potential customers based on your ideal client profile.',
    slug: 'lead-generator',
    status: 'active',
    icon: '🎯',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: {
      id: 'sub2',
      user_id: 'user1',
      tool_id: '2',
      status: 'active',
      started_at: new Date().toISOString(),
      trial_ends_at: null,
      expires_at: null,
      external_subscription_id: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    name: 'Document Processor',
    description: 'Intelligent document processing system that extracts, categorizes, and analyzes business documents using advanced OCR and AI.',
    slug: 'document-processor',
    status: 'active',
    icon: '📄',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: {
      id: 'sub3',
      user_id: 'user1',
      tool_id: '3',
      status: 'trial',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      expires_at: null,
      external_subscription_id: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '4',
    name: 'Email Automation',
    description: 'Sophisticated email marketing automation with AI-powered personalization, scheduling, and performance analytics.',
    slug: 'email-automation',
    status: 'active',
    icon: '✉️',
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: {
      id: 'sub4',
      user_id: 'user1',
      tool_id: '4',
      status: 'expired',
      started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      trial_ends_at: null,
      expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      external_subscription_id: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '5',
    name: 'Sales Optimizer',
    description: 'Advanced sales analytics and optimization platform that provides insights, forecasting, and personalized recommendations.',
    slug: 'sales-optimizer',
    status: 'coming_soon',
    icon: '📈',
    order_index: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: null // No subscription
  },
  {
    id: '6',
    name: 'Financial Analyzer',
    description: 'Comprehensive financial analysis tool that provides cash flow forecasting, expense optimization, and profitability insights.',
    slug: 'financial-analyzer',
    status: 'active',
    icon: '💰',
    order_index: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription: null // No subscription - should show "No Access"
  }
];

export default function TestToolCardPage() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>ToolCard Component Integration Demo</CardTitle>
          <CardDescription>
            This page demonstrates the ToolCard component integration within the dashboard layout, 
            showing different subscription states and visual designs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <p><strong>Integration Features Demonstrated:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-green-600 font-semibold">Active Subscription:</span> Full access with "Open Tool" button</li>
              <li><span className="text-blue-600 font-semibold">Trial Subscription:</span> Blue badge with days remaining</li>
              <li><span className="text-red-600 font-semibold">Expired Subscription:</span> Red badge, disabled access</li>
              <li><span className="text-gray-600 font-semibold">No Access:</span> Locked tool with "Access Required" button</li>
              <li><span className="text-orange-600 font-semibold">Coming Soon:</span> Tools in development</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Tools - Grid Layout</CardTitle>
          <CardDescription>
            Tool cards displayed in responsive grid layout (matches dashboard implementation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
          <CardDescription>Task 4.7 - ToolCard Integration Completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ ToolCard component imported into dashboard layout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ Grid layout implemented with responsive design</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ Subscription-based access control integrated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ Loading states and error handling implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ Tools query integration with Supabase MCP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>✅ Visual feedback for different subscription states</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 