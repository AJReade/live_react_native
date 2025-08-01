# Start the mobile supervisor for tests
{:ok, _} = LiveReactNative.MobileSupervisor.start_link([])

ExUnit.start()
