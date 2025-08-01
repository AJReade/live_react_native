defmodule LiveReactNative.MixProject do
  use Mix.Project

  @source_url "https://github.com/mrdotb/live_react"
  @version "1.0.0"

  def project do
    [
      app: :live_react_native,
      version: @version,
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      description: "React Native integration for Phoenix LiveView",
      package: package(),
      docs: docs(),
      source_url: @source_url
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    conditionals =
      case Application.get_env(:live_react_native, :ssr_module) do
        # Needed to use :httpc.request
        LiveReactNative.SSR.ViteJS -> [:inets]
        _ -> []
      end

    [
      extra_applications: [:logger] ++ conditionals
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:jason, "~> 1.2"},
      {:nodejs, "~> 3.1", optional: true},
      {:floki, ">= 0.30.0", optional: true},
      {:phoenix, ">= 1.7.0"},
      {:phoenix_html, ">= 3.3.1"},
      {:phoenix_live_view, ">= 0.18.0"},
      {:telemetry, "~> 0.4 or ~> 1.0"},
      {:credo, "~> 1.7", only: [:dev, :test]},
      {:ex_doc, "~> 0.19", only: :dev, runtime: false},
      {:git_ops, "~> 2.8.0", only: [:dev]}
    ]
  end

  defp package do
    [
      maintainers: ["Baptiste Chaleil"],
      licenses: ["MIT"],
      links: %{
        Github: "https://github.com/mrdotb/live_react"
      },
      files:
        ~w(assets/copy assets/js lib)s ++
          ~w(CHANGELOG.md LICENSE.md mix.exs package.json README.md .formatter.exs)s
    ]
  end

  defp docs do
    [
      name: "LiveReact",
      source_ref: "v#{@version}",
      source_url: "https://github.com/mrdotb/live_react",
      homepage_url: "https://github.com/mrdotb/live_react",
      main: "readme",
      extras: [
        "README.md",
        "guides/installation.md",
        "guides/deployment.md",
        "guides/development.md",
        "guides/ssr.md",
        "CHANGELOG.md"
      ]
    ]
  end
end
