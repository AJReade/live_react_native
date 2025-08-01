# LiveReact Native Usage Guide

## Overview

**LiveReact Native** enables real-time, stateful mobile applications powered by Phoenix LiveView business logic. Your React Native app connects via mobile-native Phoenix Channels to existing LiveView processes, giving you all the power of LiveView without browser limitations.

## Core Architecture: Mobile-Native Transport + LiveView Core

- **React Native**: Holds all UI templates, components, and rendering logic
- **Phoenix Channels**: Mobile-native WebSocket transport (no browser sessions)
- **Phoenix LiveView**: Existing LiveView processes handle state and business logic
- **Communication**: JSON data over mobile-optimized WebSocket connection
- **Real-time**: Automatic UI updates when LiveView assigns change

```
┌─────────────────┐   Phoenix Channel   ┌──────────────────┐   LiveView Process   ┌──────────────────┐
│  React Native   │ ←─────────────────→ │ Mobile Transport │ ←─────────────────→ │ Phoenix LiveView │
│                 │   JSON over WS      │                  │   Standard LiveView │                  │
│ • UI Templates  │                     │ • Mobile Auth    │                     │ • State Mgmt     │
│ • Components    │                     │ • Event Forward  │                     │ • Event Handling │
│ • Rendering     │                     │ • Assign Sync    │                     │ • Business Logic │
└─────────────────┘                     └──────────────────┘                     └──────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# React Native app
npm install live-react-native phoenix

# Phoenix server
# Add to mix.exs
{:live_react_native, "~> 1.0"}
```

### 2. Basic React Native Setup

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createMobileClient } from 'live-react-native';

export default function CounterScreen() {
  const [assigns, setAssigns] = React.useState({ count: 0 });
  const [client, setClient] = React.useState(null);

  React.useEffect(() => {
    const mobileClient = createMobileClient({
      url: 'ws://localhost:4000/mobile',  // Mobile-native transport
      params: { user_id: 'user123' }     // No browser sessions required
    });

    // Connect and join mobile channel
    mobileClient.connect();
    mobileClient.join('/counter', {}, (newAssigns) => {
      setAssigns(newAssigns);
    });

    setClient(mobileClient);

    return () => mobileClient.disconnect();
  }, []);

  if (!client) return <Text>Connecting...</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Count: {assigns.count}</Text>

      <TouchableOpacity
        onPress={() => client.pushEvent('increment', {})}
        style={{ backgroundColor: 'blue', padding: 10, margin: 5 }}
      >
        <Text style={{ color: 'white' }}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => client.pushEvent('decrement', {})}
        style={{ backgroundColor: 'red', padding: 10, margin: 5 }}
      >
        <Text style={{ color: 'white' }}>-</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Phoenix LiveView Setup (Unchanged!)

**The beauty:** Your LiveView code stays **exactly the same** as browser LiveView! Mobile transport is handled transparently.

```elixir
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view          # Same as browser LiveView!
  import LiveReactNative.RN

  # Same mount/3 signature as browser LiveView
  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

  # Same handle_event/3 signature as browser LiveView
  def handle_event("increment", _params, socket) do
    new_count = socket.assigns.count + 1

    {:noreply,
     socket
     |> assign(count: new_count)     # Same assign/2 as browser LiveView
     |> RN.haptic(%{type: "light"})} # Mobile-specific additions
  end

  def handle_event("decrement", _params, socket) do
    new_count = socket.assigns.count - 1

    {:noreply, assign(socket, count: new_count)}
  end

  # No render/1 function needed for mobile!
  # LiveView processes handle pure state management,
  # React Native handles all UI rendering
end
```

## Client API Reference

### Creating a Mobile Client

```typescript
import { createMobileClient } from 'live-react-native';

const client = createMobileClient({
  url: 'ws://localhost:4000/mobile',          // Mobile-native transport
  params: { user_id: 'user123', token: jwt }, // Mobile auth (no browser sessions)
  reconnectDelay: (attempt) => Math.min(1000 * attempt, 10000)
});
```

### Connection Management

