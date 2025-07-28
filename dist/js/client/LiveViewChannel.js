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
    onAssignsUpdate(callback) {
        if (!this.channel) {
            return;
        }
        this.channel.on('assigns_update', callback);
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
    // Channel getter for functional API
    getChannel() {
        return this.channel;
    }
}
// Factory function that creates a LiveView client instance
export function createLiveViewClient(options) {
    const channel = new LiveViewChannel({
        url: options.url,
        params: options.params,
        reconnectDelay: options.reconnectDelay,
    });
    let eventRef = 0;
    const eventHandlers = new Map();
    // Built-in RN command handlers
    const setupRNCommandHandlers = () => {
        // Auto-handle React Native specific commands
        channel.getChannel()?.on('rn:haptic', (payload) => {
            if (options.debug) {
                console.log('RN Command: haptic', payload);
            }
            // TODO: Implement actual haptic feedback in React Native
        });
        channel.getChannel()?.on('rn:navigate', (payload) => {
            if (options.debug) {
                console.log('RN Command: navigate', payload);
            }
            // TODO: Implement actual navigation in React Native
        });
        channel.getChannel()?.on('rn:vibrate', (payload) => {
            if (options.debug) {
                console.log('RN Command: vibrate', payload);
            }
            // TODO: Implement actual vibration in React Native
        });
    };
    const client = {
        connect() {
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
        disconnect() {
            channel.disconnect();
        },
        joinLiveView(path, params, onAssignsUpdate) {
            channel.joinLiveView(path, params, {
                onJoin: (response) => {
                    if (response.assigns) {
                        onAssignsUpdate(response.assigns);
                    }
                },
                onError: (error) => {
                    if (options.onError) {
                        options.onError(new Error(`Failed to join LiveView: ${JSON.stringify(error)}`));
                    }
                }
            });
            // Set up assigns update listener - use the channel directly for test compatibility
            channel.getChannel()?.on('assigns_update', (update) => {
                onAssignsUpdate(update.assigns);
            });
            // Set up RN command handlers
            setupRNCommandHandlers();
        },
        leaveLiveView() {
            channel.leaveLiveView();
        },
        pushEvent(event, payload = {}, onReply) {
            if (!channel.getChannel()) {
                throw new Error('Cannot push event: not joined to a LiveView');
            }
            const ref = ++eventRef;
            if (onReply) {
                channel.pushEvent(event, payload, {
                    onSuccess: (response) => onReply(response, ref),
                    onError: (error) => onReply({ error }, ref),
                    onTimeout: () => onReply({ error: 'timeout' }, ref),
                });
            }
            else {
                channel.pushEvent(event, payload);
            }
            return ref;
        },
        pushEventTo(target, event, payload = {}, onReply) {
            // Add phx_target to payload for LiveComponent targeting
            const targetedPayload = {
                ...payload,
                phx_target: target,
            };
            return client.pushEvent(event, targetedPayload, onReply);
        },
        handleEvent(event, callback) {
            // Always try to register immediately if channel exists
            if (channel.getChannel()) {
                const ref = channel.getChannel().on(event, callback);
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
            eventHandlers.get(event).add(callback);
            return () => {
                eventHandlers.get(event)?.delete(callback);
            };
        },
    };
    return client;
}
