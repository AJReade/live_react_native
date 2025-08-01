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

// Import our LiveReact Native library (correct path)
import { createLiveViewClient } from 'live-react-native';

export default function App() {
  const [assigns, setAssigns] = useState({ count: 0 });
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let liveClient = null;

    const connectToServer = async () => {
      try {
        setStatus('Getting session token...');

        // STEP 1: Get real session token from server (based on integration tests)
        console.log('🔄 Fetching session token from http://localhost:4000/mobile/session');
        const sessionResponse = await fetch('http://localhost:4000/mobile/session');

        if (!sessionResponse.ok) {
          throw new Error(`Session fetch failed: ${sessionResponse.status} ${sessionResponse.statusText}`);
        }

        const sessionData = await sessionResponse.json();
        const sessionToken = sessionData.session_token;

        console.log('✅ Got session token:', sessionToken.substring(0, 50) + '...');
        console.log('📋 Session token length:', sessionToken.length);
        setStatus('Creating client with session...');

        // STEP 2: Create LiveView client with session token
        console.log('🔄 Creating LiveView client with session...');
        liveClient = createLiveViewClient({
          url: 'ws://localhost:4000/mobile', // Use mobile socket (no session required)
          params: {
            session: sessionToken  // Pass session token based on tests
          },
          debug: true,
          onError: (error) => {
            console.error('🚨 LiveView client error:', error);
            setStatus(`Error: ${error.message}`);
          },
          onReconnect: () => {
            console.log('🔄 LiveView client reconnected!');
            setStatus('Reconnected!');
          }
        });

        setStatus('Connecting to LiveView...');

        // STEP 3: Connect to Phoenix
        console.log('🔄 Connecting to Phoenix WebSocket...');
        await liveClient.connect();
        console.log('✅ Connected to Phoenix WebSocket!');
        setStatus('Joining counter LiveView...');

        // STEP 4: Join the counter LiveView with session
        console.log('🔄 Joining LiveView topic: /live/counter');
        liveClient.joinLiveView('/live/counter', {
          session: sessionToken  // Pass session in join params too
        }, (newAssigns) => {
          console.log('🎉 SUCCESS! Received assigns from LiveView:', newAssigns);
          setAssigns(newAssigns);
          setStatus('🎉 Connected & Live with Real Session!');
        });

        setClient(liveClient);
        console.log('✅ LiveView client setup complete!');

      } catch (error) {
        console.error('❌ Connection failed with error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        setStatus(`Failed: ${error.message || 'Unknown error'}`);

        // Show detailed error for debugging
        if (error.response) {
          console.error('❌ Response error:', await error.response.text());
        }
      }
    };

    connectToServer();

    // Cleanup on unmount
    return () => {
      if (liveClient) {
        liveClient.leaveLiveView();
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
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>🔗 Architecture</Text>
        <Text style={styles.infoText}>
          • React Native handles UI rendering{'\n'}
          • Phoenix LiveView manages state{'\n'}
          • WebSocket sync via phoenix.js{'\n'}
          • Real-time updates on state changes
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
    marginBottom: 30,
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