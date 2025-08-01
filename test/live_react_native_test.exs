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

  # NEW TESTS FOR PHASE 2.1A: GRANULAR CHANGE TRACKING

  describe "granular_assigns_diff/2 (Phase 2.1A)" do
    test "detects granular changes in nested assigns" do
      old_assigns = %{
        user: %{name: "John", age: 30},
        count: 5,
        settings: %{theme: "light"},
        __changed__: %{user: true}
      }

      new_assigns = %{
        user: %{name: "Jane", age: 30},
        count: 5,
        settings: %{theme: "light"},
        __changed__: %{user: true}
      }

      result = LiveReactNative.granular_assigns_diff(old_assigns, new_assigns)

      assert result.changed_paths == %{"user.name" => %{old: "John", new: "Jane"}}
      assert result.unchanged_paths == ["count", "settings"]
      assert result.structure_changed == false
    end

    test "detects structural changes vs value changes" do
      old_assigns = %{
        user: %{name: "John"},
        __changed__: %{user: true}
      }

      new_assigns = %{
        user: %{name: "John", age: 30},  # Structure changed - added age field
        __changed__: %{user: true}
      }

      result = LiveReactNative.granular_assigns_diff(old_assigns, new_assigns)

      assert result.structure_changed == true
      assert result.changed_paths == %{"user" => %{old: %{name: "John"}, new: %{name: "John", age: 30}}}
    end

    test "tracks list changes efficiently" do
      old_assigns = %{
        items: [%{id: 1, name: "A"}, %{id: 2, name: "B"}],
        __changed__: %{items: true}
      }

      new_assigns = %{
        items: [%{id: 1, name: "A"}, %{id: 2, name: "B"}, %{id: 3, name: "C"}],
        __changed__: %{items: true}
      }

      result = LiveReactNative.granular_assigns_diff(old_assigns, new_assigns)

      assert result.list_operations == %{
        "items" => %{
          added: [%{id: 3, name: "C"}],
          removed: [],
          modified: []
        }
      }
    end

    test "handles deeply nested changes" do
      old_assigns = %{
        user: %{
          profile: %{
            settings: %{
              notifications: %{email: true, sms: false}
            }
          }
        },
        __changed__: %{user: true}
      }

      new_assigns = %{
        user: %{
          profile: %{
            settings: %{
              notifications: %{email: true, sms: true}  # Only SMS changed
            }
          }
        },
        __changed__: %{user: true}
      }

      result = LiveReactNative.granular_assigns_diff(old_assigns, new_assigns)

      assert result.changed_paths == %{
        "user.profile.settings.notifications.sms" => %{old: false, new: true}
      }
    end
  end

  describe "assigns_fingerprint/1 (Phase 2.1A)" do
    test "generates consistent fingerprints for same structure" do
      assigns1 = %{user: %{name: "John", age: 30}, count: 5}
      assigns2 = %{user: %{name: "Jane", age: 25}, count: 10}

      fp1 = LiveReactNative.assigns_fingerprint(assigns1)
      fp2 = LiveReactNative.assigns_fingerprint(assigns2)

      # Same structure should have same fingerprint
      assert fp1.structure == fp2.structure
      # Different values should have different data fingerprints
      refute fp1.data == fp2.data
    end

    test "detects structural changes" do
      assigns1 = %{user: %{name: "John"}}
      assigns2 = %{user: %{name: "John", age: 30}}  # Added age field

      fp1 = LiveReactNative.assigns_fingerprint(assigns1)
      fp2 = LiveReactNative.assigns_fingerprint(assigns2)

      # Different structure should have different structure fingerprints
      refute fp1.structure == fp2.structure
    end

    test "fingerprints are deterministic" do
      assigns = %{user: %{name: "John", settings: %{theme: "dark"}}}

      fp1 = LiveReactNative.assigns_fingerprint(assigns)
      fp2 = LiveReactNative.assigns_fingerprint(assigns)

      assert fp1 == fp2
    end
  end

  describe "minimal_assigns_diff/2 (Phase 2.1A)" do
    test "generates minimal diff payload" do
      old_assigns = %{
        user: %{name: "John", age: 30},
        count: 5,
        settings: %{theme: "light", lang: "en"}
      }

      new_assigns = %{
        user: %{name: "Jane", age: 30},  # Only name changed
        count: 5,                       # Unchanged
        settings: %{theme: "dark", lang: "en"}  # Only theme changed
      }

      result = LiveReactNative.minimal_assigns_diff(old_assigns, new_assigns)

      # Should only include changed values, not unchanged ones
      assert result.diff == %{
        "user.name" => "Jane",
        "settings.theme" => "dark"
      }

      assert result.operations == [:set, :set]
      assert result.payload_size < Jason.encode!(new_assigns) |> byte_size()
    end

    test "handles list operations efficiently" do
      old_assigns = %{items: [%{id: 1}, %{id: 2}]}
      new_assigns = %{items: [%{id: 1}, %{id: 2}, %{id: 3}]}  # Added item

      result = LiveReactNative.minimal_assigns_diff(old_assigns, new_assigns)

      assert result.diff == %{"items" => %{append: [%{id: 3}]}}
      assert result.operations == [:list_append]
    end

    test "removes keys when assigns are deleted" do
      old_assigns = %{user: %{name: "John"}, temp_data: "delete_me"}
      new_assigns = %{user: %{name: "John"}}  # temp_data removed

      result = LiveReactNative.minimal_assigns_diff(old_assigns, new_assigns)

      assert result.diff == %{"temp_data" => :__delete__}
      assert result.operations == [:delete]
    end
  end

  describe "change_batching/1 (Phase 2.1A)" do
    test "batches multiple rapid changes" do
      changes = [
        {:assign, :count, 1},
        {:assign, :timestamp, ~N[2024-01-01 12:00:00]},
        {:assign, :status, "active"}
      ]

      result = LiveReactNative.batch_assigns_changes(changes)

      assert result.batched_assigns == %{
        count: 1,
        timestamp: ~N[2024-01-01 12:00:00],
        status: "active"
      }

      assert result.batch_id != nil
      assert result.batch_size == 3
    end

    test "respects change prioritization" do
      ui_changes = [{:assign, :loading, false}]
      data_changes = [{:assign, :background_data, %{}}]

      ui_result = LiveReactNative.batch_assigns_changes(ui_changes, priority: :high)
      data_result = LiveReactNative.batch_assigns_changes(data_changes, priority: :low)

      assert ui_result.priority == :high
      assert data_result.priority == :low
      assert ui_result.timestamp <= data_result.timestamp  # UI processed first
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

