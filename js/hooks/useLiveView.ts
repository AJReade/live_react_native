import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { LiveViewChannel } from '../client/LiveViewChannel';
import { LiveViewAssignsUpdate } from '../types';

export interface UseLiveViewOptions {
  computedValues?: {
    [key: string]: (assigns: any) => any;
  };
  debounceMs?: number;
  enablePerformanceMonitoring?: boolean;
  enableConcurrentFeatures?: boolean;
}

export interface UseLiveViewReturn {
  loading: boolean;
  assigns: Record<string, any>;
  error: any | null;
  pushEvent: (event: string, payload?: any, options?: any) => void;
  memoizedProps: Record<string, any>;
  computedValues: Record<string, any>;
  addEventHandler: (event: string, handler: (data: any) => void) => void;
  removeEventHandler: (event: string, handler: (data: any) => void) => void;
  cleanup: () => void;
  performanceMetrics?: {
    updateCount: number;
    averageUpdateTime: number;
  };
}

export function useLiveView(
  path: string,
  params: Record<string, any>,
  options: UseLiveViewOptions = {}
): UseLiveViewReturn {
  // Core state
  const [loading, setLoading] = useState(true);
  const [assigns, setAssigns] = useState<Record<string, any>>({});
  const [error, setError] = useState<any | null>(null);

  // Performance monitoring
  const [updateCount, setUpdateCount] = useState(0);
  const [totalUpdateTime, setTotalUpdateTime] = useState(0);

  // Refs for managing lifecycle and preventing stale closures
  const channelRef = useRef<LiveViewChannel | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAssignsRef = useRef<Record<string, any>>({});
  const isUnmountedRef = useRef(false);

  // Initialize LiveView channel and connection
  useEffect(() => {
    const channel = new LiveViewChannel({
      url: 'ws://localhost:4000/socket', // This should be configurable
      path,
    });

    channelRef.current = channel;

    // Connect to WebSocket
    channel.connect();

    // Set up assigns update subscription
    channel.onAssignsUpdate((update: LiveViewAssignsUpdate) => {
      if (isUnmountedRef.current) return;

      const updateStart = performance.now();

      if (options.debounceMs && options.debounceMs > 0) {
        // Debounced updates
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          applyAssignsUpdate(update, updateStart);
        }, options.debounceMs);
      } else {
        // Immediate updates
        applyAssignsUpdate(update, updateStart);
      }
    });

    // Join LiveView with mount protocol
    channel.joinLiveView(path, params, {
      onJoin: (response: any) => {
        if (isUnmountedRef.current) return;

        setLoading(false);
        if (response.assigns) {
          setAssigns(response.assigns);
          lastAssignsRef.current = response.assigns;
        }
        setError(null);
      },
      onError: (errorResponse: any) => {
        if (isUnmountedRef.current) return;

        setLoading(false);
        setError(errorResponse);
      },
      onTimeout: () => {
        if (isUnmountedRef.current) return;

        setLoading(false);
        setError({ reason: 'timeout' });
      }
    });

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      channel.leaveLiveView();
      channel.disconnect();
    };
  }, [path, JSON.stringify(params)]); // Re-initialize if path or params change

  // Apply assigns update with smart reconciliation
  const applyAssignsUpdate = useCallback((update: LiveViewAssignsUpdate, updateStart: number) => {
    if (isUnmountedRef.current) return;

    // Smart reconciliation - only update if assigns actually changed
    const newAssigns = update.assigns;
    const oldAssigns = lastAssignsRef.current;

    // Shallow comparison optimization
    const hasActualChanges = !shallowEqual(oldAssigns, newAssigns);

    if (hasActualChanges) {
      setAssigns(newAssigns);
      lastAssignsRef.current = newAssigns;
    }

    // Performance monitoring
    if (options.enablePerformanceMonitoring) {
      const updateEnd = performance.now();
      const updateTime = updateEnd - updateStart;

      setUpdateCount(prev => prev + 1);
      setTotalUpdateTime(prev => prev + updateTime);
    }
  }, [options.enablePerformanceMonitoring]);

  // Memoized props with shallow comparison
  const memoizedProps = useMemo(() => {
    return createMemoizedProps(assigns);
  }, [assigns]);

  // Computed values with memoization
  const computedValues = useMemo(() => {
    if (!options.computedValues) return {};

    const computed: Record<string, any> = {};

    for (const [key, computeFn] of Object.entries(options.computedValues)) {
      computed[key] = computeFn(assigns);
    }

    return computed;
  }, [assigns, options.computedValues]);

  // Push event to server
  const pushEvent = useCallback((event: string, payload: any = {}, eventOptions: any = {}) => {
    if (!channelRef.current) {
      console.warn('Cannot push event: LiveView not connected');
      return;
    }

    channelRef.current.pushEvent(event, payload, {
      onSuccess: eventOptions.onSuccess,
      onError: eventOptions.onError,
      onTimeout: eventOptions.onTimeout,
    });
  }, []);

  // Event handler management
  const addEventHandler = useCallback((event: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
  }, []);

  const removeEventHandler = useCallback((event: string, handler: (data: any) => void) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(event);
      }
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    isUnmountedRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (channelRef.current) {
      channelRef.current.leaveLiveView();
      channelRef.current.disconnect();
    }

    eventHandlersRef.current.clear();
  }, []);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    if (!options.enablePerformanceMonitoring) return undefined;

    return {
      updateCount,
      averageUpdateTime: updateCount > 0 ? totalUpdateTime / updateCount : 0,
    };
  }, [options.enablePerformanceMonitoring, updateCount, totalUpdateTime]);

  return {
    loading,
    assigns,
    error,
    pushEvent,
    memoizedProps,
    computedValues,
    addEventHandler,
    removeEventHandler,
    cleanup,
    performanceMetrics,
  };
}

// Helper functions

function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

function createMemoizedProps(assigns: Record<string, any>): Record<string, any> {
  // Create a new object with the same keys but potentially memoized values
  // This is a simplified version - in real implementation, we'd use more sophisticated memoization
  return { ...assigns };
}