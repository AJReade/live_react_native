// TODO: Implement in Phase 1.3
import { Socket, Channel } from 'phoenix';
import {
  LiveViewOptions,
  LiveViewJoinOptions,
  LiveViewLeaveOptions,
  PushEventOptions,
  ConnectionState,
  LiveViewAssignsUpdate,
} from '../types';

export class LiveViewChannel {
  private socket: Socket;
  private channel: Channel | null = null;
  private currentTopic: string | null = null;
  private connectionState: ConnectionState;
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private maxReconnectAttemptsCallback: (() => void) | null = null;
  private maxReconnectAttempts: number;

  constructor(options: LiveViewOptions) {
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;

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

  joinLiveView(topic: string, params: Record<string, any> = {}, options: LiveViewJoinOptions = {}): void {
    this.channel = this.socket.channel(topic, params);
    this.currentTopic = topic;

    this.channel.join()
      .receive('ok', (response: any) => {
        if (options.onJoin) {
          options.onJoin(response);
        }
      })
      .receive('error', (error: any) => {
        if (options.onError) {
          options.onError(error);
        }
      })
      .receive('timeout', () => {
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

  leaveLiveView(options: LiveViewLeaveOptions = {}): void {
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
      throw new Error('Cannot push event: no LiveView channel joined');
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

  onAssignsUpdate(callback: (update: LiveViewAssignsUpdate) => void): void {
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
}