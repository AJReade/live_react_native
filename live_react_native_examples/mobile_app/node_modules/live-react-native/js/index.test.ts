// Simple test to verify Jest setup works
import { version } from './index';

describe('LiveReact Native', () => {
  it('should export the correct version', () => {
    expect(version).toBe('0.1.0');
  });

  it('should export all main functions', () => {
    // These should throw errors since they're stubs, but they should be defined
    const liveReactNative = require('./index');

    expect(typeof liveReactNative.useLiveView).toBe('function');
    expect(typeof liveReactNative.useLiveComponent).toBe('function');
    expect(typeof liveReactNative.useLiveUpload).toBe('function');
    expect(typeof liveReactNative.LiveProvider).toBe('function');
    expect(typeof liveReactNative.LiveComponent).toBe('function');
    expect(typeof liveReactNative.LiveViewChannel).toBe('function');
    expect(typeof liveReactNative.ComponentRegistry).toBe('function');
  });
});
