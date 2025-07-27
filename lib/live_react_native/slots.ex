defmodule LiveReactNative.Slots do
  @moduledoc false

  @doc """
  Render slots for mobile transmission - returns plain text instead of HTML.

  Unlike the web version, this renders slots to plain text that can be
  JSON-serialized and sent over Phoenix Channels to React Native.
  """
  def render_for_mobile(slot_assigns) when is_list(slot_assigns) do
    case slot_assigns do
      [%{__slot__: :inner_block, inner_block: slot_fun}] when is_function(slot_fun) ->
        # Render the slot function to plain text
        rendered_content = slot_fun.()
        %{default: to_string(rendered_content)}

      [] ->
        %{}

      _other ->
        raise "Unsupported slot configuration for mobile. Only default slot (inner_block) is supported."
    end
  end

  def render_for_mobile(_), do: %{}
end
