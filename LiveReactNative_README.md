# 🧬 LiveReact Native

A React Native adapter for [`live_react`](https://github.com/mrdotb/live_react) that brings **Phoenix LiveView's end-to-end reactivity** to mobile apps.

## 🎯 Revolutionary Approach

Instead of bypassing LiveView entirely, **LiveReact Native acts as a mobile "renderer"** for LiveView. Your Phoenix LiveView becomes a **universal state engine** that can render to both web browsers AND mobile apps.

### 🧠 Core Insight

The genius of `live_react` is that it turns LiveView into a **React component orchestrator**. LiveReact Native extends this concept:

- **Same LiveView backend** manages state and logic
- **Same component props/events** system
- **Different renderer**: React Native instead of DOM
- **Same developer experience**: Write LiveView, get mobile apps

## 🏗 Architecture

```
┌─────────────────┬─────────────────┐
│   Web Browser   │  React Native   │
│                 │      App        │
├─────────────────┼─────────────────┤
│ DOM + ReactDOM  │ Native Widgets  │
│                 │                 │
├─────────────────┴─────────────────┤
│     Phoenix LiveView Engine       │
│   (State, Events, Components)     │
└───────────────────────────────────┘
```

## 🔧 How It Works

### 1. **Shared LiveView Backend**
Your existing LiveView code works unchanged:

```elixir
defmodule MyApp.CounterLive do
  use MyAppWeb, :live_view

  def render(assigns) do
    ~H"""
    <.react name="Counter" count={@count} socket={@socket} />
    """
  end

  def handle_event("increment", %{"amount" => amount}, socket) do
    {:noreply, assign(socket, :count, socket.assigns.count + amount)}
  end
end
```

### 2. **Mobile Channel Adapter**
Instead of DOM hooks, we create a **mobile channel client** that:
- Connects to the same LiveView process
- Receives the same prop updates
- Sends the same events
- But renders to React Native widgets

### 3. **Component Mapping**
React Native components receive identical props:

```tsx
// Counter.tsx - Nearly identical to web version
export function Counter({ count, pushEvent }) {
  const [amount, setAmount] = useState(1);

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button
        title={`+${amount}`}
        onPress={() => pushEvent("increment", { amount })}
      />
    </View>
  );
}
```

## 🚀 Implementation Strategy

### Phase 1: Mobile LiveView Client
Create a React Native client that speaks LiveView's protocol:

```tsx
// useLiveView.ts
function useLiveView(path: string, params = {}) {
  const [assigns, setAssigns] = useState({});

  // Connect to LiveView channel
  // Handle mount, updates, events
  // Return: { assigns, pushEvent, handleEvent, ... }
}
```

### Phase 2: Component Bridge
Map LiveView's component system to React Native:

```tsx
// LiveComponent.tsx
function LiveComponent({ name, ...props }) {
  const Component = componentRegistry[name];
  const liveViewContext = useLiveView();

  return <Component {...props} {...liveViewContext} />;
}
```

### Phase 3: Advanced Features
- **File uploads** via React Native's file system
- **Navigation** integration with React Navigation
- **Background/foreground** lifecycle handling
- **Offline/reconnection** logic

## 🎁 What You Get

### ✅ **Keep Everything Good About LiveView**
- Server-side state management
- Real-time updates
- Event handling
- Form validation
- Authentication
- Business logic centralization

### ✅ **Add Mobile Superpowers**
- Native performance and UX
- Device APIs (camera, GPS, notifications)
- App store distribution
- Offline capabilities
- Platform-specific UI

### ✅ **Unified Development**
- One backend for web + mobile
- Shared components between platforms
- Single deployment pipeline
- Consistent business logic

## 📁 Project Structure

```
live_react_native/
├── js/
│   ├── client/
│   │   ├── LiveViewChannel.ts    # Phoenix channel protocol
│   │   ├── ComponentRegistry.ts  # Component mapping
│   │   └── Reconnection.ts       # Mobile-specific networking
│   ├── hooks/
│   │   ├── useLiveView.ts        # Main LiveView hook
│   │   ├── useLiveComponent.ts   # Component-level hook
│   │   └── useLiveUpload.ts      # File upload hook
│   └── components/
│       ├── LiveProvider.tsx      # Context provider
│       ├── LiveComponent.tsx     # Component renderer
│       └── Navigation.tsx        # LiveView navigation helpers
├── lib/
│   └── live_react_native.ex     # Phoenix helpers (minimal changes)
└── example/
    └── ExpoApp/                  # Full demo app
```

## 🆚 Compared to Alternatives

| Approach | State Management | Real-time | Complexity |
|----------|-----------------|-----------|------------|
| **REST API** | Client-side mess | Polling/WebSocket | High |
| **GraphQL** | Client queries | Subscriptions | Medium |
| **LiveReact Native** | **Server-side LiveView** | **Built-in** | **Low** |

## 🛠 Development Experience

```bash
# Terminal 1: Start Phoenix server
mix phx.server

# Terminal 2: Start React Native app
npx expo start

# Both connect to same LiveView processes!
# Changes in LiveView instantly appear in mobile app
```

## 🎯 Roadmap

- [ ] **Core Protocol** - Phoenix channel LiveView client
- [ ] **Component System** - React Native component mapping
- [ ] **Event Handling** - pushEvent, handleEvent, etc.
- [ ] **File Uploads** - Mobile file system integration
- [ ] **Navigation** - React Navigation bridge
- [ ] **Offline Support** - Queue events when disconnected
- [ ] **DevTools** - Debugging and inspection tools

## 🤔 Why This Approach?

### Instead of: Creating a new mobile-specific backend
### We: Extend LiveView to support mobile "viewports"

This means:
- **Zero backend duplication**
- **Instant real-time sync** between web and mobile
- **Shared business logic**
- **Simplified architecture**
- **Faster development**

---

**This isn't just "LiveView for mobile" - it's "Universal LiveView" where one backend powers infinite client types.**
