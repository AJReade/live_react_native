// Tests for MobileChannel - Mobile-native Phoenix Channel transport for React Native
import { MobileChannel, MobileChannel as LiveViewChannel } from './LiveViewChannel';
import { Socket } from 'phoenix';

// Mock Phoenix Socket and Channel
jest.mock('phoenix', () => ({
  Socket: jest.fn(),
}));

// **MOBILE-NATIVE FUNCTIONAL API TESTS (Phase 1.3 Complete)**
describe('createMobileClient() Functional API', () => {
  let createMobileClient: any;
  let mockSocket: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Phoenix Channel methods with chainable receive
    const mockJoinPush = {
      receive: jest.fn().mockReturnThis(),
    };
    const mockLeavePush = {
      receive: jest.fn().mockReturnThis(),
    };
    const mockEventPush = {
      receive: jest.fn().mockReturnThis(),
    };

    mockChannel = {
      join: jest.fn().mockReturnValue(mockJoinPush),
      leave: jest.fn().mockReturnValue(mockLeavePush),
      push: jest.fn().mockReturnValue(mockEventPush),
      on: jest.fn().mockReturnValue(123), // Return a reference number
      off: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
    };

    mockSocket = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      channel: jest.fn().mockReturnValue(mockChannel),
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
    };

    (Socket as jest.Mock).mockReturnValue(mockSocket);

    // Import the mobile client function
    try {
      createMobileClient = require('./LiveViewChannel').createMobileClient;
    } catch {
      // Function doesn't exist yet - this test should fail initially
      createMobileClient = () => { throw new Error('createMobileClient not implemented'); };
    }
  });

  describe('Factory Function', () => {
    test('createMobileClient creates a client instance', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile',
        params: { user_id: 'user123', token: 'jwt-token' }
      });

      expect(client).toBeDefined();
      expect(typeof client.connect).toBe('function');
      expect(typeof client.disconnect).toBe('function');
      expect(typeof client.join).toBe('function');
      expect(typeof client.leave).toBe('function');
      expect(typeof client.pushEvent).toBe('function');
      expect(typeof client.handleEvent).toBe('function');
      expect(typeof client.getChannel).toBe('function');
    });

    test('createMobileClient accepts mobile configuration options', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile',
        params: { user_id: 'user123', token: 'jwt-token' },
        reconnectDelay: (attempt) => attempt * 1000,
        debug: true
      });

      expect(client).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    test('client.connect() returns a Promise', async () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      // Should return a Promise
      const connectPromise = client.connect();
      expect(connectPromise).toBeInstanceOf(Promise);

      // Simulate successful connection
      const onOpenCallback = mockSocket.onOpen.mock.calls[0][0];
      onOpenCallback();

      await expect(connectPromise).resolves.toBeUndefined();
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    test('client.disconnect() immediately disconnects', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      client.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Mobile Channel Management', () => {
    test('client.join(topic, params, onAssignsUpdate) joins with mobile channel signature', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      const onAssignsUpdate = jest.fn();
      client.join('/counter', { user_id: 'user123' }, onAssignsUpdate);

      expect(mockSocket.channel).toHaveBeenCalledWith('mobile:/counter', { user_id: 'user123', token: null });
      expect(mockChannel.join).toHaveBeenCalled();

      // Should set up assigns update callback
      expect(mockChannel.on).toHaveBeenCalledWith('assigns_update', expect.any(Function));
    });

    test('client.leave() leaves current mobile channel', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      // First join
      client.join('/counter', {}, jest.fn());

      // Then leave
      client.leave();

      expect(mockChannel.leave).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    test('client.pushEvent(event, payload) sends event without callback', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      client.join('/counter', {}, jest.fn());
      client.pushEvent('increment', { amount: 1 });

      expect(mockChannel.push).toHaveBeenCalledWith('increment', { amount: 1 });
    });

    test('client.pushEvent(event, payload, onReply) sends event with callback', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      const onReply = jest.fn();
      client.join('/counter', {}, jest.fn());
      const ref = client.pushEvent('validate', { data: 'test' }, onReply);

      expect(mockChannel.push).toHaveBeenCalledWith('validate', { data: 'test' });
      expect(typeof ref).toBe('number'); // Should return a reference number
    });

    test('client.handleEvent(event, callback) returns unsubscribe function', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      // First join a mobile channel to make channel available
      client.join('/test', {}, jest.fn());

      const callback = jest.fn();
      const unsubscribe = client.handleEvent('user_updated', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(mockChannel.on).toHaveBeenCalledWith('user_updated', callback);

      // Test unsubscribe - should call off with event name and reference number
      unsubscribe();
      expect(mockChannel.off).toHaveBeenCalledWith('user_updated', expect.any(Number));
    });

    test('client.handleEvent handles RN commands automatically', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      client.join('/counter', {}, jest.fn());

      // Should automatically handle rn:haptic events
      expect(mockChannel.on).toHaveBeenCalledWith('rn:haptic', expect.any(Function));
      expect(mockChannel.on).toHaveBeenCalledWith('rn:navigate', expect.any(Function));
      expect(mockChannel.on).toHaveBeenCalledWith('rn:vibrate', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    test('client.pushEvent throws error when not joined', () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile'
      });

      expect(() => {
        client.pushEvent('increment', {});
      }).toThrow('Cannot push event: not joined to a mobile channel');
    });

    test('client.connect handles connection errors', async () => {
      const client = createMobileClient({
        url: 'ws://localhost:4000/mobile',
        onError: jest.fn(),
        onReconnect: jest.fn()
      });

      const connectPromise = client.connect();

      // Simulate connection error
      const onErrorCallback = mockSocket.onError.mock.calls[0][0];
      onErrorCallback(new Error('Connection failed'));

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });
  });
});

// =============================================================================
// LEGACY TESTS REMOVED (Phase 1.3 Refactor Complete)
// =============================================================================
//
// The old `LiveViewChannel` class tests have been removed because we've moved
// to a completely mobile-native functional API with `createMobileClient()`.
//
// ✅ WHAT'S TESTED ABOVE:
// - Mobile Phoenix Channel transport (not LiveView browser transport)
// - createMobileClient() functional API (not class-based)
// - Mobile authentication (user_id, tokens - not browser sessions)
// - Mobile channel topics (mobile:/counter - not lv:/counter)
// - All core functionality: connect, join, pushEvent, handleEvent
// - RN command handling (haptic, navigate, vibrate)
// - Error handling for mobile scenarios
//
// ❌ WHAT'S NOT NEEDED:
// - Legacy LiveViewChannel class constructor tests
// - Browser-specific LiveView session management
// - LiveView-specific join parameters (session, static, _mounts)
// - Browser-specific error scenarios
//
// All essential mobile functionality is comprehensively tested above.
// The mobile-native approach completely bypasses the "stale" session issues
// that plagued the LiveView browser transport.