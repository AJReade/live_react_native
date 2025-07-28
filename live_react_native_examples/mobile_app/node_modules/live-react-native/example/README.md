# LiveReact Native Example App

This is a comprehensive example app that demonstrates all the features of LiveReact Native - a library that integrates Phoenix LiveView with React Native for real-time mobile applications.

## 🚀 Features Demonstrated

### 1. **Real-time Counter with LiveView**
- Phoenix LiveView integration using `useLiveView` hook
- Real-time state synchronization between server and mobile
- Performance monitoring with update metrics
- Error handling and loading states

### 2. **Live Chat Demo**
- Multi-user real-time chat powered by LiveView
- WebSocket communication via Phoenix Channels
- Dynamic message list updates

### 3. **Advanced Update Optimizations**
- `useAdvancedUpdates` hook with smart reconciliation
- List operation detection (append, prepend, remove, reorder)
- Performance metrics showing renders saved
- Efficiency calculations

### 4. **Performance Monitoring Dashboard**
- `usePerformanceMonitoring` hook demonstration
- Toggleable monitoring features
- Real-time performance logging
- Memory leak detection
- Visual update analysis

## 📱 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI** (`npm install -g expo-cli`)
3. **Phoenix Server** (for LiveView backend)

### Installation

1. **Install dependencies:**
   ```bash
   cd example
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Phoenix Server Setup (Optional)

To see the full real-time features, you'll need a Phoenix server running:

```bash
# In a separate terminal, set up a basic Phoenix app with LiveView
mix phx.new live_react_backend --live
cd live_react_backend

# Add the counter LiveView
# Create lib/live_react_backend_web/live/counter_live.ex:
```

```elixir
defmodule LiveReactBackendWeb.CounterLive do
  use LiveReactBackendWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

  def handle_event("increment", _params, socket) do
    {:noreply, assign(socket, count: socket.assigns.count + 1)}
  end

  def handle_event("decrement", _params, socket) do
    {:noreply, assign(socket, count: socket.assigns.count - 1)}
  end
end
```

```bash
# Start the server
mix phx.server
```

## 🎯 What You'll See

### Loading States
When the Phoenix server isn't running, you'll see proper error handling and helpful messages.

### Real-time Updates
With the server running, you'll see:
- Instant counter updates synchronized across all connected clients
- Chat messages appearing in real-time
- Performance metrics updating live

### Advanced Features
- **Smart Reconciliation**: List updates optimized for minimal re-renders
- **Performance Monitoring**: Real-time logging and metrics in the console
- **Memory Tracking**: Automatic detection of potential memory leaks
- **Error Boundaries**: Graceful handling of connection failures

## 🛠️ Architecture Highlights

### Device-Centric Design
- React Native handles all UI rendering
- Phoenix LiveView acts as pure state management
- WebSocket bridges data between server and device

### Performance Optimized
- Smart reconciliation prevents unnecessary re-renders
- List operations optimized for large datasets
- Memory usage tracked and optimized
- Update debouncing for smooth UX

### Production Ready
- Comprehensive error handling
- Performance monitoring
- Memory leak detection
- Offline-friendly architecture

## 📊 Performance Features

### Monitoring Dashboard
The example includes a live performance monitoring dashboard that shows:
- Update frequency and timing
- Memory usage patterns
- Optimization effectiveness
- Feature toggle for different monitoring levels

### Console Logging
With monitoring enabled, check the console for detailed logs about:
- Assigns changes and why components re-rendered
- Performance timing for different update phases
- Memory usage warnings and optimization suggestions

## 🔄 Development Workflow

### Hot Reloading
The example supports full hot reloading:
- React Native hot reload for UI changes
- Phoenix LiveView hot reload for server-side logic
- Library changes reflected immediately

### Testing
```bash
# Run the full test suite
cd ..
npm test && mix test
```

### Building for Production
```bash
# Build the app for production
expo build:android
expo build:ios
```

## 🎮 Interactive Demo

1. **Counter Demo**: Tap increment/decrement buttons to see real-time updates
2. **Performance Toggle**: Enable/disable monitoring to see the impact
3. **List Operations**: Add items to see optimized reconciliation
4. **Chat Demo**: Send messages to test real-time communication

## 🚀 Next Steps

This example demonstrates the full potential of LiveReact Native. Use it as a starting point for building your own real-time mobile applications with Phoenix LiveView!

### Key Takeaways
- LiveView provides powerful server-side state management
- React Native delivers native mobile performance
- The combination creates a unique, productive development experience
- Real-time features work seamlessly across platforms

Happy coding! 🎉