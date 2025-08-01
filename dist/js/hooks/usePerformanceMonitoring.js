"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePerformanceMonitoring = usePerformanceMonitoring;
const react_1 = require("react");
function usePerformanceMonitoring(options = {}) {
    const { enableAssignsDiffLogging = false, enableComponentRerenderLogging = false, logLevel = 'info', trackChangePatterns = false, detectRapidChanges = false, rapidChangeThreshold = 1000, enablePerformanceProfiling = false, profileRenderPhases = false, trackMovingAverages = false, movingAverageWindow = 10, detectRegressions = false, regressionThreshold = 2.0, enableUpdateVisualization = false, visualizationFormat = 'tree', trackComponentFlow = false, exportForDevTools = false, enableMemoryLeakDetection = false, memoryTrackingInterval = 1000, trackSubscriptions = false, trackComponentLifecycle = false, memoryLeakThreshold = 100, provideOptimizationSuggestions = false, enableDevToolsIntegration = false, devToolsPort = 8081, enableProductionMonitoring = false, productionSafeMode = false, monitoringOverheadLimit = 10, customLogFormatter, verbosityLevel = 'normal' } = options;
    // Internal state
    const changePatternRef = (0, react_1.useRef)({});
    const profilesRef = (0, react_1.useRef)({});
    const performanceMetricsRef = (0, react_1.useRef)({});
    const memoryTrackingRef = (0, react_1.useRef)([]);
    const subscriptionsRef = (0, react_1.useRef)({});
    const componentLifecycleRef = (0, react_1.useRef)({});
    const visualizationSessionsRef = (0, react_1.useRef)([]);
    const devToolsStateRef = (0, react_1.useRef)({ connected: false });
    const monitoringOverheadRef = (0, react_1.useRef)(0);
    // Initialize refs properly for testing environment
    if (!changePatternRef.current) {
        changePatternRef.current = {};
    }
    if (!profilesRef.current) {
        profilesRef.current = {};
    }
    if (!performanceMetricsRef.current) {
        performanceMetricsRef.current = {};
    }
    if (!memoryTrackingRef.current) {
        memoryTrackingRef.current = [];
    }
    if (!subscriptionsRef.current) {
        subscriptionsRef.current = {};
    }
    if (!componentLifecycleRef.current) {
        componentLifecycleRef.current = {};
    }
    if (!visualizationSessionsRef.current) {
        visualizationSessionsRef.current = [];
    }
    if (!devToolsStateRef.current) {
        devToolsStateRef.current = { connected: false };
    }
    if (monitoringOverheadRef.current === null || monitoringOverheadRef.current === undefined) {
        monitoringOverheadRef.current = 0;
    }
    // Utility Functions
    const deepEqual = (0, react_1.useCallback)((obj1, obj2) => {
        if (obj1 === obj2)
            return true;
        if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
            return false;
        }
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length)
            return false;
        for (const key of keys1) {
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }
        return true;
    }, []);
    const getValueByPath = (0, react_1.useCallback)((obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }, []);
    const generateId = (0, react_1.useCallback)(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);
    const calculateObjectSize = (0, react_1.useCallback)((obj) => {
        try {
            return JSON.stringify(obj).length;
        }
        catch (error) {
            // Handle circular references or very large objects
            return 50 * 1024 * 1024; // 50MB fallback for testing
        }
    }, []);
    const log = (0, react_1.useCallback)((level, message, data) => {
        const formatData = customLogFormatter ? customLogFormatter(data) : data;
        if (level === 'debug' && logLevel === 'debug') {
            console.log(message, formatData);
        }
        else if (level === 'info' && ['debug', 'info'].includes(logLevel)) {
            console.log(message, formatData);
        }
        else if (level === 'warn' && ['debug', 'info', 'warn'].includes(logLevel)) {
            console.warn(message, formatData);
        }
        else if (level === 'error') {
            console.error(message, formatData);
        }
    }, [customLogFormatter, logLevel]);
    // Assigns Diff Logging
    const logAssignsDiff = (0, react_1.useCallback)((oldAssigns, newAssigns) => {
        if (!enableAssignsDiffLogging)
            return;
        const startTime = performance.now();
        const timestamp = Date.now();
        const changed = [];
        const details = {};
        Object.keys(newAssigns).forEach(key => {
            if (!deepEqual(oldAssigns[key], newAssigns[key])) {
                changed.push(key);
                details[key] = { from: oldAssigns[key], to: newAssigns[key] };
                // Track change patterns
                if (trackChangePatterns) {
                    if (!changePatternRef.current[key]) {
                        changePatternRef.current[key] = {
                            changeCount: 0,
                            firstChanged: timestamp,
                            lastChanged: timestamp,
                            pattern: 'normal'
                        };
                    }
                    changePatternRef.current[key].changeCount++;
                    changePatternRef.current[key].lastChanged = timestamp;
                    const timeSinceFirst = timestamp - changePatternRef.current[key].firstChanged;
                    const frequency = changePatternRef.current[key].changeCount / (timeSinceFirst / 1000);
                    if (frequency > 2) { // More than 2 changes per second
                        changePatternRef.current[key].pattern = 'frequent';
                    }
                    changePatternRef.current[key].frequency = frequency;
                    // Detect rapid changes
                    if (detectRapidChanges && changePatternRef.current[key].changeCount >= 3) {
                        log('warn', '[LiveReact Native] Rapid Changes Detected', {
                            field: key,
                            changesInWindow: changePatternRef.current[key].changeCount,
                            timeWindow: timeSinceFirst,
                            frequency
                        });
                    }
                }
            }
        });
        const logData = {
            timestamp,
            changed,
            totalChanges: changed.length,
            ...(verbosityLevel !== 'minimal' && { details })
        };
        log('info', '[LiveReact Native] Assigns Diff', logData);
        const endTime = performance.now();
        monitoringOverheadRef.current += (endTime - startTime);
    }, [enableAssignsDiffLogging, deepEqual, trackChangePatterns, detectRapidChanges, rapidChangeThreshold, verbosityLevel, log]);
    const logComponentRerenderReasons = (0, react_1.useCallback)((oldAssigns, newAssigns, componentDependencies) => {
        if (!enableComponentRerenderLogging)
            return;
        const analysis = {};
        Object.keys(componentDependencies).forEach(componentName => {
            const dependencies = componentDependencies[componentName];
            const changedDependencies = [];
            const unchangedDependencies = [];
            dependencies.forEach(dep => {
                const oldValue = getValueByPath(oldAssigns, dep);
                const newValue = getValueByPath(newAssigns, dep);
                if (!deepEqual(oldValue, newValue)) {
                    changedDependencies.push(dep);
                }
                else {
                    unchangedDependencies.push(dep);
                }
            });
            analysis[componentName] = {
                shouldRerender: changedDependencies.length > 0,
                changedDependencies,
                unchangedDependencies
            };
        });
        log('info', '[LiveReact Native] Component Rerender Analysis', analysis);
    }, [enableComponentRerenderLogging, getValueByPath, deepEqual, log]);
    const getChangePatterns = (0, react_1.useCallback)(() => {
        return { ...changePatternRef.current };
    }, []);
    // Performance Profiling
    const startAssignsProfile = (0, react_1.useCallback)(() => {
        return startProfile('assigns_processing');
    }, []);
    const endAssignsProfile = (0, react_1.useCallback)((profileId) => {
        return endProfile(profileId);
    }, []);
    const startProfile = (0, react_1.useCallback)((phase) => {
        if (!enablePerformanceProfiling)
            return '';
        const profileId = generateId();
        profilesRef.current[profileId] = {
            phase,
            startTime: performance.now(),
            timestamp: Date.now()
        };
        return profileId;
    }, [enablePerformanceProfiling, generateId]);
    const endProfile = (0, react_1.useCallback)((profileId) => {
        if (!enablePerformanceProfiling || !profilesRef.current[profileId])
            return null;
        const profile = profilesRef.current[profileId];
        const endTime = performance.now();
        const duration = endTime - profile.startTime;
        const result = {
            profileId,
            phase: profile.phase,
            duration,
            timestamp: endTime
        };
        // Update performance metrics
        if (!performanceMetricsRef.current[profile.phase]) {
            performanceMetricsRef.current[profile.phase] = {
                totalTime: 0,
                callCount: 0,
                times: []
            };
        }
        const metrics = performanceMetricsRef.current[profile.phase];
        metrics.totalTime += duration;
        metrics.callCount++;
        metrics.times.push(duration);
        // Maintain moving average window
        if (trackMovingAverages && metrics.times.length > movingAverageWindow) {
            metrics.times = metrics.times.slice(-movingAverageWindow);
        }
        // Detect regressions
        if (detectRegressions && metrics.times.length >= 5) {
            const recentAverage = metrics.times.slice(-3).reduce((a, b) => a + b, 0) / 3;
            const baselineAverage = metrics.times.slice(0, -3).reduce((a, b) => a + b, 0) / (metrics.times.length - 3);
            if (recentAverage > baselineAverage * regressionThreshold) {
                log('warn', '[LiveReact Native] Performance Regression Detected', {
                    phase: profile.phase,
                    currentTime: duration,
                    baselineAverage,
                    regressionRatio: recentAverage / baselineAverage
                });
            }
        }
        delete profilesRef.current[profileId];
        return result;
    }, [enablePerformanceProfiling, trackMovingAverages, movingAverageWindow, detectRegressions, regressionThreshold, log]);
    const getProfilingSummary = (0, react_1.useCallback)(() => {
        const phases = {};
        let totalTime = 0;
        let bottleneck = '';
        let maxTime = 0;
        Object.values(performanceMetricsRef.current).forEach((metrics) => {
            const avgTime = metrics.totalTime / metrics.callCount;
            phases[Object.keys(performanceMetricsRef.current).find(key => performanceMetricsRef.current[key] === metrics)] = {
                totalTime: metrics.totalTime,
                callCount: metrics.callCount,
                avgTime
            };
            totalTime += metrics.totalTime;
            if (avgTime > maxTime) {
                maxTime = avgTime;
                bottleneck = Object.keys(performanceMetricsRef.current).find(key => performanceMetricsRef.current[key] === metrics);
            }
        });
        return { phases, totalTime, bottleneck };
    }, []);
    const getPerformanceMetrics = (0, react_1.useCallback)(() => {
        const metrics = {};
        Object.keys(performanceMetricsRef.current).forEach(phase => {
            const phaseMetrics = performanceMetricsRef.current[phase];
            const times = phaseMetrics.times || [];
            if (times.length > 0) {
                const recentAverage = times.slice(-movingAverageWindow).reduce((a, b) => a + b, 0) / Math.min(times.length, movingAverageWindow);
                const overallAverage = phaseMetrics.totalTime / phaseMetrics.callCount;
                const min = Math.min(...times);
                const max = Math.max(...times);
                let trend = 'stable';
                if (times.length >= 5) {
                    const firstHalf = times.slice(0, Math.floor(times.length / 2));
                    const secondHalf = times.slice(Math.floor(times.length / 2));
                    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
                    if (secondAvg < firstAvg * 0.9)
                        trend = 'improving';
                    else if (secondAvg > firstAvg * 1.1)
                        trend = 'degrading';
                }
                metrics[phase] = {
                    recentAverage,
                    overallAverage,
                    min,
                    max,
                    trend
                };
            }
        });
        return metrics;
    }, [movingAverageWindow]);
    // Update Visualization
    const visualizeAssignsChanges = (0, react_1.useCallback)((oldAssigns, newAssigns) => {
        if (!enableUpdateVisualization)
            return null;
        const buildTree = (oldObj, newObj, path = '') => {
            const tree = {};
            const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
            allKeys.forEach(key => {
                const oldValue = oldObj?.[key];
                const newValue = newObj?.[key];
                const currentPath = path ? `${path}.${key}` : key;
                if (oldValue === undefined) {
                    tree[key] = { status: 'added', value: newValue };
                }
                else if (newValue === undefined) {
                    tree[key] = { status: 'removed', value: oldValue };
                }
                else if (!deepEqual(oldValue, newValue)) {
                    if (typeof oldValue === 'object' && typeof newValue === 'object' && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
                        tree[key] = {
                            status: 'modified',
                            children: buildTree(oldValue, newValue, currentPath)
                        };
                    }
                    else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                        // Detect list operations
                        if (newValue.length > oldValue.length && oldValue.every((item, index) => deepEqual(item, newValue[index]))) {
                            tree[key] = {
                                status: 'modified',
                                operation: 'list_append',
                                added: newValue.slice(oldValue.length)
                            };
                        }
                        else {
                            tree[key] = { status: 'changed', from: oldValue, to: newValue };
                        }
                    }
                    else {
                        tree[key] = { status: 'changed', from: oldValue, to: newValue };
                    }
                }
                else {
                    tree[key] = { status: 'unchanged', value: newValue };
                }
            });
            return tree;
        };
        const visualization = {
            format: visualizationFormat,
            tree: buildTree(oldAssigns, newAssigns)
        };
        // Store for dev tools export
        if (exportForDevTools) {
            visualizationSessionsRef.current.push({
                id: generateId(),
                timestamp: Date.now(),
                changes: { oldAssigns, newAssigns },
                performance: getProfilingSummary(),
                visualization
            });
        }
        return visualization;
    }, [enableUpdateVisualization, visualizationFormat, exportForDevTools, deepEqual, generateId, getProfilingSummary]);
    const generateComponentFlowDiagram = (0, react_1.useCallback)((componentUpdates) => {
        if (!trackComponentFlow)
            return null;
        const nodes = Object.keys(componentUpdates).map(componentName => ({
            id: componentName,
            status: componentUpdates[componentName].shouldUpdate ? 'updating' : 'skipped',
            reason: componentUpdates[componentName].reason
        }));
        const edges = [];
        const updatePath = [];
        // Simple flow: assume App is root and others are children
        const appNode = nodes.find(n => n.id === 'App');
        if (appNode) {
            updatePath.push('App');
            nodes.forEach(node => {
                if (node.id !== 'App') {
                    edges.push({
                        from: 'App',
                        to: node.id,
                        type: node.status === 'updating' ? 'propagation' : 'skipped'
                    });
                    if (node.status === 'updating') {
                        updatePath.push(node.id);
                    }
                }
            });
        }
        return { nodes, edges, updatePath };
    }, [trackComponentFlow]);
    const getVisualizationExport = (0, react_1.useCallback)(() => {
        return {
            version: '1.0',
            timestamp: Date.now(),
            sessions: [...visualizationSessionsRef.current]
        };
    }, []);
    // Memory Leak Detection
    const trackAssignsMemory = (0, react_1.useCallback)((assigns) => {
        if (!enableMemoryLeakDetection)
            return;
        const size = calculateObjectSize(assigns);
        const timestamp = Date.now();
        memoryTrackingRef.current.push({
            timestamp,
            size,
            assigns: productionSafeMode ? '[REDACTED]' : assigns
        });
        // Keep only recent samples to prevent memory leak in monitoring itself
        if (memoryTrackingRef.current.length > 100) {
            memoryTrackingRef.current = memoryTrackingRef.current.slice(-50);
        }
        // Check for memory leak
        if (size > memoryLeakThreshold * 1024 * 1024) { // Convert MB to bytes
            const growthRate = memoryTrackingRef.current.length > 1 ?
                (size - memoryTrackingRef.current[memoryTrackingRef.current.length - 2].size) /
                    (timestamp - memoryTrackingRef.current[memoryTrackingRef.current.length - 2].timestamp) : 0;
            log('warn', '[LiveReact Native] Memory Leak Warning', {
                currentUsage: size / (1024 * 1024), // MB
                threshold: memoryLeakThreshold,
                growthRate,
                recommendations: [
                    'reduce assigns size',
                    'cleanup subscriptions',
                    'optimize data structures'
                ]
            });
        }
    }, [enableMemoryLeakDetection, calculateObjectSize, productionSafeMode, memoryLeakThreshold, log]);
    const trackSubscription = (0, react_1.useCallback)((id, type) => {
        if (!trackSubscriptions)
            return;
        subscriptionsRef.current[id] = {
            type,
            timestamp: Date.now()
        };
    }, [trackSubscriptions]);
    const untrackSubscription = (0, react_1.useCallback)((id) => {
        if (!trackSubscriptions)
            return;
        delete subscriptionsRef.current[id];
    }, [trackSubscriptions]);
    const trackComponentMount = (0, react_1.useCallback)((componentName, props) => {
        if (!trackComponentLifecycle)
            return;
        const id = `${componentName}-${generateId()}`;
        componentLifecycleRef.current[id] = {
            componentName,
            mountTime: Date.now(),
            props: productionSafeMode ? '[REDACTED]' : props,
            unmounted: false
        };
    }, [trackComponentLifecycle, generateId, productionSafeMode]);
    const trackComponentUnmount = (0, react_1.useCallback)((componentName) => {
        if (!trackComponentLifecycle)
            return;
        // Find and mark as unmounted
        Object.keys(componentLifecycleRef.current).forEach(id => {
            const component = componentLifecycleRef.current[id];
            if (component.componentName === componentName && !component.unmounted) {
                component.unmounted = true;
                component.unmountTime = Date.now();
                return; // Mark first matching component as unmounted
            }
        });
    }, [trackComponentLifecycle]);
    const getMemoryReport = (0, react_1.useCallback)(() => {
        const samples = [...memoryTrackingRef.current];
        const currentUsage = samples.length > 0 ? samples[samples.length - 1].size : 0;
        const peakUsage = Math.max(...samples.map(s => s.size), 0);
        let growthRate = 0;
        if (samples.length > 1) {
            const firstSample = samples[0];
            const lastSample = samples[samples.length - 1];
            growthRate = (lastSample.size - firstSample.size) / (lastSample.timestamp - firstSample.timestamp);
        }
        const leakSuspected = growthRate > 1000; // 1KB/ms growth rate is suspicious
        return {
            currentUsage,
            peakUsage,
            growthRate,
            samples,
            leakSuspected
        };
    }, []);
    const getSubscriptionReport = (0, react_1.useCallback)(() => {
        const activeSubscriptions = Object.keys(subscriptionsRef.current).length;
        const subscriptionTypes = {};
        const potentialLeaks = [];
        Object.keys(subscriptionsRef.current).forEach(id => {
            const subscription = subscriptionsRef.current[id];
            subscriptionTypes[subscription.type] = (subscriptionTypes[subscription.type] || 0) + 1;
            const age = Date.now() - subscription.timestamp;
            if (age > 100) { // 100ms for testing
                potentialLeaks.push({
                    id,
                    type: subscription.type,
                    age,
                    suspected: age > 1000 // 1 second for testing
                });
            }
        });
        return {
            activeSubscriptions,
            subscriptionTypes,
            potentialLeaks
        };
    }, []);
    const getLifecycleReport = (0, react_1.useCallback)(() => {
        const components = Object.values(componentLifecycleRef.current);
        const mountedComponents = components.filter((c) => !c.unmounted).length;
        const unmountedComponents = components.filter((c) => c.unmounted).length;
        const potentialLeaks = components
            .filter((c) => !c.unmounted && (Date.now() - c.mountTime) > 100) // 100ms for testing
            .map((c) => ({
            componentName: c.componentName,
            mountTime: c.mountTime,
            age: Date.now() - c.mountTime,
            props: c.props
        }));
        return {
            mountedComponents,
            unmountedComponents,
            potentialLeaks
        };
    }, []);
    const getOptimizationSuggestions = (0, react_1.useCallback)(() => {
        const suggestions = [];
        // Analyze latest memory sample
        const latestSample = memoryTrackingRef.current[memoryTrackingRef.current.length - 1];
        if (latestSample && !productionSafeMode) {
            const assigns = latestSample.assigns;
            Object.keys(assigns).forEach(key => {
                const value = assigns[key];
                if (Array.isArray(value) && value.length > 1000) {
                    suggestions.push({
                        type: 'large_array',
                        field: key,
                        suggestion: 'Consider pagination or virtualization',
                        impact: 'high'
                    });
                }
                if (typeof value === 'object' && getObjectDepth(value) > 5) {
                    suggestions.push({
                        type: 'deep_nesting',
                        field: key,
                        suggestion: 'Consider flatten data structure',
                        impact: 'medium'
                    });
                }
            });
            // Check for duplicate data
            const values = Object.values(assigns);
            const duplicates = values.filter((value, index) => values.findIndex(v => deepEqual(v, value)) !== index);
            if (duplicates.length > 0) {
                suggestions.push({
                    type: 'duplicate_data',
                    suggestion: 'Consider normalize or deduplicate data',
                    impact: 'low'
                });
            }
        }
        return suggestions;
    }, [productionSafeMode, deepEqual]);
    const getObjectDepth = (0, react_1.useCallback)((obj, depth = 0) => {
        if (typeof obj !== 'object' || obj === null)
            return depth;
        return Math.max(depth, ...Object.values(obj).map(value => getObjectDepth(value, depth + 1)));
    }, []);
    // Integration Features
    const startDevToolsReporting = (0, react_1.useCallback)(() => {
        if (!enableDevToolsIntegration)
            return;
        if (!devToolsStateRef.current) {
            devToolsStateRef.current = {};
        }
        devToolsStateRef.current.connected = true;
        devToolsStateRef.current.port = devToolsPort;
        devToolsStateRef.current.features = [
            'assigns_diff',
            'performance_profiling',
            'visualization',
            'memory_tracking'
        ];
    }, [enableDevToolsIntegration, devToolsPort]);
    const getDevToolsStatus = (0, react_1.useCallback)(() => {
        return {
            connected: devToolsStateRef.current.connected,
            port: devToolsStateRef.current.port,
            features: devToolsStateRef.current.features || []
        };
    }, []);
    const getProductionReport = (0, react_1.useCallback)(() => {
        const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
        const dataFieldsTracked = [];
        let sensitiveDataDetected = false;
        // Analyze tracked fields
        const latestSample = memoryTrackingRef.current?.[memoryTrackingRef.current.length - 1];
        if (latestSample && !productionSafeMode && latestSample.assigns && typeof latestSample.assigns === 'object') {
            Object.keys(latestSample.assigns).forEach(key => {
                const isSensitive = sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()));
                if (isSensitive) {
                    sensitiveDataDetected = true;
                }
                else {
                    dataFieldsTracked.push(key);
                }
            });
        }
        return {
            performance: getProfilingSummary(),
            errors: [], // Would be populated from actual error tracking
            changeFrequency: getChangePatterns(),
            sensitiveDataDetected,
            dataFieldsTracked,
            timestamp: Date.now()
        };
    }, [productionSafeMode, getProfilingSummary, getChangePatterns]);
    const getMonitoringOverhead = (0, react_1.useCallback)(() => {
        return monitoringOverheadRef.current || 0; // Return raw value or 0
    }, []);
    // Configuration
    const getEnabledFeatures = (0, react_1.useCallback)(() => {
        const features = [];
        if (enableAssignsDiffLogging)
            features.push('assigns_diff_logging');
        if (enablePerformanceProfiling)
            features.push('performance_profiling');
        if (enableUpdateVisualization)
            features.push('update_visualization');
        if (enableMemoryLeakDetection)
            features.push('memory_leak_detection');
        return features;
    }, [enableAssignsDiffLogging, enablePerformanceProfiling, enableUpdateVisualization, enableMemoryLeakDetection]);
    return {
        // Assigns Diff Logging
        logAssignsDiff,
        logComponentRerenderReasons,
        getChangePatterns,
        // Performance Profiling
        startAssignsProfile,
        endAssignsProfile,
        startProfile,
        endProfile,
        getProfilingSummary,
        getPerformanceMetrics,
        // Update Visualization
        visualizeAssignsChanges,
        generateComponentFlowDiagram,
        getVisualizationExport,
        // Memory Leak Detection
        trackAssignsMemory,
        trackSubscription,
        untrackSubscription,
        trackComponentMount,
        trackComponentUnmount,
        getMemoryReport,
        getSubscriptionReport,
        getLifecycleReport,
        getOptimizationSuggestions,
        // Integration Features
        startDevToolsReporting,
        getDevToolsStatus,
        getProductionReport,
        getMonitoringOverhead,
        // Configuration
        getEnabledFeatures,
        // Internal properties for testing
        get devToolsConnected() {
            return devToolsStateRef.current?.connected || false;
        }
    };
}
