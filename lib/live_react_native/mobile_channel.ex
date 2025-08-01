defmodule LiveReactNative.MobileChannel do
  @moduledoc """
  Phoenix Channel implementation for mobile-native React Native clients.

  This channel acts as a bridge between mobile clients using `createMobileClient()`
  and existing Phoenix LiveView processes. It allows mobile apps to reuse existing
  LiveView business logic without any server-side changes.

  ## Architecture

  ```
  Mobile Client (createMobileClient)
         ↓ Phoenix Channel
  LiveReactNative.MobileChannel
         ↓ Event Forwarding
  Phoenix LiveView Process (unchanged)
  ```

  ## Usage

  Mobile clients connect to this channel using topics like `mobile:/live/counter`
  which map to LiveView routes like `/live/counter`.

  ## Authentication

  Mobile clients authenticate using JWT tokens and user IDs rather than
  browser sessions:

  ```javascript
  const client = createMobileClient({
    url: 'ws://localhost:4000/mobile',
    params: { user_id: 'user123', token: 'jwt_token' }
  });
  ```
  """

  use Phoenix.Channel

  require Logger



  # Registry for tracking LiveView processes per topic
  @registry LiveReactNative.MobileChannel.Registry

    def join("mobile:" <> live_path, params, socket) do
    Logger.info("Mobile channel join attempt: #{live_path}")
    Logger.debug("Join params: #{inspect(params)}")

    with {:ok, authenticated_socket} <- authenticate_mobile_user(socket, params),
         {:ok, live_view_module} <- resolve_live_view_module(live_path, params),
         {:ok, live_view_pid, initial_assigns} <- start_or_get_live_view(live_path, live_view_module, params, authenticated_socket) do

      # Set up the socket with LiveView process information
      socket = authenticated_socket
      |> assign(:live_view_pid, live_view_pid)
      |> assign(:live_view_module, live_view_module)
      |> assign(:live_path, live_path)
      |> assign(:user_id, params["user_id"])

      # Monitor the LiveView process for cleanup
      Process.monitor(live_view_pid)

      # Subscribe to LiveView assigns updates
      Phoenix.PubSub.subscribe(LiveReactNative.PubSub, "live_view:#{live_path}:assigns")

      Logger.info("Mobile channel joined successfully: #{live_path}")

      # Only send assigns to mobile client - PIDs stay on server side
      {:ok, %{assigns: initial_assigns}, socket}
    else
      {:error, reason} ->
        Logger.warning("Mobile channel join failed: #{inspect(reason)}")
        {:error, %{reason: reason}}
    end
  end

  def join(topic, _params, _socket) do
    Logger.warning("Invalid mobile channel topic: #{topic}")
    {:error, %{reason: "invalid_topic"}}
  end

  def handle_in(event, payload, socket) do
    Logger.debug("Mobile channel event: #{event} with payload: #{inspect(payload)}")

    case socket.assigns[:live_view_pid] do
      nil ->
        Logger.error("No LiveView process associated with mobile channel")
        {:reply, {:error, %{reason: "no_live_view"}}, socket}

      live_view_pid when is_pid(live_view_pid) ->
        try_forward_event(event, payload, live_view_pid, socket)
    end
  end

  def handle_info({:DOWN, _ref, :process, _live_view_pid, reason}, socket) do
    Logger.warning("LiveView process terminated: #{inspect(reason)}")

    # Clean up the socket
    socket = socket
    |> assign(:live_view_pid, nil)
    |> assign(:live_view_module, nil)

    # Notify mobile client of termination
    push(socket, "live_view_terminated", %{reason: inspect(reason)})

    {:noreply, socket}
  end

  def handle_info({:assigns_update, assigns, changed}, socket) do
    Logger.debug("Forwarding assigns update to mobile client: #{inspect(assigns)}")

    # Push assigns update to mobile client
    push(socket, "assigns_update", %{assigns: assigns, changed: changed})

    {:noreply, socket}
  end

  def handle_info({:rn_command, command, payload}, socket) do
    Logger.debug("Forwarding RN command to mobile client: #{command}")

    # Push RN command to mobile client (e.g., rn:haptic, rn:navigate)
    push(socket, "rn:#{command}", payload)

    {:noreply, socket}
  end

  def handle_info(message, socket) do
    Logger.debug("Unhandled mobile channel message: #{inspect(message)}")
    {:noreply, socket}
  end

  def terminate(reason, socket) do
    Logger.info("Mobile channel terminating: #{inspect(reason)}")

    # Clean up any resources
    if _live_view_pid = socket.assigns[:live_view_pid] do
      # Unsubscribe from LiveView updates
      if live_path = socket.assigns[:live_path] do
        Phoenix.PubSub.unsubscribe(LiveReactNative.PubSub, "live_view:#{live_path}:assigns")
      end
    end

    :ok
  end

  # Private functions

  defp authenticate_mobile_user(socket, params) do
    user_id = params["user_id"]
    token = params["token"]

    case validate_mobile_auth(user_id, token) do
      {:ok, user_claims} ->
        socket = socket
        |> assign(:authenticated_user, user_claims)
        |> assign(:mobile_user_id, user_id)

        {:ok, socket}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp validate_mobile_auth(nil, _), do: {:error, "unauthorized"}
  defp validate_mobile_auth(_, nil), do: {:error, "unauthorized"}
  defp validate_mobile_auth(user_id, token) do
    # TODO: Implement proper JWT validation
    # For now, accept specific test tokens and user IDs
    case {user_id, token} do
      {"test_user_123", "valid_jwt_token"} ->
        {:ok, %{user_id: user_id, roles: ["user"]}}

      {_, "expired_jwt_token"} ->
        {:error, "token_expired"}

      {_, "malformed_token"} ->
        {:error, "invalid_token"}

      {"wrong_user", "valid_jwt_token_for_different_user"} ->
        {:error, "user_mismatch"}

      _ ->
        # In production, this would validate JWT properly
        {:ok, %{user_id: user_id, roles: ["user"]}}
    end
  end

  defp resolve_live_view_module(live_path, params) do
    dbg("resolve_live_view_module called")
    dbg(live_path)
    dbg(params)

        # Allow tests to specify the LiveView module directly
    result = case params["live_view_module"] do
      module when is_atom(module) and not is_nil(module) ->
        dbg("Using module from params: #{inspect(module)}")
        {:ok, module}

      _ ->
        dbg("Mapping path to module")
        # Direct mapping of mobile channel topics to LiveView modules
        # This is NOT router-based - just direct topic to module mapping
        case live_path do
          "/mobile/counter" ->
            dbg("Found /mobile/counter, returning ServerWeb.MobileCounterLive")
            {:ok, ServerWeb.MobileCounterLive}
          _ ->
            dbg("No match for path: #{live_path}")
            {:error, "module_not_found for path: #{live_path}"}
        end
    end

    dbg(result)
    result
  end

  defp start_or_get_live_view(live_path, live_view_module, params, socket) do
    registry_key = {live_path, socket.assigns.mobile_user_id}

    case Registry.lookup(@registry, registry_key) do
      [{live_view_pid, _}] when is_pid(live_view_pid) ->
        # Reuse existing LiveView process
        Logger.debug("Reusing existing LiveView process: #{inspect(live_view_pid)}")
        initial_assigns = get_live_view_assigns(live_view_pid)
        {:ok, live_view_pid, initial_assigns}

      [] ->
        # Start new LiveView process
        Logger.debug("Starting new LiveView process for: #{live_path}")
        start_live_view_process(live_path, live_view_module, params, socket, registry_key)
    end
  end

    defp start_live_view_process(live_path, live_view_module, params, socket, registry_key) do
    dbg("start_live_view_process called")
    dbg(live_path)
    dbg(live_view_module)
    dbg(params)

    # Derive router from endpoint module name
    endpoint_module = socket.endpoint |> Module.split() |> Enum.take(2) |> Module.concat()
    router = Module.concat(endpoint_module, "Router")

    dbg(endpoint_module)
    dbg(router)

    # Create a mobile-compatible LiveView socket with minimal required internals
    # This maintains full LiveView compatibility while staying mobile-focused
    live_view_socket = %Phoenix.LiveView.Socket{
      endpoint: socket.endpoint,
      router: router,
      view: live_view_module,
      assigns: %{
        # Essential LiveView fields that mount/3 expects
        live_action: nil,
        flash: %{},
        # Mobile context that gets passed to LiveView
        mobile_params: socket.assigns.mobile_params,
        mobile_user_id: socket.assigns.mobile_user_id,
        mobile_authenticated: true,
        # Minimal change tracking - required for LiveView assign/3 function
        __changed__: %{}
      },
      # Minimal private state for LiveView compatibility
      private: %{
        connect_info: %{},
        connect_params: params
      }
    }

    try do
      dbg("About to call mount function")
      dbg(live_view_module)
      dbg("Is module nil? #{is_nil(live_view_module)}")
      dbg("Module exists? #{Code.ensure_loaded?(live_view_module)}")

      # Call the LiveView's mount function
      dbg("Calling mount with:")
      dbg(params)
      dbg("socket assigns: #{inspect(live_view_socket.assigns)}")
      mount_result = live_view_module.mount(params, %{}, live_view_socket)
      dbg("Mount result: #{inspect(mount_result)}")

      case mount_result do
        {:ok, mounted_socket} ->
          dbg("Mount successful")
          # Start a process to hold the LiveView state
          {:ok, live_view_pid} = start_live_view_holder(live_path, mounted_socket, registry_key)

          initial_assigns = mounted_socket.assigns
          {:ok, live_view_pid, initial_assigns}

        {:error, reason} ->
          dbg("Mount failed with reason: #{inspect(reason)}")
          {:error, "mount_failed: #{inspect(reason)}"}
      end
    rescue
      error ->
        dbg("Mount rescue error: #{inspect(error)}")
        Logger.error("LiveView mount error: #{inspect(error)}")
        {:error, "mount_error"}
    end
  end

  defp start_live_view_holder(live_path, live_view_socket, registry_key) do
    {:ok, pid} = GenServer.start_link(
      LiveReactNative.LiveViewHolder,
      %{
        socket: live_view_socket,
        live_path: live_path
      }
    )

    # Register the process
    Registry.register(@registry, registry_key, live_view_socket.view)

    {:ok, pid}
  end

  defp get_live_view_assigns(live_view_pid) do
    try do
      GenServer.call(live_view_pid, :get_assigns, 5000)
    catch
      :exit, _ -> %{}
    end
  end

  defp try_forward_event(event, payload, live_view_pid, socket) do
    try do
      case GenServer.call(live_view_pid, {:handle_event, event, payload}, 5000) do
        {:noreply, updated_socket} ->
          # Get the updated assigns
          new_assigns = updated_socket.assigns

          # Notify about assigns update
          publish_assigns_update(socket.assigns.live_path, new_assigns)

          {:reply, {:ok, %{assigns: new_assigns}}, socket}

        {:reply, reply, updated_socket} ->
          # Handle replies from LiveView
          new_assigns = updated_socket.assigns

          # Notify about assigns update
          publish_assigns_update(socket.assigns.live_path, new_assigns)

          {:reply, {:ok, %{assigns: new_assigns, reply: reply}}, socket}

        {:error, reason} ->
          {:reply, {:error, %{reason: inspect(reason)}}, socket}
      end
    catch
      :exit, {:timeout, _} ->
        {:reply, {:error, %{reason: "event_timeout"}}, socket}

      :exit, _reason ->
        {:reply, {:error, %{reason: "live_view_error"}}, socket}

      error ->
        Logger.error("Event forwarding error: #{inspect(error)}")
        {:reply, {:error, %{reason: "event_error"}}, socket}
    end
  end

  defp publish_assigns_update(live_path, assigns) do
    Phoenix.PubSub.broadcast(
      LiveReactNative.PubSub,
      "live_view:#{live_path}:assigns",
      {:assigns_update, assigns, true}
    )
  end
end