# **NEW TESTS: Phase 3.1 - RN Module & Navigation Commands**

defmodule LiveReactNative.RNTest do
  use ExUnit.Case

  describe "RN.navigate/3" do
    test "adds navigate command to socket assigns" do
      socket = %Phoenix.LiveView.Socket{
        assigns: %{},
        private: %{}
      }

      result_socket = LiveReactNative.RN.navigate(socket, "ProfileScreen", %{userId: 123})

      assert result_socket.assigns[:__rn_commands__] == [
        {"navigate", %{screen: "ProfileScreen", params: %{userId: 123}}}
      ]
    end

    test "appends to existing rn_commands" do
      socket = %Phoenix.LiveView.Socket{
        assigns: %{__rn_commands__: [{"haptic", %{type: "light"}}]},
        private: %{}
      }

      result_socket = LiveReactNative.RN.navigate(socket, "HomeScreen")

      assert length(result_socket.assigns[:__rn_commands__]) == 2
      assert List.last(result_socket.assigns[:__rn_commands__]) == {
        "navigate",
        %{screen: "HomeScreen", params: %{}}
      }
    end

    test "handles navigation with no params" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.navigate(socket, "HomeScreen")

      assert result_socket.assigns[:__rn_commands__] == [
        {"navigate", %{screen: "HomeScreen", params: %{}}}
      ]
    end
  end

  describe "RN.go_back/1" do
    test "adds go_back command to socket assigns" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.go_back(socket)

      assert result_socket.assigns[:__rn_commands__] == [
        {"go_back", %{}}
      ]
    end

    test "can stack multiple navigation commands" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = socket
        |> LiveReactNative.RN.navigate("DetailsScreen")
        |> LiveReactNative.RN.go_back()

      assert length(result_socket.assigns[:__rn_commands__]) == 2
      assert Enum.at(result_socket.assigns[:__rn_commands__], 0) == {"navigate", %{screen: "DetailsScreen", params: %{}}}
      assert Enum.at(result_socket.assigns[:__rn_commands__], 1) == {"go_back", %{}}
    end
  end

  describe "RN.reset_stack/2" do
    test "adds reset_stack command to socket assigns" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.reset_stack(socket, "HomeScreen")

      assert result_socket.assigns[:__rn_commands__] == [
        {"reset_stack", %{screen: "HomeScreen"}}
      ]
    end

    test "resets navigation stack to specified screen" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.reset_stack(socket, "LoginScreen")

      expected_command = {"reset_stack", %{screen: "LoginScreen"}}
      assert result_socket.assigns[:__rn_commands__] == [expected_command]
    end
  end

  describe "RN.replace/3" do
    test "adds replace command to socket assigns" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.replace(socket, "NewScreen", %{data: "test"})

      assert result_socket.assigns[:__rn_commands__] == [
        {"replace", %{screen: "NewScreen", params: %{data: "test"}}}
      ]
    end

    test "replaces current screen with new screen" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.replace(socket, "ReplacementScreen")

      expected_command = {"replace", %{screen: "ReplacementScreen", params: %{}}}
      assert result_socket.assigns[:__rn_commands__] == [expected_command]
    end
  end

  describe "RN command transmission" do
    test "commands are properly structured for channel transmission" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = socket
        |> LiveReactNative.RN.navigate("Screen1", %{id: 1})
        |> LiveReactNative.RN.haptic(%{type: "medium"})
        |> LiveReactNative.RN.go_back()

      commands = result_socket.assigns[:__rn_commands__]

      # All commands should be tuples with command name and payload
      assert Enum.all?(commands, fn
        {command, payload} when is_binary(command) and is_map(payload) -> true
        _ -> false
      end)

      # Commands should be in order
      assert Enum.at(commands, 0) == {"navigate", %{screen: "Screen1", params: %{id: 1}}}
      assert Enum.at(commands, 1) == {"haptic", %{type: "medium"}}
      assert Enum.at(commands, 2) == {"go_back", %{}}
    end

    test "commands are JSON serializable" do
      socket = %Phoenix.LiveView.Socket{assigns: %{}, private: %{}}

      result_socket = LiveReactNative.RN.navigate(socket, "TestScreen", %{
        string: "test",
        number: 42,
        boolean: true,
        list: [1, 2, 3],
        map: %{nested: "value"}
      })

      commands = result_socket.assigns[:__rn_commands__]

      # Should be able to encode/decode as JSON
      # Convert tuples to maps for JSON serialization
      serializable_commands = Enum.map(commands, fn {cmd, payload} ->
        %{command: cmd, payload: payload}
      end)

      encoded = Jason.encode!(serializable_commands)
      decoded = Jason.decode!(encoded)

      assert is_list(decoded)
      assert length(decoded) == 1
      assert List.first(decoded)["command"] == "navigate"
      assert List.first(decoded)["payload"]["screen"] == "TestScreen"
    end
  end
end
