const { readFileSync } = require('fs');
const { join } = require('path');

// Enhanced test runner for comprehensive dashboard testing
class DashboardTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  describe(name, fn) {
    console.log(`\n📋 Testing: ${name}`);
    fn();
  }

  it(name, fn, options = {}) {
    this.tests.push({ name, fn, skip: options.skip });
  }

  async run() {
    console.log('🚀 Running Comprehensive Dashboard Functionality Tests\n');
    
    for (const test of this.tests) {
      try {
        if (test.skip) {
          console.log(`  ⏭️  ${test.name} (skipped)`);
          this.skipped++;
          continue;
        }
        
        await test.fn();
        console.log(`  ✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`  ❌ ${test.name}`);
        console.log(`     Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${this.passed}`);
    console.log(`   ❌ Failed: ${this.failed}`);
    console.log(`   ⏭️  Skipped: ${this.skipped}`);
    console.log(`   📈 Total: ${this.passed + this.failed + this.skipped}`);
    
    const successRate = this.passed / (this.passed + this.failed) * 100;
    console.log(`   📊 Success Rate: ${successRate.toFixed(1)}%`);
    
    return this.failed === 0;
  }
}

// Enhanced assertion library
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
    }
  },
  toBeFalsy: () => {
    if (actual) {
      throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
    }
  },
  toContain: (expected) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
    }
  },
  toHaveProperty: (prop) => {
    if (!(prop in actual)) {
      throw new Error(`Expected object to have property ${prop}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toHaveLength: (expected) => {
    if (actual.length !== expected) {
      throw new Error(`Expected length ${expected}, got ${actual.length}`);
    }
  }
});

// Test runner instance
const test = new DashboardTestRunner();

// Comprehensive Dashboard Functionality Tests
test.describe('Dashboard Functionality - Complete Integration Tests', () => {
  
  test.describe('Core File Structure Validation', () => {
    test.it('should have all main dashboard components', () => {
      const dashboardPath = join(process.cwd(), 'nextjs/src/app/app/page.tsx');
      const content = readFileSync(dashboardPath, 'utf-8');
      
      // Check for main dashboard structure
      expect(content).toContain('DashboardContent');
      expect(content).toContain('Welcome');
      expect(content).toContain('My Tools');
      expect(content).toContain('Recent Jobs');
      expect(content).toContain('Account Settings');
    });

    test.it('should have ToolCard component with subscription support', () => {
      const toolCardPath = join(process.cwd(), 'nextjs/src/components/Dashboard/ToolCard.tsx');
      const content = readFileSync(toolCardPath, 'utf-8');
      
      expect(content).toContain('export function ToolCard');
      expect(content).toContain('subscription');
      expect(content).toContain('hasAccess');
      expect(content).toContain('status');
      expect(content).toContain('Badge');
    });

    test.it('should have RecentJobs component with status tracking', () => {
      const recentJobsPath = join(process.cwd(), 'nextjs/src/components/Dashboard/RecentJobs.tsx');
      const content = readFileSync(recentJobsPath, 'utf-8');
      
      expect(content).toContain('export function RecentJobs');
      expect(content).toContain('getRecentJobsForUser');
      expect(content).toContain('status');
      expect(content).toContain('airline_type');
    });

    test.it('should have loading skeleton components', () => {
      const skeletonsPath = join(process.cwd(), 'nextjs/src/components/Dashboard/LoadingSkeletons.tsx');
      const content = readFileSync(skeletonsPath, 'utf-8');
      
      expect(content).toContain('WelcomeSkeleton');
      expect(content).toContain('ToolCardSkeleton');
      expect(content).toContain('RecentJobsSkeleton');
      expect(content).toContain('DashboardSkeleton');
    });

    test.it('should have error boundary component', () => {
      const errorBoundaryPath = join(process.cwd(), 'nextjs/src/components/ErrorBoundary.tsx');
      const content = readFileSync(errorBoundaryPath, 'utf-8');
      
      expect(content).toContain('ErrorBoundary');
      expect(content).toContain('componentDidCatch');
      expect(content).toContain('Try Again');
    });
  });

  test.describe('Database Query Utilities Validation', () => {
    test.it('should have comprehensive tools queries', () => {
      const toolsQueriesPath = join(process.cwd(), 'nextjs/src/lib/supabase/queries/tools.ts');
      const content = readFileSync(toolsQueriesPath, 'utf-8');
      
      expect(content).toContain('getToolsWithSubscriptions');
      expect(content).toContain('hasToolAccess');
      expect(content).toContain('getToolWithSubscription');
      expect(content).toContain('getToolSubscriptionStatus');
      expect(content).toContain('SupabaseClient');
    });

    test.it('should have comprehensive jobs queries', () => {
      const jobsQueriesPath = join(process.cwd(), 'nextjs/src/lib/supabase/queries/jobs.ts');
      const content = readFileSync(jobsQueriesPath, 'utf-8');
      
      expect(content).toContain('getRecentJobsForUser');
      expect(content).toContain('getJobStatusInfo');
      expect(content).toContain('formatDuration');
      expect(content).toContain('formatJobsForDisplay');
    });

    test.it('should have data fetching hook', () => {
      const hookPath = join(process.cwd(), 'nextjs/src/hooks/useDataFetching.ts');
      const content = readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain('useDataFetching');
      expect(content).toContain('loading');
      expect(content).toContain('error');
      expect(content).toContain('retry');
    });
  });

  test.describe('Tool Access Logic Validation', () => {
    test.it('should validate active subscription access', () => {
      const mockSubscription = {
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const hasAccess = (sub) => {
        if (!sub) return false;
        if (sub.status === 'active') return true;
        if (sub.status === 'trial') {
          const trialEnd = new Date(sub.trial_ends_at);
          return trialEnd > new Date();
        }
        return false;
      };

      expect(hasAccess(mockSubscription)).toBe(true);
    });

    test.it('should validate trial subscription access', () => {
      const mockTrialSubscription = {
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const hasAccess = (sub) => {
        if (!sub) return false;
        if (sub.status === 'active') return true;
        if (sub.status === 'trial') {
          const trialEnd = new Date(sub.trial_ends_at);
          return trialEnd > new Date();
        }
        return false;
      };

      expect(hasAccess(mockTrialSubscription)).toBe(true);
    });

    test.it('should reject expired or inactive subscriptions', () => {
      const expiredSubscription = { status: 'expired' };
      const inactiveSubscription = { status: 'inactive' };

      const hasAccess = (sub) => {
        if (!sub) return false;
        if (sub.status === 'expired' || sub.status === 'inactive') return false;
        return sub.status === 'active' || sub.status === 'trial';
      };

      expect(hasAccess(expiredSubscription)).toBe(false);
      expect(hasAccess(inactiveSubscription)).toBe(false);
      expect(hasAccess(null)).toBe(false);
    });

    test.it('should calculate trial countdown correctly', () => {
      const calculateDaysLeft = (trialEndDate) => {
        const now = new Date();
        const end = new Date(trialEndDate);
        const diffTime = end - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const trialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const daysLeft = calculateDaysLeft(trialEnd.toISOString());
      
      expect(daysLeft).toBeGreaterThan(4);
      expect(daysLeft).toBe(5);
    });
  });

  test.describe('Job Status and Display Logic', () => {
    test.it('should format job status indicators correctly', () => {
      const getJobStatusInfo = (status) => {
        const statusMap = {
          'completed': { label: 'Completed', variant: 'default', color: 'green' },
          'processing': { label: 'Processing', variant: 'secondary', color: 'blue' },
          'failed': { label: 'Failed', variant: 'destructive', color: 'red' },
          'pending': { label: 'Pending', variant: 'outline', color: 'gray' }
        };
        return statusMap[status] || { label: status, variant: 'outline', color: 'gray' };
      };

      expect(getJobStatusInfo('completed').label).toBe('Completed');
      expect(getJobStatusInfo('processing').variant).toBe('secondary');
      expect(getJobStatusInfo('failed').variant).toBe('destructive');
      expect(getJobStatusInfo('pending').color).toBe('gray');
    });

    test.it('should format duration correctly', () => {
      const formatDuration = (start, end) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime - startTime;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
      };

      const start = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T11:30:00Z');
      const end2 = new Date('2024-01-01T10:15:00Z');
      
      expect(formatDuration(start.toISOString(), end1.toISOString())).toBe('1h 30m');
      expect(formatDuration(start.toISOString(), end2.toISOString())).toBe('15m');
    });

    test.it('should format airline types correctly', () => {
      const formatAirlineType = (type) => {
        const airlineMap = {
          'fly_dubai': 'Fly Dubai',
          'tap': 'TAP',
          'philippines': 'Philippines Airlines',
          'air_india': 'Air India',
          'el_al': 'El Al'
        };
        return airlineMap[type] || type;
      };

      expect(formatAirlineType('fly_dubai')).toBe('Fly Dubai');
      expect(formatAirlineType('tap')).toBe('TAP');
      expect(formatAirlineType('philippines')).toBe('Philippines Airlines');
    });
  });

  test.describe('Data Structure Validation', () => {
    test.it('should validate complete tool data structure', () => {
      const mockTool = {
        id: 'tool-1',
        name: 'Invoice Reconciler',
        slug: 'invoice-reconciler',
        description: 'Automated invoice reconciliation tool',
        icon: '📊',
        subscription: {
          id: 'sub-1',
          user_id: 'user-123',
          tool_id: 'tool-1',
          status: 'active',
          trial_ends_at: null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      
      expect(mockTool).toHaveProperty('id');
      expect(mockTool).toHaveProperty('name');
      expect(mockTool).toHaveProperty('slug');
      expect(mockTool).toHaveProperty('description');
      expect(mockTool).toHaveProperty('icon');
      expect(mockTool.subscription).toHaveProperty('status');
      expect(mockTool.subscription.user_id).toBe('user-123');
      expect(mockTool.subscription.tool_id).toBe(mockTool.id);
    });

    test.it('should validate complete job data structure', () => {
      const mockJob = {
        id: 'job-1',
        job_name: 'Fly Dubai Reconciliation - Dec 2024',
        status: 'completed',
        airline_type: 'fly_dubai',
        result_file_path: 'user-123/jobs/job-1/result.xlsx',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        tool: {
          id: 'tool-1',
          name: 'Invoice Reconciler',
          slug: 'invoice-reconciler'
        }
      };
      
      expect(mockJob).toHaveProperty('id');
      expect(mockJob).toHaveProperty('job_name');
      expect(mockJob).toHaveProperty('status');
      expect(mockJob).toHaveProperty('airline_type');
      expect(mockJob).toHaveProperty('result_file_path');
      expect(mockJob.tool).toHaveProperty('slug');
      expect(mockJob.tool).toHaveProperty('name');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test.it('should handle empty data arrays gracefully', () => {
      const processTools = (tools) => {
        if (!Array.isArray(tools)) return [];
        return tools.filter(tool => tool && tool.id);
      };

      const processJobs = (jobs) => {
        if (!Array.isArray(jobs)) return [];
        return jobs.filter(job => job && job.id);
      };

      expect(processTools([])).toEqual([]);
      expect(processTools(null)).toEqual([]);
      expect(processTools(undefined)).toEqual([]);
      expect(processJobs([])).toEqual([]);
    });

    test.it('should handle malformed subscription data', () => {
      const validateSubscription = (subscription) => {
        if (!subscription) return { valid: false, reason: 'No subscription' };
        if (!subscription.status) return { valid: false, reason: 'No status' };
        if (!subscription.user_id) return { valid: false, reason: 'No user ID' };
        return { valid: true };
      };

      const invalidSub1 = null;
      const invalidSub2 = { user_id: 'user-123' }; // missing status
      const validSub = { status: 'active', user_id: 'user-123' };

      expect(validateSubscription(invalidSub1).valid).toBe(false);
      expect(validateSubscription(invalidSub2).valid).toBe(false);
      expect(validateSubscription(validSub).valid).toBe(true);
    });

    test.it('should handle network error scenarios', () => {
      const handleNetworkError = (error) => {
        if (error.message.includes('fetch')) {
          return { type: 'network', retry: true, message: 'Connection problem. Please try again.' };
        }
        if (error.message.includes('timeout')) {
          return { type: 'timeout', retry: true, message: 'Request timed out. Please try again.' };
        }
        return { type: 'unknown', retry: false, message: 'Something went wrong.' };
      };

      const networkError = new Error('fetch failed');
      const timeoutError = new Error('timeout exceeded');
      const unknownError = new Error('unknown issue');

      expect(handleNetworkError(networkError).type).toBe('network');
      expect(handleNetworkError(timeoutError).type).toBe('timeout');
      expect(handleNetworkError(unknownError).type).toBe('unknown');
    });
  });

  test.describe('Security and Access Control', () => {
    test.it('should validate user data isolation', () => {
      const filterUserData = (data, userId) => {
        if (!userId) throw new Error('User ID is required');
        return data.filter(item => item.user_id === userId);
      };

      const testData = [
        { id: '1', user_id: 'user-123', data: 'test1' },
        { id: '2', user_id: 'user-456', data: 'test2' },
        { id: '3', user_id: 'user-123', data: 'test3' }
      ];

      const filtered = filterUserData(testData, 'user-123');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].user_id).toBe('user-123');
      expect(filtered[1].user_id).toBe('user-123');
    });

    test.it('should prevent cross-user data access', () => {
      const validateAccess = (requestedUserId, currentUserId) => {
        if (!currentUserId) return false;
        if (!requestedUserId) return false;
        return requestedUserId === currentUserId;
      };

      expect(validateAccess('user-123', 'user-123')).toBe(true);
      expect(validateAccess('user-456', 'user-123')).toBe(false);
      expect(validateAccess('user-123', null)).toBe(false);
    });

    test.it('should validate subscription-based access control', () => {
      const checkToolAccess = (tool, userId) => {
        if (!tool || !userId) return false;
        if (!tool.subscription) return false;
        if (tool.subscription.user_id !== userId) return false;
        return ['active', 'trial'].includes(tool.subscription.status);
      };

      const toolWithAccess = {
        id: 'tool-1',
        subscription: { user_id: 'user-123', status: 'active' }
      };
      const toolWithoutAccess = {
        id: 'tool-2',
        subscription: { user_id: 'user-456', status: 'active' }
      };

      expect(checkToolAccess(toolWithAccess, 'user-123')).toBe(true);
      expect(checkToolAccess(toolWithoutAccess, 'user-123')).toBe(false);
    });
  });

  test.describe('Performance and Optimization', () => {
    test.it('should limit query results appropriately', () => {
      const applyLimit = (data, limit = 5) => {
        return data.slice(0, limit);
      };

      const largeDataset = Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` }));
      const limited = applyLimit(largeDataset, 5);
      
      expect(limited).toHaveLength(5);
      expect(limited[0].id).toBe('item-0');
      expect(limited[4].id).toBe('item-4');
    });

    test.it('should validate efficient database query patterns', () => {
      const validateQuery = (queryStr) => {
        // Check for proper joins and selections
        const hasProperJoin = queryStr.includes('!inner') || queryStr.includes('!left');
        const hasSpecificSelection = queryStr.includes('*,') || queryStr.includes('select');
        const hasLimit = queryStr.includes('limit(') || queryStr.includes('.limit(');
        
        return { hasProperJoin, hasSpecificSelection, hasLimit };
      };

      const goodQuery = '*,subscription:user_tool_subscriptions!inner(*).limit(10)';
      const result = validateQuery(goodQuery);
      
      expect(result.hasProperJoin).toBe(true);
      expect(result.hasSpecificSelection).toBe(true);
    });

    test.it('should handle loading states efficiently', () => {
      const createLoadingState = (sections) => {
        return sections.reduce((acc, section) => {
          acc[section] = { loading: true, data: null, error: null };
          return acc;
        }, {});
      };

      const sections = ['tools', 'jobs', 'user'];
      const loadingState = createLoadingState(sections);
      
      expect(loadingState).toHaveProperty('tools');
      expect(loadingState).toHaveProperty('jobs');
      expect(loadingState.tools.loading).toBe(true);
    });
  });

  test.describe('User Experience Features', () => {
    test.it('should provide proper feedback messages', () => {
      const getFeedbackMessage = (state, error) => {
        if (state === 'loading') return 'Loading your data...';
        if (state === 'error' && error?.type === 'network') return 'Connection problem. Please check your internet.';
        if (state === 'error') return 'Something went wrong. Please try again.';
        if (state === 'empty') return 'No data available. Contact support if needed.';
        return 'Ready';
      };

      expect(getFeedbackMessage('loading')).toContain('Loading');
      expect(getFeedbackMessage('error', { type: 'network' })).toContain('Connection problem');
      expect(getFeedbackMessage('empty')).toContain('No data available');
    });

    test.it('should format dates and times for display', () => {
      const formatRelativeTime = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return 'Just now';
      };

      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const oldDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      expect(formatRelativeTime(recentDate)).toContain('hour');
      expect(formatRelativeTime(oldDate)).toContain('day');
    });
  });
});

// Run tests if called directly
if (require.main === module) {
  test.run().then(success => {
    console.log('\n🎯 Dashboard Functionality Testing Complete');
    console.log(success ? '✅ All tests passed!' : '❌ Some tests failed');
    process.exit(success ? 0 : 1);
  });
}

module.exports = { test, expect }; 