# 🚀 Getting Started with LiveReact Native

> **Universal LiveView for Web + Mobile** - Write once in Elixir, render everywhere

LiveReact Native enables you to use the same Phoenix LiveView backend to power both web applications and native mobile apps. This guide shows you how to build real-time, interactive mobile experiences using the LiveView patterns you already know and love.

## 🧠 **Key Architectural Insight**

**LiveView becomes a pure state management service** - no HTML rendering needed! Your LiveView handles events, updates assigns, and sends JSON data over WebSocket. The React Native app receives this data and renders everything natively on the device.

```
LiveView: State Management ⟷ WebSocket ⟷ React Native: UI Rendering
```

## 📱 What You'll Build

After completing this guide, you'll have:

- **📱 Native Mobile App** - Real React Native app with LiveView backend
- **🔄 Real-time Updates** - Live data synchronization across all devices
- **🎯 Shared Backend** - One Phoenix LiveView powering web + mobile
- **⚡ Native Performance** - 60fps animations with server-side state
- **📂 File Uploads** - Native mobile file picker integration
- **🧭 Navigation** - React Navigation powered by LiveView routes
- **📡 Offline Support** - Graceful handling of network connectivity

## 🎯 Final Result Preview

Here's what your complete app will look like:

### **Mobile App (React Native)**
```tsx
import { LiveProvider, LiveComponent, useLiveView } from 'live_react_native';

export default function CounterApp() {
  return (
    <LiveProvider url="ws://localhost:4000/socket">
      <LiveComponent
        path="/lv/counter"
        params={{ user_id: 123 }}
        fallback={<LoadingSpinner />}
      />
    </LiveProvider>
  );
}

// Your React Native components automatically receive LiveView props
function Counter({ count, step, pushEvent }) {
  return (
    <View style={styles.container}>
      <Text style={styles.counter}>Count: {count}</Text>
      <Button
        title={`+${step}`}
        onPress={() => pushEvent('increment', { amount: step })}
      />
      <Button
        title="Reset"
        onPress={() => pushEvent('reset')}
      />
    </View>
  );
}
```

### **Backend (Phoenix LiveView)**
```elixir
# Pure state management - no render function needed for mobile!
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0, step: 1)}
  end

  def handle_event("increment", %{"amount" => amount}, socket) do
    {:noreply, update(socket, :count, &(&1 + amount))}
  end

  def handle_event("reset", _params, socket) do
    {:noreply, assign(socket, count: 0)}
  end

  # No render function needed!
  # LiveReact Native automatically sends assigns as JSON over WebSocket
  # Mobile app handles all UI rendering natively
end
```

## 📦 Installation

### **1. Add to Phoenix Project**

```bash
# Add to your Phoenix project's mix.exs
def deps do
  [
    {:live_react_native, "~> 0.1.0"}
  ]
end

# Install
mix deps.get
```

### **2. Create React Native App**

```bash
# Create new Expo project
npx create-expo-app MyLiveApp --template typescript
cd MyLiveApp

# Add LiveReact Native
npm install live_react_native phoenix
```

### **3. Configure Phoenix**

```elixir
# config/config.exs
config :live_react_native,
  # Enable mobile channel adapter
  mobile_adapter: true,
  # Configure component registry
  component_registry: MyAppWeb.Components

# lib/my_app_web/endpoint.ex
defmodule MyAppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :my_app

  # Add mobile LiveView socket
  socket "/socket", MyAppWeb.UserSocket,
    websocket: true,
    longpoll: false

  # Enable both web and mobile rendering
  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]
end
```

## 🏗️ Project Structure

```
my_app/
├── assets/                          # Web assets
│   └── react-components/           # Shared React components (web)
├── lib/
│   └── my_app_web/
│       ├── live/                   # LiveView modules (shared!)
│       │   ├── counter_live.ex
│       │   ├── chat_live.ex
│       │   └── dashboard_live.ex
│       └── components/             # Component registry
│           └── mobile_components.ex
└── mobile_app/                     # React Native app
    ├── app/                        # Expo Router pages
    ├── components/                 # React Native components
    │   ├── Counter.tsx
    │   ├── ChatRoom.tsx
    │   └── Dashboard.tsx
    └── App.tsx                     # Main app with LiveProvider
```

## 🚀 Quick Start Examples

### **Example 1: Real-time Counter**

**LiveView (Backend):**
```elixir
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Subscribe to counter updates from other users
      Phoenix.PubSub.subscribe(MyApp.PubSub, "counter:global")
    end

    {:ok, assign(socket, count: get_global_count(), step: 1)}
  end

  def handle_event("increment", %{"amount" => amount}, socket) do
    new_count = socket.assigns.count + amount

    # Update global counter
    update_global_count(new_count)

    # Broadcast to all connected clients (web + mobile)
    Phoenix.PubSub.broadcast(MyApp.PubSub, "counter:global",
      {:count_updated, new_count})

    {:noreply, assign(socket, count: new_count)}
  end

  def handle_info({:count_updated, new_count}, socket) do
    {:noreply, assign(socket, count: new_count)}
  end

  def render(assigns) do
    ~H"""
    <.react_native name="Counter" count={@count} step={@step} />
    """
  end
end
```

