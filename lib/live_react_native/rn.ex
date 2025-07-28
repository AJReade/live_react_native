defmodule LiveReactNative.RN do
  @moduledoc """
  React Native specific commands for LiveView.

  This module provides server-side functions to push mobile-specific
  commands (navigation, haptics, notifications, etc.) to React Native clients.
  """

  # Navigation Commands

  def navigate(socket, screen, params \\ %{}) do
    add_rn_command(socket, "rn:navigate", %{screen: screen, params: params})
  end

  def go_back(socket) do
    add_rn_command(socket, "rn:go_back", %{})
  end

  def reset_stack(socket, screen) do
    add_rn_command(socket, "rn:reset_stack", %{screen: screen})
  end

  def replace(socket, screen, params \\ %{}) do
    add_rn_command(socket, "rn:replace", %{screen: screen, params: params})
  end

  # Mobile Features (Phase 3.2)

  def haptic(socket, options \\ %{}) do
    add_rn_command(socket, "rn:haptic", options)
  end

  def vibrate(socket, options \\ %{}) do
    # TODO: Implement vibrate command
    raise "Not implemented yet - Phase 3.2"
  end

  def notification(socket, options \\ %{}) do
    # TODO: Implement notification command
    raise "Not implemented yet - Phase 3.2"
  end

  def badge(socket, options \\ %{}) do
    # TODO: Implement badge command
    raise "Not implemented yet - Phase 3.2"
  end

  # UI Interactions (Phase 3.3)

  def show_toast(socket, options \\ %{}) do
    # TODO: Implement show_toast command
    raise "Not implemented yet - Phase 3.3"
  end

  def show_alert(socket, options \\ %{}) do
    # TODO: Implement show_alert command
    raise "Not implemented yet - Phase 3.3"
  end

  def dismiss_keyboard(socket) do
    # TODO: Implement dismiss_keyboard command
    raise "Not implemented yet - Phase 3.3"
  end

  def show_loading(socket, options \\ %{}) do
    # TODO: Implement show_loading command
    raise "Not implemented yet - Phase 3.3"
  end

  def hide_loading(socket) do
    # TODO: Implement hide_loading command
    raise "Not implemented yet - Phase 3.3"
  end

  # Private helper functions

  defp add_rn_command(socket, type, payload) do
    command = %{type: type, payload: payload}
    existing_commands = socket.private[:rn_commands] || []
    new_commands = existing_commands ++ [command]

    %{socket | private: Map.put(socket.private, :rn_commands, new_commands)}
  end
end
