import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Stores
import { useSubscriptionStore } from './src/stores/SubscriptionStore';
import { useBuJoStore } from './src/stores/BuJoStore';

const AppContent: React.FC = () => {
  const { initialize: initializeSubscription } = useSubscriptionStore();
  const { initialize: initializeBuJo } = useBuJoStore();

  useEffect(() => {
    // Initialize services in demo mode
    initializeSubscription('demo-user');
    initializeBuJo();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor="#FAF7F0" />
    </>
  );
};

export default function App() {
  return <AppContent />;
}
