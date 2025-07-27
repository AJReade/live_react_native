# 🧬 LiveReact Native - Implementation Notes & Gotchas

This file documents detailed implementation notes, testing procedures, and critical gotchas for each completed phase.

## 📋 **Documentation Rules**

After completing each section in `IMPLEMENTATION_TODO.md`, document:
- **What was implemented** (technical details)
- **How it was tested** (verification commands)
- **Critical gotchas** (footguns and future reference warnings)
- **Lessons learned** (patterns and conventions established)

---

## ✅ **Phase 1.1: Project Structure Setup*

### 📋 **Implementation Details & Testing**

**What was implemented:**
- **TypeScript Library Structure**: Created modular `js/` directory with `client/`, `hooks/`, `components/` subdirectories and proper TypeScript exports
- **Build Pipeline**: TypeScript compiler generates both JS and .d.ts declaration files in `dist/` for library distribution
- **Testing Framework**: Jest with ts-jest preset, coverage thresholds (80% MVP, 90% production), and WebSocket mocking setup
- **Code Quality**: ESLint with TypeScript + React rules, ignores variables prefixed with `_` for intentionally unused parameters
- **Metro Bundler**: React Native-optimized bundler config with TypeScript support and symlink handling
- **Example Expo App**: Expo Router v3 setup with TypeScript, separate from main library compilation
- **Stub Architecture**: All Phase 2+ components implemented as throwing stubs with proper TypeScript signatures

**Testing verification:**
```bash
✅ npm run type-check  # TypeScript: 0 compilation errors
✅ npm run build      # Generates proper dist/ files (JS + .d.ts)
✅ npm run lint       # ESLint: Clean code quality checks
✅ npm test          # Jest: 2/2 tests passing with proper exports
✅ npm run dev       # TypeScript watch mode working
```

### ⚠️ **Critical Gotchas & Future Reference**

1. **Package Version Conflicts**: React Native peer dependencies are notoriously finicky. We locked to specific versions:
   - `@types/react: ~18.2.79` (not ^19.x which conflicts with RN 0.73)
   - `react-native: ^0.73.0` peerDependency (not >=0.72 which causes resolution issues)
   - **FOOTGUN**: Always use `~` for React types, not `^`, to avoid major version conflicts

2. **Jest Configuration Pitfalls**:
   - **FOOTGUN**: Cannot use both `testMatch` and `testRegex` - Jest will error
   - **FOOTGUN**: `moduleNameMapping` is wrong property name, must be `moduleNameMapper`
   - **CRITICAL**: Must explicitly ignore Elixir directories (`assets/`, `lib/`, etc.) or Jest tries to parse `.ex` files as JS
   - **ts-jest vs react-native preset**: Used ts-jest for library development instead of react-native preset to avoid Metro dependencies

3. **ESLint React Native Community Config Issues**:
   - **FOOTGUN**: `@react-native-community/eslint-config` has broken jest/globals environment in some versions
   - **SOLUTION**: Built custom config with essential plugins only (`@typescript-eslint`, `react`, `react-hooks`)
   - **CONVENTION**: Use `_variableName` prefix for intentionally unused parameters in stubs

4. **TypeScript Configuration Traps**:
   - **FOOTGUN**: `noEmit: true` prevents build output generation - must be `false` for library
   - **CRITICAL**: Exclude `example/` from main tsconfig to avoid Expo dependency conflicts
   - **FUTURE**: Path aliases `@/*` set up for cleaner imports when implementing

5. **Metro vs TypeScript Build**:
   - **DECISION**: Metro for React Native apps, TypeScript compiler for library distribution
   - **FUTURE**: When implementing Phase 2, Metro will handle the example app bundling separately

6. **Stub Implementation Pattern**:
   - **CONVENTION**: All unimplemented functions throw with "Phase X.Y" reference for tracking
   - **TESTING**: Stubs export proper TypeScript signatures so integration tests pass
   - **FOOTGUN**: Don't import React unnecessarily in pure TypeScript files (triggers unused import lint errors)

