export interface UseAdvancedUpdatesOptions {
    oldAssigns: Record<string, any>;
    newAssigns: Record<string, any>;
    keyFields?: Record<string, string>;
    preserveIdentity?: boolean;
    componentMap?: Record<string, string[]>;
    debounceMs?: number;
    highPriorityPaths?: string[];
    enableConcurrentFeatures?: boolean;
    priorityLevels?: Record<string, 'immediate' | 'normal' | 'background' | 'idle'>;
    enablePerformanceMonitoring?: boolean;
    liveViewIntegration?: boolean;
}
export interface UseAdvancedUpdatesResult {
    listOperations: Record<string, any>;
    nestedOperations: Record<string, any>;
    optimizationApplied: boolean;
    identityMap: Record<string, any>;
    componentUpdates: Record<string, any>;
    debouncedUpdate: boolean;
    immediateUpdate: boolean;
    updateFired?: boolean;
    highPriorityTrigger?: string[];
    immediateUpdates?: Record<string, any>;
    debouncedUpdates?: Record<string, any>;
    renderPriority?: {
        level: string;
        reason: string;
        interruptible: boolean;
    };
    renderStrategy?: {
        interrupt?: boolean;
        deferredUpdates?: string[];
        immediateUpdates?: string[];
        strategy: string;
        schedule?: string;
        updates?: string[];
    };
    performanceMetrics?: {
        optimizationsApplied: string[];
        rendersSaved: number;
        timeSaved: number;
        efficiency: number;
    };
    memoryMetrics?: {
        reusedComponents: number;
        newComponents: number;
        memoryEfficiency: number;
    };
    liveViewCompatible?: boolean;
    assignsUpdateStrategy?: {
        selective: boolean;
        optimized: boolean;
        listOperations: boolean;
    };
}
export declare function useAdvancedUpdates(options: UseAdvancedUpdatesOptions): UseAdvancedUpdatesResult;
//# sourceMappingURL=useAdvancedUpdates.d.ts.map