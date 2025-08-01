import { Channel } from 'phoenix';
import { MobileClientOptions, MobileJoinOptions, MobileLeaveOptions, MobileClient, PushEventOptions, ConnectionState, AssignsUpdate } from '../types';
export declare class MobileChannel {
    private socket;
    private channel;
    private currentTopic;
    private connectionState;
    private connectionCallbacks;
    private errorCallbacks;
    private maxReconnectAttemptsCallback;
    private maxReconnectAttempts;
    private userId;
    private authToken;
    private debugMode;
    constructor(options: MobileClientOptions);
    connect(): void;
    disconnect(): void;
    join(topic: string, params?: Record<string, any>, options?: MobileJoinOptions): void;
    leave(options?: MobileLeaveOptions): void;
    pushEvent(event: string, payload?: Record<string, any>, options?: PushEventOptions): void;
    onAssignsUpdate(callback: (update: AssignsUpdate) => void): void;
    onConnectionChange(callback: (connected: boolean) => void): void;
    onError(callback: (error: Error) => void): void;
    onMaxReconnectAttempts(callback: () => void): void;
    isConnected(): boolean;
    getCurrentTopic(): string | null;
    getReconnectAttempts(): number;
    getConnectionState(): ConnectionState;
    getChannel(): Channel | null;
}
export declare function createMobileClient(options: MobileClientOptions): MobileClient;
export type { MobileClient };
//# sourceMappingURL=LiveViewChannel.d.ts.map