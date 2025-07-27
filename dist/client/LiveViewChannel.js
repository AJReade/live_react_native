// TODO: Implement in Phase 1.3
import { Socket } from 'phoenix';
export class LiveViewChannel {
    constructor(options) {
        this.channel = null;
        this.currentTopic = null;
        this.connectionCallbacks = [];
        this.errorCallbacks = [];
        this.maxReconnectAttemptsCallback = null;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.connectionState = {
            connected: false,
            connecting: false,
            error: null,
            reconnectAttempt: 0,
        };
        const socketOptions = {};
        if (options.params) {
            socketOptions.params = options.params;
        }
        if (options.reconnectDelay) {
            socketOptions.reconnectAfterMs = options.reconnectDelay;
        }
        else {
            // Default exponential backoff: [1000, 2000, 5000, 10000, 30000]
            socketOptions.reconnectAfterMs = (tries) => {
                const delays = [1000, 2000, 5000, 10000, 30000];
                return delays[tries - 1] || 30000; // cap at 30s
            };
        }
        this.socket = new Socket(options.url, socketOptions);
    }
    connect() {
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
        this.socket.onError((error) => {
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
    disconnect() {
        if (this.channel) {
            this.channel.leave();
            this.channel = null;
            this.currentTopic = null;
        }
        this.socket.disconnect();
        this.connectionState.connected = false;
        this.connectionState.connecting = false;
    }
    joinLiveView(topic, params = {}, options = {}) {
        this.channel = this.socket.channel(topic, params);
        this.currentTopic = topic;
        this.channel.join()
            .receive('ok', (response) => {
            if (options.onJoin) {
                options.onJoin(response);
            }
        })
            .receive('error', (error) => {
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
        this.channel.onError((error) => {
            this.errorCallbacks.forEach(callback => callback(error));
        });
    }
    leaveLiveView(options = {}) {
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
    pushEvent(event, payload = {}, options = {}) {
        if (!this.channel) {
            throw new Error('Cannot push event: no LiveView channel joined');
        }
        this.channel.push(event, payload)
            .receive('ok', (response) => {
            if (options.onSuccess) {
                options.onSuccess(response);
            }
        })
            .receive('error', (error) => {
            if (options.onError) {
                options.onError(error);
            }
        });
    }
    onLiveViewUpdate(callback) {
        if (!this.channel) {
            return;
        }
        this.channel.on('live_react_native_update', callback);
    }
    // Event handler registration
    onConnectionChange(callback) {
        this.connectionCallbacks.push(callback);
    }
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
    onMaxReconnectAttempts(callback) {
        this.maxReconnectAttemptsCallback = callback;
    }
    // State getters
    isConnected() {
        return this.connectionState.connected;
    }
    getCurrentTopic() {
        return this.currentTopic;
    }
    getReconnectAttempts() {
        return this.connectionState.reconnectAttempt;
    }
    getConnectionState() {
        return { ...this.connectionState };
    }
}
