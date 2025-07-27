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