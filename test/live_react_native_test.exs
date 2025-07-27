defmodule LiveReactNativeTest do
  use ExUnit.Case, async: true
  import Phoenix.LiveViewTest

  alias LiveReactNative

  describe "serialize_assigns/1" do
    test "extracts user assigns filtering out Phoenix internals" do
      assigns = %{
        count: 42,
        step: 1,
        user: %{name: "John"},
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true},
        __given__: %{}
      }

      result = LiveReactNative.serialize_assigns(assigns)

      assert result.assigns == %{count: 42, step: 1, user: %{name: "John"}}
      assert result.changed == true
    end

        test "handles complex nested assigns" do
      assigns = %{
        title: "Hello",
        user: %{name: "John", settings: %{theme: "dark"}},
        items: [%{id: 1, name: "Item 1"}],
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{title: true}
      }

      result = LiveReactNative.serialize_assigns(assigns)

      assert result.assigns == %{
        title: "Hello",
        user: %{name: "John", settings: %{theme: "dark"}},
        items: [%{id: 1, name: "Item 1"}]
      }
      assert is_binary(Jason.encode!(result.assigns))
    end

    test "handles assigns with no changes tracked" do
      assigns = %{count: 0, name: "Test"}

      result = LiveReactNative.serialize_assigns(assigns)

      # When no __changed__ key, should default to changed=true
      assert result.assigns == %{count: 0, name: "Test"}
      assert result.changed == true
    end

        test "tracks changed assigns efficiently" do
      # First render - everything changed
      assigns1 = %{
        count: 0,
        step: 1,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true, step: true}
      }

      result1 = LiveReactNative.serialize_assigns(assigns1)
      assert result1.changed == true

      # Second render - only count changed
      assigns2 = %{
        count: 1,
        step: 1,
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true}
      }

      result2 = LiveReactNative.serialize_assigns(assigns2)
      assert result2.changed == true
      assert result2.assigns == %{count: 1, step: 1}
    end

    test "ignores Phoenix internal assigns" do
      assigns = %{
        count: 42,
        user_name: "John",
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{count: true},
        __given__: %{}
      }

      result = LiveReactNative.serialize_assigns(assigns)

      # Only user assigns should be included
      assert result.assigns == %{count: 42, user_name: "John"}
      # Phoenix internals should be filtered out
      refute Map.has_key?(result.assigns, :socket)
      refute Map.has_key?(result.assigns, :__changed__)
      refute Map.has_key?(result.assigns, :__given__)
    end

    test "never includes server-side rendering data" do
      assigns = %{
        count: 42,
        socket: nil,  # Dead view that would trigger SSR on web
        __changed__: nil
      }

      result = LiveReactNative.serialize_assigns(assigns)

      # Mobile should never have SSR data - just clean assigns
      assert result.assigns == %{count: 42}
      refute Map.has_key?(result, :ssr_render)
      refute Map.has_key?(result, :html)
    end

    test "returns JSON-serializable data structure" do
      assigns = %{
        data: %{nested: %{values: [1, 2, 3]}},
        socket: %Phoenix.LiveView.Socket{},
        __changed__: %{data: true}
      }

      result = LiveReactNative.serialize_assigns(assigns)

      # Entire result should be JSON-serializable for WebSocket transmission
      assert {:ok, _json} = Jason.encode(result)
    end
  end

  describe "extract_user_assigns/1" do
    test "separates user assigns from Phoenix internals" do
      assigns = %{
        # User assigns
        count: 42,
        name: "test",
        user_id: 123,
        data: %{nested: true},
        # Phoenix internals that should be filtered out
        socket: %{},
        __changed__: %{},
        __given__: %{}
      }

      {user_assigns, _changed?} = LiveReactNative.extract_user_assigns(assigns)

      assert user_assigns == %{count: 42, name: "test", user_id: 123, data: %{nested: true}}
    end

    test "handles empty assigns with change tracking" do
      assigns = %{socket: %{}, __changed__: %{}}

      {user_assigns, changed?} = LiveReactNative.extract_user_assigns(assigns)

      assert user_assigns == %{}
      assert changed? == false  # Empty __changed__ means nothing changed
    end

    test "handles assigns with no change tracking" do
      assigns = %{count: 42}  # No __changed__ key at all

      {user_assigns, changed?} = LiveReactNative.extract_user_assigns(assigns)

      assert user_assigns == %{count: 42}
      assert changed? == true  # No __changed__ key defaults to true
    end

    test "preserves all non-Phoenix assigns" do
      assigns = %{
        title: "Hello",
        items: [1, 2, 3],
        settings: %{theme: "dark"},
        __changed__: %{title: true}
      }

      {user_assigns, changed?} = LiveReactNative.extract_user_assigns(assigns)

      assert user_assigns == %{title: "Hello", items: [1, 2, 3], settings: %{theme: "dark"}}
      assert changed? == true
    end
  end
end
