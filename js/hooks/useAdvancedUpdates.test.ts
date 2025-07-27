import { useAdvancedUpdates } from './useAdvancedUpdates';

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

describe('useAdvancedUpdates Hook (Phase 2.1C)', () => {
  let mockUseState: jest.MockedFunction<any>;
  let mockUseRef: jest.MockedFunction<any>;

  beforeEach(() => {
    mockUseState = React.useState as jest.MockedFunction<any>;
    mockUseRef = React.useRef as jest.MockedFunction<any>;

    // Reset mocks
    mockUseState.mockReturnValue([{}, jest.fn()]);
    mockUseRef.mockReturnValue({ current: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('List Update Optimization', () => {
    test('detects list append operations efficiently', () => {
      const oldList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const newList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { items: oldList },
        newAssigns: { items: newList },
        keyFields: { items: 'id' }
      });

      expect(result.listOperations.items).toEqual({
        type: 'append',
        items: [{ id: 3, name: 'Item 3' }],
        indices: [2]
      });
      expect(result.optimizationApplied).toBe(true);
    });

    test('detects list prepend operations efficiently', () => {
      const oldList = [
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const newList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { items: oldList },
        newAssigns: { items: newList },
        keyFields: { items: 'id' }
      });

      expect(result.listOperations.items).toEqual({
        type: 'prepend',
        items: [{ id: 1, name: 'Item 1' }],
        indices: [0]
      });
    });

    test('detects list item removal operations', () => {
      const oldList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const newList = [
        { id: 1, name: 'Item 1' },
        { id: 3, name: 'Item 3' }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { items: oldList },
        newAssigns: { items: newList },
        keyFields: { items: 'id' }
      });

      expect(result.listOperations.items).toEqual({
        type: 'remove',
        removedKeys: [2],
        removedIndices: [1]
      });
    });

    test('detects list reordering operations', () => {
      const oldList = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const newList = [
        { id: 3, name: 'Item 3' },
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { items: oldList },
        newAssigns: { items: newList },
        keyFields: { items: 'id' }
      });

      expect(result.listOperations.items).toEqual({
        type: 'reorder',
        fromIndices: [2, 0, 1],
        toIndices: [0, 1, 2],
        keyMap: { 3: 0, 1: 1, 2: 2 }
      });
    });

    test('detects mixed list operations (add, remove, modify)', () => {
      const oldList = [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'inactive' },
        { id: 3, name: 'Item 3', status: 'active' }
      ];

      const newList = [
        { id: 1, name: 'Item 1 Updated', status: 'active' }, // modified
        { id: 4, name: 'Item 4', status: 'active' }, // added
        { id: 3, name: 'Item 3', status: 'inactive' } // modified
        // id: 2 removed
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { items: oldList },
        newAssigns: { items: newList },
        keyFields: { items: 'id' }
      });

      expect(result.listOperations.items).toEqual({
        type: 'mixed',
        added: [{ id: 4, name: 'Item 4', status: 'active' }],
        removed: [2],
        modified: [
          { id: 1, changes: { name: 'Item 1 Updated' } },
          { id: 3, changes: { status: 'inactive' } }
        ]
      });
    });

    test('handles nested list operations', () => {
      const oldAssigns = {
        categories: [
          { id: 1, name: 'Cat 1', items: [{ id: 'a', name: 'Item A' }] },
          { id: 2, name: 'Cat 2', items: [{ id: 'b', name: 'Item B' }] }
        ]
      };

      const newAssigns = {
        categories: [
          { id: 1, name: 'Cat 1', items: [{ id: 'a', name: 'Item A' }, { id: 'c', name: 'Item C' }] },
          { id: 2, name: 'Cat 2', items: [{ id: 'b', name: 'Item B Updated' }] }
        ]
      };

      const result = useAdvancedUpdates({
        oldAssigns,
        newAssigns,
        keyFields: { categories: 'id', 'categories.items': 'id' }
      });

      expect(result.listOperations.categories).toBeDefined();
             expect(result.nestedOperations['categories.0.items']).toEqual({
         type: 'append',
         items: [{ id: 'c', name: 'Item C' }],
         indices: [1]
       });
             expect(result.nestedOperations['categories.1.items']).toEqual({
         type: 'mixed',
         added: [],
         removed: [],
         modified: [{ id: 'b', changes: { name: 'Item B Updated' } }]
       });
    });
  });

  describe('Component Identity Preservation', () => {
    test('maintains component identity across updates when keys are stable', () => {
      const oldComponents = [
        { key: 'comp1', type: 'Button', props: { text: 'Click me' } },
        { key: 'comp2', type: 'Input', props: { value: 'hello' } }
      ];

      const newComponents = [
        { key: 'comp1', type: 'Button', props: { text: 'Click me now' } },
        { key: 'comp2', type: 'Input', props: { value: 'hello world' } }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { components: oldComponents },
        newAssigns: { components: newComponents },
        preserveIdentity: true,
        keyFields: { components: 'key' }
      });

      expect(result.identityMap.comp1).toEqual({
        preserved: true,
        reason: 'stable_key',
        propsChanged: ['text']
      });
      expect(result.identityMap.comp2).toEqual({
        preserved: true,
        reason: 'stable_key',
        propsChanged: ['value']
      });
    });

    test('detects identity breaks when component type changes', () => {
      const oldComponents = [
        { key: 'comp1', type: 'Button', props: { text: 'Click me' } }
      ];

      const newComponents = [
        { key: 'comp1', type: 'Input', props: { value: 'changed type' } }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { components: oldComponents },
        newAssigns: { components: newComponents },
        preserveIdentity: true,
        keyFields: { components: 'key' }
      });

      expect(result.identityMap.comp1).toEqual({
        preserved: false,
        reason: 'type_changed',
        oldType: 'Button',
        newType: 'Input'
      });
    });

    test('maintains identity when only props change', () => {
      const oldComponents = [
        { key: 'form1', type: 'Form', props: { title: 'User Form', mode: 'edit' } }
      ];

      const newComponents = [
        { key: 'form1', type: 'Form', props: { title: 'User Form', mode: 'view' } }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { components: oldComponents },
        newAssigns: { components: newComponents },
        preserveIdentity: true,
        keyFields: { components: 'key' }
      });

      expect(result.identityMap.form1.preserved).toBe(true);
      expect(result.identityMap.form1.propsChanged).toEqual(['mode']);
    });

    test('handles component identity with deep prop changes', () => {
      const oldComponents = [
        { key: 'chart1', type: 'Chart', props: { config: { type: 'bar', data: [1, 2, 3] } } }
      ];

      const newComponents = [
        { key: 'chart1', type: 'Chart', props: { config: { type: 'line', data: [1, 2, 3, 4] } } }
      ];

      const result = useAdvancedUpdates({
        oldAssigns: { components: oldComponents },
        newAssigns: { components: newComponents },
        preserveIdentity: true,
        keyFields: { components: 'key' }
      });

      expect(result.identityMap.chart1.preserved).toBe(true);
      expect(result.identityMap.chart1.deepPropsChanged).toEqual(['config.type', 'config.data']);
    });
  });

  describe('Selective Component Updates', () => {
    test('identifies components that need updates vs those that dont', () => {
      const oldAssigns = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', lang: 'en' },
        posts: [{ id: 1, title: 'Post 1' }]
      };

      const newAssigns = {
        user: { name: 'John', age: 31 }, // changed
        settings: { theme: 'dark', lang: 'en' }, // unchanged
        posts: [{ id: 1, title: 'Post 1' }] // unchanged
      };

      const result = useAdvancedUpdates({
        oldAssigns,
        newAssigns,
        componentMap: {
          UserProfile: ['user'],
          SettingsPanel: ['settings'],
          PostsList: ['posts']
        }
      });

      expect(result.componentUpdates).toEqual({
        UserProfile: { shouldUpdate: true, changedProps: ['user'] },
        SettingsPanel: { shouldUpdate: false, changedProps: [] },
        PostsList: { shouldUpdate: false, changedProps: [] }
      });
    });

    test('handles components with multiple dependencies', () => {
      const oldAssigns = {
        user: { name: 'John', role: 'admin' },
        permissions: ['read', 'write'],
        ui: { sidebar: true }
      };

      const newAssigns = {
        user: { name: 'John', role: 'user' }, // changed
        permissions: ['read'], // changed
        ui: { sidebar: true } // unchanged
      };

      const result = useAdvancedUpdates({
        oldAssigns,
        newAssigns,
        componentMap: {
          AdminPanel: ['user.role', 'permissions'],
          UserInfo: ['user.name'],
          Sidebar: ['ui.sidebar']
        }
      });

      expect(result.componentUpdates.AdminPanel).toEqual({
        shouldUpdate: true,
        changedProps: ['user.role', 'permissions']
      });
      expect(result.componentUpdates.UserInfo).toEqual({
        shouldUpdate: false,
        changedProps: []
      });
      expect(result.componentUpdates.Sidebar).toEqual({
        shouldUpdate: false,
        changedProps: []
      });
    });

    test('supports wildcard dependencies for dynamic components', () => {
      const oldAssigns = {
        items: [
          { id: 1, name: 'Item 1', category: 'A' },
          { id: 2, name: 'Item 2', category: 'B' }
        ]
      };

      const newAssigns = {
        items: [
          { id: 1, name: 'Item 1 Updated', category: 'A' },
          { id: 2, name: 'Item 2', category: 'B' }
        ]
      };

      const result = useAdvancedUpdates({
        oldAssigns,
        newAssigns,
        componentMap: {
          'ItemCard.*': ['items.*']
        }
      });

      expect(result.componentUpdates['ItemCard.1']).toEqual({
        shouldUpdate: true,
        changedProps: ['items.0']
      });
      expect(result.componentUpdates['ItemCard.2']).toEqual({
        shouldUpdate: false,
        changedProps: []
      });
    });
  });

  describe('Update Debouncing', () => {
    test('batches rapid updates within debounce window', () => {
      jest.useFakeTimers();

      const result = useAdvancedUpdates({
        oldAssigns: { count: 0 },
        newAssigns: { count: 1 },
        debounceMs: 100
      });

      // Initial update should be queued
      expect(result.debouncedUpdate).toBe(true);
      expect(result.immediateUpdate).toBe(false);

      // Fast forward time
      jest.advanceTimersByTime(100);

      expect(result.updateFired).toBe(true);

      jest.useRealTimers();
    });

    test('allows immediate updates for high priority changes', () => {
      const result = useAdvancedUpdates({
        oldAssigns: { loading: false, criticalData: 'old' },
        newAssigns: { loading: true, criticalData: 'new' },
        debounceMs: 100,
        highPriorityPaths: ['loading']
      });

      expect(result.immediateUpdate).toBe(true);
      expect(result.debouncedUpdate).toBe(false);
      expect(result.highPriorityTrigger).toEqual(['loading']);
    });

    test('separates debounced and immediate updates', () => {
      const result = useAdvancedUpdates({
        oldAssigns: { loading: false, backgroundData: 'old', criticalAlert: null },
        newAssigns: { loading: false, backgroundData: 'new', criticalAlert: 'Error!' },
        debounceMs: 50,
        highPriorityPaths: ['criticalAlert', 'loading']
      });

      expect(result.immediateUpdates).toEqual({
        criticalAlert: 'Error!'
      });
      expect(result.debouncedUpdates).toEqual({
        backgroundData: 'new'
      });
    });
  });

  describe('Render Interruption (Concurrent Mode)', () => {
    test('supports render interruption for high priority updates', () => {
      const result = useAdvancedUpdates({
        oldAssigns: {
          backgroundProcess: 'running',
          userInteraction: null
        },
        newAssigns: {
          backgroundProcess: 'running',
          userInteraction: 'button_clicked'
        },
        enableConcurrentFeatures: true,
        priorityLevels: {
          userInteraction: 'immediate',
          backgroundProcess: 'normal'
        }
      });

      expect(result.renderPriority).toEqual({
        level: 'immediate',
        reason: 'userInteraction_changed',
        interruptible: false
      });
    });

    test('allows interrupting expensive background renders', () => {
      const result = useAdvancedUpdates({
        oldAssigns: {
          expensiveChart: { data: [1, 2, 3] },
          userAlert: null
        },
        newAssigns: {
          expensiveChart: { data: [1, 2, 3, 4, 5] },
          userAlert: 'Critical error!'
        },
        enableConcurrentFeatures: true,
        priorityLevels: {
          userAlert: 'immediate',
          expensiveChart: 'background'
        }
      });

      expect(result.renderStrategy).toEqual({
        interrupt: true,
        deferredUpdates: ['expensiveChart'],
        immediateUpdates: ['userAlert'],
        strategy: 'interrupt_and_defer'
      });
    });

    test('schedules non-critical updates for idle time', () => {
      const result = useAdvancedUpdates({
        oldAssigns: {
          analytics: { views: 100 },
          cacheData: 'old'
        },
        newAssigns: {
          analytics: { views: 101 },
          cacheData: 'new'
        },
        enableConcurrentFeatures: true,
        priorityLevels: {
          analytics: 'idle',
          cacheData: 'idle'
        }
      });

      expect(result.renderStrategy).toEqual({
        schedule: 'idle',
        updates: ['analytics', 'cacheData'],
        strategy: 'idle_callback'
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('tracks optimization effectiveness', () => {
      const result = useAdvancedUpdates({
        oldAssigns: {
          items: [{ id: 1 }, { id: 2 }]
        },
        newAssigns: {
          items: [{ id: 1 }, { id: 2 }, { id: 3 }]
        },
        keyFields: { items: 'id' },
        enablePerformanceMonitoring: true
      });

      expect(result.performanceMetrics).toEqual({
        optimizationsApplied: ['list_append'],
        rendersSaved: 2, // didn't re-render existing items
        timeSaved: expect.any(Number),
        efficiency: expect.any(Number)
      });
    });

    test('reports memory usage optimization', () => {
      const largeData = new Array(1000).fill(0).map((_, i) => ({ id: i, data: 'large' }));

      const result = useAdvancedUpdates({
        oldAssigns: { items: largeData },
        newAssigns: { items: [...largeData, { id: 1000, data: 'new' }] },
        keyFields: { items: 'id' },
        enablePerformanceMonitoring: true
      });

      expect(result.memoryMetrics).toEqual({
        reusedComponents: 1000,
        newComponents: 1,
        memoryEfficiency: expect.any(Number)
      });
    });
  });

  describe('Integration with useLiveView', () => {
    test('integrates seamlessly with useLiveView hook', () => {
      const result = useAdvancedUpdates({
        oldAssigns: { count: 0, items: [] },
        newAssigns: { count: 1, items: [{ id: 1 }] },
        liveViewIntegration: true,
        keyFields: { items: 'id' }
      });

      expect(result.liveViewCompatible).toBe(true);
      expect(result.assignsUpdateStrategy).toEqual({
        selective: true,
        optimized: true,
        listOperations: true
      });
    });
  });
});