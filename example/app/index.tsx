import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import LiveReact Native (will be implemented in Phase 2)
// import { LiveProvider, LiveComponent } from 'live_react_native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🧬 LiveReact Native</Text>
          <Text style={styles.subtitle}>
            Phoenix LiveView + React Native = ❤️
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚧 Coming Soon</Text>
          <Text style={styles.description}>
            This example app will demonstrate LiveReact Native features:
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.feature}>• Real-time component updates</Text>
            <Text style={styles.feature}>• Two-way event communication</Text>
            <Text style={styles.feature}>• File uploads from mobile</Text>
            <Text style={styles.feature}>• Navigation integration</Text>
            <Text style={styles.feature}>• Offline queue support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Ready for Development</Text>
          <Text style={styles.description}>
            The project structure is set up and ready for Phase 2 implementation.
            {'\n\n'}
            Next: Implement the Phoenix Channel client and React Native hooks.
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
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    marginLeft: 8,
  },
  feature: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 24,
  },
});