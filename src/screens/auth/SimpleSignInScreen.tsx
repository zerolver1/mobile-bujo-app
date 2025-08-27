import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleSignInScreenProps {
  onSignIn: () => void;
}

export const SimpleSignInScreen: React.FC<SimpleSignInScreenProps> = ({ onSignIn }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bullet Journal</Text>
          <Text style={styles.subtitle}>
            Bridge your analog journal with digital productivity
          </Text>
        </View>

        {/* Bullet Journal Visual */}
        <View style={styles.visualContainer}>
          <View style={styles.paperPage}>
            <View style={styles.sampleEntries}>
              <View style={styles.entryRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.entryText}>Complete project proposal</Text>
              </View>
              <View style={styles.entryRow}>
                <Text style={styles.bullet}>○</Text>
                <Text style={styles.entryText}>Team meeting 2:00 PM</Text>
              </View>
              <View style={styles.entryRow}>
                <Text style={styles.bullet}>—</Text>
                <Text style={styles.entryText}>Great ideas from the session</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Demo Sign In Button */}
        <View style={styles.authButtons}>
          <TouchableOpacity style={styles.demoButton} onPress={onSignIn}>
            <Ionicons name="play-outline" size={20} color="white" />
            <Text style={styles.demoButtonText}>Try Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <Text style={styles.privacyText}>
          Demo mode - Your data stays on your device and won't be saved permanently.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  visualContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  paperPage: {
    width: 280,
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sampleEntries: {
    marginTop: 40,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bullet: {
    fontSize: 16,
    color: '#1C1C1E',
    marginRight: 12,
    width: 16,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  authButtons: {
    marginBottom: 40,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
});