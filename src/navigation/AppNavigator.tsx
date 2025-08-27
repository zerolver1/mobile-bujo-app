import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Screens
import { DailyLogScreen } from '../screens/main/DailyLogScreen';
import { CaptureScreen } from '../screens/main/CaptureScreen';
import { CollectionsScreen } from '../screens/main/CollectionsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { EntryReviewScreen } from '../screens/main/EntryReviewScreen';

// Type definitions
export type RootTabParamList = {
  DailyLog: undefined;
  Capture: undefined;
  Collections: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EntryReview: {
    imageUri: string;
    ocrResult: any;
    parsedEntries: any[];
  };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'DailyLog':
              iconName = focused ? 'today' : 'today-outline';
              break;
            case 'Capture':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Collections':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingTop: Platform.OS === 'ios' ? 0 : 5,
          height: Platform.OS === 'ios' ? 84 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 2 : 5,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E7',
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        },
        headerTintColor: '#007AFF',
      })}
    >
      <Tab.Screen 
        name="DailyLog" 
        component={DailyLogScreen}
        options={{
          title: 'Today',
          headerTitle: 'Daily Log',
        }}
      />
      <Tab.Screen 
        name="Capture" 
        options={{
          title: 'Capture',
          headerTitle: 'Scan Page',
        }}
      >
        {(props) => <CaptureScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Collections" 
        component={CollectionsScreen}
        options={{
          title: 'Collections',
          headerTitle: 'Collections',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="EntryReview" 
        component={EntryReviewScreen}
        options={{
          headerShown: true,
          presentation: 'modal',
          headerTitle: 'Review Entries',
        }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};