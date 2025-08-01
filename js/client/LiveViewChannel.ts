// Mobile-native Phoenix Channel transport (Phase 1.3 refactor)
import { Socket, Channel } from 'phoenix';
import {
  MobileClientOptions,
  MobileJoinOptions,
  MobileLeaveOptions,
  MobileClient,
  PushEventOptions,
  ConnectionState,
  AssignsUpdate,
} from '../types';
import { RNCommandHandlers } from './RNCommandHandlers';

export class MobileChannel {
  private socket: Socket;
  private channel: Channel | null = null;
  private currentTopic: string | null = null;
  private connectionState: ConnectionState;
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private maxReconnectAttemptsCallback: (() => void) | null = null;
  private maxReconnectAttempts: number;
  private userId: string | null = null;      // Mobile user identification
  private authToken: string | null = null;   // Mobile auth token (JWT, etc.)
  private debugMode: boolean = false;        // Debug logging

  constructor(options: MobileClientOptions) {
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.debugMode = options.debug || false;

    // Extract mobile authentication from params
    if (options.params) {
      this.userId = options.params.user_id || null;
      this.authToken = options.params.token || null;
    }

    this.connectionState = {
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempt: 0,
    };

    const socketOptions: any = {};

    if (options.params) {
      socketOptions.params = options.params;
    }

    if (options.reconnectDelay) {
      socketOptions.reconnectAfterMs = options.reconnectDelay;
    } else {
      // Default exponential backoff: [1000, 2000, 5000, 10000, 30000]
      socketOptions.reconnectAfterMs = (tries: number) => {
        const delays = [1000, 2000, 5000, 10000, 30000];
        return delays[tries - 1] || 30000; // cap at 30s
      };
    }

    this.socket = new Socket(options.url, socketOptions);
  }

  connect(): void {
    this.connectionState.connecting = true;

    this.socket.onOpen(() => {
      this.connectionState.connected = true;
      this.connectionState.connecting = false;
      this.connectionState.error = null;
      this.connectionState.reconnectAttempt = 0; // Reset on successful connection

      this.connectionCallbacks.forEach(callback => callback(true));
    });

    this.socket.onClose(() => {
      this.connectionState.connected = false;
      this.connectionState.connecting = false;

      this.connectionCallbacks.forEach(callback => callback(false));
    });

    this.socket.onError((error: Error) => {
      this.connectionState.error = error;
      this.connectionState.connecting = false;
      this.connectionState.reconnectAttempt += 1;

      this.errorCallbacks.forEach(callback => callback(error));

      // Check if we've exceeded max reconnect attempts
      if (this.connectionState.reconnectAttempt >= this.maxReconnectAttempts) {
        if (this.maxReconnectAttemptsCallback) {
          this.maxReconnectAttemptsCallback();
        }
      }
    });

    this.socket.connect();
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.leave();
      this.channel = null;
      this.currentTopic = null;
    }

    this.socket.disconnect();
    this.connectionState.connected = false;
    this.connectionState.connecting = false;
  }

  join(topic: string, params: Record<string, any> = {}, options: MobileJoinOptions = {}): void {
    // Format topic for Phoenix Channel: mobile: + path (standard channel topic)
    const channelTopic = topic.startsWith('mobile:') ? topic : `mobile:${topic}`;

    // Mobile-native Phoenix Channel join parameters (no LiveView-specific structure)
    const mobileJoinParams = {
      // Standard Phoenix Channel parameters
      user_id: this.userId,
      token: this.authToken,
      ...params  // Allow additional mobile-specific params
    };

    // Log the join parameters for debugging
    if (this.debugMode) {
      console.log('📱 Mobile channel join params:', JSON.stringify(mobileJoinParams, null, 2));
    }

    this.channel = this.socket.channel(channelTopic, mobileJoinParams);
    this.currentTopic = channelTopic;

    this.channel.join()
      .receive('ok', (response: any) => {
        if (this.debugMode) {
          console.log('✅ Mobile channel join successful:', response);
        }
        if (options.onJoin) {
          options.onJoin(response);
        }
      })
      .receive('error', (error: any) => {
        if (this.debugMode) {
          console.error('❌ Mobile channel join error:', error);
        }
        if (options.onError) {
          options.onError(error);
        }
      })
      .receive('timeout', () => {
        if (this.debugMode) {
          console.warn('⏰ Mobile channel join timeout');
        }
        if (options.onError) {
          options.onError({ reason: 'timeout' });
        }
      });

    this.channel.onClose(() => {
      this.currentTopic = null;
    });

    this.channel.onError((error: Error) => {
      this.errorCallbacks.forEach(callback => callback(error));
    });
  }

  leave(options: MobileLeaveOptions = {}): void {
    if (!this.channel) {
      return;
    }

    this.channel.leave()
      .receive('ok', () => {
        if (options.onLeave) {
          options.onLeave();
        }
      });

    this.channel = null;
    this.currentTopic = null;
  }

  pushEvent(event: string, payload: Record<string, any> = {}, options: PushEventOptions = {}): void {
    if (!this.channel) {
      throw new Error('Cannot push event: no mobile channel joined');
    }

    this.channel.push(event, payload)
      .receive('ok', (response: any) => {
        if (options.onSuccess) {
          options.onSuccess(response);
        }
      })
      .receive('error', (error: any) => {
        if (options.onError) {
          options.onError(error);
        }
      });
  }

  onAssignsUpdate(callback: (update: AssignsUpdate) => void): void {
    if (!this.channel) {
      return;
    }

    this.channel.on('assigns_update', callback);
  }

  // Event handler registration
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  onMaxReconnectAttempts(callback: () => void): void {
    this.maxReconnectAttemptsCallback = callback;
  }

  // State getters
  isConnected(): boolean {
    return this.connectionState.connected;
  }

  getCurrentTopic(): string | null {
    return this.currentTopic;
  }

  getReconnectAttempts(): number {
    return this.connectionState.reconnectAttempt;
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  // Channel getter for functional API
  getChannel(): Channel | null {
    return this.channel;
  }
}

