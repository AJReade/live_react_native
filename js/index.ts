// Main exports for LiveReact Native

// ✅ IMPLEMENTED: Core mobile-native functional API
export { createMobileClient } from './client/LiveViewChannel';
export { useLiveView } from './hooks/useLiveView';
export { useAdvancedUpdates } from './hooks/useAdvancedUpdates';
export { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

// ❌ STUBS: Not yet implemented - will throw errors if used
export { useLiveComponent } from './hooks/useLiveComponent'; // TODO: Phase 2.2
export { useLiveUpload } from './hooks/useLiveUpload'; // TODO: Phase 5.3
export { LiveProvider } from './components/LiveProvider'; // TODO: Phase 2.3
export { LiveComponent } from './components/LiveComponent'; // TODO: Phase 2.2
export { ComponentRegistry } from './client/ComponentRegistry'; // TODO: Phase 2.2

// ✅ IMPLEMENTED: Mobile-native classes
export { MobileChannel } from './client/LiveViewChannel'; // Mobile Phoenix Channel transport

// ❌ LEGACY COMPATIBILITY: (Will be removed in breaking change)
export { createMobileClient as createLiveViewClient } from './client/LiveViewChannel'; // Legacy alias
export { MobileChannel as LiveViewChannel } from './client/LiveViewChannel'; // Legacy alias

// Types
export type {
  // Legacy LiveView types (for compatibility)
  LiveViewOptions,
  LiveViewState,
  PushEventFunction,
  HandleEventFunction,
  LiveComponentProps,

  // New mobile-native types
  MobileClientOptions,
  MobileClient,
  MobileJoinOptions,
  MobileLeaveOptions,
  AssignsUpdate,
} from './types';

// Legacy type aliases (for compatibility)
export type { MobileClientOptions as LiveViewClientOptions } from './types';
export type { MobileClient as LiveViewClient } from './types';

// Version
export const version = '0.1.0';