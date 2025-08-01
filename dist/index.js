"use strict";
// Main exports for LiveReact Native
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.LiveViewChannel = exports.createLiveViewClient = exports.MobileChannel = exports.ComponentRegistry = exports.LiveComponent = exports.LiveProvider = exports.useLiveUpload = exports.useLiveComponent = exports.usePerformanceMonitoring = exports.useAdvancedUpdates = exports.useLiveView = exports.createMobileClient = void 0;
// ✅ IMPLEMENTED: Core mobile-native functional API
var LiveViewChannel_1 = require("./js/client/LiveViewChannel");
Object.defineProperty(exports, "createMobileClient", { enumerable: true, get: function () { return LiveViewChannel_1.createMobileClient; } });
var useLiveView_1 = require("./js/hooks/useLiveView");
Object.defineProperty(exports, "useLiveView", { enumerable: true, get: function () { return useLiveView_1.useLiveView; } });
var useAdvancedUpdates_1 = require("./js/hooks/useAdvancedUpdates");
Object.defineProperty(exports, "useAdvancedUpdates", { enumerable: true, get: function () { return useAdvancedUpdates_1.useAdvancedUpdates; } });
var usePerformanceMonitoring_1 = require("./js/hooks/usePerformanceMonitoring");
Object.defineProperty(exports, "usePerformanceMonitoring", { enumerable: true, get: function () { return usePerformanceMonitoring_1.usePerformanceMonitoring; } });
// ❌ STUBS: Not yet implemented - will throw errors if used
var useLiveComponent_1 = require("./js/hooks/useLiveComponent"); // TODO: Phase 2.2
Object.defineProperty(exports, "useLiveComponent", { enumerable: true, get: function () { return useLiveComponent_1.useLiveComponent; } });
var useLiveUpload_1 = require("./js/hooks/useLiveUpload"); // TODO: Phase 5.3
Object.defineProperty(exports, "useLiveUpload", { enumerable: true, get: function () { return useLiveUpload_1.useLiveUpload; } });
var LiveProvider_1 = require("./js/components/LiveProvider"); // TODO: Phase 2.3
Object.defineProperty(exports, "LiveProvider", { enumerable: true, get: function () { return LiveProvider_1.LiveProvider; } });
var LiveComponent_1 = require("./js/components/LiveComponent"); // TODO: Phase 2.2
Object.defineProperty(exports, "LiveComponent", { enumerable: true, get: function () { return LiveComponent_1.LiveComponent; } });
var ComponentRegistry_1 = require("./js/client/ComponentRegistry"); // TODO: Phase 2.2
Object.defineProperty(exports, "ComponentRegistry", { enumerable: true, get: function () { return ComponentRegistry_1.ComponentRegistry; } });
// ✅ IMPLEMENTED: Mobile-native classes
var LiveViewChannel_2 = require("./js/client/LiveViewChannel"); // Mobile Phoenix Channel transport
Object.defineProperty(exports, "MobileChannel", { enumerable: true, get: function () { return LiveViewChannel_2.MobileChannel; } });
// ❌ LEGACY COMPATIBILITY: (Will be removed in breaking change)
var LiveViewChannel_3 = require("./js/client/LiveViewChannel"); // Legacy alias
Object.defineProperty(exports, "createLiveViewClient", { enumerable: true, get: function () { return LiveViewChannel_3.createMobileClient; } });
var LiveViewChannel_4 = require("./js/client/LiveViewChannel"); // Legacy alias
Object.defineProperty(exports, "LiveViewChannel", { enumerable: true, get: function () { return LiveViewChannel_4.MobileChannel; } });
// Version
exports.version = '0.1.0';
