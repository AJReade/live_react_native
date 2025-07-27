# React Native Update Optimization Strategy

**Combining Phoenix LiveView's Change Tracking with React Native's Reconciliation**

## 🎯 Core Principle

**Device-Centric Architecture**: Templates and components live entirely on the React Native device. The Elixir server is pure state management - no `render/1` functions, just `handle_event/3` → `{:noreply, assign(socket, ...)}`.

Instead of naively sending entire state trees or re-rendering whole components, we combine:
- **Server-side**: Phoenix LiveView's sophisticated change tracking and minimal diff generation (assigns only)
- **Client-side**: React Native's efficient reconciliation and memoization strategies (local templates)

**Flow**: Device templates → pushEvent → Server handle_event → assigns update → Device re-render

This hybrid approach achieves **native-level performance** while maintaining LiveView's simplicity.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    WebSocket     ┌──────────────────────┐  │
│  │   Phoenix       │◄────JSON──────►│  React Native       │  │
│  │   LiveView      │   diff stream   │  Reconciliation     │  │
│  │                 │                 │                     │  │
│  │ ┌─────────────┐ │                 │ ┌─────────────────┐ │  │
│  │ │ Change      │ │                 │ │ Smart           │ │  │
│  │ │ Tracking    │ │                 │ │ Re-rendering    │ │  │
│  │ │             │ │                 │ │                 │ │  │
│  │ │• Granular   │ │                 │ │• Memoization    │ │  │
│  │ │• Fingerprint│ │                 │ │• Shallow Comp   │ │  │
│  │ │• Batching   │ │                 │ │• Key-based      │ │  │
│  │ │• Minimal    │ │                 │ │• Debouncing     │ │  │
│  │ │  Diffs      │ │                 │ │• Interruption   │ │  │
│  │ └─────────────┘ │                 │ └─────────────────┘ │  │
│  │                 │                 │                     │  │
│  │ assigns only    │                 │ native views only   │  │
│  └─────────────────┘                 └──────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Server-Side: Advanced Change Tracking

### 1. **Granular Change Detection**
Instead of Phoenix's simple `__changed__` map, implement precise tracking:

```elixir
# Current LiveView approach (binary)
%{__changed__: %{user: true}}

# Our enhanced approach (granular)
%{
  __changed_paths__: %{
    "user.name" => {:updated, "John", "Jane"},
    "user.settings.theme" => {:updated, "light", "dark"},
    "posts" => {:list_changed, %{added: [3], removed: [], moved: %{1 => 2}}}
  }
}
```

**Benefits**:
- Client knows exactly what changed
- Can skip expensive computations for unchanged nested data
- Enables surgical React Native updates

### 2. **Assigns Fingerprinting**
Track structural changes vs value changes:

```elixir
# Structural fingerprint (changes rarely)
%{
  structure_fingerprint: "abc123",  # Hash of assigns shape/types
  data_fingerprint: "def456"       # Hash of actual values
}

# Only send structure when it changes
# Most updates only send new data_fingerprint + changed values
```

### 3. **Minimal Diff Generation**
Send only the delta, not the full state:

```elixir
# Instead of full assigns
%{assigns: %{user: %{name: "Jane", age: 30}, posts: [...]}}

# Send minimal diff
%{
  assigns_diff: %{
    "user.name" => "Jane",
    "posts.2" => %{id: 3, title: "New Post"}
  },
  operations: [:set, :list_append]
}
```

### 4. **Change Batching & Prioritization**
```elixir
# Batch rapid changes
LiveViewNative.batch_changes(socket, [
  {:assign, :counter, 1},
  {:assign, :timestamp, now()},
  {:assign, :status, "active"}
], priority: :high)

# UI updates get priority over background data
```

---

## 📱 Client-Side: Smart React Native Reconciliation

### 1. **Intelligent useLiveView Hook**
```typescript
const useLiveView = (path: string, params: object, options?: OptimizationOptions) => {
  const [assigns, setAssigns] = useState({});
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Memoize expensive computations
  const computedValues = useMemo(() =>
    computeExpensiveData(assigns),
    [assigns.user, assigns.settings] // Only recompute when these change
  );

  // Shallow comparison for props
  const stableProps = useMemo(() =>
    extractComponentProps(assigns),
    [assigns.ui, assigns.data] // Skip if other assigns change
  );

  // Batched updates to prevent cascading re-renders
  const updateAssigns = useCallback(
    debounce((newAssigns) => {
      setAssigns(prev => smartMerge(prev, newAssigns));
      setRenderTrigger(prev => prev + 1);
    }, 16) // 60fps max
  );

  return { assigns: stableProps, computedValues, pushEvent };
};
```

