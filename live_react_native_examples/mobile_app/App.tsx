import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import our LiveReact Native library
import { createMobileClient } from 'live-react-native';

export default function App() {
  const [assigns, setAssigns] = useState({ count: 0, last_action: null, user_id: null });
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let liveClient = null;

    const connectToServer = async () => {
      try {
        setStatus('Creating client...');

        // Create mobile client for React Native (with mobile authentication)
        liveClient = createMobileClient({
          url: 'ws://localhost:4000/mobile',
          params: {
            user_id: 'demo_user_123',
            token: 'demo_jwt_token',
            device_id: 'expo_device_001'
          },
          debug: true,
          onError: (error) => {
            console.error('Connection error:', error);
            setStatus(`Error: ${error.message}`);
          },
          onReconnect: () => {
            setStatus('Reconnected!');
          }
        });

        setStatus('Connecting...');

        // Connect to Phoenix
        await liveClient.connect();
        setStatus('Joining LiveView...');

        // Join the counter channel through mobile bridge
        liveClient.join('mobile:/mobile/counter', {}, (newAssigns) => {
          console.log('Received assigns:', newAssigns);
          setAssigns(newAssigns);
          setStatus('✅ Connected & Live!');
        });

        setClient(liveClient);

      } catch (error) {
        console.error('Failed to connect:', error);
        setStatus(`Failed: ${error.message}`);
      }
    };

    connectToServer();

    // Cleanup on unmount
    return () => {
      if (liveClient) {
        liveClient.leave();
        liveClient.disconnect();
      }
    };
  }, []);

  const handleIncrement = () => {
    if (client) {
      client.pushEvent('increment', {});
    } else {
      Alert.alert('Error', 'Not connected to server');
    }
  };

  const handleDecrement = () => {
    if (client) {
      client.pushEvent('decrement', {});
    } else {
      Alert.alert('Error', 'Not connected to server');
    }
  };

  const handleReset = () => {
    if (client) {
      client.pushEvent('reset', {});
    } else {
      Alert.alert('Error', 'Not connected to server');
    }
  };

  const handleShowInfo = () => {
    if (client) {
      client.pushEvent('show_info', {});
    } else {
      Alert.alert('Error', 'Not connected to server');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>🧬 LiveReact Native</Text>
        <Text style={styles.subtitle}>Real-time Counter Demo</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.label}>Live Count from Server:</Text>
        <Text style={styles.count}>{assigns.count || 0}</Text>
        {assigns.last_action && (
          <Text style={styles.lastAction}>Last Action: {assigns.last_action}</Text>
        )}
        {assigns.user_id && (
          <Text style={styles.userId}>User: {assigns.user_id}</Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.decrementButton]}
            onPress={handleDecrement}
            disabled={!client}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={!client}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.incrementButton]}
            onPress={handleIncrement}
            disabled={!client}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleShowInfo}
          disabled={!client}
        >
          <Text style={styles.buttonText}>ℹ️ Show Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>🔗 Mobile-Native Architecture</Text>
        <Text style={styles.infoText}>
          • React Native handles UI rendering{'\n'}
          • Mobile Channel bridges to LiveView{'\n'}
          • Phoenix LiveView manages state{'\n'}
          • JWT-based mobile authentication{'\n'}
          • Real-time updates via WebSocket
        </Text>

        <Text style={styles.infoTitle}>🚀 Start Server</Text>
        <Text style={styles.infoText}>
          1. cd live_react_native_examples/server{'\n'}
          2. mix deps.get{'\n'}
          3. mix phx.server
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  counterContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  count: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },
  lastAction: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  userId: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButton: {
    backgroundColor: '#22c55e',
  },
  decrementButton: {
    backgroundColor: '#ef4444',
  },
  resetButton: {
    backgroundColor: '#6b7280',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
    marginTop: 15,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});