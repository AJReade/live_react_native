defmodule ServerWeb.PageController do
  use ServerWeb, :controller

  def home(conn, _params) do
    # The home page is often custom, but here…
    render(conn, :home, layout: false)
  end

  # Generate session token for mobile apps
  def mobile_session(conn, _params) do
    # Create a minimal session for mobile LiveView connections
    session_data = %{
      "_csrf_token" => "mobile-app-csrf-token"
    }

    # Sign the session using the same signing salt as the endpoint
    signing_salt = "k2I3sl8Z"
    session_token = Phoenix.Token.sign(ServerWeb.Endpoint, signing_salt, session_data)

    json(conn, %{session_token: session_token})
  end
end