### 🎯 **Ready for Phase 1.2**
- All tooling verified and working
- Development workflow established
- Zero technical debt from setup phase
- Clear error messages point to next implementation phases

---

## ✅ **Phase 1.2: Analyze & Adapt LiveReact Core**

### 📋 **Implementation Details & Testing**

**What was implemented:**
- **LiveReactNative Module**: Pure state management layer that sends assigns as JSON (no HTML rendering!)
- **Assigns Extraction**: Separates LiveView assigns from special Phoenix assigns for mobile transmission
- **JSON Serialization**: All assigns automatically serialized and sent over WebSocket to React Native
- **Mobile Slots System**: Simplified slots to plain text for JSON transmission (React Native handles composition)
- **Consistent ID Generation**: Per-LiveView ID generation for mobile app component tracking
- **Change Tracking**: Preserved LiveView's efficient change detection for optimized mobile updates
- **No Rendering**: Completely eliminated HTML rendering - LiveView becomes pure state service

**Testing verification:**
```bash
✅ mix test test/live_react_native_test.exs  # 10/10 LiveReactNative tests passing
✅ mix test                                 # 23/23 total tests (including existing LiveReact)
```

### ⚠️ **Critical Gotchas & Future Reference**

1. **Component Name vs Props Conflict**:
   - **ISSUE**: Key named "name" serves dual purposes - component name AND potential prop
   - **SOLUTION**: Extract component name first, then remove it from assigns before prop extraction
   - **FOOTGUN**: Don't let component name leak into props or it breaks React Native integration

2. **Separate Normalization Functions**:
   - **ISSUE**: `extract_props/1` standalone function vs `react_native/1` context need different "name" handling
   - **SOLUTION**: Created `normalize_key_for_extraction/2` that doesn't treat "name" as special
   - **PATTERN**: Standalone utility functions vs context-specific functions may need different rules

3. **Change Tracking Edge Cases**:
   - **ISSUE**: `key_changed?/2` must handle missing `__changed__` key gracefully
   - **SOLUTION**: Added catch-all clause that defaults to `true` for missing change tracking
   - **FOOTGUN**: Missing `__changed__` key can cause function clause errors

4. **Mobile Slot Rendering**:
   - **DECISION**: Render slots to plain text instead of HTML for JSON serialization
   - **LIMITATION**: Only supports default slot (inner_block), no named slots yet
   - **FUTURE**: May need to expand slot support based on React Native children patterns

5. **ID Generation Strategy**:
   - **REQUIREMENT**: Same component must get same ID in same process (for React Native reconciliation)
   - **IMPLEMENTATION**: Process-local cache of component name → ID mappings
   - **CONSIDERATION**: Process memory grows with unique component names (acceptable for mobile app lifecycle)

6. **Data Structure Design**:
   - **OUTPUT**: Returns map with `%{component_name, id, props, slots, props_changed?, slots_changed?}`
   - **SERIALIZATION**: Entire output must be JSON-serializable for Phoenix Channel transmission
   - **FUTURE**: This structure will be sent over WebSocket to React Native client

### 🎯 **Ready for Phase 1.3**
- Mobile-adapted LiveView API complete and tested
- Data structures designed for channel transmission
- Zero breaking changes to existing web LiveReact
- Clear separation between web (HTML) and mobile (data) rendering paths

---

## ✅ **Phase 1.3: Phoenix Channel Protocol Implementation**

### 📋 **Implementation Details & Testing**

**What was implemented:**
- **LiveViewChannel Class**: Complete Phoenix Channel wrapper for React Native with 185+ lines of production-ready code
- **WebSocket Connection Management**: Socket lifecycle, connection state tracking, error handling
- **Channel Operations**: Join/leave channels, push events, subscribe to updates
- **LiveView Integration**: `onLiveViewUpdate()` for receiving `live_react_native_update` events from our Phase 1.2 backend
- **Reconnection Logic**: Exponential backoff, max attempts tracking, connection state management
- **Event Handling**: Complete callback system for connection, error, and channel lifecycle events
- **Type Safety**: Full TypeScript interfaces for all operations and state management

