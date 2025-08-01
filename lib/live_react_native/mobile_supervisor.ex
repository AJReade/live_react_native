defmodule LiveReactNative.MobileSupervisor do
  @moduledoc """
  Supervisor for mobile-native Phoenix Channel components.

  This supervisor manages the Registry and PubSub processes needed for
  mobile channel communication. It should be added to the consuming
  Phoenix application's supervision tree.

  ## Usage

  In your Phoenix application's supervision tree:

  ```elixir
  children = [
    # ... other children
    LiveReactNative.MobileSupervisor,
    # ... rest of children
  ]
  ```

  ## Components

  - **Registry**: Tracks LiveView processes per mobile channel topic
  - **PubSub**: Handles communication between MobileChannel and LiveViewHolder
  """

  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    children = [
      # Registry for tracking LiveView processes per mobile client
      {Registry, keys: :unique, name: LiveReactNative.MobileChannel.Registry},

      # PubSub for mobile channel communication
      {Phoenix.PubSub, name: LiveReactNative.PubSub}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
