defmodule ServerWeb.MobileCounterLive do
  use Phoenix.LiveView
  import LiveReactNative.RN

  # Mobile-specific LiveView for React Native clients
  def mount(_params, _session, socket) do
    {:ok, assign(socket, %{
      count: 0,
      last_action: nil,
      user_id: socket.assigns[:mobile_params]["user_id"] || "anonymous"
    })}
  end

  # Increment with haptic feedback and toast notification
  def handle_event("increment", _params, socket) do
    new_count = socket.assigns.count + 1

    {:noreply,
     socket
     |> assign(count: new_count, last_action: "increment")
     |> haptic(%{type: "light"})
     |> show_toast(%{message: "Count: #{new_count}"})}
  end

    # Decrement with haptic feedback
  def handle_event("decrement", _params, socket) do
    new_count = max(0, socket.assigns.count - 1)

    updated_socket = socket
      |> assign(count: new_count, last_action: "decrement")
      |> haptic(%{type: "medium"})

    final_socket = if new_count == 0 do
      vibrate(updated_socket, %{duration: 100})
    else
      updated_socket
    end

    {:noreply, final_socket}
  end

  # Reset with multiple RN commands
  def handle_event("reset", _params, socket) do
    {:noreply,
     socket
     |> assign(count: 0, last_action: "reset")
     |> haptic(%{type: "heavy"})
     |> show_toast(%{message: "Counter reset!"})
     |> notification(%{
       title: "Counter Reset",
       body: "Your counter has been reset to 0"
     })}
  end

  # Show info with alert
  def handle_event("show_info", _params, socket) do
    {:noreply,
     socket
     |> assign(last_action: "show_info")
     |> show_alert(%{
       title: "Counter Info",
       message: "Current count: #{socket.assigns.count}\nUser: #{socket.assigns.user_id}",
       buttons: [%{text: "OK"}]
     })}
  end

  # Simple render function for debugging
  def render(assigns) do
    ~H"""
    <div>
      <h1>Mobile Counter: <%= @count %></h1>
      <button phx-click="increment">+</button>
      <button phx-click="decrement">-</button>
      <button phx-click="reset">Reset</button>
    </div>
    """
  end
end
