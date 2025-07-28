import { ReactNode } from 'react';
export interface LiveViewOptions {
    url: string;
    path?: string;
    params?: Record<string, any>;
    connect?: boolean;
    reconnectOnError?: boolean;
    reconnectDelay?: (tries: number) => number;
    maxReconnectAttempts?: number;
}
export interface LiveViewJoinOptions {
    onJoin?: (response: any) => void;
    onError?: (error: any) => void;
    onTimeout?: () => void;
}
export interface LiveViewLeaveOptions {
    onLeave?: () => void;
}
export interface PushEventOptions {
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    onTimeout?: () => void;
}
export interface ConnectionState {
    connected: boolean;
    connecting: boolean;
    error: Error | null;
    reconnectAttempt: number;
}
export interface LiveViewAssignsUpdate {
    assigns: Record<string, any>;
    changed: boolean;
}
export interface LiveViewState {
    assigns: Record<string, any>;
    connected: boolean;
    connecting: boolean;
    error?: string;
    reconnectAttempt: number;
}
export type PushEventFunction = (event: string, payload?: Record<string, any>, target?: string) => void;
export type HandleEventFunction = (event: string, callback: (payload: any) => void) => () => void;
export type UploadFunction = (name: string, files: File[], options?: UploadOptions) => void;
export interface LiveComponentProps {
    name: string;
    assigns?: Record<string, any>;
    children?: ReactNode;
    [key: string]: any;
}
export interface ComponentRegistryEntry {
    component: React.ComponentType<any>;
    displayName?: string;
}
export interface UploadOptions {
    onProgress?: (progress: number) => void;
    onComplete?: (response: any) => void;
    onError?: (error: string) => void;
}
export interface UploadEntry {
    name: string;
    progress: number;
    error?: string;
    completed: boolean;
}
export interface ChannelMessage {
    event: string;
    payload: any;
    ref?: string;
}
export interface LiveViewMessage {
    type: 'mount' | 'update' | 'event' | 'upload';
    assigns?: Record<string, any>;
    event?: string;
    payload?: any;
}
export interface LiveContextValue {
    state: LiveViewState;
    pushEvent: PushEventFunction;
    pushEventTo: PushEventFunction;
    handleEvent: HandleEventFunction;
    removeHandleEvent: (event: string) => void;
    upload: UploadFunction;
    uploadTo: UploadFunction;
}
export interface UseLiveViewReturn extends LiveContextValue {
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;
}
//# sourceMappingURL=types.d.ts.map