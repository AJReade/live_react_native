defmodule LiveReactNative.MobileSocket do
  @moduledoc """
  Phoenix Socket for mobile React Native clients.

  This socket provides a clean interface for mobile clients, routing
  channel connections to our MobileChannel bridge that forwards to
  existing LiveView processes.

  ## Usage in Phoenix Endpoint

  ```elixir
  socket "/mobile", LiveReactNative.MobileSocket,
    websocket: [connect_info: []],
    longpoll: false
  ```

  ## Mobile Client Connection

  ```javascript
  const client = createMobileClient({
    url: 'ws://localhost:4000/mobile',
    params: { user_id: 'user123', token: 'jwt_token' }
  });

  client.join('mobile:/live/counter');
  ```
  """

  use Phoenix.Socket

  # Channel routes for mobile clients
  # All mobile channels go through our MobileChannel bridge
  channel "mobile:*", LiveReactNative.MobileChannel

  # Socket params - validates mobile authentication
  @impl true
  def connect(params, socket, _connect_info) do
    # Basic validation - full authentication happens in MobileChannel.join/3
    case validate_mobile_params(params) do
      {:ok, validated_params} ->
        socket = assign(socket, :mobile_params, validated_params)
        {:ok, socket}

      {:error, _reason} ->
        :error
    end
  end

  # Socket ID for tracking mobile clients
  @impl true
  def id(socket) do
    mobile_params = socket.assigns.mobile_params
    user_id = mobile_params["user_id"]
    device_id = mobile_params["device_id"] || "unknown"

    "mobile_user:#{user_id}:#{device_id}"
  end

  # Private functions

  defp validate_mobile_params(params) do
    # Basic parameter validation
    user_id = params["user_id"]
    token = params["token"]

    cond do
      is_nil(user_id) or user_id == "" ->
        {:error, "user_id required"}

      is_nil(token) or token == "" ->
        {:error, "token required"}

      true ->
        {:ok, params}
    end
  end
end
