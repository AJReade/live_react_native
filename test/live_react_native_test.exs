defmodule LiveReactNativeTest do
  use ExUnit.Case, async: true
  import Phoenix.LiveViewTest

  alias LiveReactNative

  describe "react_native/1" do
    test "extracts props from assigns" do
      assigns = %{
        name: "Counter",
        count: 42,
        step: 1,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true}
      }

      result = LiveReactNative.react_native(assigns)

      assert result.component_name == "Counter"
      assert result.props == %{count: 42, step: 1}
      assert result.props_changed? == true
    end

    test "handles slots correctly for mobile" do
      assigns = %{
        name: "Card",
        title: "Hello",
        inner_block: [%{__slot__: :inner_block, inner_block: fn -> "Content" end}],
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{title: true}
      }

      result = LiveReactNative.react_native(assigns)

      assert result.component_name == "Card"
      assert result.props == %{title: "Hello"}
      # Slots should be JSON-serializable, not HTML
      assert result.slots == %{default: "Content"}
      assert is_binary(Jason.encode!(result.slots))
    end

    test "generates consistent component IDs" do
      assigns = %{name: "Test", socket: %Phoenix.LiveView.Socket{}}

      result1 = LiveReactNative.react_native(assigns)
      result2 = LiveReactNative.react_native(assigns)

      # Should generate consistent IDs for same component in same process
      assert result1.id == result2.id
      assert String.starts_with?(result1.id, "Test-")
    end

    test "tracks changed props efficiently" do
      # First render - everything changed
      assigns1 = %{
        name: "Counter",
        count: 0,
        step: 1,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true, step: true}
      }

      result1 = LiveReactNative.react_native(assigns1)
      assert result1.props_changed? == true

      # Second render - only count changed
      assigns2 = %{
        name: "Counter",
        count: 1,
        step: 1,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true}
      }

      result2 = LiveReactNative.react_native(assigns2)
      assert result2.props_changed? == true
      assert result2.props == %{count: 1, step: 1}
    end

    test "ignores special LiveView assigns" do
      assigns = %{
        name: "Test",
        count: 42,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true},
        __given__: %{},
        id: "custom-id",
        class: "some-class"
      }

      result = LiveReactNative.react_native(assigns)

      # Only actual props should be extracted
      assert result.props == %{count: 42}
      # Special assigns should be handled separately
      assert result.id == "custom-id"
    end

    test "does not include SSR data for mobile" do
      assigns = %{
        name: "Test",
        count: 42,
        socket: nil,  # Dead view that would trigger SSR on web
        __changed__: nil
      }

      result = LiveReactNative.react_native(assigns)

      # Mobile should never have SSR data
      refute Map.has_key?(result, :ssr_render)
      refute Map.has_key?(result, :html)
    end

    test "returns serializable data structure" do
      assigns = %{
        name: "Complex",
        data: %{nested: %{values: [1, 2, 3]}},
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{data: true}
      }

      result = LiveReactNative.react_native(assigns)

      # Entire result should be JSON-serializable for channel transmission
      assert {:ok, _json} = Jason.encode(result)
    end
  end

  describe "extract_props/1" do
    test "separates props from special assigns" do
      assigns = %{
        # Props
        count: 42,
        name: "test",
        user_id: 123,
        # Special assigns that should be ignored
        socket: %{},
        __changed__: %{},
        __given__: %{},
        # Slots
        inner_block: [%{__slot__: :inner_block}]
      }

      {props, _changed?} = LiveReactNative.extract_props(assigns)

      assert props == %{count: 42, name: "test", user_id: 123}
    end
  end

  describe "extract_slots/1" do
    test "extracts and renders slots to plain text for mobile" do
      slot_fun = fn -> "Hello World" end
      assigns = %{
        inner_block: [%{__slot__: :inner_block, inner_block: slot_fun}],
        __changed__: %{}
      }

      {slots, _changed?} = LiveReactNative.extract_slots(assigns)

      assert slots == %{default: "Hello World"}
    end

    test "handles empty slots" do
      assigns = %{count: 42, __changed__: %{}}

      {slots, changed?} = LiveReactNative.extract_slots(assigns)

      assert slots == %{}
      assert changed? == false
    end
  end
end
