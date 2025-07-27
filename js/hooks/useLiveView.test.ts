import { useLiveView } from './useLiveView';
import { LiveViewChannel } from '../client/LiveViewChannel';

// Mock React hooks
jest.mock('react', () => ({
  useRef: jest.fn((initialValue) => ({ current: initialValue })),
  useState: jest.fn((initialValue) => [initialValue, jest.fn()]),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  useEffect: jest.fn((fn) => fn()),
}));

// Mock the LiveViewChannel
jest.mock('../client/LiveViewChannel');
const MockedLiveViewChannel = LiveViewChannel as jest.MockedClass<typeof LiveViewChannel>;

// Import React after mocking
const React = require('react');

describe('useLiveView Hook (Phase 2.1B)', () => {
  let mockChannel: jest.Mocked<LiveViewChannel>;
  let mockUseState: jest.MockedFunction<any>;
  let mockUseEffect: jest.MockedFunction<any>;
  let mockUseRef: jest.MockedFunction<any>;

  beforeEach(() => {
    // Set up useState mock
    mockUseState = React.useState as jest.MockedFunction<any>;
    mockUseEffect = React.useEffect as jest.MockedFunction<any>;
    mockUseRef = React.useRef as jest.MockedFunction<any>;

    // Reset useState mock to return proper state setters
    mockUseState
      .mockReturnValueOnce([true, jest.fn()]) // loading state
      .mockReturnValueOnce([{}, jest.fn()]) // assigns state
      .mockReturnValueOnce([null, jest.fn()]) // error state
      .mockReturnValueOnce([0, jest.fn()]) // updateCount state
      .mockReturnValueOnce([0, jest.fn()]); // totalUpdateTime state

    mockChannel = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      joinLiveView: jest.fn(),
      leaveLiveView: jest.fn(),
      pushEvent: jest.fn(),
      onAssignsUpdate: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      getCurrentTopic: jest.fn().mockReturnValue('lv:counter'),
      onConnectionChange: jest.fn(),
      onError: jest.fn(),
    } as any;

    MockedLiveViewChannel.mockImplementation(() => mockChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization and Mount Protocol', () => {
    test('initializes with loading state and connects to LiveView', () => {
      const result = useLiveView('/counter', { user_id: 123 });

      expect(result.loading).toBe(true);
      expect(result.assigns).toEqual({});
      expect(result.error).toBeNull();
      expect(mockChannel.connect).toHaveBeenCalled();
      expect(mockChannel.joinLiveView).toHaveBeenCalledWith('/counter', { user_id: 123 }, expect.any(Object));
    });

    test('handles LiveView mount protocol with initial assigns', () => {
      useLiveView('/counter', {});

      expect(mockChannel.joinLiveView).toHaveBeenCalled();

      // Get the join callback and simulate successful mount
      const joinOptions = mockChannel.joinLiveView.mock.calls[0][2];
      expect(joinOptions.onJoin).toBeDefined();
      expect(joinOptions.onError).toBeDefined();
      expect(joinOptions.onTimeout).toBeDefined();

      // Test that onJoin callback exists and can be called
      expect(() => {
        joinOptions.onJoin({ assigns: { count: 0, step: 1 } });
      }).not.toThrow();
    });

    test('handles mount errors gracefully', () => {
      useLiveView('/counter', {});

      // Get the join callback and simulate error
      const joinOptions = mockChannel.joinLiveView.mock.calls[0][2];

      // Test that onError callback exists and can be called
      expect(() => {
        joinOptions.onError({ reason: 'unauthorized' });
      }).not.toThrow();
    });
  });

  describe('Smart Reconciliation and Assigns Change Detection', () => {
    test('sets up assigns update subscription', () => {
      useLiveView('/counter', {});

      expect(mockChannel.onAssignsUpdate).toHaveBeenCalledWith(expect.any(Function));
    });

    test('handles assigns updates through subscription', () => {
      useLiveView('/counter', {});

      // Verify that onAssignsUpdate was called with a callback
      expect(mockChannel.onAssignsUpdate).toHaveBeenCalled();
      const updateCallback = mockChannel.onAssignsUpdate.mock.calls[0][0];

      // Test that the callback can handle updates
      expect(() => {
        updateCallback({
          assigns: { count: 1, step: 1, background_data: 'initial' },
          changed: true
        });
      }).not.toThrow();
    });

    test('provides memoized props functionality', () => {
      const result = useLiveView('/counter', {});

      expect(result.memoizedProps).toBeDefined();
      expect(typeof result.memoizedProps).toBe('object');
    });
  });

  describe('Memoization Strategy', () => {
    test('supports computed values configuration', () => {
      const expensiveComputation = jest.fn(() => 'computed-result');

      const result = useLiveView('/dashboard', {}, {
        computedValues: {
          expensiveData: (assigns) => expensiveComputation(assigns.rawData)
        }
      });

      expect(result.computedValues).toBeDefined();
      expect(result.computedValues.expensiveData).toBe('computed-result');
    });
  });

  describe('pushEvent Functionality', () => {
    test('implements pushEvent for sending events to server', () => {
      const result = useLiveView('/counter', {});

      expect(result.pushEvent).toBeDefined();
      expect(typeof result.pushEvent).toBe('function');

      // Test pushEvent call
      result.pushEvent('increment', { amount: 1 });

      expect(mockChannel.pushEvent).toHaveBeenCalledWith('increment', { amount: 1 }, expect.any(Object));
    });

    test('handles pushEvent with callbacks', () => {
      const result = useLiveView('/counter', {});

      const onSuccess = jest.fn();
      const onError = jest.fn();

      // Push event with callbacks
      result.pushEvent('increment', {}, { onSuccess, onError });

      expect(mockChannel.pushEvent).toHaveBeenCalledWith('increment', {},
        expect.objectContaining({ onSuccess, onError })
      );
    });
  });

  describe('Assigns Subscription System', () => {
    test('subscribes to assigns updates and processes them efficiently', () => {
      useLiveView('/counter', {});

      expect(mockChannel.onAssignsUpdate).toHaveBeenCalledWith(expect.any(Function));
    });

    test('handles batched updates', () => {
      useLiveView('/counter', {});

      // Verify subscription was set up
      expect(mockChannel.onAssignsUpdate).toHaveBeenCalled();
      const updateCallback = mockChannel.onAssignsUpdate.mock.calls[0][0];

      // Simulate rapid updates - should not throw
      expect(() => {
        updateCallback({ assigns: { count: 1 }, changed: true });
        updateCallback({ assigns: { count: 2 }, changed: true });
        updateCallback({ assigns: { count: 3 }, changed: true });
      }).not.toThrow();
    });
  });

  describe('Cleanup and Unmount Handling', () => {
    test('provides cleanup functionality', () => {
      const result = useLiveView('/counter', {});

      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe('function');

      // Call cleanup
      result.cleanup();

      expect(mockChannel.leaveLiveView).toHaveBeenCalled();
      expect(mockChannel.disconnect).toHaveBeenCalled();
    });
  });

  describe('Event Handler System', () => {
    test('provides event handler management', () => {
      const result = useLiveView('/counter', {});

      expect(result.addEventHandler).toBeDefined();
      expect(result.removeEventHandler).toBeDefined();
      expect(typeof result.addEventHandler).toBe('function');
      expect(typeof result.removeEventHandler).toBe('function');

      const handler = jest.fn();

      // Should not throw when adding/removing handlers
      expect(() => {
        result.addEventHandler('custom_event', handler);
        result.removeEventHandler('custom_event', handler);
      }).not.toThrow();
    });
  });

  describe('Performance Features', () => {
    test('supports performance monitoring configuration', () => {
      const result = useLiveView('/counter', {}, { enablePerformanceMonitoring: true });

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics).toHaveProperty('updateCount');
      expect(result.performanceMetrics).toHaveProperty('averageUpdateTime');
    });

    test('supports concurrent features configuration', () => {
      const result = useLiveView('/dashboard', {}, { enableConcurrentFeatures: true });

      // Should initialize without throwing
      expect(result).toBeDefined();
      expect(result.loading).toBe(true);
    });

    test('supports debouncing configuration', () => {
      const result = useLiveView('/counter', {}, { debounceMs: 100 });

      // Should initialize without throwing
      expect(result).toBeDefined();
      expect(result.loading).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('full lifecycle: mount, update, cleanup', () => {
      const result = useLiveView('/counter', {});

      // Initial state
      expect(result.loading).toBe(true);
      expect(mockChannel.connect).toHaveBeenCalled();
      expect(mockChannel.joinLiveView).toHaveBeenCalled();

      // Simulate successful mount
      const joinOptions = mockChannel.joinLiveView.mock.calls[0][2];
      joinOptions.onJoin({ assigns: { count: 0 } });

      // Simulate assigns update
      const updateCallback = mockChannel.onAssignsUpdate.mock.calls[0][0];
      updateCallback({ assigns: { count: 1 }, changed: true });

      // Push event
      result.pushEvent('increment');
      expect(mockChannel.pushEvent).toHaveBeenCalled();

      // Cleanup
      result.cleanup();
      expect(mockChannel.leaveLiveView).toHaveBeenCalled();
      expect(mockChannel.disconnect).toHaveBeenCalled();
    });
  });
});