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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../stores/SubscriptionStore';
import { useProcessingStore, ProcessingSpeedPreference } from '../../stores/ProcessingStore';
import { useTheme } from '../../theme';
import { 
  PaperBackground, 
  PaperButton, 
  Typography, 
  Card,
  PAPER_DESIGN_TOKENS,
  safeThemeAccess 
} from '../../components/ui/paperComponents';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { getSubscriptionTier, usageStats, restorePurchases } = useSubscriptionStore();
  const { speedPreference, setSpeedPreference, loadPreferences } = useProcessingStore();
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();

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
        <Ionicons 
          name={icon} 
          size={22} 
          color={safeThemeAccess(theme, t => t.colors.primary, '#007AFF')} 
        />
      </View>
      <View style={styles.settingContent}>
        <Typography variant="body" style={[styles.settingTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>{title}</Typography>
        {subtitle && <Typography variant="caption" style={[styles.settingSubtitle, {
          color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')
        }]}>{subtitle}</Typography>}
      </View>
      {rightElement || (showChevron && onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={safeThemeAccess(theme, t => t.colors.textTertiary, '#C7C7CC')} 
        />
      ))}
    </TouchableOpacity>
  );

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
        {/* App Logo Header */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../assets/d7e9cb17-153c-48bb-bf38-5e839a589a61.png')} 
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Typography variant="title1" style={styles.appTitle}>Bullet Journal</Typography>
          <Typography variant="caption1" style={styles.appSubtitle}>Digital Bullet Journaling</Typography>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Account</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Demo User"
              subtitle={`${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan`}
              icon="person-outline"
              showChevron={false}
            />
          </Card>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Subscription</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Usage This Month"
              subtitle={`${usageStats.monthlyScans} scans used`}
              icon="analytics-outline"
              showChevron={false}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Manage Subscription"
              subtitle="Change plan or billing"
              icon="card-outline"
              onPress={() => Alert.alert('Coming Soon', 'Subscription management will be available soon')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Restore Purchases"
              subtitle="Restore previous purchases"
              icon="refresh-outline"
              onPress={handleRestorePurchases}
            />
          </Card>
        </View>

        {/* Processing Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Processing</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
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
          </Card>
        </View>

        {/* Apple Integration Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Apple Integration</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Apple Sync Settings"
              subtitle="Configure sync with Reminders & Calendar"
              icon="phone-portrait-outline"
              onPress={() => navigation.navigate('AppleSyncSettings')}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Preferences</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
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
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
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
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
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
          </Card>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Appearance</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Theme"
              subtitle={themeMode === 'system' 
                ? 'Follow system setting'
                : themeMode === 'dark' 
                  ? 'Dark paper theme' 
                  : 'Light paper theme'
              }
              icon={theme.isDark ? "moon-outline" : "sunny-outline"}
              rightElement={
                <View style={[styles.themeButtons, {
                  backgroundColor: safeThemeAccess(theme, t => t.colors.backgroundSecondary, '#F2F2F7')
                }]}>
                  <TouchableOpacity 
                    style={[
                      styles.themeButton, 
                      themeMode === 'light' && [styles.activeThemeButton, {
                        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                        shadowColor: safeThemeAccess(theme, t => t.colors.shadow, '#000000'),
                      }]
                    ]}
                    onPress={() => setThemeMode('light')}
                  >
                    <Ionicons 
                      name="sunny-outline" 
                      size={18} 
                      color={themeMode === 'light' 
                        ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                        : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')
                      } 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.themeButton, 
                      themeMode === 'system' && [styles.activeThemeButton, {
                        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                        shadowColor: safeThemeAccess(theme, t => t.colors.shadow, '#000000'),
                      }]
                    ]}
                    onPress={() => setThemeMode('system')}
                  >
                    <Ionicons 
                      name="phone-portrait-outline" 
                      size={18} 
                      color={themeMode === 'system' 
                        ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                        : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')
                      } 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.themeButton, 
                      themeMode === 'dark' && [styles.activeThemeButton, {
                        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                        shadowColor: safeThemeAccess(theme, t => t.colors.shadow, '#000000'),
                      }]
                    ]}
                    onPress={() => setThemeMode('dark')}
                  >
                    <Ionicons 
                      name="moon-outline" 
                      size={18} 
                      color={themeMode === 'dark' 
                        ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                        : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')
                      } 
                    />
                  </TouchableOpacity>
                </View>
              }
              showChevron={false}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Typography variant="caption" style={[styles.sectionHeader, { 
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') 
          }]}>Support</Typography>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Design System"
              subtitle="Preview app components & theming"
              icon="color-palette-outline"
              onPress={() => navigation.navigate('DesignSystem')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Bullet Journal Guide"
              subtitle="Learn the methodology & app features"
              icon="book-outline"
              onPress={() => navigation.navigate('BuJoGuide')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Help & FAQ"
              subtitle="Get help with bullet journaling"
              icon="help-circle-outline"
              onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Send Feedback"
              subtitle="Help us improve the app"
              icon="chatbubble-outline"
              onPress={() => Alert.alert('Coming Soon', 'Feedback form will be available soon')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Privacy Policy"
              subtitle="How we protect your data"
              icon="shield-outline"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <View style={[styles.separator, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
            }]} />
            <SettingRow
              title="Terms of Service"
              subtitle="Terms and conditions"
              icon="document-text-outline"
              onPress={() => navigation.navigate('TermsOfService')}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Card style={[styles.card, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
          }]}>
            <SettingRow
              title="Sign Out"
              icon="log-out-outline"
              onPress={handleSignOut}
              showChevron={false}
            />
          </Card>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Typography variant="caption" style={[styles.footerText, {
            color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')
          }]}>Bullet Journal v1.0.0</Typography>
          <Typography variant="caption" style={[styles.footerSubtext, {
            color: safeThemeAccess(theme, t => t.colors.textTertiary, '#C7C7CC')
          }]}>Made with ♥ for analog thinkers</Typography>
        </View>
      </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let PaperBackground show through
  },
  scrollView: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F2A44',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#8E8E93',
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  card: {
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
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  activeThemeButton: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
});