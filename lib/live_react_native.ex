defmodule LiveReactNative do
  @moduledoc """
  Pure state management for Phoenix LiveView mobile apps.

  Sends LiveView assigns as JSON over WebSocket to React Native apps.
  No HTML rendering or component orchestration - just clean state management.
  """

  require Logger

  @doc """
  Extract and serialize LiveView assigns for mobile transmission.

  Takes LiveView assigns, filters out Phoenix internals, and returns clean
  data ready for JSON serialization over WebSocket to React Native.
  """
  def serialize_assigns(assigns) do
    # Extract only the user assigns, filtering out Phoenix internals
    {clean_assigns, assigns_changed?} = extract_user_assigns(assigns)

    %{
      assigns: clean_assigns,
      changed: assigns_changed?
    }
  end

  # NEW PHASE 2.1A FUNCTIONS: GRANULAR CHANGE TRACKING

  @doc """
  Generate granular diff between old and new assigns, tracking specific changed paths.

  Returns detailed information about what exactly changed, enabling surgical
  React Native updates instead of full re-renders.
  """
  def granular_assigns_diff(old_assigns, new_assigns) do
    old_clean = filter_phoenix_internals(old_assigns)
    new_clean = filter_phoenix_internals(new_assigns)

    {changed_paths, unchanged_paths} = compare_assigns_paths(old_clean, new_clean, "")
    structure_changed = assigns_structure_changed?(old_clean, new_clean)
    list_operations = detect_list_operations(old_clean, new_clean)

    %{
      changed_paths: changed_paths,
      unchanged_paths: unchanged_paths,
      structure_changed: structure_changed,
      list_operations: list_operations
    }
  end

  @doc """
  Generate structural and data fingerprints for assigns.

  Structure fingerprint changes when assigns shape changes (new keys, different types).
  Data fingerprint changes when values change but structure stays the same.
  """
  def assigns_fingerprint(assigns) do
    clean_assigns = filter_phoenix_internals(assigns)

    structure_hash = generate_structure_hash(clean_assigns)
    data_hash = generate_data_hash(clean_assigns)

    %{
      structure: structure_hash,
      data: data_hash
    }
  end

  @doc """
  Generate minimal diff containing only changed values and operations.

  Instead of sending full assigns, sends only the deltas needed to update
  the React Native app, dramatically reducing network payload.
  """
  def minimal_assigns_diff(old_assigns, new_assigns) do
    old_clean = filter_phoenix_internals(old_assigns)
    new_clean = filter_phoenix_internals(new_assigns)

    {diff_map, operations} = build_minimal_diff(old_clean, new_clean, "")
    payload_size = Jason.encode!(diff_map) |> byte_size()

    %{
      diff: diff_map,
      operations: operations,
      payload_size: payload_size
    }
  end

  @doc """
  Batch multiple assign changes for efficient transmission.

  Combines rapid changes into single update, with optional prioritization
  for UI-critical updates vs background data changes.
  """
  def batch_assigns_changes(changes, opts \\ []) do
    priority = Keyword.get(opts, :priority, :normal)
    batch_id = generate_batch_id()
    timestamp = System.system_time(:microsecond)

    batched_assigns =
      changes
      |> Enum.reduce(%{}, fn {:assign, key, value}, acc ->
        Map.put(acc, key, value)
      end)

    %{
      batched_assigns: batched_assigns,
      batch_id: batch_id,
      batch_size: length(changes),
      priority: priority,
      timestamp: timestamp
    }
  end

  @doc """
  Extract user assigns from LiveView assigns, filtering out Phoenix internals.
  """
  def extract_user_assigns(assigns) do
    Enum.reduce(assigns, {%{}, false}, fn {key, value}, {acc, changed} ->
      case is_phoenix_internal?(key) do
        false -> {Map.put(acc, key, value), changed || assign_changed?(assigns, key)}
        true -> {acc, changed}
      end
    end)
  end

  # Private functions

  # Phoenix internal assigns that should not be sent to React Native
  defp is_phoenix_internal?(key) when key in ~w(socket __changed__ __given__)a, do: true
  defp is_phoenix_internal?(_key), do: false

  defp assign_changed?(%{__changed__: nil}, _key), do: true
  defp assign_changed?(%{__changed__: changed}, key), do: changed[key] != nil
  defp assign_changed?(_assigns, _key), do: true  # Handle missing __changed__ key

  # PHASE 2.1A PRIVATE HELPER FUNCTIONS

  defp filter_phoenix_internals(assigns) do
    assigns
    |> Enum.reject(fn {key, _value} -> is_phoenix_internal?(key) end)
    |> Enum.into(%{})
  end

      defp compare_assigns_paths(old_assigns, new_assigns, path_prefix) do
    all_keys = (Map.keys(old_assigns) ++ Map.keys(new_assigns)) |> Enum.uniq()

    {changed, unchanged} =
      all_keys
      |> Enum.reduce({%{}, []}, fn key, {changed_acc, unchanged_acc} ->
        current_path = build_path(path_prefix, key)
        old_value = Map.get(old_assigns, key, :__not_found__)
        new_value = Map.get(new_assigns, key, :__not_found__)

        cond do
          old_value == :__not_found__ ->
            # Key added
            {Map.put(changed_acc, current_path, %{old: nil, new: new_value}), unchanged_acc}

          new_value == :__not_found__ ->
            # Key removed
            {Map.put(changed_acc, current_path, %{old: old_value, new: nil}), unchanged_acc}

          is_map(old_value) and is_map(new_value) ->
            # Check if structure changed first
            old_structure = extract_structure_info(old_value)
            new_structure = extract_structure_info(new_value)

            if old_structure != new_structure do
              # Structure changed - return full object diff
              {Map.put(changed_acc, current_path, %{old: old_value, new: new_value}), unchanged_acc}
            else
                            # Same structure - do nested comparison
              {nested_changed, _nested_unchanged} = compare_assigns_paths(old_value, new_value, current_path)

              if map_size(nested_changed) > 0 do
                # Has nested changes - include nested changes but don't add to unchanged
                {Map.merge(changed_acc, nested_changed), unchanged_acc}
              else
                # No nested changes - add top-level path to unchanged (only if at root level)
                new_unchanged = if path_prefix == "", do: [current_path | unchanged_acc], else: unchanged_acc
                {changed_acc, new_unchanged}
              end
            end

          old_value != new_value ->
            # Value changed
            {Map.put(changed_acc, current_path, %{old: old_value, new: new_value}), unchanged_acc}

          true ->
            # Unchanged - add to unchanged list only if at root level
            new_unchanged = if path_prefix == "", do: [current_path | unchanged_acc], else: unchanged_acc
            {changed_acc, new_unchanged}
        end
      end)

    # Sort unchanged paths for consistent ordering
    {changed, Enum.sort(unchanged)}
  end

  defp assigns_structure_changed?(old_assigns, new_assigns) do
    old_structure = extract_structure_info(old_assigns)
    new_structure = extract_structure_info(new_assigns)
    old_structure != new_structure
  end

  defp detect_list_operations(old_assigns, new_assigns) do
    old_assigns
    |> Enum.reduce(%{}, fn {key, old_value}, acc ->
      new_value = Map.get(new_assigns, key)

      if is_list(old_value) and is_list(new_value) do
        operations = analyze_list_changes(old_value, new_value)
        Map.put(acc, to_string(key), operations)
      else
        acc
      end
    end)
  end

  defp extract_structure_info(assigns) when is_map(assigns) do
    assigns
    |> Enum.map(fn {key, value} ->
      {key, extract_value_type(value)}
    end)
    |> Enum.sort()
    |> Enum.into(%{})
  end

  defp extract_value_type(value) when is_map(value), do: {:map, extract_structure_info(value)}
  defp extract_value_type(value) when is_list(value), do: {:list, length(value)}
  defp extract_value_type(value) when is_binary(value), do: :string
  defp extract_value_type(value) when is_integer(value), do: :integer
  defp extract_value_type(value) when is_float(value), do: :float
  defp extract_value_type(value) when is_boolean(value), do: :boolean
  defp extract_value_type(value) when is_atom(value), do: :atom
  defp extract_value_type(_value), do: :other

  defp analyze_list_changes(old_list, new_list) do
    # Simple implementation - detect appends for now
    old_size = length(old_list)
    new_size = length(new_list)

    cond do
      new_size > old_size ->
        # Items added
        added = Enum.drop(new_list, old_size)
        %{added: added, removed: [], modified: []}

      new_size < old_size ->
        # Items removed
        removed = Enum.drop(old_list, new_size)
        %{added: [], removed: removed, modified: []}

      true ->
        # Same size - check for modifications
        modified =
          old_list
          |> Enum.zip(new_list)
          |> Enum.with_index()
          |> Enum.filter(fn {{old_item, new_item}, _index} -> old_item != new_item end)
          |> Enum.map(fn {{_old_item, new_item}, index} -> {index, new_item} end)

        %{added: [], removed: [], modified: modified}
    end
  end

  defp generate_structure_hash(assigns) do
    assigns
    |> extract_structure_info()
    |> :erlang.phash2()
    |> Integer.to_string(16)
  end

  defp generate_data_hash(assigns) do
    assigns
    |> :erlang.phash2()
    |> Integer.to_string(16)
  end

  defp build_minimal_diff(old_assigns, new_assigns, path_prefix) do
    all_keys = (Map.keys(old_assigns) ++ Map.keys(new_assigns)) |> Enum.uniq()

    all_keys
    |> Enum.reduce({%{}, []}, fn key, {diff_acc, ops_acc} ->
      current_path = build_path(path_prefix, key)
      old_value = Map.get(old_assigns, key, :__not_found__)
      new_value = Map.get(new_assigns, key, :__not_found__)

      cond do
        old_value == :__not_found__ ->
          # Key added
          {Map.put(diff_acc, current_path, new_value), [:set | ops_acc]}

        new_value == :__not_found__ ->
          # Key removed
          {Map.put(diff_acc, current_path, :__delete__), [:delete | ops_acc]}

        is_list(old_value) and is_list(new_value) and length(new_value) > length(old_value) ->
          # List append operation
          appended = Enum.drop(new_value, length(old_value))
          {Map.put(diff_acc, to_string(key), %{append: appended}), [:list_append | ops_acc]}

        is_map(old_value) and is_map(new_value) ->
          # Nested comparison
          {nested_diff, nested_ops} = build_minimal_diff(old_value, new_value, current_path)

          if map_size(nested_diff) > 0 do
            {Map.merge(diff_acc, nested_diff), nested_ops ++ ops_acc}
          else
            {diff_acc, ops_acc}
          end

        old_value != new_value ->
          # Value changed
          {Map.put(diff_acc, current_path, new_value), [:set | ops_acc]}

        true ->
          # Unchanged - skip
          {diff_acc, ops_acc}
      end
    end)
  end

  defp build_path("", key), do: to_string(key)
  defp build_path(prefix, key), do: "#{prefix}.#{key}"

  defp generate_batch_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase()
  end
end
