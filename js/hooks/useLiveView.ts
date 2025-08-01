import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { createMobileClient, MobileClient } from '../client/LiveViewChannel';
import { LiveViewAssignsUpdate } from '../types';

export interface UseLiveViewOptions {
  computedValues?: {
    [key: string]: (assigns: any) => any;
  };
  debounceMs?: number;
  enablePerformanceMonitoring?: boolean;
  enableConcurrentFeatures?: boolean;
  url?: string; // Allow custom URL override
}

export interface UseLiveViewReturn {
  loading: boolean;
  assigns: Record<string, any>;
  error: any | null;
  pushEvent: (event: string, payload?: any, options?: any) => void;
  pushEventTo: (target: string, event: string, payload?: any, options?: any) => void;
  handleEvent: (event: string, callback: (payload: any) => void) => () => void;
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

function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

function createMemoizedProps(assigns: Record<string, any>): Record<string, any> {
  // Simple implementation - in production this would be more sophisticated
  return assigns;
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
  const clientRef = useRef<MobileClient | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAssignsRef = useRef<Record<string, any>>({});
  const isUnmountedRef = useRef(false);

  // Initialize mobile client and connection using mobile-native API
  useEffect(() => {
    const client = createMobileClient({
      url: options.url || 'ws://localhost:4000/mobile',
      params: params,  // Pass user_id, token, etc. for mobile auth
      debug: options.enablePerformanceMonitoring,
      onError: (error: any) => {
        if (isUnmountedRef.current) return;
        setLoading(false);
        setError(error);
      },
      onReconnect: () => {
        if (isUnmountedRef.current) return;
        setError(null);
      }
    });

    clientRef.current = client;

    // Connect and join mobile channel using mobile-native API
    client.connect().then(() => {
      if (isUnmountedRef.current) return;

      client.join(path, {}, (newAssigns: Record<string, any>) => {
        if (isUnmountedRef.current) return;

        const updateStart = performance.now();

        if (options.debounceMs && options.debounceMs > 0) {
          // Debounced updates
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            applyAssignsUpdate(newAssigns, updateStart);
          }, options.debounceMs);
        } else {
          // Immediate updates
          applyAssignsUpdate(newAssigns, updateStart);
        }
      });

      // Set loading to false on successful join
      setLoading(false);
      setError(null);
    }).catch((error: any) => {
      if (isUnmountedRef.current) return;
      setLoading(false);
      setError(error);
    });

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      client.leave();
      client.disconnect();
    };
  }, [path, JSON.stringify(params), options.url, options.debounceMs]);

  // Apply assigns update with smart reconciliation
  const applyAssignsUpdate = useCallback((newAssigns: Record<string, any>, updateStart: number) => {
    if (isUnmountedRef.current) return;

    // Smart reconciliation - only update if assigns actually changed
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

  // Push event to server using functional client
  const pushEvent = useCallback((event: string, payload: any = {}, eventOptions: any = {}) => {
    if (!clientRef.current) {
      console.warn('Cannot push event: LiveView not connected');
      return;
    }

    clientRef.current.pushEvent(event, payload, eventOptions.onReply);
  }, []);

  // Push event to specific target (LiveComponent) using functional client
  const pushEventTo = useCallback((target: string, event: string, payload: any = {}, eventOptions: any = {}) => {
    if (!clientRef.current) {
      console.warn('Cannot push event: LiveView not connected');
      return;
    }

    clientRef.current.pushEvent(event, payload, eventOptions.onReply);
  }, []);

  // Handle events from server using functional client
  const handleEvent = useCallback((event: string, callback: (payload: any) => void): () => void => {
    if (!clientRef.current) {
      console.warn('Cannot handle event: LiveView not connected');
      return () => {};
    }

    return clientRef.current.handleEvent(event, callback);
  }, []);

  // Legacy event handler management (for backward compatibility)
  const addEventHandler = useCallback((event: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);

    // Also add to functional client if available
    if (clientRef.current) {
      clientRef.current.handleEvent(event, handler);
    }
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

    if (clientRef.current) {
      clientRef.current.leave();
      clientRef.current.disconnect();
    }
  }, []);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    if (!options.enablePerformanceMonitoring || updateCount === 0) {
      return undefined;
    }

    return {
      updateCount,
      averageUpdateTime: totalUpdateTime / updateCount,
    };
  }, [options.enablePerformanceMonitoring, updateCount, totalUpdateTime]);

  return {
    loading,
    assigns,
    error,
    pushEvent,
    pushEventTo,
    handleEvent,
    memoizedProps,
    computedValues,
    addEventHandler,
    removeEventHandler,
    cleanup,
    performanceMetrics,
  };
}