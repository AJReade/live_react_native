defmodule LiveReactNative.LiveViewHolder do
  @moduledoc """
  GenServer that holds LiveView state and handles events for mobile clients.

  This process acts as a bridge between the MobileChannel and LiveView logic,
  allowing us to reuse existing LiveView modules without modification while
  adapting them for mobile-native communication.

  ## Purpose

  - Holds LiveView socket state between mobile client events
  - Forwards events to LiveView handle_event/3 functions
  - Manages LiveView lifecycle (mount, handle_event, etc.)
  - Publishes assigns updates back to mobile clients
  - Handles RN commands (haptic, navigate, etc.) from LiveView

  ## Architecture

  ```
  Mobile Client -> MobileChannel -> LiveViewHolder -> LiveView Module
                                         ↓
                                   Assigns Updates
                                         ↓
                Mobile Client <- MobileChannel <- LiveViewHolder
  ```
  """

  use GenServer

  require Logger



  def start_link(state) do
    GenServer.start_link(__MODULE__, state)
  end

  def init(%{socket: socket, live_path: live_path}) do
    Logger.debug("Starting LiveViewHolder for: #{live_path}")

    state = %{
      socket: socket,
      live_path: live_path,
      view_module: socket.view
    }

    {:ok, state}
  end

  def handle_call(:get_assigns, _from, state) do
    {:reply, state.socket.assigns, state}
  end

  def handle_call({:handle_event, event, payload}, _from, state) do
    Logger.debug("LiveViewHolder handling event: #{event}")

    try do
      # Call the LiveView's handle_event function
      case state.view_module.handle_event(event, payload, state.socket) do
        {:noreply, updated_socket} ->
          # Update our state with the new socket
          new_state = %{state | socket: updated_socket}

          # Check for RN commands in the socket
          handle_rn_commands(updated_socket, state.live_path)

          {:reply, {:noreply, updated_socket}, new_state}

        {:reply, reply, updated_socket} ->
          # Update our state and return the reply
          new_state = %{state | socket: updated_socket}

          # Check for RN commands in the socket
          handle_rn_commands(updated_socket, state.live_path)

          {:reply, {:reply, reply, updated_socket}, new_state}

        other ->
          Logger.warning("Unexpected LiveView response: #{inspect(other)}")
          {:reply, {:error, "unexpected_response"}, state}
      end
    rescue
      error ->
        Logger.error("LiveView event error: #{inspect(error)}")
        {:reply, {:error, inspect(error)}, state}
    catch
      kind, reason ->
        Logger.error("LiveView event #{kind}: #{inspect(reason)}")
        {:reply, {:error, "#{kind}: #{inspect(reason)}"}, state}
    end
  end

  def handle_call(message, from, state) do
    Logger.debug("Unhandled LiveViewHolder call: #{inspect(message)} from #{inspect(from)}")
    {:reply, {:error, "unhandled_call"}, state}
  end

  def handle_info(message, state) do
    Logger.debug("LiveViewHolder received info: #{inspect(message)}")
    {:noreply, state}
  end

  def terminate(reason, _state) do
    Logger.info("LiveViewHolder terminating: #{inspect(reason)}")
    :ok
  end

  # Private functions

  defp handle_rn_commands(socket, live_path) do
    # Check if socket has any RN commands that were executed
    # This is where we'll extract RN commands from the socket and publish them

    case socket.assigns[:__rn_commands__] do
      nil ->
        :ok

      commands when is_list(commands) ->
        # Process each RN command
        Enum.each(commands, fn {command, payload} ->
          publish_rn_command(live_path, command, payload)
        end)

        # Clear the commands from the socket for next time
        # Note: In a real implementation, we'd need to modify the socket
        :ok

      _ ->
        :ok
    end
  end

  defp publish_rn_command(live_path, command, payload) do
    Logger.debug("Publishing RN command: #{command} with payload: #{inspect(payload)}")

    Phoenix.PubSub.broadcast(
      LiveReactNative.PubSub,
      "live_view:#{live_path}:assigns",
      {:rn_command, command, payload}
    )
  end
end
