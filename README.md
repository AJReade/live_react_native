# 🧬 LiveReact Native

A React Native adapter for Phoenix LiveView that brings end-to-end reactivity to mobile apps.

## 🚀 Phase 1.1 Complete: Project Structure Setup ✅

The foundation is now ready! We've successfully set up:

### ✅ **Project Structure**
```
live_react_native/
├── js/                          # TypeScript source code
│   ├── client/                  # Phoenix channel protocol (Phase 1.3)
│   ├── hooks/                   # React Native hooks (Phase 2.1)
│   ├── components/              # LiveReact components (Phase 2.3)
│   ├── index.ts                 # Main library entry point
│   └── types.ts                 # TypeScript definitions
├── example/                     # Expo demo app
│   ├── app/                     # Expo Router pages
│   ├── components/              # Example components
│   └── package.json             # Example app dependencies
├── lib/                         # Elixir source (Phase 1.2)
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Testing setup
├── metro.config.js              # React Native bundler
├── .eslintrc.js                 # Code quality
└── package.json                 # Library dependencies
```

### ✅ **TypeScript Configuration**
- Optimized for React Native development
- Strict type checking enabled
- Path aliases configured (`@/*` → `js/*`)
- Declaration files generated for library distribution

### ✅ **React Native Dependencies**
- Phoenix Channel client for WebSocket communication
- React Native peer dependencies
- Development tooling (ESLint, Jest, TypeScript)
- Example Expo app with latest version

### ✅ **Build Tooling**
- **Metro bundler** configured for React Native
- **Jest testing** with React Native preset
- **ESLint** with TypeScript and React Native rules
- **Test coverage** thresholds set (80% for MVP, 90% for production)

### ✅ **Example Expo App**
- Basic Expo Router setup
- TypeScript configuration
- Safety area handling
- Ready for Phase 2 implementation

## 🎯 **Next Steps: Phase 1.2**

Ready to move on to:
- [ ] **Analyze & Adapt LiveReact Core** (Elixir side)
- [ ] Remove SSR-related code
- [ ] Create mobile-specific LiveView helpers

## 🧪 **Development Workflow**

```bash
# Install dependencies
npm install

# Start TypeScript compiler in watch mode
npm run dev

# Run tests
npm test

# Start example app
npm run example

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📋 **Current Status**

- ✅ **Project structure** complete
- ✅ **TypeScript setup** complete
- ✅ **Build tooling** complete
- ✅ **Example app** ready
- 🔄 **Phase 1.2** ready to begin

## 🔗 **Related Files**

- [`IMPLEMENTATION_TODO.md`](./IMPLEMENTATION_TODO.md) - Complete implementation plan
- [`LiveReactNative_README.md`](./LiveReactNative_README.md) - Project vision and architecture

---

**Ready for Phase 1.2: Analyze & Adapt LiveReact Core! 🚀**