**React Native Component:**
```tsx
// mobile_app/components/Counter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CounterProps {
  count: number;
  step: number;
  pushEvent: (event: string, payload?: any) => void;
}

export function Counter({ count, step, pushEvent }: CounterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Counter</Text>
      <Text style={styles.count}>{count}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => pushEvent('increment', { amount: step })}
        >
          <Text style={styles.buttonText}>+{step}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => pushEvent('increment', { amount: -step })}
        >
          <Text style={styles.buttonText}>-{step}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  count: { fontSize: 48, color: '#007AFF', marginBottom: 30 },
  buttons: { flexDirection: 'row', gap: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' }
});
```

**Mobile App Setup:**
```tsx
// mobile_app/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LiveProvider, LiveComponent } from 'live_react_native';

const Stack = createStackNavigator();

export default function App() {
  return (
    <LiveProvider
      url="ws://10.0.2.2:4000/socket"  // Android emulator
      params={{ user_id: 'mobile_user_123' }}
      reconnectOnError={true}
      maxReconnectAttempts={5}
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Counter"
            component={CounterScreen}
            options={{ title: 'Live Counter' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LiveProvider>
  );
}

function CounterScreen() {
  return (
    <LiveComponent
      path="/lv/counter"
      params={{ room: 'global' }}
      loadingComponent={<Text>Connecting...</Text>}
      errorComponent={<Text>Connection failed</Text>}
    />
  );
}
```

### **Example 2: Real-time Chat**

**LiveView (Backend):**
```elixir
defmodule MyAppWeb.ChatLive do
  use MyAppWeb, :live_view

  def mount(%{"room" => room}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(MyApp.PubSub, "chat:#{room}")
    end

    messages = load_recent_messages(room)

    {:ok, assign(socket,
      room: room,
      messages: messages,
      message_input: "",
      user: get_current_user(socket)
    )}
  end

  def handle_event("send_message", %{"text" => text}, socket) when text != "" do
    message = %{
      id: Ecto.UUID.generate(),
      text: text,
      user: socket.assigns.user,
      timestamp: DateTime.utc_now()
    }

    # Save to database
    MyApp.Chat.create_message(socket.assigns.room, message)

    # Broadcast to all clients
    Phoenix.PubSub.broadcast(MyApp.PubSub, "chat:#{socket.assigns.room}",
      {:new_message, message})

    {:noreply, assign(socket, message_input: "")}
  end

  def handle_event("typing", %{"text" => text}, socket) do
    # Real-time typing indicators
    Phoenix.PubSub.broadcast(MyApp.PubSub, "chat:#{socket.assigns.room}",
      {:user_typing, socket.assigns.user, text != ""})

    {:noreply, assign(socket, message_input: text)}
  end

  def handle_info({:new_message, message}, socket) do
    messages = [message | socket.assigns.messages] |> Enum.take(50)
    {:noreply, assign(socket, messages: messages)}
  end

    # No render function needed for mobile!
  # Assigns are automatically sent to React Native app:
  # %{messages: [...], current_user: %{...}, room: "..."}
  # Mobile app receives this data and renders UI natively
end
```

**React Native Chat Component:**
```tsx
// mobile_app/components/ChatRoom.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform
} from 'react-native';

interface Message {
  id: string;
  text: string;
  user: { name: string; avatar: string };
  timestamp: string;
}

interface ChatRoomProps {
  messages: Message[];
  current_user: { id: string; name: string };
  room: string;
  pushEvent: (event: string, payload?: any) => void;
}

export function ChatRoom({ messages, current_user, pushEvent }: ChatRoomProps) {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto-scroll to latest message
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim()) {
      pushEvent('send_message', { text: inputText });
      setInputText('');
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    // Send typing indicator
    pushEvent('typing', { text });
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMe = message.user.id === current_user.id;

    return (
      <View style={[styles.messageContainer, isMe && styles.myMessage]}>
        <Text style={styles.userName}>{message.user.name}</Text>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### **Example 3: File Upload with Live Progress**

**LiveView (Backend):**
```elixir
defmodule MyAppWeb.UploadLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket,
      uploads: [],
      upload_progress: %{}
    )}
  end

  def handle_event("start_upload", %{"file" => file_info}, socket) do
    upload_id = Ecto.UUID.generate()

    upload = %{
      id: upload_id,
      filename: file_info["name"],
      size: file_info["size"],
      type: file_info["type"],
      status: :uploading,
      progress: 0
    }

    uploads = [upload | socket.assigns.uploads]

    # Start background upload process
    Task.start(fn -> process_upload(upload_id, file_info) end)

    {:noreply, assign(socket, uploads: uploads)}
  end

  def handle_info({:upload_progress, upload_id, progress}, socket) do
    uploads = update_upload_progress(socket.assigns.uploads, upload_id, progress)
    {:noreply, assign(socket, uploads: uploads)}
  end

  def handle_info({:upload_complete, upload_id, file_url}, socket) do
    uploads = mark_upload_complete(socket.assigns.uploads, upload_id, file_url)
    {:noreply, assign(socket, uploads: uploads)}
  end

  # No render function needed for mobile!
  # Assigns automatically sent as: %{uploads: [...], upload_progress: %{...}}
  # React Native app handles all file upload UI
