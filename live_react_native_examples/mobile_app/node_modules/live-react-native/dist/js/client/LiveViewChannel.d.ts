import { Channel } from 'phoenix';
import { LiveViewOptions, LiveViewJoinOptions, LiveViewLeaveOptions, PushEventOptions, ConnectionState, LiveViewAssignsUpdate } from '../types';
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
    onAssignsUpdate(callback: (update: LiveViewAssignsUpdate) => void): void;
    onConnectionChange(callback: (connected: boolean) => void): void;
    onError(callback: (error: Error) => void): void;
    onMaxReconnectAttempts(callback: () => void): void;
    isConnected(): boolean;
    getCurrentTopic(): string | null;
    getReconnectAttempts(): number;
    getConnectionState(): ConnectionState;
    getChannel(): Channel | null;
}
export interface LiveViewClientOptions {
    url: string;
    params?: Record<string, any>;
    reconnectDelay?: (attempt: number) => number;
    debug?: boolean;
    onError?: (error: Error) => void;
    onReconnect?: () => void;
}
export interface LiveViewClient {
    connect(): Promise<void>;
    disconnect(): void;
    joinLiveView(path: string, params: Record<string, any>, onAssignsUpdate: (assigns: Record<string, any>) => void): void;
    leaveLiveView(): void;
    pushEvent(event: string, payload?: Record<string, any>, onReply?: (reply: any, ref: number) => void): number;
    pushEventTo(target: string, event: string, payload?: Record<string, any>, onReply?: (reply: any, ref: number) => void): number;
    handleEvent(event: string, callback: (payload: any) => void): () => void;
}
export declare function createLiveViewClient(options: LiveViewClientOptions): LiveViewClient;
//# sourceMappingURL=LiveViewChannel.d.ts.map