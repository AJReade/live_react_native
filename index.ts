// Main exports for LiveReact Native

// ✅ IMPLEMENTED: Core mobile-native functional API
export { createMobileClient } from './js/client/LiveViewChannel';
export { useLiveView } from './js/hooks/useLiveView';
export { useAdvancedUpdates } from './js/hooks/useAdvancedUpdates';
export { usePerformanceMonitoring } from './js/hooks/usePerformanceMonitoring';

// ❌ STUBS: Not yet implemented - will throw errors if used
export { useLiveComponent } from './js/hooks/useLiveComponent'; // TODO: Phase 2.2
export { useLiveUpload } from './js/hooks/useLiveUpload'; // TODO: Phase 5.3
export { LiveProvider } from './js/components/LiveProvider'; // TODO: Phase 2.3
export { LiveComponent } from './js/components/LiveComponent'; // TODO: Phase 2.2
export { ComponentRegistry } from './js/client/ComponentRegistry'; // TODO: Phase 2.2

// ✅ IMPLEMENTED: Mobile-native classes
export { MobileChannel } from './js/client/LiveViewChannel'; // Mobile Phoenix Channel transport

// ❌ LEGACY COMPATIBILITY: (Will be removed in breaking change)
export { createMobileClient as createLiveViewClient } from './js/client/LiveViewChannel'; // Legacy alias
export { MobileChannel as LiveViewChannel } from './js/client/LiveViewChannel'; // Legacy alias

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
} from './js/types';

// Legacy type aliases (for compatibility)
export type { MobileClientOptions as LiveViewClientOptions } from './js/types';
export type { MobileClient as LiveViewClient } from './js/types';

// Version
export const version = '0.1.0';