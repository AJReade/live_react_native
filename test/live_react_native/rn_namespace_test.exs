defmodule LiveReactNative.RNNamespaceTest do
  @moduledoc """
  Tests that RN namespace functions work correctly through the mobile bridge.

  This is a simpler version of the integration test that focuses specifically
  on verifying that RN commands are properly added to socket assigns.
  """

  use ExUnit.Case, async: true

  import LiveReactNative.RN

  # Mock LiveView socket for testing
  defp mock_socket(assigns \\ %{}) do
    %{assigns: assigns}
  end

  # Helper function to update assigns while preserving __rn_commands__
  defp update_assigns(socket, key, value) do
    %{socket | assigns: Map.put(socket.assigns, key, value)}
  end

  describe "RN Navigation Commands" do
    test "navigate/3 adds command to socket assigns" do
      socket = mock_socket()

      result = navigate(socket, "Settings", %{from: "home"})

      assert result.assigns[:__rn_commands__] == [
        {"navigate", %{screen: "Settings", params: %{from: "home"}}}
      ]
    end

    test "go_back/1 adds command to socket assigns" do
      socket = mock_socket()

      result = go_back(socket)

      assert result.assigns[:__rn_commands__] == [
        {"go_back", %{}}
      ]
    end

    test "reset_stack/2 adds command to socket assigns" do
      socket = mock_socket()

      result = reset_stack(socket, "Home")

      assert result.assigns[:__rn_commands__] == [
        {"reset_stack", %{screen: "Home"}}
      ]
    end

    test "replace/3 adds command to socket assigns" do
      socket = mock_socket()

      result = replace(socket, "Login", %{redirect: "/dashboard"})

      assert result.assigns[:__rn_commands__] == [
        {"replace", %{screen: "Login", params: %{redirect: "/dashboard"}}}
      ]
    end
  end

  describe "RN Mobile Features" do
    test "haptic/2 adds command to socket assigns" do
      socket = mock_socket()

      result = haptic(socket, %{type: "light"})

      assert result.assigns[:__rn_commands__] == [
        {"haptic", %{type: "light"}}
      ]
    end

    test "vibrate/2 adds command to socket assigns" do
      socket = mock_socket()

      result = vibrate(socket, %{pattern: [200, 100, 200]})

      assert result.assigns[:__rn_commands__] == [
        {"vibrate", %{pattern: [200, 100, 200]}}
      ]
    end

    test "notification/2 adds command to socket assigns" do
      socket = mock_socket()

      result = notification(socket, %{title: "New Message", body: "You have a new message"})

      assert result.assigns[:__rn_commands__] == [
        {"notification", %{title: "New Message", body: "You have a new message"}}
      ]
    end

    test "badge/2 adds command to socket assigns" do
      socket = mock_socket()

      result = badge(socket, %{count: 5})

      assert result.assigns[:__rn_commands__] == [
        {"badge", %{count: 5}}
      ]
    end
  end

  describe "RN UI Interactions" do
    test "show_toast/2 adds command to socket assigns" do
      socket = mock_socket()

      result = show_toast(socket, %{message: "Success!", duration: "short"})

      assert result.assigns[:__rn_commands__] == [
        {"show_toast", %{message: "Success!", duration: "short"}}
      ]
    end

    test "show_alert/2 adds command to socket assigns" do
      socket = mock_socket()

      result = show_alert(socket, %{title: "Confirm", message: "Are you sure?", buttons: ["Yes", "No"]})

      assert result.assigns[:__rn_commands__] == [
        {"show_alert", %{title: "Confirm", message: "Are you sure?", buttons: ["Yes", "No"]}}
      ]
    end

    test "dismiss_keyboard/1 adds command to socket assigns" do
      socket = mock_socket()

      result = dismiss_keyboard(socket)

      assert result.assigns[:__rn_commands__] == [
        {"dismiss_keyboard", %{}}
      ]
    end

    test "show_loading/2 adds command to socket assigns" do
      socket = mock_socket()

      result = show_loading(socket, %{message: "Loading..."})

      assert result.assigns[:__rn_commands__] == [
        {"show_loading", %{message: "Loading..."}}
      ]
    end

    test "hide_loading/1 adds command to socket assigns" do
      socket = mock_socket()

      result = hide_loading(socket)

      assert result.assigns[:__rn_commands__] == [
        {"hide_loading", %{}}
      ]
    end
  end

  describe "RN Command Chaining" do
    test "multiple RN commands can be chained together" do
      socket = mock_socket()

      result = socket
               |> haptic(%{type: "light"})
               |> show_toast(%{message: "Success!"})
               |> navigate("Home")

      assert result.assigns[:__rn_commands__] == [
        {"haptic", %{type: "light"}},
        {"show_toast", %{message: "Success!"}},
        {"navigate", %{screen: "Home", params: %{}}}
      ]
    end

    test "RN commands append to existing commands" do
      existing_commands = [{"haptic", %{type: "medium"}}]
      socket = mock_socket(%{__rn_commands__: existing_commands})

      result = socket
               |> show_toast(%{message: "Updated!"})
               |> navigate("Settings")

      assert result.assigns[:__rn_commands__] == [
        {"haptic", %{type: "medium"}},
        {"show_toast", %{message: "Updated!"}},
        {"navigate", %{screen: "Settings", params: %{}}}
      ]
    end
  end

  describe "RN Namespace Backward Compatibility" do
    test "all RN functions work identically to previous version" do
      # This test ensures that existing LiveView code using RN commands
      # continues to work unchanged with the mobile bridge

      socket = mock_socket()

      # Test the same pattern used in our CounterLive example
      result = socket
               |> Map.put(:assigns, Map.put(socket.assigns, :count, 1))
               |> haptic(%{type: "light"})

      # Socket state should be preserved
      assert result.assigns.count == 1

      # RN command should be added
      assert result.assigns[:__rn_commands__] == [
        {"haptic", %{type: "light"}}
      ]
    end

    test "RN commands work with complex LiveView assigns" do
      complex_assigns = %{
        user: %{id: 123, name: "Test User"},
        items: [%{id: 1, name: "Item 1"}, %{id: 2, name: "Item 2"}],
        loading: false,
        errors: %{}
      }

      socket = mock_socket(complex_assigns)

      result = socket
               |> show_loading(%{message: "Saving..."})
               |> update_assigns(:loading, true)
               |> show_toast(%{message: "Saved successfully!"})
               |> update_assigns(:loading, false)
               |> hide_loading()



      # All original assigns should be preserved
      assert result.assigns.user == complex_assigns.user
      assert result.assigns.items == complex_assigns.items
      assert result.assigns.errors == complex_assigns.errors

      # RN commands should be properly accumulated
      assert length(result.assigns[:__rn_commands__]) == 3
      assert Enum.any?(result.assigns[:__rn_commands__], fn {cmd, _} -> cmd == "show_loading" end)
      assert Enum.any?(result.assigns[:__rn_commands__], fn {cmd, _} -> cmd == "show_toast" end)
      assert Enum.any?(result.assigns[:__rn_commands__], fn {cmd, _} -> cmd == "hide_loading" end)
    end
  end
end
