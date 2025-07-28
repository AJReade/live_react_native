import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { createLiveViewClient } from '../client/LiveViewChannel';
function shallowEqual(objA, objB) {
    if (objA === objB)
        return true;
    if (!objA || !objB)
        return false;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length)
        return false;
    for (let key of keysA) {
        if (objA[key] !== objB[key])
            return false;
    }
    return true;
}
function createMemoizedProps(assigns) {
    // Simple implementation - in production this would be more sophisticated
    return assigns;
}
export function useLiveView(path, params, options = {}) {
    // Core state
    const [loading, setLoading] = useState(true);
    const [assigns, setAssigns] = useState({});
    const [error, setError] = useState(null);
    // Performance monitoring
    const [updateCount, setUpdateCount] = useState(0);
    const [totalUpdateTime, setTotalUpdateTime] = useState(0);
    // Refs for managing lifecycle and preventing stale closures
    const clientRef = useRef(null);
    const eventHandlersRef = useRef(new Map());
    const debounceTimerRef = useRef(null);
    const lastAssignsRef = useRef({});
    const isUnmountedRef = useRef(false);
    // Initialize LiveView client and connection using functional API
    useEffect(() => {
        const client = createLiveViewClient({
            url: options.url || 'ws://localhost:4000/live/websocket',
            params: {},
            debug: options.enablePerformanceMonitoring,
            onError: (error) => {
                if (isUnmountedRef.current)
                    return;
                setLoading(false);
                setError(error);
            },
            onReconnect: () => {
                if (isUnmountedRef.current)
                    return;
                setError(null);
            }
        });
        clientRef.current = client;
        // Connect and join LiveView using functional API
        client.connect().then(() => {
            if (isUnmountedRef.current)
                return;
            client.joinLiveView(path, params, (newAssigns) => {
                if (isUnmountedRef.current)
                    return;
                const updateStart = performance.now();
                if (options.debounceMs && options.debounceMs > 0) {
                    // Debounced updates
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }
                    debounceTimerRef.current = setTimeout(() => {
                        applyAssignsUpdate(newAssigns, updateStart);
                    }, options.debounceMs);
                }
                else {
                    // Immediate updates
                    applyAssignsUpdate(newAssigns, updateStart);
                }
            });
            // Set loading to false on successful join
            setLoading(false);
            setError(null);
        }).catch((error) => {
            if (isUnmountedRef.current)
                return;
            setLoading(false);
            setError(error);
        });
        // Cleanup on unmount
        return () => {
            isUnmountedRef.current = true;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            client.leaveLiveView();
            client.disconnect();
        };
    }, [path, JSON.stringify(params), options.url, options.debounceMs]);
    // Apply assigns update with smart reconciliation
    const applyAssignsUpdate = useCallback((newAssigns, updateStart) => {
        if (isUnmountedRef.current)
            return;
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
        if (!options.computedValues)
            return {};
        const computed = {};
        for (const [key, computeFn] of Object.entries(options.computedValues)) {
            computed[key] = computeFn(assigns);
        }
        return computed;
    }, [assigns, options.computedValues]);
    // Push event to server using functional client
    const pushEvent = useCallback((event, payload = {}, eventOptions = {}) => {
        if (!clientRef.current) {
            console.warn('Cannot push event: LiveView not connected');
            return;
        }
        clientRef.current.pushEvent(event, payload, eventOptions.onReply);
    }, []);
    // Push event to specific target (LiveComponent) using functional client
    const pushEventTo = useCallback((target, event, payload = {}, eventOptions = {}) => {
        if (!clientRef.current) {
            console.warn('Cannot push event: LiveView not connected');
            return;
        }
        clientRef.current.pushEventTo(target, event, payload, eventOptions.onReply);
    }, []);
    // Handle events from server using functional client
    const handleEvent = useCallback((event, callback) => {
        if (!clientRef.current) {
            console.warn('Cannot handle event: LiveView not connected');
            return () => { };
        }
        return clientRef.current.handleEvent(event, callback);
    }, []);
    // Legacy event handler management (for backward compatibility)
    const addEventHandler = useCallback((event, handler) => {
        if (!eventHandlersRef.current.has(event)) {
            eventHandlersRef.current.set(event, new Set());
        }
        eventHandlersRef.current.get(event).add(handler);
        // Also add to functional client if available
        if (clientRef.current) {
            clientRef.current.handleEvent(event, handler);
        }
    }, []);
    const removeEventHandler = useCallback((event, handler) => {
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
            clientRef.current.leaveLiveView();
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