```typescript
// Connect to Phoenix Channel
await client.connect();

// Join a mobile channel (connects to LiveView process behind the scenes)
client.join('/counter', params, (assigns) => {
  setAssigns(assigns);
});

// Leave current channel
client.leave();

// Disconnect
client.disconnect();
```

### Event Handling

#### Sending Events to Server

```typescript
// Simple event
client.pushEvent('save', { name: 'John' });

// Event with callback
const ref = client.pushEvent('validate', formData, (reply, ref) => {
  if (reply.status === 'ok') {
    console.log('Validation passed');
  }
});

// Event to specific LiveComponent
client.pushEventTo('#user-form', 'submit', formData);

// With async/await pattern
const handleSubmit = async () => {
  try {
    const result = await new Promise((resolve, reject) => {
      client.pushEvent('save_user', userData, (reply, ref) => {
        if (reply.status === 'ok') {
          resolve(reply.data);
        } else {
          reject(reply.error);
        }
      });
    });

    navigation.navigate('Success', { user: result });
  } catch (error) {
    showError(error.message);
  }
};
```

#### Receiving Events from Server

```typescript
// Handle custom events from server
const unsubscribe = client.handleEvent('user_updated', (payload) => {
  setUser(payload.user);
  showToast(`User ${payload.user.name} updated`);
});

// Handle mobile-specific server commands
client.handleEvent('rn:navigate', ({ screen, params }) => {
  navigation.navigate(screen, params);
});

client.handleEvent('rn:haptic', ({ type }) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle[type]);
});

// Cleanup
return () => unsubscribe();
```

## Server API Reference

### Basic LiveView Functions

```elixir
defmodule MyAppWeb.UserLive do
  use MyAppWeb, :live_view
  import LiveReactNative.RN

  def handle_event("save_user", params, socket) do
    case Users.create_user(params) do
      {:ok, user} ->
        # Update assigns and send success event
        {:noreply,
         socket
         |> assign(user: user)
         |> push_event("user_created", %{user: user})}

      {:error, changeset} ->
        # Send validation errors
        {:noreply,
         socket
         |> push_event("validation_errors", %{errors: format_errors(changeset)})}
    end
  end
end
```

### Mobile-Specific Server API (RN Namespace)

#### Navigation Commands

```elixir
# Navigate to a screen
{:noreply, socket |> RN.navigate("ProfileScreen", %{user_id: 123})}

# Go back
{:noreply, socket |> RN.go_back()}

# Reset navigation stack
{:noreply, socket |> RN.reset_stack("HomeScreen")}

# Replace current screen
{:noreply, socket |> RN.replace("LoginScreen")}
```

#### Native Mobile Features

```elixir
# Haptic feedback
{:noreply, socket |> RN.haptic(%{type: "success"})}  # light, medium, heavy, success, warning, error

# Vibration patterns
{:noreply, socket |> RN.vibrate(%{pattern: [100, 200, 100]})}

# Push notifications
{:noreply, socket |> RN.notification(%{
  title: "New Message",
  message: "You have a new message from John",
  data: %{chat_id: 123}
})}

# App badge count
{:noreply, socket |> RN.badge(%{count: 5})}
```

#### UI Interactions

```elixir
# Show toast message
{:noreply, socket |> RN.show_toast(%{message: "Saved successfully", duration: "short"})}

# Show native alert
{:noreply, socket |> RN.show_alert(%{
  title: "Confirm Delete",
  message: "Are you sure you want to delete this item?",
  buttons: [
    %{text: "Cancel", style: "cancel"},
    %{text: "Delete", style: "destructive", event: "confirm_delete"}
  ]
})}

# Dismiss keyboard
{:noreply, socket |> RN.dismiss_keyboard()}

# Show loading overlay
{:noreply, socket |> RN.show_loading(%{message: "Saving..."})}
{:noreply, socket |> RN.hide_loading()}
```

## Advanced Patterns

### Form Handling with Validation

#### React Native Component

