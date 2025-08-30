import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { PaperTabBar } from '../components/ui/PaperTabBar';
import { useTheme } from '../theme';
import { safeThemeAccess } from '../theme/paperStyleUtils';
import { PAPER_DESIGN_TOKENS } from '../theme/paperDesignTokens';
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
import { MemoryLogScreen } from '../screens/memory/MemoryLogScreen';
import { DesignSystemScreen } from '../screens/design/DesignSystemScreen';

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
  MemoryLog: undefined;
  DesignSystem: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <PaperTabBar {...props} />}
      screenOptions={({ route }) => ({
        // Tab bar is now handled by PaperTabBar component
        headerStyle: {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
          borderBottomWidth: 0.5,
          borderBottomColor: safeThemeAccess(theme, t => t.colors.border, '#E8E3D5'),
          elevation: 0,
          shadowOpacity: 0.1,
          shadowColor: 'rgba(139, 69, 19, 0.1)',
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 2,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '600',
          color: safeThemeAccess(theme, t => t.colors.text, '#2B2B2B'),
          fontFamily: Platform.select({
            ios: 'Georgia',
            android: 'serif',
            default: 'System',
          }),
          letterSpacing: 0.4,
        },
        headerTintColor: safeThemeAccess(theme, t => t.colors.primary, '#0F2A44'),
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
      <Stack.Screen 
        name="MemoryLog" 
        component={MemoryLogScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="DesignSystem" 
        component={DesignSystemScreen}
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