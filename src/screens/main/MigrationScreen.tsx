import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { PaperBackground } from '../../components/ui/PaperBackground';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { PaperButton } from '../../components/ui/PaperButton';
import { useMigrationCandidates, useEntryActions } from '../../stores/selectors';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { Ionicons } from '@expo/vector-icons';

export const MigrationScreen: React.FC = () => {
  const { theme } = useTheme();
  const migrationCandidates = useMigrationCandidates();
  const { updateEntry } = useEntryActions();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [migrationDate, setMigrationDate] = useState<string>('');

  // Get current date for default migration target
  useEffect(() => {
    const today = new Date();
    setMigrationDate(today.toISOString().split('T')[0]);
  }, []);

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
      migrationCard: {
        marginBottom: theme.spacing?.sm || 8,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.textSecondary,
      },
      migrationCardSelected: {
        borderLeftColor: theme.colors.primary,
        backgroundColor: 'rgba(15, 42, 68, 0.05)',
      },
      migrationCardOverdue: {
        borderLeftColor: '#B91C1C',
      },
      entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing?.sm || 8,
      },
      entryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      entryType: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.primary,
        fontWeight: '500',
        marginRight: theme.spacing?.sm || 8,
      },
      entryDate: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textTertiary,
      },
      entryDateOverdue: {
        color: '#B91C1C',
        fontWeight: '500',
      },
      entryContent: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        lineHeight: 24,
        color: theme.colors.text,
        marginBottom: theme.spacing?.sm || 8,
      },
      entryTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      tag: {
        fontSize: 12,
        color: theme.colors.primary,
        backgroundColor: 'rgba(15, 42, 68, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        marginRight: 4,
        marginTop: 2,
      },
      selectionControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.md || 16,
        paddingHorizontal: theme.spacing?.md || 16,
      },
      bulkActions: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing?.md || 16,
        paddingBottom: theme.spacing?.md || 16,
      },
      bulkActionButton: {
        flex: 1,
        marginHorizontal: theme.spacing?.xs || 4,
      },
      emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing?.xl || 48,
        paddingHorizontal: theme.spacing?.lg || 32,
      },
      emptyStateIcon: {
        marginBottom: theme.spacing?.md || 16,
      },
      emptyStateTitle: {
        textAlign: 'center',
        marginBottom: theme.spacing?.sm || 8,
      },
      emptyStateDescription: {
        textAlign: 'center',
        lineHeight: 22,
      },
      statsCard: {
        marginBottom: theme.spacing?.md || 16,
      },
      statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      statItem: {
        alignItems: 'center',
      },
      statValue: {
        fontSize: theme.typography.textStyles?.title2?.fontSize || 22,
        fontWeight: 'bold',
        color: theme.colors.primary,
      },
      statLabel: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing?.xs || 4,
      },
      checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
      },
      checkboxSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    content: { flex: 1, paddingVertical: 8 },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { marginBottom: 16 },
    migrationCard: { marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#999' },
    migrationCardSelected: { borderLeftColor: '#0F2A44', backgroundColor: 'rgba(15, 42, 68, 0.05)' },
    migrationCardOverdue: { borderLeftColor: '#B91C1C' },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    entryMeta: { flexDirection: 'row', alignItems: 'center' },
    entryType: { fontSize: 14, color: '#0F2A44', fontWeight: '500', marginRight: 8 },
    entryDate: { fontSize: 14, color: '#999' },
    entryDateOverdue: { color: '#B91C1C', fontWeight: '500' },
    entryContent: { fontSize: 17, lineHeight: 24, color: '#2B2B2B', marginBottom: 8 },
    entryTags: { flexDirection: 'row', flexWrap: 'wrap' },
    tag: { fontSize: 12, color: '#0F2A44', backgroundColor: 'rgba(15, 42, 68, 0.1)', padding: 4, borderRadius: 3, margin: 2 },
    selectionControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
    bulkActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16 },
    bulkActionButton: { flex: 1, marginHorizontal: 4 },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 48 },
    emptyStateIcon: { marginBottom: 16 },
    emptyStateTitle: { textAlign: 'center', marginBottom: 8 },
    emptyStateDescription: { textAlign: 'center', lineHeight: 22 },
    statsCard: { marginBottom: 16 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#0F2A44' },
    statLabel: { fontSize: 14, color: '#666', marginTop: 4 },
    checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2E8' },
    checkboxSelected: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
  });

  const styles = getStyles;

  // Calculate migration statistics
  const migrationStats = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const overdueTasks = migrationCandidates.filter(entry => 
      new Date(entry.collectionDate) < oneDayAgo
    );
    const weekOldTasks = migrationCandidates.filter(entry => 
      new Date(entry.collectionDate) < oneWeekAgo
    );

    return {
      total: migrationCandidates.length,
      overdue: overdueTasks.length,
      weekOld: weekOldTasks.length,
      selected: selectedEntries.length,
    };
  }, [migrationCandidates, selectedEntries]);

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    setSelectedEntries(migrationCandidates.map(entry => entry.id));
  };

  const deselectAllEntries = () => {
    setSelectedEntries([]);
  };

  const handleMigration = async (action: 'migrate' | 'complete' | 'cancel') => {
    if (selectedEntries.length === 0) {
      Alert.alert('No Entries Selected', 'Please select entries to perform this action.');
      return;
    }

    const actionText = action === 'migrate' ? 'migrate' : action === 'complete' ? 'complete' : 'cancel';
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedEntries.length} selected entries?`;

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Entries`,
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          onPress: async () => {
            try {
              for (const entryId of selectedEntries) {
                const entry = migrationCandidates.find(e => e.id === entryId);
                if (!entry) continue;

                let updatedEntry: Partial<BuJoEntry>;
                
                switch (action) {
                  case 'migrate':
                    updatedEntry = {
                      ...entry,
                      status: 'migrated',
                      collectionDate: migrationDate,
                      lastModifiedAt: new Date(),
                    };
                    break;
                  case 'complete':
                    updatedEntry = {
                      ...entry,
                      status: 'complete',
                      completedAt: new Date(),
                      lastModifiedAt: new Date(),
                    };
                    break;
                  case 'cancel':
                    updatedEntry = {
                      ...entry,
                      status: 'cancelled',
                      lastModifiedAt: new Date(),
                    };
                    break;
                }

                await updateEntry(entryId, updatedEntry);
              }

              setSelectedEntries([]);
              Alert.alert('Success', `${selectedEntries.length} entries ${actionText}ed successfully.`);
            } catch (error) {
              console.error(`Error ${actionText}ing entries:`, error);
              Alert.alert('Error', `Failed to ${actionText} entries. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (dateString: string) => {
    const entryDate = new Date(dateString);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return entryDate < oneDayAgo;
  };

  if (migrationCandidates.length === 0) {
    return (
      <PaperBackground variant="subtle" intensity="light">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Typography variant="h2" color="text">
              Migration Review
            </Typography>
            <Typography variant="body" color="textSecondary">
              BuJo methodology: migrate incomplete tasks forward
            </Typography>
          </View>

          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color={theme?.colors?.primary || '#0F2A44'}
              style={styles.emptyStateIcon}
            />
            <Typography variant="h3" color="text" style={styles.emptyStateTitle}>
              All Caught Up!
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.emptyStateDescription}>
              You don't have any incomplete tasks from previous days that need migration.
              {'\n\n'}
              This is great! It means you're staying current with your bullet journal methodology.
              {'\n\n'}
              Come back here during your weekly or daily reviews to migrate any incomplete tasks forward.
            </Typography>
          </View>
        </SafeAreaView>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" color="text">
            Migration Review
          </Typography>
          <Typography variant="body" color="textSecondary">
            Review and migrate incomplete tasks from previous days
          </Typography>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Migration Statistics */}
          <View style={styles.section}>
            <Card variant="elevated" padding="md" style={styles.statsCard}>
              <Typography variant="h3" color="text" style={{ marginBottom: 12, textAlign: 'center' }}>
                Migration Overview
              </Typography>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{migrationStats.total}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#B91C1C' }]}>{migrationStats.overdue}</Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#D97706' }]}>{migrationStats.weekOld}</Text>
                  <Text style={styles.statLabel}>Week+ Old</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{migrationStats.selected}</Text>
                  <Text style={styles.statLabel}>Selected</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Selection Controls */}
          <View style={styles.selectionControls}>
            <Typography variant="h3" color="text">
              Entries to Review
            </Typography>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={selectAllEntries} style={{ marginRight: 16 }}>
                <Typography variant="body" color="primary">
                  Select All
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity onPress={deselectAllEntries}>
                <Typography variant="body" color="textSecondary">
                  Clear
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Migration Candidates */}
          <View style={styles.section}>
            {migrationCandidates.map((entry) => {
              const isSelected = selectedEntries.includes(entry.id);
              const isEntryOverdue = isOverdue(entry.collectionDate);

              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => toggleEntrySelection(entry.id)}
                  style={[
                    styles.migrationCard,
                    isSelected && styles.migrationCardSelected,
                    isEntryOverdue && styles.migrationCardOverdue,
                  ]}
                >
                  <Card variant="flat" padding="md">
                    <View style={styles.entryHeader}>
                      <View style={styles.entryMeta}>
                        <Text style={styles.entryType}>
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Text>
                        <Text style={[styles.entryDate, isEntryOverdue && styles.entryDateOverdue]}>
                          {formatDate(entry.collectionDate)}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={theme?.colors?.background || '#F9F6F0'}
                          />
                        )}
                      </View>
                    </View>
                    
                    <Text style={styles.entryContent}>{entry.content}</Text>
                    
                    {(entry.tags.length > 0 || entry.contexts.length > 0) && (
                      <View style={styles.entryTags}>
                        {entry.tags.map((tag, index) => (
                          <Text key={`tag-${index}`} style={styles.tag}>#{tag}</Text>
                        ))}
                        {entry.contexts.map((context, index) => (
                          <Text key={`context-${index}`} style={[styles.tag, { backgroundColor: 'rgba(21, 128, 61, 0.1)' }]}>@{context}</Text>
                        ))}
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bulk Actions */}
        {selectedEntries.length > 0 && (
          <View style={styles.bulkActions}>
            <PaperButton
              variant="pencil"
              size="md"
              title={`Complete (${selectedEntries.length})`}
              onPress={() => handleMigration('complete')}
              style={styles.bulkActionButton}
            />
            <PaperButton
              variant="ink"
              size="md"
              title={`Migrate (${selectedEntries.length})`}
              onPress={() => handleMigration('migrate')}
              style={styles.bulkActionButton}
            />
            <PaperButton
              variant="highlight"
              size="md"
              title={`Cancel (${selectedEntries.length})`}
              onPress={() => handleMigration('cancel')}
              style={styles.bulkActionButton}
            />
          </View>
        )}
      </SafeAreaView>
    </PaperBackground>
  );
};