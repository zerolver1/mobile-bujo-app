import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../stores/SubscriptionStore';
import { useProcessingStore, ProcessingSpeedPreference } from '../../stores/ProcessingStore';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { getSubscriptionTier, usageStats, restorePurchases } = useSubscriptionStore();
  const { speedPreference, setSpeedPreference, loadPreferences } = useProcessingStore();

  const [preferences, setPreferences] = React.useState({
    autoSync: true,
    hapticFeedback: true,
    dailyNotifications: false,
  });

  // Load processing preferences on mount
  React.useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const subscriptionTier = getSubscriptionTier();

  const handleSignOut = () => {
    Alert.alert(
      'Demo Mode',
      'This is a demo version. Sign out functionality will be available when authentication is enabled.',
      [{ text: 'OK' }]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }> = ({ title, subtitle, icon, onPress, rightElement, showChevron = true }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.card}>
            <SettingRow
              title="Demo User"
              subtitle={`${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan`}
              icon="person-outline"
              showChevron={false}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Subscription</Text>
          <View style={styles.card}>
            <SettingRow
              title="Usage This Month"
              subtitle={`${usageStats.monthlyScans} scans used`}
              icon="analytics-outline"
              showChevron={false}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Manage Subscription"
              subtitle="Change plan or billing"
              icon="card-outline"
              onPress={() => Alert.alert('Coming Soon', 'Subscription management will be available soon')}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Restore Purchases"
              subtitle="Restore previous purchases"
              icon="refresh-outline"
              onPress={handleRestorePurchases}
            />
          </View>
        </View>

        {/* Processing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Processing</Text>
          <View style={styles.card}>
            <SettingRow
              title="Processing Mode"
              subtitle={speedPreference === 'speed' 
                ? 'Prioritize Speed - Faster results with good accuracy'
                : 'Prioritize Accuracy - Best quality results, may take longer'
              }
              icon="flash-outline"
              rightElement={
                <Switch
                  value={speedPreference === 'speed'}
                  onValueChange={(value) => 
                    setSpeedPreference(value ? 'speed' : 'accuracy')
                  }
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* Apple Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Apple Integration</Text>
          <View style={styles.card}>
            <SettingRow
              title="Apple Sync Settings"
              subtitle="Configure sync with Reminders & Calendar"
              icon="phone-portrait-outline"
              onPress={() => navigation.navigate('AppleSyncSettings')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow
              title="Auto-Sync"
              subtitle="Automatically sync with Apple apps"
              icon="sync-outline"
              rightElement={
                <Switch
                  value={preferences.autoSync}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, autoSync: value }))
                  }
                />
              }
              showChevron={false}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Haptic Feedback"
              subtitle="Tactile feedback for interactions"
              icon="hand-left-outline"
              rightElement={
                <Switch
                  value={preferences.hapticFeedback}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, hapticFeedback: value }))
                  }
                />
              }
              showChevron={false}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Daily Reminders"
              subtitle="Get reminded to review your journal"
              icon="notifications-outline"
              rightElement={
                <Switch
                  value={preferences.dailyNotifications}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, dailyNotifications: value }))
                  }
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.card}>
            <SettingRow
              title="Bullet Journal Guide"
              subtitle="Learn the methodology & app features"
              icon="book-outline"
              onPress={() => navigation.navigate('BuJoGuide')}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Help & FAQ"
              subtitle="Get help with bullet journaling"
              icon="help-circle-outline"
              onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon')}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Send Feedback"
              subtitle="Help us improve the app"
              icon="chatbubble-outline"
              onPress={() => Alert.alert('Coming Soon', 'Feedback form will be available soon')}
            />
            <View style={styles.separator} />
            <SettingRow
              title="Privacy Policy"
              subtitle="How we protect your data"
              icon="shield-outline"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow
              title="Sign Out"
              icon="log-out-outline"
              onPress={handleSignOut}
              showChevron={false}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bullet Journal v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ♥ for analog thinkers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E7',
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});