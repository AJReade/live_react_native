defmodule ServerWeb.Router do
  use ServerWeb, :router
  import Phoenix.LiveView.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {ServerWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  # Mobile pipeline without session requirements
  pipeline :mobile do
    plug :accepts, ["html", "json"]
  end

  scope "/", ServerWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/mobile", ServerWeb do
    pipe_through :api

    get "/session", PageController, :mobile_session
  end

  # Mobile LiveView routes without session requirements
  scope "/", ServerWeb do
    pipe_through :mobile

    live_session :mobile_session, session: %{} do
      live "/live/counter", CounterLive
      live "/counter", CounterLive
      live "/mobile/counter", MobileCounterLive  # Mobile-specific route
    end
  end

  # Other scopes may use custom stacks.
  # scope "/api", ServerWeb do
  #   pipe_through :api
  # end
end
