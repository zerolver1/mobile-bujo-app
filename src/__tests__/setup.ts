// Extended matchers are built-in with @testing-library/react-native v12.4+

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

// Mock Zustand stores
jest.mock('../stores/BuJoStore', () => ({
  useBuJoStore: () => ({
    entries: [],
    addEntries: jest.fn(),
    removeEntry: jest.fn(),
    updateEntry: jest.fn(),
    toggleEntryStatus: jest.fn(),
    getEntryStats: () => ({
      total: 0,
      tasks: 0,
      events: 0,
      notes: 0,
      completed: 0,
      completionRate: 0,
    }),
  }),
}));

// Mock ProcessingStore
jest.mock('../stores/ProcessingStore', () => ({
  useProcessingStore: () => ({
    isProcessing: false,
    tasks: [],
    startTask: jest.fn(),
    updateTask: jest.fn(),
    completeTask: jest.fn(),
    clearTasks: jest.fn(),
  }),
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock camera and image picker
jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));