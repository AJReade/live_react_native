defmodule LiveReactNative do
  @moduledoc """
  Pure state management for Phoenix LiveView mobile apps.

  Sends LiveView assigns as JSON over WebSocket to React Native apps.
  No HTML rendering or component orchestration - just clean state management.
  """

  require Logger

  @doc """
  Extract and serialize LiveView assigns for mobile transmission.

  Takes LiveView assigns, filters out Phoenix internals, and returns clean
  data ready for JSON serialization over WebSocket to React Native.
  """
  def serialize_assigns(assigns) do
    # Extract only the user assigns, filtering out Phoenix internals
    {clean_assigns, assigns_changed?} = extract_user_assigns(assigns)

    %{
      assigns: clean_assigns,
      changed: assigns_changed?
    }
  end

    @doc """
  Extract user assigns from LiveView assigns, filtering out Phoenix internals.
  """
  def extract_user_assigns(assigns) do
    Enum.reduce(assigns, {%{}, false}, fn {key, value}, {acc, changed} ->
      case is_phoenix_internal?(key) do
        false -> {Map.put(acc, key, value), changed || assign_changed?(assigns, key)}
        true -> {acc, changed}
      end
    end)
  end

  # Private functions

  # Phoenix internal assigns that should not be sent to React Native
  defp is_phoenix_internal?(key) when key in ~w(socket __changed__ __given__)a, do: true
  defp is_phoenix_internal?(_key), do: false

  defp assign_changed?(%{__changed__: nil}, _key), do: true
  defp assign_changed?(%{__changed__: changed}, key), do: changed[key] != nil
  defp assign_changed?(_assigns, _key), do: true  # Handle missing __changed__ key
end
