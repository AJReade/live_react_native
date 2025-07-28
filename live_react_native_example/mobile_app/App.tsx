import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useLiveView } from './useLiveViewFixed';

export default function App() {
  const [count, setCount] = useState(0);

  // Step 4: Try using fixed version with wrapper
  let hookResult;
  let hookError = null;

  try {
    hookResult = useLiveView('/live/counter');
  } catch (error) {
    hookError = error.message;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧬 LiveReact Native</Text>
      <Text style={styles.subtitle}>Step 4: Fixed Library Hook</Text>

      <View style={styles.testContainer}>
        <Text style={styles.label}>React useState test:</Text>
        <Text style={styles.count}>{count}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.decrementButton]}
            onPress={() => setCount(count - 1)}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.incrementButton]}
            onPress={() => setCount(count + 1)}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.status}>
        React: {typeof useState === 'function' ? '✅ Working' : '❌ Broken'}
      </Text>

      <Text style={styles.status}>
        Fixed Hook: {hookError ? `❌ ${hookError}` : hookResult ? '✅ Success' : '❓ Unknown'}
      </Text>

      {hookResult && (
        <>
          <Text style={styles.status}>
            Loading: {hookResult.loading ? '🔄 Loading' : '✅ Loaded'}
          </Text>
          <Text style={styles.status}>
            Connected: {hookResult.connected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
          <Text style={styles.status}>
            Count: {hookResult.assigns.count || 0}
          </Text>
        </>
      )}

      <Text style={styles.nextStep}>
        Step 4: Testing fixed library using wrapper approach
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 30,
  },
  testContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 15,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButton: {
    backgroundColor: '#22c55e',
  },
  decrementButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  nextStep: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

    marginBottom: 15,
  },
  nextStep: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
