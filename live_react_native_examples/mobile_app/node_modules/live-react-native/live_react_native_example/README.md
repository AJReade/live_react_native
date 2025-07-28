# LiveReact Native Examples

A clean, simple demonstration of **Phoenix LiveView + React Native** integration using the LiveReact Native library.

## 🚀 **Quick Start**

### **1. Start the Phoenix Server**

```bash
cd server
mix deps.get
mix phx.server
```

Your server will be running at `http://localhost:4000`

### **2. Start the React Native App**

```bash
cd mobile_app
npm start
```

Choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

## 🎯 **What You'll Experience**

### **✅ Real-time Counter Integration:**
- **Phoenix LiveView**: Manages state and handles events
- **React Native**: Renders native UI and sends events
- **WebSocket**: Real-time synchronization between server and mobile

### **🎮 Interactive Demo:**
1. **Tap increment/decrement** in React Native → See instant updates
2. **Open web browser** to `http://localhost:4000/counter` → Same counter!
3. **Use both interfaces** → Watch real-time sync across web and mobile

## 🏗️ **Architecture**

```
React Native App ←→ WebSocket ←→ Phoenix LiveView
     (UI Only)                        (State Only)
```

### **Phoenix LiveView (`/server/lib/server_web/live/counter_live.ex`)**
- Pure state management
- Handles `increment`, `decrement`, `reset` events
- Serves both web and React Native clients

### **React Native App (`/mobile_app/App.tsx`)**
- Complete UI rendering using fresh Expo setup
- Uses `useLiveView` hook to connect to Phoenix
- Native mobile performance with LiveView reactivity

## 📱 **Demo Features**

- ✅ **Real-time state sync** between server and mobile
- ✅ **Cross-platform compatibility** (iOS, Android, Web)
- ✅ **Native performance** with React Native rendering
- ✅ **Live development** with hot reloading on both sides
- ✅ **Error handling** and reconnection logic
- ✅ **Clean Expo setup** with TypeScript

## 🛠️ **Development**

### **Hot Reloading:**
- **Phoenix**: Automatic LiveView code reloading
- **React Native**: Expo Metro bundler hot reload
- **Library changes**: Reflected immediately

### **Testing:**
```bash
# Test the library (from project root)
cd ../../
npm test && mix test
```

### **Debugging:**
- **Phoenix**: Check server logs for LiveView events
- **React Native**: Use Expo dev tools or React Native Debugger
- **WebSocket**: Monitor network tab for real-time communication

## 🎉 **This is LiveReact Native!**

A simple counter that demonstrates the power of Phoenix LiveView for real-time mobile apps. The same backend powers both web and native mobile experiences! 🚀✨

## 📁 **Project Structure**

```
live_react_native_examples/
├── server/                     # Phoenix LiveView backend
│   ├── lib/server_web/live/
│   │   └── counter_live.ex     # Simple counter LiveView
│   └── mix.exs                 # Includes live_react_native dependency
└── mobile_app/                 # Clean Expo React Native app
    ├── App.tsx                 # Simple counter with useLiveView integration
    └── package.json            # Includes live-react-native dependency
```

## ✨ **Key Improvements**

- **Fresh Expo Setup**: Clean `create-expo-app` with TypeScript
- **Simple Counter**: Pure demonstration of LiveReact Native
- **Error Handling**: Beautiful error states with helpful messages
- **Connection Status**: Live connection indicator
- **Mobile Optimized**: Native look and feel with proper styling
## ✨ **Key Improvements**

- **Fresh Expo Setup**: Clean `create-expo-app` with TypeScript
- **Simple Counter**: Pure demonstration of LiveReact Native
- **Error Handling**: Beautiful error states with helpful messages
- **Connection Status**: Live connection indicator
- **Mobile Optimized**: Native look and feel with proper styling