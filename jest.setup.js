// import 'react-native-gesture-handler/jestSetup'; // Will enable when gesture handler is added

// Mock react-native modules that aren't available in Jest
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  // Mock modules that don't work well in Jest
  RN.NativeModules = {
    ...RN.NativeModules,
    // Add any native modules you need to mock
  };

  return RN;
});

// Mock WebSocket for Phoenix Channel testing
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
}));

// Mock console methods for cleaner test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global test timeout
jest.setTimeout(10000);