```typescript
function UserForm() {
  const [assigns, setAssigns] = useState({ user: {}, errors: {} });
  const [client, setClient] = useState(null);

  React.useEffect(() => {
    const mobileClient = createMobileClient({
      url: 'ws://localhost:4000/mobile'
    });

    mobileClient.connect();
    mobileClient.join('/user_form', {}, setAssigns);
    setClient(mobileClient);

    return () => mobileClient.disconnect();
  }, []);

  const handleSubmit = async () => {
    const result = await new Promise((resolve, reject) => {
      client.pushEvent('validate_and_save', assigns.user, (reply) => {
        if (reply.status === 'ok') resolve(reply);
        else reject(reply);
      });
    });

    if (result.redirect) {
      navigation.navigate(result.redirect.screen, result.redirect.params);
    }
  };

  return (
    <View>
      <TextInput
        value={assigns.user.name}
        onChangeText={(name) =>
          client.pushEvent('update_field', { field: 'name', value: name })
        }
        placeholder="Name"
      />
      {assigns.errors.name && (
        <Text style={{ color: 'red' }}>{assigns.errors.name}</Text>
      )}

      <TouchableOpacity onPress={handleSubmit}>
        <Text>Save User</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### LiveView Handler

```elixir
def handle_event("update_field", %{"field" => field, "value" => value}, socket) do
  user = put_in(socket.assigns.user, [String.to_atom(field)], value)
  {:noreply, assign(socket, user: user)}
end

def handle_event("validate_and_save", user_params, socket) do
  changeset = Users.change_user(%User{}, user_params)

  if changeset.valid? do
    case Users.create_user(user_params) do
      {:ok, user} ->
        {:noreply,
         socket
         |> assign(user: user)
         |> RN.show_toast(%{message: "User created successfully"})
         |> RN.navigate("UserProfile", %{user_id: user.id})}

      {:error, changeset} ->
        {:noreply,
         socket
         |> assign(errors: format_errors(changeset))
         |> RN.vibrate(%{pattern: [100, 100, 100]})}
    end
  else
    {:noreply, assign(socket, errors: format_errors(changeset))}
  end