**Testing verification:**
```bash
✅ npm test js/client/LiveViewChannel.test.ts  # 30/30 LiveViewChannel tests passing
✅ npm test                                   # 32/32 total tests (no regressions)
```

**Key Features Implemented:**
- `connect()` / `disconnect()` with lifecycle callbacks
- `joinLiveView()` / `leaveLiveView()` with response handling
- `pushEvent()` with success/error callbacks
- `onLiveViewUpdate()` for receiving component updates
- Exponential backoff reconnection (1s → 2s → 5s → 10s → 30s cap)
- Connection state tracking and error recovery
- Mobile-optimized reconnection limits

### ⚠️ **Critical Gotchas & Future Reference**

1. **Jest Mock Chaining Issues**:
   - **ISSUE**: Tests expecting `mock.returnValue` but Jest doesn't populate this automatically
   - **SOLUTION**: Use `mock.results[0].value` to access actual returned mock objects
   - **PATTERN**: For Phoenix Channel API, create shared mock objects and reference them consistently

2. **Connection State Management**:
   - **ISSUE**: Phoenix Socket `isConnected()` vs internal state tracking
   - **SOLUTION**: Use internal `connectionState.connected` for consistency with lifecycle callbacks
   - **FOOTGUN**: Don't rely on external socket state when you control the lifecycle internally

3. **Phoenix Channel API Integration**:
   - **KEY INSIGHT**: Phoenix Channel uses fluent API: `channel.join().receive('ok', callback).receive('error', callback)`
   - **MOBILE ADAPTATION**: Wrapped in promises/callbacks for React Native integration patterns
   - **EVENT NAMING**: Used `live_react_native_update` to receive data from our Phase 1.2 backend

4. **TypeScript Interface Design**:
   - **PATTERN**: Separate interfaces for options vs internal state vs callbacks
   - **EXTENSIBILITY**: `LiveViewOptions`, `LiveViewJoinOptions`, `PushEventOptions` allow future expansion
   - **INTEGRATION**: `LiveReactNativeUpdate` interface matches our backend data structure exactly

5. **Reconnection Strategy**:
   - **MOBILE-SPECIFIC**: Exponential backoff with max attempt limits (not infinite like web)
   - **BATTERY AWARENESS**: Cap at 30s intervals to avoid draining mobile battery
   - **APP LIFECYCLE**: Reset reconnect attempts on successful connection (foreground/background handling)

6. **Error Handling Architecture**:
   - **LAYERED**: Socket errors, channel errors, and operation-specific errors
   - **CALLBACK PATTERNS**: Multiple error callbacks for different error types
   - **GRACEFUL DEGRADATION**: Failed operations don't crash the connection

### 🎯 **Ready for Phase 2**
- WebSocket communication layer complete and tested
- Phoenix Channel protocol fully implemented
- Ready to receive assigns data from simplified LiveView backend
- Type-safe interfaces for React Native integration
- Mobile-optimized connection management
- Comprehensive test coverage for all scenarios

**🧠 ARCHITECTURAL INSIGHT**: Device-Centric Templates + Server State Management

- **Templates Live on Device**: All React Native components exist locally on mobile device
- **Server is Pure State**: Elixir LiveView modules have NO `render/1` functions - only event handlers
- **Standard Patterns**: Same `{:noreply, assign(socket, ...)}` patterns developers know
- **Data Flow**: Device templates → pushEvent → Server handle_event → assigns → Device re-render

**Next: Build React Native hooks and components that consume assigns data!** 📱

---

## 🔄 **Template for Future Phases**

### ✅ **Phase X.Y: [Phase Name]**

#### 📋 **Implementation Details & Testing**

**What was implemented:**
- [Bullet points of what was built]

**Testing verification:**
```bash
# Commands that prove it works
```

#### ⚠️ **Critical Gotchas & Future Reference**

1. **[Category]**: [Description]
   - **FOOTGUN**: [What to avoid]
   - **SOLUTION**: [How to fix]

#### 🎯 **Ready for Phase X.Z**
- [What's ready for next phase]

---