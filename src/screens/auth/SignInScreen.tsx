import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// Required for OAuth
WebBrowser.maybeCompleteAuthSession();

export const SignInScreen: React.FC = () => {
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleAppleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleFlow();
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('Sign In Error', 'Failed to sign in with Apple');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleFlow();
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('Sign In Error', 'Failed to sign in with Google');
    }
  };

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
            <View style={styles.dotGrid} />
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

        {/* Sign In Buttons */}
        <View style={styles.authButtons}>
          <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn}>
            <Ionicons name="logo-apple" size={20} color="white" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <Text style={styles.privacyText}>
          Your journal data stays private and secure. We process everything on your device.
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
  dotGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    // Add dot pattern background here if needed
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
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  googleButtonText: {
    color: '#1C1C1E',
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