end
```

### Real-time Multi-User Features

#### Chat Application

```typescript
function ChatScreen({ roomId }) {
  const [assigns, setAssigns] = useState({ messages: [], users: [] });
  const [client, setClient] = useState(null);

  useEffect(() => {
    const mobileClient = createMobileClient({
      url: 'ws://localhost:4000/mobile'
    });

    mobileClient.connect();
    mobileClient.join(`/chat/${roomId}`, {}, setAssigns);

    // Handle real-time events
    mobileClient.handleEvent('new_message', (payload) => {
      // Haptic feedback for new messages
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

    mobileClient.handleEvent('user_typing', (payload) => {
      setTypingUsers(payload.users);
    });

    setClient(mobileClient);
    return () => mobileClient.disconnect();
  }, [roomId]);

  const sendMessage = (text) => {
    client.pushEvent('send_message', { text });
  };

  const indicateTyping = (text) => {
    client.pushEvent('typing', { typing: text.length > 0 });
  };

  return (
    <View>
      <FlatList
        data={assigns.messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <TextInput
        onChangeText={indicateTyping}
        onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
        placeholder="Type a message..."
      />
    </View>
  );
}
```

#### LiveView Chat Handler

```elixir
defmodule MyAppWeb.ChatLive do
  use MyAppWeb, :live_view
  import LiveReactNative.RN

  def mount(%{"room_id" => room_id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(MyApp.PubSub, "chat:#{room_id}")
    end

    messages = Chat.get_messages(room_id)
    users = Chat.get_online_users(room_id)

    {:ok, assign(socket, room_id: room_id, messages: messages, users: users)}
  end

  def handle_event("send_message", %{"text" => text}, socket) do
    case Chat.create_message(socket.assigns.room_id, text, socket.assigns.current_user) do
      {:ok, message} ->
        # Broadcast to all users in room
        Phoenix.PubSub.broadcast(
          MyApp.PubSub,
          "chat:#{socket.assigns.room_id}",
          {:new_message, message}
        )

        {:noreply, socket}

      {:error, _} ->
        {:noreply, socket |> RN.show_toast(%{message: "Failed to send message"})}
    end
  end

  def handle_info({:new_message, message}, socket) do
    messages = [message | socket.assigns.messages]

    {:noreply,
     socket
     |> assign(messages: messages)
     |> push_event("new_message", %{message: message})}
  end
end
```

### File Upload Integration

```typescript
function ImageUpload() {
  const [client, setClient] = useState(null);

  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });

      client.pushEvent('upload_image', {
        filename: 'upload.jpg',
        size: result.assets[0].fileSize
      }, (reply) => {
        if (reply.upload_url) {
          // Upload to presigned URL
          uploadToS3(reply.upload_url, formData);
        }
      });
    }
  };

  return (
    <TouchableOpacity onPress={uploadImage}>
      <Text>Upload Image</Text>
    </TouchableOpacity>
  );
}
```

## Performance Optimization

### Using Advanced Update Strategies

```typescript
import { createMobileClient, useAdvancedUpdates } from 'live-react-native';

function OptimizedListScreen() {
  const [assigns, setAssigns] = useState({ items: [], total_count: 0 });
  const [client, setClient] = useState(null);

  useEffect(() => {
    const mobileClient = createMobileClient({
      url: 'ws://localhost:4000/mobile'
    });

    mobileClient.connect();
    mobileClient.join('/items', {}, setAssigns);
    setClient(mobileClient);

    return () => mobileClient.disconnect();
  }, []);

  const advanced = useAdvancedUpdates({
    listOptimization: {
      enabled: true,
      keyField: 'id',
      detectMoves: true
    },
    selectiveUpdates: {
      enabled: true,
      keyFields: ['items', 'total_count']
    },
    debouncing: {
      enabled: true,
      delay: 16 // 60fps
    }
  });

  const optimizedAssigns = advanced.applyOptimizations(assigns);

  return (
    <FlatList
      data={optimizedAssigns.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ItemComponent item={item} />}
    />
  );
}
```

### Performance Monitoring

```typescript
import { usePerformanceMonitoring } from 'live-react-native';

function MonitoredScreen() {
  const monitor = usePerformanceMonitoring({
    assignsDiffLogging: true,
    performanceProfiling: true,
    memoryLeakDetection: true
  });

  useEffect(() => {
    console.log('Performance metrics:', monitor.getPerformanceMetrics());
    console.log('Memory report:', monitor.getMemoryReport());
  }, [assigns]);

  return <YourComponent />;
}
```

## Development & Debugging

### Enable Debug Mode

```typescript
const client = createMobileClient({
  url: 'ws://localhost:4000/mobile',
  debug: true,  // Enables console logging
  params: { user_id: 'user123' }
});
```

### Server-side Debugging

```elixir
# In your LiveView
def handle_event(event, params, socket) do
  IO.inspect({event, params}, label: "LiveView Event")
  # ... handle event
end
```

## Best Practices

1. **State Management**: Keep UI state in React Native, business logic in LiveView
2. **Performance**: Use `useAdvancedUpdates` for complex lists and frequent updates
3. **Error Handling**: Always handle connection failures and reconnection
4. **Mobile UX**: Use `RN.*` functions for native mobile feedback (haptics, toasts)
5. **Testing**: Test both client and server components independently
6. **Security**: Always validate events and sanitize data on the server

## Common Patterns

### Loading States

```typescript
function Screen() {
  const [assigns, setAssigns] = useState({ loading: true });

  if (assigns.loading) {
    return <LoadingSpinner />;
  }

  return <YourContent />;
}
```

### Error Boundaries

```typescript
const client = createMobileClient({
  url: 'ws://localhost:4000/mobile',
  onError: (error) => {
    console.error('Mobile client error:', error);
    showErrorMessage('Connection lost. Reconnecting...');
  },
  onReconnect: () => {
    showSuccessMessage('Connected!');
  }
});
```

### Cleanup

```typescript
useEffect(() => {
  return () => {
    client.disconnect();
  };
}, []);
```

---

This guide covers the complete LiveReact Native workflow from basic setup to advanced real-time features. The library enables you to build powerful, reactive mobile applications with the reliability and real-time capabilities of Phoenix LiveView.