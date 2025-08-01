# 🧬 LiveReact Native Complete Example

This directory contains a **complete working example** of the LiveReact Native mobile-native architecture with:

- 📱 **React Native mobile app** (`mobile_app/`)
- 🚀 **Phoenix LiveView server** (`server/`)
- 🔄 **Real-time bidirectional communication**
- 📳 **Automatic native mobile features** (haptics, notifications, alerts)

## ⚡ Quick Start

### Option 1: Terminal Setup (Recommended)

**Terminal 1 - Start Phoenix Server:**
```bash
cd server
mix deps.get
mix phx.server
```

**Terminal 2 - Start Mobile App:**
```bash
cd mobile_app
npm install
npm start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

### Option 2: One-Line Setup
```bash
# Start both server and mobile app
cd server && mix deps.get && mix phx.server &
cd ../mobile_app && npm install && npm start
```

## 🎮 Try the Demo

1. **Counter App loads** with real-time connection to Phoenix
2. **Tap buttons** to see instant state synchronization
3. **Feel haptic feedback** on mobile devices
4. **See toast notifications** appear automatically
5. **Try "Show Info"** for native alert dialogs
6. **Open multiple instances** to see real-time sync

## 🏗️ What This Demonstrates

### ✅ Mobile-Native Architecture
- No browser session complexity
- Direct WebSocket connection to Phoenix
- JWT-based mobile authentication
- Mobile-specific Phoenix Channel

### ✅ LiveView Programming Model
```elixir
# Same familiar LiveView pattern works for mobile!
def handle_event("increment", _params, socket) do
  {:noreply,
   socket
   |> assign(count: new_count)
   |> RN.haptic(%{type: "light"})      # ← Automatic haptic
   |> RN.show_toast(%{message: "!"})   # ← Automatic toast
  }
end
```

### ✅ Automatic Native Features
Server commands automatically trigger mobile actions:
- **Haptic feedback** - `RN.haptic/2`
- **Toast notifications** - `RN.show_toast/2`
- **Push notifications** - `RN.notification/2`
- **Native alerts** - `RN.show_alert/2`
- **Vibration** - `RN.vibrate/2`

### ✅ Real-Time State Management
- Server manages state via LiveView assigns
- Mobile client receives instant updates
- Multiple clients stay synchronized
- Handles network disconnections gracefully

## 📂 Project Structure

```
live_react_native_examples/
├── mobile_app/           # React Native app
│   ├── App.tsx          # Main mobile app with LiveReact integration
│   ├── package.json     # Dependencies including live-react-native
│   └── README.md        # Mobile app specific docs
├── server/              # Phoenix LiveView server
│   ├── lib/server_web/
│   │   ├── endpoint.ex  # Mobile socket configuration
│   │   ├── router.ex    # Mobile LiveView routes
│   │   └── live/
│   │       └── mobile_counter_live.ex  # LiveView with RN commands
│   ├── mix.exs          # Dependencies including live_react_native
│   └── README.md        # Server specific docs
└── README.md           # This overview
```

## 🎯 Key Implementation Details

### Mobile Client (`mobile_app/App.tsx`)
```javascript
import { createMobileClient } from 'live-react-native';

const client = createMobileClient({
  url: 'ws://localhost:4000/mobile',
  params: { user_id: 'demo_user', token: 'demo_jwt' }
});

client.join('mobile:/mobile/counter', {}, (assigns) => {
  setAssigns(assigns);  // Real-time state updates
});
```

### Phoenix Server (`server/lib/server_web/`)
```elixir
# endpoint.ex - Mobile socket
socket "/mobile", LiveReactNative.MobileSocket

# router.ex - Mobile routes
live "/mobile/counter", MobileCounterLive

# mobile_counter_live.ex - LiveView with RN commands
import LiveReactNative.RN

def handle_event("increment", _params, socket) do
  {:noreply, socket |> assign(count: new_count) |> haptic(%{type: "light"})}
end
```

## 🚀 Next Steps

After trying this example, you can:

1. **Customize the LiveView** - Add more events and RN commands
2. **Expand the mobile UI** - Add more React Native components
3. **Add authentication** - Implement real JWT validation
4. **Add navigation** - Use React Navigation with RN.navigate
5. **Deploy to production** - See deployment guides in each README

## 🔧 Development Tips

### Hot Reloading
- **Mobile app**: Auto-reloads on file changes
- **Phoenix server**: Auto-reloads on `.ex` file changes
- **Library changes**: Run `npm run build` in main project directory

### Physical Device Testing
Update WebSocket URL in `mobile_app/App.tsx`:
```javascript
url: 'ws://YOUR_COMPUTER_IP:4000/mobile'
```

### Debugging
- **Mobile**: Check Metro bundler logs and React Native debugger
- **Server**: Check Phoenix server logs and LiveView debugging
- **Connection**: Verify WebSocket connection in browser dev tools

## 📚 Learn More

- **[Mobile App Details](mobile_app/README.md)** - React Native implementation
- **[Server Details](server/README.md)** - Phoenix LiveView implementation
- **[Main Documentation](../README.md)** - Full LiveReact Native API
- **[Usage Guide](../USAGE_GUIDE.md)** - Complete development guide

---

This example shows the **complete mobile-native architecture** in action! 🎉