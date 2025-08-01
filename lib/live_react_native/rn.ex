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
    add_rn_command(socket, "rn:vibrate", options)
  end

  def notification(socket, options \\ %{}) do
    add_rn_command(socket, "rn:notification", options)
  end

  def badge(socket, options \\ %{}) do
    add_rn_command(socket, "rn:badge", options)
  end

  # UI Interactions (Phase 3.3)

  def show_toast(socket, options \\ %{}) do
    add_rn_command(socket, "rn:show_toast", options)
  end

  def show_alert(socket, options \\ %{}) do
    add_rn_command(socket, "rn:show_alert", options)
  end

  def dismiss_keyboard(socket) do
    add_rn_command(socket, "rn:dismiss_keyboard", %{})
  end

  def show_loading(socket, options \\ %{}) do
    add_rn_command(socket, "rn:show_loading", options)
  end

  def hide_loading(socket) do
    add_rn_command(socket, "rn:hide_loading", %{})
  end

  # Private helper functions

  defp add_rn_command(socket, type, payload) do
    # Store RN commands in assigns so LiveViewHolder can detect and send them
    command = {String.replace_prefix(type, "rn:", ""), payload}
    existing_commands = socket.assigns[:__rn_commands__] || []
    new_commands = existing_commands ++ [command]

    %{socket | assigns: Map.put(socket.assigns, :__rn_commands__, new_commands)}
  end
end
