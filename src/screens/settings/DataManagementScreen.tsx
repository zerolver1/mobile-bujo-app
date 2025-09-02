import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import {
  PaperBackground,
  PaperButton,
  Typography,
  Card,
  NotebookCard,
  PaperLoading,
  safeThemeAccess,
  PAPER_DESIGN_TOKENS,
} from '../../components/ui/paperComponents';
import { bujoSyncService } from '../../services/supabase/BuJoSyncService';
import { useBuJoStore } from '../../stores/BuJoStore';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface DataManagementScreenProps {
  navigation: any;
}

interface DataStatistics {
  totalEntries: number;
  totalCollections: number;
  totalPageScans: number;
  storageUsed: string;
  cloudStorageUsed: string;
  lastSyncAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'never';
  isConnected: boolean;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataStats, setDataStats] = useState<DataStatistics | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Use unified sync status hook for real-time updates
  const { status: syncStatus, lastSyncAt, isEnabled, isAuthenticated, refresh: refreshSyncStatus } = useSyncStatus();
  
  // Get store reference (but avoid reactive subscriptions)
  const store = useBuJoStore;

  const loadDataStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current store state (one-time access, not subscription)
      const currentState = store.getState();
      const entries = currentState.entries || [];
      const collections = currentState.collections || [];
      
      // Calculate local storage (rough estimate)
      const entriesSize = entries.length * 0.5; // ~0.5KB per entry
      const collectionsSize = collections.length * 0.2; // ~0.2KB per collection
      const totalLocalSize = entriesSize + collectionsSize;
      
      // Try to get cloud statistics with better error handling
      let cloudStorageUsed = 'Calculating...';
      try {
        const dataStats = await bujoSyncService.getDataStatistics();
        cloudStorageUsed = dataStats.cloud.storageSize || '0 KB';
        
        if (__DEV__) {
          console.log('Cloud statistics loaded:', {
            cloudStorageSize: dataStats.cloud.storageSize,
            entryCount: dataStats.cloud.entryCount,
            collectionCount: dataStats.cloud.collectionCount
          });
        }
      } catch (error) {
        console.warn('Could not load cloud statistics:', error);
        // Check if we're authenticated - if not, show appropriate message
        if (isAuthenticated && isEnabled) {
          cloudStorageUsed = 'Error loading';
        } else if (!isAuthenticated) {
          cloudStorageUsed = 'Not authenticated';
        } else if (!isEnabled) {
          cloudStorageUsed = 'Sync disabled';
        } else {
          cloudStorageUsed = 'Unavailable';
        }
      }
      
      const stats: DataStatistics = {
        totalEntries: entries.length,
        totalCollections: collections.length,
        totalPageScans: 0, // TODO: Add page scans when implemented
        storageUsed: `${totalLocalSize.toFixed(1)} KB`,
        cloudStorageUsed,
        lastSyncAt, // Use real-time sync status from hook
        syncStatus, // Use real-time sync status from hook
        isConnected: isEnabled && isAuthenticated, // Use real-time connection status from hook
      };
      
      setDataStats(stats);
    } catch (error) {
      console.error('Error loading data statistics:', error);
      Alert.alert('Error', 'Failed to load data statistics');
    } finally {
      setIsLoading(false);
    }
  }, [syncStatus, lastSyncAt, isEnabled, isAuthenticated]); // Dependencies on real-time sync data

  useEffect(() => {
    loadDataStatistics();
  }, [loadDataStatistics]);

  // Sync local button state with global sync status
  useEffect(() => {
    if (syncStatus === 'syncing') {
      setIsSyncing(true);
      setSyncError(null);
    } else if (syncStatus === 'error') {
      setIsSyncing(false);
      setSyncError('Sync error occurred');
    } else {
      setIsSyncing(false);
      setSyncError(null);
    }
  }, [syncStatus]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Refresh both data statistics and sync status
    await Promise.all([
      loadDataStatistics(),
      refreshSyncStatus()
    ]);
    setIsRefreshing(false);
  }, [loadDataStatistics, refreshSyncStatus]);

  const handleManualSync = useCallback(async () => {
    try {
      // Pre-flight validation - check if sync is possible before showing confirmation
      const syncCheck = await bujoSyncService.canPerformSync();
      
      if (!syncCheck.possible) {
        Alert.alert('Sync Unavailable', syncCheck.reason || 'Unable to sync at this time.');
        return;
      }
      
      // Additional UI state check
      if (isSyncing || syncStatus === 'syncing') {
        Alert.alert('Sync in Progress', 'A sync operation is already running. Please wait for it to complete.');
        return;
      }

      Alert.alert(
        'Synchronize All Data',
        'This will sync all local data with the cloud (upload new items, download updates). Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sync Now',
            onPress: async () => {
            setIsSyncing(true);
            setSyncError(null);
            
            // Immediately refresh sync status to show "syncing" state
            await refreshSyncStatus();
            
            try {
              console.log('Starting manual sync operation...');
              await bujoSyncService.manualSync();
              
              // Wait a moment for sync status to update in AsyncStorage
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh data and sync status multiple times to ensure we get updated state
              await Promise.all([
                loadDataStatistics(),
                refreshSyncStatus()
              ]);
              
              // Double-check sync status after a short delay
              setTimeout(async () => {
                await refreshSyncStatus();
              }, 1000);
              
              // Force local state update since sync is complete
              setIsSyncing(false);
              setSyncError(null);
              
              // Get final statistics for success message
              const finalStats = await bujoSyncService.getDataStatistics();
              const entryCount = finalStats?.cloud?.entryCount || 0;
              const collectionCount = finalStats?.cloud?.collectionCount || 0;
              
              Alert.alert(
                'Sync Complete!', 
                `Successfully synchronized:\n• ${entryCount} entries\n• ${collectionCount} collections\n\nLast synced: ${new Date().toLocaleTimeString()}`
              );
              
              console.log('Manual sync completed successfully');
            } catch (error) {
              console.error('Manual sync error:', error);
              
              let errorMessage = 'Failed to sync data. Please try again.';
              
              // Provide more specific error messages
              if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = 'Network error - check your internet connection and try again.';
              } else if (error.message?.includes('auth')) {
                errorMessage = 'Authentication error - please check your login status.';
              } else if (error.message?.includes('timeout')) {
                errorMessage = 'Sync timed out - this may be due to a large amount of data.';
              }
              
              setSyncError(errorMessage);
              Alert.alert('Sync Failed', errorMessage, [
                { text: 'OK', style: 'default' },
                { text: 'Retry', onPress: () => handleManualSync() }
              ]);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
    } catch (error) {
      console.error('Pre-sync validation error:', error);
      Alert.alert('Sync Error', error.message || 'Unable to prepare sync operation. Please try again.');
    }
  }, [isSyncing, syncStatus, loadDataStatistics, refreshSyncStatus]);

  const handleExportData = useCallback(async () => {
    try {
      const exportData = await bujoSyncService.exportAllData();
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Use React Native Share API
      await Share.share({
        message: jsonData,
        title: 'Bullet Journal Data Export',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear local cached data but keep your entries. The data will be re-downloaded from cloud on next sync. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await bujoSyncService.clearLocalCache();
              Alert.alert('Success', 'Local cache cleared successfully');
              await loadDataStatistics();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  }, [loadDataStatistics]);

  const handleResetSync = useCallback(() => {
    Alert.alert(
      'Reset Sync State',
      'This will reset the sync state and force a full re-sync on next sync. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await bujoSyncService.resetSyncState();
              Alert.alert('Success', 'Sync state reset successfully');
              await loadDataStatistics();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset sync state');
            }
          }
        }
      ]
    );
  }, [loadDataStatistics]);

  const handleDeleteCloudData = useCallback(() => {
    Alert.alert(
      'Delete Cloud Data',
      'WARNING: This will permanently delete ALL your data from the cloud. This action cannot be undone. Your local data will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Cloud Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will permanently delete all cloud data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await bujoSyncService.deleteAllCloudData();
                      Alert.alert('Success', 'Cloud data deleted successfully');
                      await loadDataStatistics();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete cloud data');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  }, [loadDataStatistics]);

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing?.xs || 4,
      },
      backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(15, 42, 68, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing?.sm || 12,
      },
      headerTitle: {
        flex: 1,
      },
      content: {
        flex: 1,
        paddingVertical: theme.spacing?.sm || 8,
      },
      section: {
        paddingHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.lg || 24,
      },
      sectionTitle: {
        marginBottom: theme.spacing?.md || 16,
      },
      card: {
        marginBottom: theme.spacing?.sm || 8,
        transform: [{ rotate: '0.2deg' }],
      },
      statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
      },
      statusIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      },
      statusContent: {
        flex: 1,
      },
      statusTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 2,
      },
      statusSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
      },
      statusValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
      },
      statsGrid: {
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderLight,
      },
      statsRowLast: {
        borderBottomWidth: 0,
      },
      statsLabel: {
        fontSize: 15,
        color: theme.colors.text,
      },
      statsValue: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
      },
      actionButton: {
        marginBottom: theme.spacing?.sm || 8,
      },
      dangerButton: {
        backgroundColor: 'rgba(185, 28, 28, 0.1)',
        borderColor: '#B91C1C',
      },
      separator: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: 16,
        marginVertical: 4,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15, 42, 68, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { flex: 1 },
    content: { flex: 1, paddingVertical: 8 },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { marginBottom: 16 },
    card: { marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 56 },
    statusIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    statusContent: { flex: 1 },
    statusTitle: { fontSize: 16, fontWeight: '500', color: '#2B2B2B', marginBottom: 2 },
    statusSubtitle: { fontSize: 14, color: '#6B7280' },
    statusValue: { fontSize: 14, fontWeight: '600', color: '#0F2A44' },
    statsGrid: { padding: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
    statsRowLast: { borderBottomWidth: 0 },
    statsLabel: { fontSize: 15, color: '#2B2B2B' },
    statsValue: { fontSize: 15, fontWeight: '600', color: '#0F2A44' },
    actionButton: { marginBottom: 8 },
    dangerButton: { backgroundColor: 'rgba(185, 28, 28, 0.1)', borderColor: '#B91C1C' },
    separator: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16, marginVertical: 4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  if (isLoading || !dataStats) {
    return (
      <PaperBackground variant="subtle" intensity="light">
        <SafeAreaView style={getStyles.container}>
          <View style={getStyles.loadingContainer}>
            <PaperLoading type="ink-spreading" message="Loading data statistics..." size="md" />
          </View>
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const getSyncStatusColor = (status: DataStatistics['syncStatus']) => {
    switch (status) {
      case 'syncing': return '#D97706';
      case 'idle': return '#15803D';
      case 'error': return '#B91C1C';
      case 'never': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSyncStatusIcon = (status: DataStatistics['syncStatus']) => {
    switch (status) {
      case 'syncing': return 'sync';
      case 'idle': return 'checkmark-circle';
      case 'error': return 'warning';
      case 'never': return 'cloud-offline';
      default: return 'cloud-offline';
    }
  };

  const getSyncStatusText = (status: DataStatistics['syncStatus']) => {
    switch (status) {
      case 'syncing': return 'Syncing data...';
      case 'idle': return 'All data synced';
      case 'error': return 'Sync error occurred';
      case 'never': return 'Never synced';
      default: return 'Unknown status';
    }
  };

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={getStyles.container}>
        <View style={getStyles.header}>
          <View style={getStyles.headerContent}>
            <TouchableOpacity 
              style={getStyles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
              />
            </TouchableOpacity>
            <Typography variant="h2" color="primary" style={getStyles.headerTitle}>
              Data Management
            </Typography>
          </View>
          <Typography variant="body" color="textSecondary">
            Monitor and manage your bullet journal data
          </Typography>
        </View>

        <ScrollView 
          style={getStyles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Sync Status Section */}
          <View style={getStyles.section}>
            <Typography variant="h3" color="primary" style={getStyles.sectionTitle}>
              Sync Status
            </Typography>
            <NotebookCard variant="page" showHoles={false} style={getStyles.card}>
              <View style={getStyles.statusRow}>
                <View style={[
                  getStyles.statusIcon,
                  { backgroundColor: `${getSyncStatusColor(dataStats.syncStatus)}20` }
                ]}>
                  <Ionicons 
                    name={getSyncStatusIcon(dataStats.syncStatus)} 
                    size={18} 
                    color={getSyncStatusColor(dataStats.syncStatus)} 
                  />
                </View>
                <View style={getStyles.statusContent}>
                  <Typography variant="body" style={getStyles.statusTitle}>
                    {getSyncStatusText(dataStats.syncStatus)}
                  </Typography>
                  <Typography variant="caption" style={getStyles.statusSubtitle}>
                    {dataStats.lastSyncAt 
                      ? `Last synced: ${dataStats.lastSyncAt.toLocaleDateString()} at ${dataStats.lastSyncAt.toLocaleTimeString()}`
                      : 'No sync performed yet'
                    }
                  </Typography>
                </View>
                <Typography variant="caption" style={getStyles.statusValue}>
                  {dataStats.isConnected ? 'Online' : 'Offline'}
                </Typography>
              </View>
            </NotebookCard>
          </View>

          {/* Data Statistics Section */}
          <View style={getStyles.section}>
            <Typography variant="h3" color="primary" style={getStyles.sectionTitle}>
              Data Overview
            </Typography>
            <NotebookCard variant="page" showHoles={false} style={getStyles.card}>
              <View style={getStyles.statsGrid}>
                <View style={getStyles.statsRow}>
                  <Typography variant="body" style={getStyles.statsLabel}>Total Entries</Typography>
                  <Typography variant="body" style={getStyles.statsValue}>{dataStats.totalEntries}</Typography>
                </View>
                <View style={getStyles.statsRow}>
                  <Typography variant="body" style={getStyles.statsLabel}>Collections</Typography>
                  <Typography variant="body" style={getStyles.statsValue}>{dataStats.totalCollections}</Typography>
                </View>
                <View style={getStyles.statsRow}>
                  <Typography variant="body" style={getStyles.statsLabel}>Page Scans</Typography>
                  <Typography variant="body" style={getStyles.statsValue}>{dataStats.totalPageScans}</Typography>
                </View>
                <View style={getStyles.statsRow}>
                  <Typography variant="body" style={getStyles.statsLabel}>Local Storage</Typography>
                  <Typography variant="body" style={getStyles.statsValue}>{dataStats.storageUsed}</Typography>
                </View>
                <View style={[getStyles.statsRow, getStyles.statsRowLast]}>
                  <Typography variant="body" style={getStyles.statsLabel}>Cloud Storage</Typography>
                  <Typography variant="body" style={getStyles.statsValue}>{dataStats.cloudStorageUsed}</Typography>
                </View>
              </View>
            </NotebookCard>
          </View>

          {/* Manual Actions Section */}
          <View style={getStyles.section}>
            <Typography variant="h3" color="primary" style={getStyles.sectionTitle}>
              Sync Actions
            </Typography>
            <NotebookCard variant="page" showHoles={false} style={getStyles.card}>
              <View style={{ padding: 16 }}>
                <PaperButton
                  variant="ink"
                  size="md"
                  title={
                    isSyncing || syncStatus === 'syncing' 
                      ? "Syncing..." 
                      : syncError 
                      ? "Sync Failed - Retry"
                      : "Force Sync All Data"
                  }
                  onPress={handleManualSync}
                  style={[
                    getStyles.actionButton,
                    (isSyncing || syncStatus === 'syncing') && { opacity: 0.7 },
                    syncError && { backgroundColor: '#EF4444' }
                  ]}
                  disabled={isSyncing || syncStatus === 'syncing'}
                />
                <PaperButton
                  variant="pencil"
                  size="md"
                  title="Export Data Backup"
                  onPress={handleExportData}
                  style={getStyles.actionButton}
                />
                <PaperButton
                  variant="pencil"
                  size="md"
                  title="Clear Local Cache"
                  onPress={handleClearCache}
                  style={getStyles.actionButton}
                />
                <PaperButton
                  variant="pencil"
                  size="md"
                  title="Reset Sync State"
                  onPress={handleResetSync}
                  style={getStyles.actionButton}
                />
              </View>
            </NotebookCard>
          </View>

          {/* Advanced Options Section */}
          <View style={getStyles.section}>
            <Typography variant="h3" color="error" style={getStyles.sectionTitle}>
              Advanced Options
            </Typography>
            <NotebookCard variant="page" showHoles={false} style={getStyles.card}>
              <View style={{ padding: 16 }}>
                <Typography variant="caption" color="textSecondary" style={{ marginBottom: 12, textAlign: 'center' }}>
                  Dangerous operations - use with caution
                </Typography>
                <PaperButton
                  variant="highlight"
                  size="md"
                  title="Delete All Cloud Data"
                  onPress={handleDeleteCloudData}
                  style={[getStyles.actionButton, getStyles.dangerButton]}
                />
              </View>
            </NotebookCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};