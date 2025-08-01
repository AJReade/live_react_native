# 🧬 LiveReact Native Mobile App Example

This is a **real-world example** demonstrating the LiveReact Native mobile architecture with a React Native counter app that connects to a Phoenix LiveView backend.

## ✨ Features Demonstrated

- 🔄 **Real-time state synchronization** with Phoenix LiveView
- 📱 **Mobile-native RN commands** (haptics, toasts, alerts, notifications)
- 🚀 **Mobile-native Phoenix Channel bridge** (no browser session required)
- 🔐 **JWT-based mobile authentication**
- ⚡ **Automatic RN command handling** (server → native actions)
- 🎯 **LiveView programming model** reused for mobile

## 🏃‍♂️ Quick Start

### 1. Start the Phoenix Server
```bash
cd ../server
mix deps.get
mix phx.server
```
Server runs at `http://localhost:4000`

### 2. Start the Mobile App
```bash
npm install
npm start
```

### 3. Choose your platform:
- **iOS**: `i` (opens iOS Simulator)
- **Android**: `a` (opens Android Emulator)
- **Web**: `w` (opens in browser)

## 🎮 Try These Features

### Counter Operations
- **Increment**: Triggers light haptic feedback + toast notification
- **Decrement**: Triggers medium haptic + vibration when reaching 0
- **Reset**: Triggers heavy haptic + toast + push notification
- **Show Info**: Displays native alert with current state

### Real-time Updates
- Open multiple apps/browsers - state syncs instantly
- All RN commands execute automatically on mobile devices
- Server manages state, mobile handles native UI

## 🏗️ Architecture Overview

```
React Native App (UI)
    ↕ WebSocket
Mobile Channel Bridge
    ↕ GenServer calls
Phoenix LiveView (Logic)
    ↓ RN Commands
Native Mobile Features
```

**Key Benefits:**
- ✅ Same LiveView code works for web AND mobile
- ✅ No browser session complexity for mobile
- ✅ Automatic native feature integration
- ✅ Real-time state management

## 📱 Mobile-Specific Features

The server-side LiveView uses RN commands that automatically trigger native actions:

```elixir
# In Phoenix LiveView (server)
def handle_event("increment", _params, socket) do
  {:noreply,
   socket
   |> assign(count: new_count)
   |> RN.haptic(%{type: "light"})          # ← Automatic haptic feedback
   |> RN.show_toast(%{message: "Count!"})  # ← Automatic toast notification
   |> RN.notification(%{title: "Update"})} # ← Automatic push notification
end
```

**No client-side code needed** - RN commands automatically execute!

## 🔧 Development Tips

### Physical Device Testing
Update the WebSocket URL in `App.tsx`:
```javascript
url: 'ws://YOUR_COMPUTER_IP:4000/mobile'  // Replace with your IP
```

### Debugging
- Check Metro bundler logs for connection issues
- Use React Native debugger for client-side debugging
- Check Phoenix server logs for server-side debugging

### Hot Reloading
- **Mobile app**: Auto-reloads on file changes
- **Phoenix server**: Auto-reloads on `.ex` file changes
- **Library changes**: Run `npm run build` in main directory

## 🔍 Code Structure

### Mobile App (`App.tsx`)
- Uses `createMobileClient()` from our library
- Connects to `ws://localhost:4000/mobile`
- Joins `mobile:/mobile/counter` channel
- Handles real-time assign updates

### Phoenix Server
- **Endpoint**: Configures `/mobile` socket
- **Router**: Maps `/mobile/counter` to LiveView
- **LiveView**: `MobileCounterLive` with RN commands

## 🚀 Production Considerations

### Authentication
Replace demo JWT with real authentication:
```javascript
params: {
  user_id: await getUserId(),
  token: await getJWTToken(),
  device_id: await getDeviceId()
}
```

### Error Handling
Add proper error handling for:
- Network disconnections
- Invalid JWT tokens
- Server unavailable scenarios

### Performance
- Consider using React.memo for expensive components
- Implement proper loading states
- Add retry logic for connection failures

## 🔗 Related

- **Main Library**: `../../` (LiveReact Native core)
- **Server Example**: `../server/` (Phoenix backend)
- **Documentation**: See main README for full API docs

This example shows the **complete mobile-native architecture** in action!