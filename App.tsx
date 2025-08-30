import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Theme
import { ThemeProvider } from './src/theme';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Stores
import { useSubscriptionStore } from './src/stores/SubscriptionStore';
import { useBuJoStore } from './src/stores/BuJoStore';
import { useProcessingStore } from './src/stores/ProcessingStore';

// Components
import { GlobalProcessingOverlay } from './src/components/GlobalProcessingOverlay';

// Hooks
import { useAppleSync } from './src/hooks/useAppleSync';

const AppContent: React.FC = () => {
  const { initialize: initializeSubscription } = useSubscriptionStore();
  const { initialize: initializeBuJo } = useBuJoStore();
  const { loadPreferences } = useProcessingStore();
  const { startSync, stopSync } = useAppleSync();

  useEffect(() => {
    // Initialize services in demo mode
    initializeSubscription('demo-user');
    initializeBuJo();
    
    // Load user processing preferences
    loadPreferences();
    
    // Start Apple sync service
    startSync(5); // Sync every 5 minutes
    
    // Cleanup on unmount
    return () => {
      stopSync();
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
        <GlobalProcessingOverlay />
        <StatusBar style="dark" backgroundColor="#FAF7F0" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}
