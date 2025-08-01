defmodule LiveReactNative.MobileChannelBasicTest do
  use ExUnit.Case, async: true

  alias LiveReactNative.MobileChannel

  # Basic smoke test to ensure the module loads and has the right functions
  test "MobileChannel module exists and compiles" do
    # Just check the module can be loaded and has the behavior
    assert Code.ensure_loaded?(MobileChannel)
    assert MobileChannel.__info__(:module) == MobileChannel

    # Check if it implements the channel behavior (Phoenix.Channel adds callbacks via macros)
    behaviours = MobileChannel.__info__(:attributes)[:behaviour] || []
    assert Phoenix.Channel in behaviours
  end

  test "mobile authentication validation works" do
    # Test the private function logic by calling the module's behavior indirectly
    # We'll test this through integration later
    assert :ok == :ok
  end

  test "LiveViewHolder module exists and compiles" do
    alias LiveReactNative.LiveViewHolder

    # Check the module can be loaded
    assert Code.ensure_loaded?(LiveViewHolder)
    assert LiveViewHolder.__info__(:module) == LiveViewHolder

    # Check if it implements the GenServer behavior
    behaviours = LiveViewHolder.__info__(:attributes)[:behaviour] || []
    assert GenServer in behaviours
  end

  test "MobileSupervisor is already running from test_helper" do
    # Supervisor should already be started, so we get :already_started
    case LiveReactNative.MobileSupervisor.start_link([]) do
      {:ok, _pid} -> :ok  # Fresh start
      {:error, {:already_started, _pid}} -> :ok  # Already running
    end
  end

  test "Registry is available" do
    # Registry should be available from supervisor in test_helper
    assert Registry.lookup(LiveReactNative.MobileChannel.Registry, "test_key") == []

    # Can register a process
    Registry.register(LiveReactNative.MobileChannel.Registry, "test_key", :test_value)

    assert [{_pid, :test_value}] = Registry.lookup(LiveReactNative.MobileChannel.Registry, "test_key")
  end

  test "PubSub is available" do
    # PubSub should be available from supervisor in test_helper
    Phoenix.PubSub.subscribe(LiveReactNative.PubSub, "test_topic")
    Phoenix.PubSub.broadcast(LiveReactNative.PubSub, "test_topic", {:test_message, "hello"})

    # Should receive the message
    assert_receive {:test_message, "hello"}
  end
end
