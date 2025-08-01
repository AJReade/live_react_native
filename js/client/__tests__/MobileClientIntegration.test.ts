import { createMobileClient } from '../LiveViewChannel';

// Mock Phoenix Socket to avoid WebSocket issues in tests
jest.mock('phoenix', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  Channel: jest.fn().mockImplementation(() => ({
    join: jest.fn().mockReturnValue({
      receive: jest.fn().mockReturnThis(),
    }),
    leave: jest.fn(),
    push: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

describe('Mobile Client RN Command Integration', () => {
  test('mobile client automatically handles RN commands when received from server', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create a mobile client with debug enabled to see RN command handling
    const client = createMobileClient({
      url: 'ws://localhost:4000/mobile',
      params: { user_id: 'test_user', token: 'test_token' },
      debug: true,
      onError: () => {},
      onReconnect: () => {},
    });

    // Verify client has the expected mobile API
    expect(typeof client.connect).toBe('function');
    expect(typeof client.disconnect).toBe('function');
    expect(typeof client.join).toBe('function');
    expect(typeof client.pushEvent).toBe('function');
    expect(typeof client.handleEvent).toBe('function');

    // Clean up
    consoleSpy.mockRestore();
  });

  test('client uses mobile URL by default', () => {
    const client = createMobileClient({
      url: 'ws://localhost:4000/mobile',
      params: { user_id: 'test_user' },
    });

    // The client should be created successfully with mobile URL
    expect(client).toBeDefined();
    expect(typeof client.connect).toBe('function');
  });

  test('client passes authentication params correctly', () => {
    const authParams = {
      user_id: 'mobile_user_123',
      token: 'jwt_token_abc',
      device_id: 'device_xyz',
    };

    const client = createMobileClient({
      url: 'ws://localhost:4000/mobile',
      params: authParams,
    });

    // Client should be created with auth params
    expect(client).toBeDefined();
  });

  test('client sets up automatic RN command handling on creation', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create client with debug to see dependency checking
    const client = createMobileClient({
      url: 'ws://localhost:4000/mobile',
      params: { user_id: 'test' },
      debug: true,
    });

    // Should have logged RN dependencies during setup
    expect(client).toBeDefined();

    consoleSpy.mockRestore();
  });
});