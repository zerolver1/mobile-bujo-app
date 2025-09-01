import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppleSync } from '../../hooks/useAppleSync';
import { appleIntegrationService } from '../../services/apple-integration/AppleIntegrationService';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card, PaperButton } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface AppleSyncSettingsScreenProps {
  navigation: any;
}

export const AppleSyncSettingsScreen: React.FC<AppleSyncSettingsScreenProps> = ({ 
  navigation 
}) => {
  const { syncState, startSync, stopSync, performManualSync } = useAppleSync();
  const { theme } = useTheme();
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissions, setPermissions] = useState({ reminders: false, calendar: false });
  
  const handleToggleSync = (enabled: boolean) => {
    if (enabled) {
      startSync(5); // 5 minute intervals
    } else {
      stopSync();
    }
  };
  
  const handleRequestPermissions = async () => {
    if (!appleIntegrationService.isAvailable()) {
      Alert.alert('Not Available', 'Apple integration is only available on iOS devices.');
      return;
    }
    
    setIsRequestingPermissions(true);
    
    try {
      const result = await appleIntegrationService.requestPermissions();
      setPermissions(result);
      
      if (result.reminders && result.calendar) {
        Alert.alert(
          'Permissions Granted',
          'You can now sync your bullet journal entries with Apple Reminders and Calendar.'
        );
      } else {
        Alert.alert(
          'Permissions Required',
          'Please grant access to Reminders and Calendar in Settings to enable sync.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // This would open iOS Settings app
              console.log('Open iOS Settings');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsRequestingPermissions(false);
    }
  };
  
  const handleManualSync = async () => {
    try {
      await performManualSync();
      Alert.alert(
        'Sync Complete',
        `Updated ${syncState.syncStats.synced} entries${syncState.syncStats.errors > 0 ? ` with ${syncState.syncStats.errors} errors` : ''}.`
      );
    } catch (error) {
      Alert.alert('Sync Failed', 'Please try again later.');
    }
  };
  
  const renderSyncStatus = () => {
    if (syncState.isSyncing) {
      return (
        <Card style={[styles.statusContainer, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Typography variant="caption" style={[styles.statusText, {
            color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
          }]}>Syncing...</Typography>
        </Card>
      );
    }
    
    if (syncState.lastSync) {
      return (
        <Card style={[styles.statusContainer, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Typography variant="caption" style={[styles.statusText, {
            color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
          }]}>
            Last sync: {syncState.lastSync.toLocaleTimeString()}
          </Typography>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <PaperBackground>
      <SafeAreaView style={[styles.container, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.background, '#FAF7F0')
      }]}>
      {/* Header */}
      <Card style={[styles.header, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
        borderRadius: 0
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Typography variant="subtitle" style={styles.headerTitle}>Apple Sync</Typography>
        <View style={{ width: 24 }} />
      </Card>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Sync Status */}
        <View style={styles.section}>
          <Typography variant="title" style={[styles.sectionTitle, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>Sync Status</Typography>
          
          <Card style={[styles.settingRow, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
          }]}>
            <View style={styles.settingContent}>
              <Typography variant="body" style={[styles.settingLabel, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>Auto Sync</Typography>
              <Typography variant="caption" style={[styles.settingDescription, {
                color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
              }]}>
                Automatically sync with Apple Reminders and Calendar every 5 minutes
              </Typography>
            </View>
            <Switch
              value={syncState.isRunning}
              onValueChange={handleToggleSync}
              trackColor={{ false: '#E5E5E7', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </Card>
          
          {renderSyncStatus()}
          
          {syncState.syncStats.total > 0 && (
            <Card style={[styles.statsContainer, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
            }]}>
              <View style={styles.statItem}>
                <Typography variant="title" style={[styles.statNumber, {
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}>{syncState.syncStats.total}</Typography>
                <Typography variant="caption" style={[styles.statLabel, {
                  color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
                }]}>Total</Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="title" style={[styles.statNumber, { color: '#34C759' }]}>
                  {syncState.syncStats.synced}
                </Typography>
                <Typography variant="caption" style={[styles.statLabel, {
                  color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
                }]}>Synced</Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="title" style={[styles.statNumber, { color: '#FF3B30' }]}>
                  {syncState.syncStats.errors}
                </Typography>
                <Typography variant="caption" style={[styles.statLabel, {
                  color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
                }]}>Errors</Typography>
              </View>
            </Card>
          )}
        </View>
        
        {/* Actions */}
        <View style={styles.section}>
          <Typography variant="title" style={[styles.sectionTitle, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>Actions</Typography>
          
          <Card style={styles.actionButton}>
            <TouchableOpacity 
              style={styles.actionButtonTouchable}
              onPress={handleRequestPermissions}
              disabled={isRequestingPermissions}
            >
            <Ionicons name="key-outline" size={20} color="#007AFF" />
              <Typography variant="body" style={[styles.actionButtonText, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>
                {isRequestingPermissions ? 'Requesting...' : 'Request Permissions'}
              </Typography>
              <Ionicons name="chevron-forward" size={16} color={safeThemeAccess(theme, t => t.colors.placeholder, '#C7C7CC')} />
            </TouchableOpacity>
          </Card>
          
          <Card style={styles.actionButton}>
            <TouchableOpacity 
              style={styles.actionButtonTouchable}
              onPress={handleManualSync}
              disabled={syncState.isSyncing}
            >
            <Ionicons name="sync-outline" size={20} color="#007AFF" />
              <Typography variant="body" style={[styles.actionButtonText, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>
                {syncState.isSyncing ? 'Syncing...' : 'Sync Now'}
              </Typography>
              <Ionicons name="chevron-forward" size={16} color={safeThemeAccess(theme, t => t.colors.placeholder, '#C7C7CC')} />
            </TouchableOpacity>
          </Card>
        </View>
        
        {/* Information */}
        <View style={styles.section}>
          <Typography variant="title" style={[styles.sectionTitle, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>How It Works</Typography>
          <Card style={[styles.infoContainer, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F2F2F7')
          }]}>
            <Typography variant="body" style={[styles.infoText, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>
              • Tasks are synced to Apple Reminders with due dates and completion status{'\n'}
              • Events are synced to Apple Calendar with times and locations{'\n'}
              • Changes in Apple apps are synced back to your bullet journal{'\n'}
              • Sync happens automatically when enabled or when you return to the app
            </Typography>
          </Card>
        </View>
      </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
    marginLeft: 12,
  },
  infoContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});