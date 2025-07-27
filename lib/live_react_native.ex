defmodule LiveReactNative do
  @moduledoc """
  React Native adapter for Phoenix LiveView.

  Provides the same component-based reactivity as LiveReact but adapted for mobile apps.
  Instead of rendering HTML, returns data structures that can be sent over Phoenix Channels.
  """

  alias LiveReactNative.Slots

  require Logger

  @doc """
  Process React Native component assigns and return data structure for channel transmission.

  Unlike the web version, this returns a map with component data instead of HTML.
  """
    def react_native(assigns) do
    # Extract component name first
    component_name = Map.get(assigns, :name)

    # Create assigns without the component name for prop extraction
    assigns_for_props = Map.delete(assigns, :name)

    # Extract props and slots with change tracking
    {props, props_changed?} = extract_props(assigns_for_props)
    {slots, slots_changed?} = extract_slots(assigns_for_props)

    id = Map.get(assigns, :id) || generate_id(component_name)

    %{
      component_name: component_name,
      id: id,
      props: props,
      slots: slots,
      props_changed?: props_changed?,
      slots_changed?: slots_changed?
    }
  end

  @doc """
  Extract props from assigns, filtering out special LiveView assigns.
  """
  def extract_props(assigns) do
    Enum.reduce(assigns, {%{}, false}, fn {key, value}, {acc, changed} ->
      case normalize_key_for_extraction(key, value) do
        :props -> {Map.put(acc, key, value), changed || key_changed?(assigns, key)}
        _ -> {acc, changed}
      end
    end)
  end

  @doc """
  Extract slots from assigns and render them to plain text for mobile transmission.
  """
  def extract_slots(assigns) do
    Enum.reduce(assigns, {%{}, false}, fn {key, value}, {acc, changed} ->
      case normalize_key(key, value) do
        :slots ->
          rendered_slots = Slots.render_for_mobile(value)
          {Map.merge(acc, rendered_slots), changed || key_changed?(assigns, key)}
        _ -> {acc, changed}
      end
    end)
  end

  # Private functions adapted from LiveReact

  defp normalize_key(key, _val) when key in ~w(id class ssr name socket __changed__ __given__)a,
    do: :special

  defp normalize_key(_key, [%{__slot__: _}]), do: :slots
  defp normalize_key(key, val) when is_atom(key), do: key |> to_string() |> normalize_key(val)
  defp normalize_key(_key, _val), do: :props

  # For standalone extract_props/1 - doesn't treat "name" as special since it might be a prop
  defp normalize_key_for_extraction(key, _val) when key in ~w(id class ssr socket __changed__ __given__)a,
    do: :special

  defp normalize_key_for_extraction(_key, [%{__slot__: _}]), do: :slots
  defp normalize_key_for_extraction(key, val) when is_atom(key), do: key |> to_string() |> normalize_key_for_extraction(val)
  defp normalize_key_for_extraction(_key, _val), do: :props

  defp key_changed?(%{__changed__: nil}, _key), do: true
  defp key_changed?(%{__changed__: changed}, key), do: changed[key] != nil
  defp key_changed?(_assigns, _key), do: true  # Handle missing __changed__ key

  defp generate_id(name) do
    # Generate consistent IDs - same component gets same ID in same process
    ids = Process.get(:live_react_native_ids, %{})
    case Map.get(ids, name) do
      nil ->
        # First time seeing this component, generate new ID
        number = map_size(ids) + 1
        id = "#{name}-#{number}"
        Process.put(:live_react_native_ids, Map.put(ids, name, id))
        id
      existing_id ->
        # Component already has an ID, reuse it
        existing_id
    end
  end
end
