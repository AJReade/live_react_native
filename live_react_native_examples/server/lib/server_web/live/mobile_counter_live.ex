defmodule ServerWeb.MobileCounterLive do
  use Phoenix.LiveView

  # Mobile-specific LiveView that doesn't require sessions
  def mount(_params, _session, socket) do
    # For mobile connections, we don't rely on browser sessions
    # This bypasses the session requirement
    if connected?(socket) do
      {:ok, assign(socket, count: 0)}
    else
      {:ok, assign(socket, count: 0)}
    end
  end

  # Same event handlers as regular counter
  def handle_event("increment", _params, socket) do
    new_count = socket.assigns.count + 1

    {:noreply,
     socket
     |> assign(count: new_count)
     |> LiveReactNative.RN.haptic(%{type: "light"})}
  end

  def handle_event("decrement", _params, socket) do
    new_count = socket.assigns.count - 1

    {:noreply, assign(socket, count: new_count)}
  end

  def handle_event("reset", _params, socket) do
    {:noreply,
     socket
     |> assign(count: 0)
     |> LiveReactNative.RN.haptic(%{type: "medium"})}
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
