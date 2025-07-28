import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import our LiveReact Native library
import { useLiveView } from 'live-react-native/js/hooks/useLiveView';
import { useAdvancedUpdates } from 'live-react-native/js/hooks/useAdvancedUpdates';
import { usePerformanceMonitoring } from 'live-react-native/js/hooks/usePerformanceMonitoring';

// Demo Components
function LiveCounterDemo() {
  const {
    loading,
    assigns,
    error,
    pushEvent,
    performanceMetrics
  } = useLiveView('/live/counter', { initial_count: 0 }, {
    enablePerformanceMonitoring: true,
    debounceMs: 50
  });

  if (loading) {
    return (
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>🔄 Live Counter (Loading...)</Text>
        <View style={styles.loadingIndicator}>
          <Text>Connecting to LiveView...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>❌ Live Counter (Error)</Text>
        <Text style={styles.errorText}>
          {error.message || 'Failed to connect to Phoenix server'}
        </Text>
        <Text style={styles.helpText}>
          Make sure your Phoenix server is running on localhost:4000
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.demoCard}>
      <Text style={styles.demoTitle}>🔢 Live Counter</Text>
      <View style={styles.counterContainer}>
        <Text style={styles.counterValue}>{assigns.count || 0}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.decrementButton]}
            onPress={() => pushEvent('decrement', {})}
          >
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.incrementButton]}
            onPress={() => pushEvent('increment', {})}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      {performanceMetrics && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>📊 Performance</Text>
          <Text style={styles.metricsText}>
            Updates: {performanceMetrics.updateCount}
          </Text>
          <Text style={styles.metricsText}>
            Avg Time: {performanceMetrics.averageUpdateTime.toFixed(1)}ms
          </Text>
        </View>
      )}
    </View>
  );
}

function LiveChatDemo() {
  const {
    loading,
    assigns,
    pushEvent
  } = useLiveView('/live/chat', { room: 'demo' });

  const messages = assigns.messages || [];

  return (
    <View style={styles.demoCard}>
      <Text style={styles.demoTitle}>💬 Live Chat</Text>
      {loading ? (
        <Text>Loading chat...</Text>
      ) : (
        <View style={styles.chatContainer}>
          <ScrollView style={styles.messagesList}>
            {messages.map((message: any, index: number) => (
              <View key={index} style={styles.messageContainer}>
                <Text style={styles.messageUser}>{message.user}:</Text>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => pushEvent('send_message', {
              text: `Hello from React Native! ${Date.now()}`
            })}
          >
            <Text style={styles.sendButtonText}>Send Test Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AdvancedUpdatesDemo() {
  const [oldData, setOldData] = useState({ items: [] });
  const [newData, setNewData] = useState({
    items: [
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' }
    ]
  });

  const updateAnalysis = useAdvancedUpdates({
    oldAssigns: oldData,
    newAssigns: newData,
    keyFields: { items: 'id' },
    enablePerformanceMonitoring: true
  });

  const simulateListUpdate = () => {
    setOldData(newData);
    setNewData({
      items: [
        ...newData.items,
        {
          id: Date.now(),
          name: `Item ${newData.items.length + 1}`,
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }
      ]
    });
  };

  return (
    <View style={styles.demoCard}>
      <Text style={styles.demoTitle}>⚡ Advanced Updates</Text>
      <View style={styles.advancedUpdatesContainer}>
        <Text style={styles.sectionSubtitle}>List Operations:</Text>
        <Text style={styles.codeText}>
          {JSON.stringify(updateAnalysis.listOperations, null, 2)}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={simulateListUpdate}
        >
          <Text style={styles.buttonText}>Add Item (Optimized)</Text>
        </TouchableOpacity>

        {updateAnalysis.performanceMetrics && (
          <View style={styles.optimizationInfo}>
            <Text style={styles.metricsTitle}>🚀 Optimizations</Text>
            <Text style={styles.metricsText}>
              Applied: {updateAnalysis.performanceMetrics.optimizationsApplied.join(', ')}
            </Text>
            <Text style={styles.metricsText}>
              Renders Saved: {updateAnalysis.performanceMetrics.rendersSaved}
            </Text>
            <Text style={styles.metricsText}>
              Efficiency: {updateAnalysis.performanceMetrics.efficiency.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PerformanceMonitoringDemo() {
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  const monitor = usePerformanceMonitoring({
    enableAssignsDiffLogging: monitoringEnabled,
    enablePerformanceProfiling: monitoringEnabled,
    enableMemoryLeakDetection: monitoringEnabled,
    enableUpdateVisualization: monitoringEnabled,
    verbosityLevel: 'normal'
  });

  const enabledFeatures = monitor.getEnabledFeatures();

  return (
    <View style={styles.demoCard}>
      <Text style={styles.demoTitle}>📊 Performance Monitoring</Text>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Enable Monitoring:</Text>
        <Switch
          value={monitoringEnabled}
          onValueChange={setMonitoringEnabled}
          trackColor={{ false: '#767577', true: '#4ade80' }}
          thumbColor={monitoringEnabled ? '#22c55e' : '#f4f3f4'}
        />
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionSubtitle}>Enabled Features:</Text>
        {enabledFeatures.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.featureText}>{feature.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const oldAssigns = { test: 'old_value', count: 1 };
          const newAssigns = { test: 'new_value', count: 2 };
          monitor.logAssignsDiff(oldAssigns, newAssigns);

          const profileId = monitor.startProfile('test_operation');
          setTimeout(() => {
            monitor.endProfile(profileId);
            Alert.alert('Success', 'Check console for performance logs!');
          }, 100);
        }}
      >
        <Text style={styles.buttonText}>Test Performance Logging</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🧬 LiveReact Native</Text>
          <Text style={styles.subtitle}>
            Phoenix LiveView + React Native = ❤️
          </Text>
          <Text style={styles.version}>
            Demo App v1.0 - All Features Implemented!
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.statusText}>Phoenix Channel Client</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.statusText}>useLiveView Hook</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.statusText}>Advanced Optimizations</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.statusText}>Performance Monitoring</Text>
          </View>
        </View>

        <LiveCounterDemo />
        <LiveChatDemo />
        <AdvancedUpdatesDemo />
        <PerformanceMonitoringDemo />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚀 Ready for Production</Text>
          <Text style={styles.infoText}>
            This example demonstrates all the core LiveReact Native features:
            {'\n\n'}
            • Real-time Phoenix LiveView integration
            {'\n'}• Smart React Native reconciliation
            {'\n'}• Advanced update optimizations
            {'\n'}• Comprehensive performance monitoring
            {'\n'}• Production-ready error handling
            {'\n\n'}
            Start your Phoenix server and see the magic! ✨
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    textAlign: 'center',
  },
  version: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 4,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  demoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  loadingIndicator: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 8,
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  counterContainer: {
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  metricsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatContainer: {
    height: 200,
  },
  messagesList: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },
  messageContainer: {
    marginBottom: 8,
  },
  messageUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  advancedUpdatesContainer: {
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
    color: '#374151',
  },
  optimizationInfo: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#374151',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});