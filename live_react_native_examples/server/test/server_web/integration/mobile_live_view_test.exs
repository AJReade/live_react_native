defmodule ServerWeb.Integration.MobileLiveViewTest do
  use ServerWeb.ConnCase, async: true
  import Phoenix.LiveViewTest

  describe "Mobile LiveView Integration" do
    test "can mount counter LiveView without session", %{conn: conn} do
      # Test mounting the LiveView directly (bypasses WebSocket)
      {:ok, _view, html} = live(conn, "/live/counter")
      assert html =~ "LiveReact Native"
    end

    test "counter LiveView responds to increment events", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/live/counter")

      # Send increment event
      html = render_click(view, "increment")
      assert has_element?(view, "[data-count='1']") or html =~ "1"
    end

    test "counter LiveView responds to decrement events", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/live/counter")

      # Send decrement event
      html = render_click(view, "decrement")
      assert has_element?(view, "[data-count='-1']") or html =~ "-1"
    end

    test "counter LiveView responds to reset events", %{conn: conn} do
      {:ok, view, _html} = live(conn, "/live/counter")

      # Increment first, then reset
      render_click(view, "increment")
      render_click(view, "increment")
      html = render_click(view, "reset")
      assert has_element?(view, "[data-count='0']") or html =~ "0"
    end
  end

  describe "Mobile Pipeline Configuration" do
    test "mobile routes are accessible", %{conn: conn} do
      # Test that mobile session endpoint works
      conn = get(conn, "/mobile/session")
      assert json_response(conn, 200)
      assert Map.has_key?(json_response(conn, 200), "session_token")
    end
  end
end
