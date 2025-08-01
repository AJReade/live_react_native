import { ReactNode } from 'react';

// LiveView Connection Types
export interface LiveViewOptions {
  url: string;
  path?: string;
  params?: Record<string, any>;
  connect?: boolean;
  reconnectOnError?: boolean;
  reconnectDelay?: (tries: number) => number;
  maxReconnectAttempts?: number;
  debug?: boolean;  // Added for debug logging
}

// LiveView Channel Join/Leave Options
export interface LiveViewJoinOptions {
  onJoin?: (response: any) => void;
  onError?: (error: any) => void;
  onTimeout?: () => void;
}

export interface LiveViewLeaveOptions {
  onLeave?: () => void;
}

// Event Push Options
export interface PushEventOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  onTimeout?: () => void;
}

// Connection State
export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectAttempt: number;
}

// LiveView Assigns Update (from backend)
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

// Event Handling Types
export type PushEventFunction = (
  event: string,
  payload?: Record<string, any>,
  target?: string
) => void;

export type HandleEventFunction = (
  event: string,
  callback: (payload: any) => void
) => () => void; // Returns cleanup function

export type UploadFunction = (
  name: string,
  files: File[],
  options?: UploadOptions
) => void;

// Component Types
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

// Upload Types
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

// Channel Types
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

// Context Types
export interface LiveContextValue {
  state: LiveViewState;
  pushEvent: PushEventFunction;
  pushEventTo: PushEventFunction;
  handleEvent: HandleEventFunction;
  removeHandleEvent: (event: string) => void;
  upload: UploadFunction;
  uploadTo: UploadFunction;
}

// Hook Return Types
export interface UseLiveViewReturn extends LiveContextValue {
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

// ======================================
// MOBILE-NATIVE PHOENIX CHANNEL TYPES
// ======================================

// Mobile Client Connection Types (replaces LiveViewOptions)
export interface MobileClientOptions {
  url: string;                                      // Phoenix Channel WebSocket URL (e.g., 'ws://localhost:4000/mobile')
  params?: {
    user_id?: string;                               // Mobile user identification
    token?: string;                                 // JWT or other mobile auth token
    device_id?: string;                             // Device identification
    [key: string]: any;                             // Other mobile-specific params
  };
  reconnectDelay?: (tries: number) => number;       // Reconnection strategy
  maxReconnectAttempts?: number;                    // Max reconnection attempts
  debug?: boolean;                                  // Debug logging
  onError?: (error: Error) => void;                 // Error callback
  onReconnect?: () => void;                         // Reconnection callback
}

// Mobile Channel Join/Leave Options (replaces LiveViewJoinOptions)
export interface MobileJoinOptions {
  onJoin?: (response: any) => void;                 // Successful join callback
  onError?: (error: any) => void;                   // Join error callback
  onTimeout?: () => void;                           // Join timeout callback
}

export interface MobileLeaveOptions {
  onLeave?: () => void;                             // Leave callback
}

// Mobile Assigns Update (simplified from LiveViewAssignsUpdate)
export interface AssignsUpdate {
  assigns: Record<string, any>;                     // Clean assigns from server
  changed: boolean;                                 // Whether anything changed
}

// Mobile Client Interface (replaces LiveViewClient)
export interface MobileClient {
  connect(): Promise<void>;                         // Connect to Phoenix Channel
  disconnect(): void;                               // Disconnect from channel
  join(topic: string, params: Record<string, any>, onAssignsUpdate: (assigns: Record<string, any>) => void): void;  // Join channel
  leave(): void;                                    // Leave current channel
  pushEvent(event: string, payload: Record<string, any>, onReply?: (reply: any, ref: number) => void): number;      // Send event
  handleEvent(event: string, callback: (payload: any) => void): () => void;  // Handle events from server
  getChannel(): any;                                // Get underlying Phoenix channel (for testing)
}

// Mobile Client Factory Options
export interface MobileClientFactoryOptions extends MobileClientOptions {
  // Inherits all MobileClientOptions
}