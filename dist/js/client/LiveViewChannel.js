"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileChannel = void 0;
exports.createMobileClient = createMobileClient;
// Mobile-native Phoenix Channel transport (Phase 1.3 refactor)
const phoenix_1 = require("phoenix");
const RNCommandHandlers_1 = require("./RNCommandHandlers");
class MobileChannel {
    constructor(options) {
        this.channel = null;
        this.currentTopic = null;
        this.connectionCallbacks = [];
        this.errorCallbacks = [];
        this.maxReconnectAttemptsCallback = null;
        this.userId = null; // Mobile user identification
        this.authToken = null; // Mobile auth token (JWT, etc.)
        this.debugMode = false; // Debug logging
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
        this.socket = new phoenix_1.Socket(options.url, socketOptions);
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
    join(topic, params = {}, options = {}) {
        // Format topic for Phoenix Channel: mobile: + path (standard channel topic)
        const channelTopic = topic.startsWith('mobile:') ? topic : `mobile:${topic}`;
        // Mobile-native Phoenix Channel join parameters (no LiveView-specific structure)
        const mobileJoinParams = {
            // Standard Phoenix Channel parameters
            user_id: this.userId,
            token: this.authToken,
            ...params // Allow additional mobile-specific params
        };
        // Log the join parameters for debugging
        if (this.debugMode) {
            console.log('📱 Mobile channel join params:', JSON.stringify(mobileJoinParams, null, 2));
        }
        this.channel = this.socket.channel(channelTopic, mobileJoinParams);
        this.currentTopic = channelTopic;
        this.channel.join()
            .receive('ok', (response) => {
            if (this.debugMode) {
                console.log('✅ Mobile channel join successful:', response);
            }
            if (options.onJoin) {
                options.onJoin(response);
            }
        })
            .receive('error', (error) => {
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
        this.channel.onError((error) => {
            this.errorCallbacks.forEach(callback => callback(error));
        });
    }
    leave(options = {}) {
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
            throw new Error('Cannot push event: no mobile channel joined');
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
exports.MobileChannel = MobileChannel;
// **NEW FUNCTIONAL API (Phase 1.3)**
// Mobile client interfaces are now defined in types.ts
// Factory function that creates a mobile client instance
function createMobileClient(options) {
    const channel = new MobileChannel({
        url: options.url,
        params: options.params,
        reconnectDelay: options.reconnectDelay,
        maxReconnectAttempts: options.maxReconnectAttempts,
        debug: options.debug,
    });
    let eventRef = 0;
    const eventHandlers = new Map();
    // Built-in RN command handlers
    const rnHandlers = new RNCommandHandlers_1.RNCommandHandlers();
    const setupRNCommandHandlers = () => {
        // List of all RN commands that should be handled automatically
        const rnCommands = [
            'rn:haptic', 'rn:navigate', 'rn:go_back', 'rn:reset_stack', 'rn:replace',
            'rn:vibrate', 'rn:notification', 'rn:badge', 'rn:toast', 'rn:alert',
            'rn:dismiss_keyboard', 'rn:show_loading', 'rn:hide_loading'
        ];
        // Auto-handle all React Native specific commands
        rnCommands.forEach(command => {
            channel.getChannel()?.on(command, async (payload) => {
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
        join(topic, params, onAssignsUpdate) {
            channel.join(topic, params, {
                onJoin: (response) => {
                    if (response.assigns) {
                        onAssignsUpdate(response.assigns);
                    }
                },
                onError: (error) => {
                    if (options.onError) {
                        options.onError(new Error(`Failed to join mobile channel: ${JSON.stringify(error)}`));
                    }
                }
            });
            // Set up assigns update listener - mobile channel compatibility
            channel.getChannel()?.on('assigns_update', (update) => {
                onAssignsUpdate(update.assigns);
            });
            // Set up RN command handlers
            setupRNCommandHandlers();
        },
        leave() {
            channel.leave();
        },
        pushEvent(event, payload = {}, onReply) {
            if (!channel.getChannel()) {
                throw new Error('Cannot push event: not joined to a mobile channel');
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
        getChannel() {
            return channel.getChannel();
        },
    };
    return client;
}
