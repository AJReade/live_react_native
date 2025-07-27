import { LiveViewOptions, LiveViewJoinOptions, LiveViewLeaveOptions, PushEventOptions, ConnectionState, LiveReactNativeUpdate } from '../types';
export declare class LiveViewChannel {
    private socket;
    private channel;
    private currentTopic;
    private connectionState;
    private connectionCallbacks;
    private errorCallbacks;
    private maxReconnectAttemptsCallback;
    private maxReconnectAttempts;
    constructor(options: LiveViewOptions);
    connect(): void;
    disconnect(): void;
    joinLiveView(topic: string, params?: Record<string, any>, options?: LiveViewJoinOptions): void;
    leaveLiveView(options?: LiveViewLeaveOptions): void;
    pushEvent(event: string, payload?: Record<string, any>, options?: PushEventOptions): void;
    onLiveViewUpdate(callback: (update: LiveReactNativeUpdate) => void): void;
    onConnectionChange(callback: (connected: boolean) => void): void;
    onError(callback: (error: Error) => void): void;
    onMaxReconnectAttempts(callback: () => void): void;
    isConnected(): boolean;
    getCurrentTopic(): string | null;
    getReconnectAttempts(): number;
    getConnectionState(): ConnectionState;
}
//# sourceMappingURL=LiveViewChannel.d.ts.map