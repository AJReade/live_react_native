# 🚀 LiveReact Native Phoenix Server Example

This is the **Phoenix LiveView backend** for the LiveReact Native mobile example, demonstrating how to build mobile-native real-time applications.

## ✨ Features

- 📱 **Mobile-native Phoenix Channel** (`/mobile` socket)
- 🔄 **LiveView state management** for mobile clients
- 🎯 **RN command integration** (haptics, notifications, toasts, alerts)
- 🔐 **JWT-based mobile authentication**
- ⚡ **Real-time bidirectional communication**

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
mix deps.get

# Start the server
mix phx.server
```

Server runs at `http://localhost:4000` with mobile socket at `ws://localhost:4000/mobile`

## 🏗️ Architecture

### Mobile Socket Configuration (`endpoint.ex`)
```elixir
# Mobile-specific socket for React Native clients
socket "/mobile", LiveReactNative.MobileSocket,
  websocket: [connect_info: []],
  longpoll: false
```

### Mobile LiveView (`mobile_counter_live.ex`)
```elixir
def handle_event("increment", _params, socket) do
  {:noreply,
   socket
   |> assign(count: new_count)
   |> RN.haptic(%{type: "light"})          # Automatic haptic
   |> RN.show_toast(%{message: "Count!"})  # Automatic toast
  }
end
```

### Router Configuration (`router.ex`)
```elixir
scope "/", ServerWeb do
  pipe_through :mobile

  live_session :mobile_session, session: %{} do
    live "/mobile/counter", MobileCounterLive
  end
end
```

## 📱 Mobile-Native Features

### RN Commands Available
The server can trigger these native mobile actions:

```elixir
import LiveReactNative.RN

# Haptic feedback
socket |> haptic(%{type: "light"})  # light, medium, heavy

# Toast notifications
socket |> show_toast(%{message: "Hello!"})

# Native alerts
socket |> show_alert(%{title: "Alert", message: "Info"})

# Push notifications
socket |> notification(%{title: "Update", body: "New data"})

# Vibration
socket |> vibrate(%{duration: 200})

# Navigation (if React Navigation setup)
socket |> navigate("ScreenName", %{param: "value"})
```

### Authentication Flow
1. Mobile app connects with JWT token
2. `MobileSocket.connect/3` validates token
3. Mobile params stored in socket assigns
4. LiveView can access user info via `socket.assigns[:mobile_params]`

## 🔧 Development

### File Structure
```
lib/server_web/
├── endpoint.ex          # Mobile socket configuration
├── router.ex           # Mobile LiveView routes
└── live/
    └── mobile_counter_live.ex  # Mobile LiveView with RN commands
```

### Key Differences from Web LiveView
- **No session requirements** - mobile clients use JWT
- **Mobile-specific routes** - separate from web routes
- **RN commands** - mobile-native actions vs HTML rendering
- **Mobile authentication** - JWT instead of cookies

### Adding New Mobile LiveViews

1. **Create LiveView**:
```elixir
defmodule ServerWeb.MyMobileLive do
  use Phoenix.LiveView
  import LiveReactNative.RN

  def mount(_params, _session, socket) do
    {:ok, assign(socket, data: "initial")}
  end

  def handle_event("action", _params, socket) do
    {:noreply,
     socket
     |> assign(data: "updated")
     |> haptic(%{type: "light"})}
  end

  def render(_assigns), do: :ok  # Mobile-only, no HTML
end
```

2. **Add Route**:
```elixir
live "/mobile/my_feature", MyMobileLive
```

3. **Connect from Mobile**:
```javascript
client.join('mobile:/mobile/my_feature', {}, callback)
```

## 🔐 Authentication

### Current Implementation (Demo)
```elixir
# In MobileSocket.connect/3
def connect(_params, socket, _connect_info) do
  # Demo: Accept all connections
  {:ok, socket}
end
```

### Production Implementation
```elixir
def connect(%{"token" => token, "user_id" => user_id}, socket, _connect_info) do
  case verify_jwt_token(token) do
    {:ok, claims} when claims["user_id"] == user_id ->
      {:ok, assign(socket, :mobile_params, %{
        "user_id" => user_id,
        "token" => token,
        "verified_at" => System.system_time()
      })}

    {:error, _reason} ->
      :error
  end
end
```

## 🚀 Production Deployment

### Environment Variables
```bash
export SECRET_KEY_BASE="your-secret-key"
export JWT_SECRET="your-jwt-secret"
export PHX_HOST="your-domain.com"
export PORT=4000
```

### Release Configuration
```elixir
# config/prod.exs
config :server, ServerWeb.Endpoint,
  url: [host: System.get_env("PHX_HOST"), port: 443, scheme: "https"],
  http: [port: String.to_integer(System.get_env("PORT") || "4000")],
  force_ssl: [rewrite_on: [:x_forwarded_proto]]
```

### Mobile Socket Security
- Use WSS (secure WebSocket) in production
- Implement proper JWT validation
- Add rate limiting for mobile connections
- Monitor connection patterns

## 🔧 Troubleshooting

### Common Issues

**Mobile clients can't connect**
- Check firewall settings
- Ensure port 4000 is accessible
- Verify WebSocket URL format

**RN commands not working**
- Check `import LiveReactNative.RN` in LiveView
- Verify mobile client has RN command handlers
- Check server logs for errors

**Authentication failing**
- Verify JWT format and signing
- Check token expiration
- Ensure user_id matches token claims

### Debugging Tips
```elixir
# Add logging to LiveView
require Logger

def handle_event("debug", params, socket) do
  Logger.info("Mobile event: #{inspect(params)}")
  Logger.info("Socket assigns: #{inspect(socket.assigns)}")
  {:noreply, socket}
end
```

## 🔗 Related

- **Mobile App**: `../mobile_app/` (React Native client)
- **Main Library**: `../../` (LiveReact Native core)
- **Phoenix Documentation**: [Phoenix Channels](https://hexdocs.pm/phoenix/channels.html)
- **LiveView Documentation**: [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/)

This server demonstrates the **complete mobile-native LiveView architecture**!