### 2. **React Native List Optimization**
```typescript
// Leverage React Native's reconciliation with LiveView data
const OptimizedList = ({ items }: { items: LiveViewItem[] }) => {
  // Use stable keys from server
  const renderItem = useCallback(({ item }: { item: LiveViewItem }) => (
    <MemoizedListItem
      key={item.stable_id}  // Server provides stable IDs
      data={item}
      onUpdate={pushEvent}
    />
  ), []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.stable_id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={16}
      // React Native handles efficient adds/removes/reorders
    />
  );
};

// Memoized to prevent unnecessary re-renders
const MemoizedListItem = React.memo(({ data, onUpdate }) => (
  <ListItem data={data} onUpdate={onUpdate} />
), (prevProps, nextProps) =>
  // Custom comparison - only re-render if actual content changed
  prevProps.data.updated_at === nextProps.data.updated_at
);
```

### 3. **Component Identity Preservation**
```typescript
// Preserve component instances across assigns updates
const usePersistentComponent = (assigns) => {
  const componentRef = useRef();

  // Only create new instance if structure actually changed
  if (!componentRef.current || assigns.__structure_changed__) {
    componentRef.current = createComponent(assigns);
  } else {
    // Just update props, keep same instance
    updateComponentProps(componentRef.current, assigns);
  }

  return componentRef.current;
};
```

### 4. **Selective Re-rendering**
```typescript
const SmartComponent = ({ userAssigns, settingsAssigns, dataAssigns }) => {
  // Only re-render user section when user assigns change
  const UserSection = useMemo(() => (
    <UserProfile user={userAssigns} />
  ), [userAssigns]);

  // Settings independent of user changes
  const SettingsSection = useMemo(() => (
    <UserSettings settings={settingsAssigns} />
  ), [settingsAssigns]);

  // Data table can update independently
  const DataSection = useMemo(() => (
    <DataTable data={dataAssigns} />
  ), [dataAssigns]);

  return (
    <View>
      {UserSection}
      {SettingsSection}
      {DataSection}
    </View>
  );
};
```

---

## ⚡ Advanced Optimization Techniques

### 1. **Update Debouncing**
Prevent cascading re-renders from rapid server updates:

```typescript
const useDebouncedAssigns = (assigns, delay = 16) => {
  const [debouncedAssigns, setDebouncedAssigns] = useState(assigns);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAssigns(assigns);
    }, delay);

    return () => clearTimeout(handler);
  }, [assigns, delay]);

  return debouncedAssigns;
};
```

### 2. **Render Interruption** (React Concurrent Mode Concepts)
```typescript
const useInterruptibleRender = (assigns) => {
  const [priorityAssigns, setPriorityAssigns] = useState({});
  const [backgroundAssigns, setBackgroundAssigns] = useState({});

  useEffect(() => {
    if (assigns.__priority__ === 'high') {
      // Interrupt background renders for high priority updates
      setPriorityAssigns(assigns);
    } else {
      // Low priority updates wait for idle time
      scheduleInBackground(() => setBackgroundAssigns(assigns));
    }
  }, [assigns]);

  return { ...backgroundAssigns, ...priorityAssigns };
};
```

### 3. **Memory Leak Prevention**
```typescript
const useLiveViewWithCleanup = (path, params) => {
  const channelRef = useRef();
  const assignsRef = useRef({});

  useEffect(() => {
    return () => {
      // Clean up subscriptions
      channelRef.current?.leave();
      // Clear assigns references
      assignsRef.current = {};
    };
  }, []);

  return useCallback((newAssigns) => {
    // Shallow merge to prevent memory buildup
    assignsRef.current = { ...assignsRef.current, ...newAssigns };
  }, []);
};
```

---

## 📊 Performance Monitoring

### 1. **Assigns Diff Logging**
```typescript
const useAssignsDiffLogger = (assigns) => {
  const prevAssigns = useRef(assigns);

  useEffect(() => {
    if (__DEV__) {
      const diff = computeDiff(prevAssigns.current, assigns);
      console.log('Assigns changed:', diff);
      prevAssigns.current = assigns;
    }
  }, [assigns]);
};
```

### 2. **Render Performance Profiling**
```typescript
const useRenderProfiler = (componentName) => {
  useEffect(() => {
    if (__DEV__) {
      const start = performance.now();
      return () => {
        const end = performance.now();
        console.log(`${componentName} render took ${end - start}ms`);
      };
    }
  });
};
```

---

## 🎯 Expected Performance Improvements

1. **Reduced Network Traffic**: 60-90% reduction in payload size
2. **Faster Re-renders**: 3-5x faster component updates
3. **Better Memory Usage**: Stable memory consumption under load
4. **Smoother Animations**: 60fps maintained during live updates
5. **Battery Efficiency**: Reduced CPU usage on mobile devices

---

## 🚀 Implementation Priority

1. **Phase 2.1A**: Server-side change tracking (foundational)
2. **Phase 2.1B**: Client-side smart reconciliation (core performance)
3. **Phase 2.1C**: Advanced update strategies (optimization)
4. **Phase 2.1D**: Performance monitoring (debugging/tuning)

This strategy ensures **LiveReact Native** delivers the performance users expect from native mobile apps while maintaining the development simplicity of Phoenix LiveView!