// **NEW FUNCTIONAL API (Phase 1.3)**

// Mobile client interfaces are now defined in types.ts

// Factory function that creates a mobile client instance
export function createMobileClient(options: MobileClientOptions): MobileClient {
  const channel = new MobileChannel({
    url: options.url,
    params: options.params,
    reconnectDelay: options.reconnectDelay,
    maxReconnectAttempts: options.maxReconnectAttempts,
    debug: options.debug,
  });

  let eventRef = 0;
  const eventHandlers = new Map<string, Set<(data: any) => void>>();

  // Built-in RN command handlers
  const rnHandlers = new RNCommandHandlers();
  const setupRNCommandHandlers = () => {
    // List of all RN commands that should be handled automatically
    const rnCommands = [
      'rn:haptic', 'rn:navigate', 'rn:go_back', 'rn:reset_stack', 'rn:replace',
      'rn:vibrate', 'rn:notification', 'rn:badge', 'rn:toast', 'rn:alert',
      'rn:dismiss_keyboard', 'rn:show_loading', 'rn:hide_loading'
    ];

    // Auto-handle all React Native specific commands
    rnCommands.forEach(command => {
      channel.getChannel()?.on(command, async (payload: any) => {
        if (options.debug) {
          console.log(`RN Command: ${command}`, payload);
        }

        // Automatically execute the RN command
        await rnHandlers.handleEvent(command, payload);
      });
    });

    // Log available dependencies if in debug mode
    if (options.debug) {
      const deps = rnHandlers.checkDependencies();
      console.log('RN Dependencies available:', deps);
    }
  };

  const client: MobileClient = {
    connect(): Promise<void> {
      return new Promise((resolve, reject) => {
        let resolved = false;

        channel.onConnectionChange((connected) => {
          if (connected && !resolved) {
            resolved = true;
            if (options.onReconnect) {
              options.onReconnect();
            }
            resolve();
          }
        });

        channel.onError((error) => {
          if (!resolved) {
            resolved = true;
            if (options.onError) {
              options.onError(error);
            }
            reject(error);
          }
        });

        channel.connect();
      });
    },

    disconnect(): void {
      channel.disconnect();
    },

    join(topic: string, params: Record<string, any>, onAssignsUpdate: (assigns: Record<string, any>) => void): void {
      channel.join(topic, params, {
        onJoin: (response: any) => {
          if (response.assigns) {
            onAssignsUpdate(response.assigns);
          }
        },
        onError: (error: any) => {
          if (options.onError) {
            options.onError(new Error(`Failed to join mobile channel: ${JSON.stringify(error)}`));
          }
        }
      });

      // Set up assigns update listener - mobile channel compatibility
      channel.getChannel()?.on('assigns_update', (update: AssignsUpdate) => {
        onAssignsUpdate(update.assigns);
      });

      // Set up RN command handlers
      setupRNCommandHandlers();
    },

    leave(): void {
      channel.leave();
    },

    pushEvent(event: string, payload: Record<string, any> = {}, onReply?: (reply: any, ref: number) => void): number {
      if (!channel.getChannel()) {
        throw new Error('Cannot push event: not joined to a mobile channel');
      }

      const ref = ++eventRef;

      if (onReply) {
        channel.pushEvent(event, payload, {
          onSuccess: (response: any) => onReply(response, ref),
          onError: (error: any) => onReply({ error }, ref),
          onTimeout: () => onReply({ error: 'timeout' }, ref),
        });
      } else {
        channel.pushEvent(event, payload);
      }

      return ref;
    },

    handleEvent(event: string, callback: (payload: any) => void): () => void {
      // Always try to register immediately if channel exists
      if (channel.getChannel()) {
        const ref = channel.getChannel()!.on(event, callback);
        return () => {
          if (typeof ref === 'number') {
            channel.getChannel()?.off(event, ref);
          }
        };
      }

      // Store for later when channel is available
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(callback);

      return () => {
        eventHandlers.get(event)?.delete(callback);
      };
    },

    getChannel(): any {
      return channel.getChannel();
    },
  };

  return client;
}

// Export types
export type { MobileClient };