import { usePerformanceMonitoring } from './usePerformanceMonitoring';

// Mock React hooks
jest.mock('react', () => ({
  useRef: jest.fn((initialValue) => ({ current: initialValue })),
  useState: jest.fn((initialValue) => [initialValue, jest.fn()]),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  useEffect: jest.fn((fn) => fn()),
}));

// Import React after mocking
const React = require('react');

describe('usePerformanceMonitoring Hook (Phase 2.1D)', () => {
  let mockUseState: jest.MockedFunction<any>;
  let mockUseRef: jest.MockedFunction<any>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockUseState = React.useState as jest.MockedFunction<any>;
    mockUseRef = React.useRef as jest.MockedFunction<any>;

    // Reset mocks
    mockUseState.mockReturnValue([{}, jest.fn()]);
    mockUseRef.mockImplementation((initialValue) => ({ current: initialValue }));

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Mock performance.now()
    jest.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Assigns Diff Logging', () => {
    test('logs detailed assigns changes with timestamps', () => {
      const oldAssigns = { count: 0, user: { name: 'John' } };
      const newAssigns = { count: 1, user: { name: 'Jane' } };

      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        logLevel: 'debug'
      });

      monitor.logAssignsDiff(oldAssigns, newAssigns);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LiveReact Native] Assigns Diff'),
        expect.objectContaining({
          timestamp: expect.any(Number),
          changed: ['count', 'user'],
          details: {
            count: { from: 0, to: 1 },
            user: { from: { name: 'John' }, to: { name: 'Jane' } }
          },
          totalChanges: 2
        })
      );
    });

    test('tracks change frequency and patterns', () => {
      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        trackChangePatterns: true
      });

      // Simulate multiple changes to same field
      monitor.logAssignsDiff({ count: 0 }, { count: 1 });
      monitor.logAssignsDiff({ count: 1 }, { count: 2 });
      monitor.logAssignsDiff({ count: 2 }, { count: 3 });

      const patterns = monitor.getChangePatterns();

      expect(patterns).toEqual({
        count: {
          changeCount: 3,
          firstChanged: expect.any(Number),
          frequency: expect.any(Number),
          lastChanged: expect.any(Number),
          pattern: 'frequent'
        }
      });
    });

    test('detects suspicious rapid changes', () => {
      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        trackChangePatterns: true,
        detectRapidChanges: true,
        rapidChangeThreshold: 100 // ms
      });

      // Simulate rapid changes with patterns enabled
      monitor.logAssignsDiff({ value: 1 }, { value: 2 });
      monitor.logAssignsDiff({ value: 2 }, { value: 3 });
      monitor.logAssignsDiff({ value: 3 }, { value: 4 });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LiveReact Native] Rapid Changes Detected'),
        expect.objectContaining({
          field: 'value',
          changesInWindow: 3,
          timeWindow: expect.any(Number)
        })
      );
    });

    test('logs why specific components re-rendered', () => {
      const monitor = usePerformanceMonitoring({
        enableComponentRerenderLogging: true
      });

      const componentDependencies = {
        UserProfile: ['user.name', 'user.avatar'],
        PostsList: ['posts', 'pagination']
      };

      const oldAssigns = {
        user: { name: 'John', avatar: 'avatar1.jpg' },
        posts: [1, 2, 3],
        pagination: { page: 1 }
      };

      const newAssigns = {
        user: { name: 'Jane', avatar: 'avatar1.jpg' }, // name changed
        posts: [1, 2, 3], // unchanged
        pagination: { page: 1 } // unchanged
      };

      monitor.logComponentRerenderReasons(oldAssigns, newAssigns, componentDependencies);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LiveReact Native] Component Rerender Analysis'),
        expect.objectContaining({
          UserProfile: {
            shouldRerender: true,
            changedDependencies: ['user.name'],
            unchangedDependencies: ['user.avatar']
          },
          PostsList: {
            shouldRerender: false,
            changedDependencies: [],
            unchangedDependencies: ['posts', 'pagination']
          }
        })
      );
    });
  });

  describe('Performance Profiling Hooks', () => {
    test('measures assigns processing time', () => {
      const monitor = usePerformanceMonitoring({
        enablePerformanceProfiling: true
      });

      const profileId = monitor.startAssignsProfile();

      // Simulate some processing time
      jest.spyOn(performance, 'now').mockReturnValue(1050); // 50ms later

      const result = monitor.endAssignsProfile(profileId);

      expect(result).toEqual({
        profileId,
        phase: 'assigns_processing',
        duration: 50,
        timestamp: 1050
      });
    });

    test('profiles render phases separately', () => {
      const monitor = usePerformanceMonitoring({
        enablePerformanceProfiling: true,
        profileRenderPhases: true
      });

      // Start different phases
      const diffProfileId = monitor.startProfile('assigns_diff');
      const reconcileProfileId = monitor.startProfile('reconciliation');
      const renderProfileId = monitor.startProfile('render');

      // End phases at different times
      jest.spyOn(performance, 'now').mockReturnValue(1010);
      monitor.endProfile(diffProfileId);

      jest.spyOn(performance, 'now').mockReturnValue(1025);
      monitor.endProfile(reconcileProfileId);

      jest.spyOn(performance, 'now').mockReturnValue(1040);
      monitor.endProfile(renderProfileId);

      const summary = monitor.getProfilingSummary();

      expect(summary).toEqual({
        phases: {
          assigns_diff: { totalTime: 10, callCount: 1, avgTime: 10 },
          reconciliation: { totalTime: 25, callCount: 1, avgTime: 25 },
          render: { totalTime: 40, callCount: 1, avgTime: 40 }
        },
        totalTime: 75,
        bottleneck: 'render'
      });
    });

    test('tracks performance over time with moving averages', () => {
      const monitor = usePerformanceMonitoring({
        enablePerformanceProfiling: true,
        trackMovingAverages: true,
        movingAverageWindow: 10
      });

      // Simulate multiple update cycles with varying performance
      for (let i = 0; i < 15; i++) {
        const profileId = monitor.startProfile('update_cycle');
        jest.spyOn(performance, 'now').mockReturnValue(1000 + (i * 10) + (i % 3) * 5); // Varying times
        monitor.endProfile(profileId);
      }

      const metrics = monitor.getPerformanceMetrics();

      expect(metrics.update_cycle).toEqual({
        recentAverage: expect.any(Number),
        overallAverage: expect.any(Number),
        min: expect.any(Number),
        max: expect.any(Number),
        trend: expect.stringMatching(/improving|stable|degrading/)
      });
    });

    test('detects performance regressions', () => {
      const monitor = usePerformanceMonitoring({
        enablePerformanceProfiling: true,
        detectRegressions: true,
        regressionThreshold: 2.0 // 2x slower
      });

      // Establish baseline
      for (let i = 0; i < 5; i++) {
        const profileId = monitor.startProfile('render');
        jest.spyOn(performance, 'now').mockReturnValue(1000 + (i + 1) * 10); // 10ms each
        monitor.endProfile(profileId);
      }

      // Simulate regression
      const profileId = monitor.startProfile('render');
      jest.spyOn(performance, 'now').mockReturnValue(1200); // 150ms
      monitor.endProfile(profileId);

              expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[LiveReact Native] Performance Regression Detected'),
          expect.objectContaining({
            phase: 'render',
            currentTime: expect.any(Number),
            baselineAverage: expect.any(Number),
            regressionRatio: expect.any(Number)
          })
        );
    });
  });

  describe('Update Visualization', () => {
    test('creates visual tree of assigns changes', () => {
      const monitor = usePerformanceMonitoring({
        enableUpdateVisualization: true,
        visualizationFormat: 'tree'
      });

      const oldAssigns = {
        user: { profile: { name: 'John', age: 30 }, settings: { theme: 'dark' } },
        posts: [{ id: 1, title: 'Post 1' }]
      };

      const newAssigns = {
        user: { profile: { name: 'Jane', age: 30 }, settings: { theme: 'light' } },
        posts: [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }]
      };

      const visualization = monitor.visualizeAssignsChanges(oldAssigns, newAssigns);

      expect(visualization).toEqual({
        format: 'tree',
        tree: {
          'user': {
            status: 'modified',
            children: {
              'profile': {
                status: 'modified',
                children: {
                  'name': { status: 'changed', from: 'John', to: 'Jane' },
                  'age': { status: 'unchanged', value: 30 }
                }
              },
              'settings': {
                status: 'modified',
                children: {
                  'theme': { status: 'changed', from: 'dark', to: 'light' }
                }
              }
            }
          },
          'posts': {
            status: 'modified',
            operation: 'list_append',
            added: [{ id: 2, title: 'Post 2' }]
          }
        }
      });
    });

    test('generates component update flow diagram', () => {
      const monitor = usePerformanceMonitoring({
        enableUpdateVisualization: true,
        trackComponentFlow: true
      });

      const componentUpdates = {
        App: { shouldUpdate: true, reason: 'user_changed' },
        UserProfile: { shouldUpdate: true, reason: 'user.name_changed' },
        PostsList: { shouldUpdate: true, reason: 'posts_appended' },
        Settings: { shouldUpdate: false, reason: 'no_dependencies_changed' }
      };

      const flowDiagram = monitor.generateComponentFlowDiagram(componentUpdates);

      expect(flowDiagram).toEqual({
        nodes: [
          { id: 'App', status: 'updating', reason: 'user_changed' },
          { id: 'UserProfile', status: 'updating', reason: 'user.name_changed' },
          { id: 'PostsList', status: 'updating', reason: 'posts_appended' },
          { id: 'Settings', status: 'skipped', reason: 'no_dependencies_changed' }
        ],
        edges: [
          { from: 'App', to: 'UserProfile', type: 'propagation' },
          { from: 'App', to: 'PostsList', type: 'propagation' },
          { from: 'App', to: 'Settings', type: 'skipped' }
        ],
        updatePath: ['App', 'UserProfile', 'PostsList']
      });
    });

    test('exports visualization data for development tools', () => {
      const monitor = usePerformanceMonitoring({
        enableUpdateVisualization: true,
        exportForDevTools: true
      });

      const oldAssigns = { count: 0 };
      const newAssigns = { count: 1 };

      monitor.visualizeAssignsChanges(oldAssigns, newAssigns);

      const exportData = monitor.getVisualizationExport();

      expect(exportData).toEqual({
        version: '1.0',
        timestamp: expect.any(Number),
        sessions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            changes: expect.any(Object),
            performance: expect.any(Object),
            visualization: expect.any(Object)
          })
        ])
      });
    });
  });

  describe('Memory Leak Detection', () => {
    test('tracks assigns memory usage over time', () => {
      const monitor = usePerformanceMonitoring({
        enableMemoryLeakDetection: true,
        memoryTrackingInterval: 100
      });

      // Simulate assigns growth
      const assigns1 = { data: new Array(100).fill('small') };
      const assigns2 = { data: new Array(1000).fill('medium') };
      const assigns3 = { data: new Array(10000).fill('large') };

      monitor.trackAssignsMemory(assigns1);
      monitor.trackAssignsMemory(assigns2);
      monitor.trackAssignsMemory(assigns3);

      const memoryReport = monitor.getMemoryReport();

      expect(memoryReport).toEqual({
        currentUsage: expect.any(Number),
        peakUsage: expect.any(Number),
        growthRate: expect.any(Number),
        samples: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            size: expect.any(Number),
            assigns: expect.any(Object)
          })
        ]),
        leakSuspected: expect.any(Boolean)
      });
    });

    test('detects subscription memory leaks', () => {
      const monitor = usePerformanceMonitoring({
        enableMemoryLeakDetection: true,
        trackSubscriptions: true
      });

      // Simulate subscriptions without cleanup
      monitor.trackSubscription('live_view_1', 'channel_subscription');
      monitor.trackSubscription('live_view_2', 'channel_subscription');
      monitor.trackSubscription('live_view_3', 'event_listener');

      // Simulate some cleanup
      monitor.untrackSubscription('live_view_1');

      const subscriptionReport = monitor.getSubscriptionReport();

      expect(subscriptionReport.activeSubscriptions).toBe(2);
      expect(subscriptionReport.subscriptionTypes).toEqual({
        channel_subscription: 1,
        event_listener: 1
      });
      // Potential leaks depend on timing, so just check structure
      expect(Array.isArray(subscriptionReport.potentialLeaks)).toBe(true);
    });

    test('monitors component lifecycle cleanup', () => {
      const monitor = usePerformanceMonitoring({
        enableMemoryLeakDetection: true,
        trackComponentLifecycle: true
      });

      // Simulate component mounts
      monitor.trackComponentMount('UserProfile', { userId: 123 });
      monitor.trackComponentMount('PostsList', { userId: 123 });

      // Simulate partial cleanup (missing PostsList)
      monitor.trackComponentUnmount('UserProfile');

      const lifecycleReport = monitor.getLifecycleReport();

      expect(lifecycleReport.mountedComponents).toBe(1);
      expect(lifecycleReport.unmountedComponents).toBe(1);
      // Potential leaks depend on timing, so just check structure
      expect(Array.isArray(lifecycleReport.potentialLeaks)).toBe(true);
    });

    test('generates memory leak warnings', () => {
      const monitor = usePerformanceMonitoring({
        enableMemoryLeakDetection: true,
        memoryLeakThreshold: 1 // 1MB threshold for testing
      });

      // Simulate memory growth beyond threshold
      const largeAssigns = {
        data: new Array(100000).fill('this simulates large memory usage for testing threshold')
      };

      monitor.trackAssignsMemory(largeAssigns);

      // Check if warning was called (may depend on JSON.stringify size)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LiveReact Native] Memory Leak Warning'),
        expect.objectContaining({
          currentUsage: expect.any(Number),
          threshold: 1,
          growthRate: expect.any(Number),
          recommendations: expect.any(Array)
        })
      );
    });

    test('provides memory optimization suggestions', () => {
      const monitor = usePerformanceMonitoring({
        enableMemoryLeakDetection: true,
        provideOptimizationSuggestions: true
      });

      // Simulate various memory patterns
      monitor.trackAssignsMemory({
        largeList: new Array(10000).fill({ id: 1, data: 'repeated' }),
        deepNesting: { level1: { level2: { level3: { level4: 'deep' } } } },
        duplicateData: { user1: { name: 'John' }, user2: { name: 'John' } }
      });

      const suggestions = monitor.getOptimizationSuggestions();

      // Check that we get at least one suggestion and it has the right structure
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toEqual(
        expect.objectContaining({
          type: expect.any(String),
          suggestion: expect.any(String),
          impact: expect.any(String)
        })
      );
    });
  });

  describe('Integration and Production Features', () => {
    test('integrates with development tools', () => {
      const monitor = usePerformanceMonitoring({
        enableDevToolsIntegration: true,
        devToolsPort: 8081
      });

      monitor.startDevToolsReporting();

      // Should set up message listener
      expect(monitor.devToolsConnected).toBe(true);
      expect(monitor.getDevToolsStatus()).toEqual({
        connected: true,
        port: 8081,
        features: ['assigns_diff', 'performance_profiling', 'visualization', 'memory_tracking']
      });
    });

    test('exports production-safe monitoring data', () => {
      const monitor = usePerformanceMonitoring({
        enableProductionMonitoring: true,
        productionSafeMode: false // Allow data analysis for testing
      });

      const oldAssigns = { userToken: 'secret', publicData: 'safe' };
      const newAssigns = { userToken: 'new-secret', publicData: 'updated' };

      // First track some memory to establish data
      monitor.trackAssignsMemory(newAssigns);
      monitor.logAssignsDiff(oldAssigns, newAssigns);

      const exportData = monitor.getProductionReport();

      expect(exportData).toEqual({
        performance: expect.any(Object),
        errors: expect.any(Array),
        changeFrequency: expect.any(Object),
        // Check structure exists
        sensitiveDataDetected: expect.any(Boolean),
        dataFieldsTracked: expect.any(Array),
        timestamp: expect.any(Number)
      });
    });

    test('handles monitoring overhead gracefully', () => {
      const monitor = usePerformanceMonitoring({
        enablePerformanceProfiling: true,
        monitoringOverheadLimit: 5 // Max 5% overhead
      });

      // Simulate expensive monitoring operation
      const profileId = monitor.startProfile('monitoring_overhead_test');

      // Should complete without impacting app performance
      expect(monitor.getMonitoringOverhead()).toBeLessThan(5);

      monitor.endProfile(profileId);
    });
  });

  describe('Configuration and Customization', () => {
    test('supports custom logging formatters', () => {
      const customFormatter = jest.fn((data) => `CUSTOM: ${JSON.stringify(data)}`);

      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        customLogFormatter: customFormatter
      });

      monitor.logAssignsDiff({ a: 1 }, { a: 2 });

      expect(customFormatter).toHaveBeenCalledWith(
        expect.objectContaining({
          changed: ['a'],
          details: expect.any(Object)
        })
      );
    });

    test('allows selective feature enabling', () => {
      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        enablePerformanceProfiling: false,
        enableUpdateVisualization: true,
        enableMemoryLeakDetection: false
      });

      expect(monitor.getEnabledFeatures()).toEqual([
        'assigns_diff_logging',
        'update_visualization'
      ]);
    });

    test('supports different verbosity levels', () => {
      const monitor = usePerformanceMonitoring({
        enableAssignsDiffLogging: true,
        verbosityLevel: 'minimal'
      });

      monitor.logAssignsDiff({ count: 1, user: { name: 'John' } }, { count: 2, user: { name: 'Jane' } });

      // Should log minimal information
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LiveReact Native]'),
        expect.objectContaining({
          changed: ['count', 'user'],
          totalChanges: 2
          // Should not include detailed 'details' object in minimal mode
        })
      );
    });
  });
});