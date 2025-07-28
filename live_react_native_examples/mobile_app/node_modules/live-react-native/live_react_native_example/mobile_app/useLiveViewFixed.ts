// Fixed useLiveView that uses the app's React instance
import { useState, useRef, useCallback, useMemo, useEffect } from './LiveReactNativeHooks';

export interface UseLiveViewOptions {
  socketUrl?: string;
  enablePerformanceMonitoring?: boolean;
  debounceMs?: number;
}

export interface UseLiveViewReturn {
  loading: boolean;
  assigns: any;
  error: any;
  connected: boolean;
  pushEvent: (event: string, payload: any) => void;
}

export function useLiveView(
  path: string,
  initialAssigns: any = {},
  options: UseLiveViewOptions = {}
): UseLiveViewReturn {
  // Core state
  const [loading, setLoading] = useState(true);
  const [assigns, setAssigns] = useState(initialAssigns);
  const [error, setError] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  // Mock implementation for testing - simulates real LiveView behavior
  useEffect(() => {
    console.log('useLiveView: Initializing for path:', path);

    // Simulate connection process
    const timer = setTimeout(() => {
      setLoading(false);
      setConnected(true);
      setAssigns({ count: 0, ...initialAssigns });
      console.log('useLiveView: Connected successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, [path]);

  const pushEvent = useCallback((event: string, payload: any) => {
    console.log('useLiveView: pushEvent', event, payload);

    // Mock event handling - simulate counter events
    if (event === 'increment') {
      setAssigns(prev => ({ ...prev, count: (prev.count || 0) + 1 }));
    } else if (event === 'decrement') {
      setAssigns(prev => ({ ...prev, count: (prev.count || 0) - 1 }));
    } else if (event === 'reset') {
      setAssigns(prev => ({ ...prev, count: 0 }));
    }
  }, []);

  return {
    loading,
    assigns,
    error,
    connected,
    pushEvent
  };
}
import { useState, useRef, useCallback, useMemo, useEffect } from './LiveReactNativeHooks';

export interface UseLiveViewOptions {
  socketUrl?: string;
  enablePerformanceMonitoring?: boolean;
  debounceMs?: number;
}

export interface UseLiveViewReturn {
  loading: boolean;
  assigns: any;
  error: any;
  connected: boolean;
  pushEvent: (event: string, payload: any) => void;
}

export function useLiveView(
  path: string,
  initialAssigns: any = {},
  options: UseLiveViewOptions = {}
): UseLiveViewReturn {
  // Core state
  const [loading, setLoading] = useState(true);
  const [assigns, setAssigns] = useState(initialAssigns);
  const [error, setError] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  // Mock implementation for testing - simulates real LiveView behavior
  useEffect(() => {
    console.log('useLiveView: Initializing for path:', path);

    // Simulate connection process
    const timer = setTimeout(() => {
      setLoading(false);
      setConnected(true);
      setAssigns({ count: 0, ...initialAssigns });
      console.log('useLiveView: Connected successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, [path]);

  const pushEvent = useCallback((event: string, payload: any) => {
    console.log('useLiveView: pushEvent', event, payload);

    // Mock event handling - simulate counter events
    if (event === 'increment') {
      setAssigns(prev => ({ ...prev, count: (prev.count || 0) + 1 }));
    } else if (event === 'decrement') {
      setAssigns(prev => ({ ...prev, count: (prev.count || 0) - 1 }));
    } else if (event === 'reset') {
      setAssigns(prev => ({ ...prev, count: 0 }));
    }
  }, []);

  return {
    loading,
    assigns,
    error,
    connected,
    pushEvent
  };
}