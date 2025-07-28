export interface UseLiveViewOptions {
    computedValues?: {
        [key: string]: (assigns: any) => any;
    };
    debounceMs?: number;
    enablePerformanceMonitoring?: boolean;
    enableConcurrentFeatures?: boolean;
    url?: string;
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
export declare function useLiveView(path: string, params: Record<string, any>, options?: UseLiveViewOptions): UseLiveViewReturn;
//# sourceMappingURL=useLiveView.d.ts.map