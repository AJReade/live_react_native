defmodule ServerWeb.CounterLive do
  use ServerWeb, :live_view

  # Pure state management for React Native
  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

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

  # Optional: Render function for web browser testing
  def render(assigns) do
    ~H"""
    <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold text-center mb-6">LiveReact Native Counter</h1>
      <div class="text-center">
        <div class="text-6xl font-bold text-blue-600 mb-6"><%= @count %></div>
        <div class="flex gap-4 justify-center">
          <button
            phx-click="decrement"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            -
          </button>
          <button
            phx-click="reset"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            phx-click="increment"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            +
          </button>
        </div>
      </div>
      <p class="text-gray-600 text-center mt-6">
        This LiveView serves both web and React Native!
      </p>
    </div>
    """
  end
end
