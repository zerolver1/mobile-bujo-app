import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { EntryReviewParams } from '../types/BuJo';

// Screens
import { DailyLogScreen } from '../screens/main/DailyLogScreen';
import { CaptureScreen } from '../screens/main/CaptureScreen';
import { CollectionsScreen } from '../screens/main/CollectionsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { EntryReviewScreen } from '../screens/main/EntryReviewScreen';
import { QuickCaptureScreen } from '../screens/main/QuickCaptureScreen';
import { BuJoGuideScreen } from '../screens/settings/BuJoGuideScreen';
import { AppleSyncSettingsScreen } from '../screens/settings/AppleSyncSettingsScreen';
import { MonthlyLogScreen } from '../screens/collections/MonthlyLogScreen';
import { FutureLogScreen } from '../screens/collections/FutureLogScreen';
import { CustomCollectionsScreen } from '../screens/collections/CustomCollectionsScreen';
import { CollectionDetailScreen } from '../screens/collections/CollectionDetailScreen';
import { IndexScreen } from '../screens/collections/IndexScreen';

// Type definitions
export type RootTabParamList = {
  DailyLog: undefined;
  Capture: undefined;
  Collections: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EntryReview: EntryReviewParams;
  QuickCapture: { editEntry?: any } | undefined;
  BuJoGuide: undefined;
  AppleSyncSettings: undefined;
  MonthlyLog: undefined;
  FutureLog: undefined;
  CustomCollections: undefined;
  CollectionDetail: { collection: any };
  Index: undefined;
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
        options={{
          title: 'Today',
          headerTitle: 'Daily Log',
        }}
      >
        {(props) => <DailyLogScreen {...props} />}
      </Tab.Screen>
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
        options={{
          title: 'Collections',
          headerTitle: 'Collections',
        }}
      >
        {(props) => <CollectionsScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      >
        {(props) => <SettingsScreen {...props} />}
      </Tab.Screen>
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
      <Stack.Screen 
        name="QuickCapture" 
        component={QuickCaptureScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="BuJoGuide" 
        component={BuJoGuideScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="AppleSyncSettings" 
        component={AppleSyncSettingsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="MonthlyLog" 
        component={MonthlyLogScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="FutureLog" 
        component={FutureLogScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="CustomCollections" 
        component={CustomCollectionsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="CollectionDetail" 
        component={CollectionDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="Index" 
        component={IndexScreen}
        options={{
          headerShown: false,
          presentation: 'card',
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