end
```

**React Native Upload Component:**
```tsx
// mobile_app/components/FileUploader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useLiveUpload } from 'live_react_native';

interface Upload {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  file_url?: string;
}

interface FileUploaderProps {
  uploads: Upload[];
  pushEvent: (event: string, payload?: any) => void;
}

export function FileUploader({ uploads, pushEvent }: FileUploaderProps) {
  const { uploadFile } = useLiveUpload();

  const pickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        // Use LiveReact Native's built-in upload
        uploadFile(result, {
          onProgress: (progress) => console.log(`Upload ${progress}% complete`),
          onComplete: (fileUrl) => console.log(`Upload complete: ${fileUrl}`),
          onError: (error) => Alert.alert('Upload failed', error.message),
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={pickAndUploadFile}>
        <Text style={styles.uploadButtonText}>📎 Pick File</Text>
      </TouchableOpacity>

      {uploads.map((upload) => (
        <View key={upload.id} style={styles.uploadItem}>
          <Text style={styles.filename}>{upload.filename}</Text>
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${upload.progress}%` }]}
            />
          </View>
          <Text style={styles.status}>
            {upload.status === 'complete' ? '✅' : '⏳'} {upload.progress}%
          </Text>
        </View>
      ))}
    </View>
  );
}
```

## 🔧 Advanced Features

### **Navigation Integration**
```tsx
// App.tsx with LiveView-powered navigation
import { useLiveNavigation } from 'live_react_native';

function App() {
  const { navigate, currentRoute } = useLiveNavigation();

  return (
    <LiveProvider url="ws://localhost:4000/socket">
      <NavigationContainer>
        {/* Routes are managed by LiveView server */}
        <LiveNavigator />
      </NavigationContainer>
    </LiveProvider>
  );
}
```

### **Background Sync**
```tsx
// Automatic background synchronization
import { useLiveBackground } from 'live_react_native';

function MyApp() {
  useLiveBackground({
    onAppStateChange: (state) => {
      if (state === 'background') {
        // Pause real-time updates
      } else if (state === 'active') {
        // Resume and sync
      }
    }
  });
}
```

### **Offline Support**
```tsx
// Queue events when offline
import { useLiveOffline } from 'live_react_native';

function OfflineComponent() {
  const { isOnline, queuedEvents } = useLiveOffline();

  return (
    <View>
      {!isOnline && (
        <Text>📴 Offline - {queuedEvents.length} events queued</Text>
      )}
    </View>
  );
}
```

## 🚀 Development Workflow

### **1. Start Phoenix Server**
```bash
cd my_app
mix phx.server
# LiveView available at http://localhost:4000
```

### **2. Start React Native App**
```bash
cd mobile_app
npx expo start
# Scan QR code or press 'i' for iOS simulator
```

### **3. Shared Development**
- ✅ **Backend changes** instantly appear in mobile app
- ✅ **Real-time testing** across web and mobile simultaneously
- ✅ **Hot reload** on both platforms
- ✅ **Shared state** between all connected clients

## 🎯 Why Choose LiveReact Native?

### **🔄 Universal Backend**
- One Phoenix LiveView powers web + mobile
- Shared business logic and real-time features
- Single deployment pipeline

### **⚡ Native Performance**
- Real React Native components
- 60fps animations
- Platform-specific UX patterns

### **🧠 Simple Mental Model**
- Same LiveView patterns you know
- Server-side state management
- Event-driven architecture

### **📱 Mobile Superpowers**
- Native device APIs (camera, GPS, push notifications)
- App store distribution
- Offline-first capabilities

## 🎉 What You Get After Phase 4

After completing all implementation phases, you'll have:

1. **🏗️ Complete Integration** - Seamless web + mobile development
2. **📱 Production Apps** - Deploy to iOS/Android app stores
3. **🔄 Real-time Everything** - Live data across all platforms
4. **📁 Native Features** - File uploads, navigation, push notifications
5. **🌐 Offline Support** - Graceful network handling
6. **⚡ Developer Joy** - Write once, run everywhere

**Start building the future of Phoenix applications today!** 🚀

---

## 📚 Next Steps

1. **[Installation Guide](./guides/installation.md)** - Set up your first project
2. **[Component Guide](./guides/components.md)** - Build React Native components
3. **[Deployment Guide](./guides/deployment.md)** - Ship to production
4. **[Examples Repository](./live_react_examples/)** - Complete working examples

**Questions?** Join our [Discord community](https://discord.gg/livereact-native) or [open an issue](https://github.com/your-org/live_react_native/issues).