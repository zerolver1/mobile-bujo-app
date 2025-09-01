import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { useTheme } from '../../theme';
import { PaperBackground, PaperButton, Typography, Card } from '../../components/ui/paperComponents';
import { BuJoSymbol } from '../../components/ui/BuJoSymbols';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface QuickCaptureScreenProps {
  navigation: any;
  route?: {
    params?: {
      editEntry?: BuJoEntry;
    };
  };
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const editEntry = route?.params?.editEntry;
  const [content, setContent] = useState(editEntry?.content || '');
  const [selectedBullet, setSelectedBullet] = useState(editEntry ? getBulletIndex(editEntry) : 0);
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>(editEntry?.priority || 'none');
  const [targetDate, setTargetDate] = useState(editEntry?.collectionDate || new Date().toISOString().split('T')[0]);
  const { addEntry, updateEntry } = useBuJoStore();

  // Helper function to get bullet index from entry
  function getBulletIndex(entry: BuJoEntry): number {
    if (entry.type === 'task') {
      switch (entry.status) {
        case 'complete': return 1;
        case 'migrated': return 2;
        case 'scheduled': return 3;
        case 'cancelled': return 4;
        default: return 0; // incomplete
      }
    } else if (entry.type === 'event') {
      return 5;
    } else if (entry.type === 'note') {
      return 6;
    } else if (entry.type === 'inspiration') {
      return 7;
    } else if (entry.type === 'research') {
      return 8;
    } else if (entry.type === 'memory') {
      return 9;
    }
    return 0; // fallback to task
  }

  const bullets = [
    // Tasks - Follow BuJo methodology: Only create incomplete tasks, complete through swipe/tap
    { symbol: '•', type: 'task' as const, status: 'incomplete' as const, label: 'Task', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.task, '#2B2B2B'), description: 'Things you need to do' },
    
    // Task Status Indicators - For editing existing tasks only
    { symbol: '✗', type: 'task' as const, status: 'complete' as const, label: 'Complete', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskComplete, '#15803D'), description: 'Task completed' },
    { symbol: '>', type: 'task' as const, status: 'migrated' as const, label: 'Migrated', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskMigrated, '#D97706'), description: 'Task migrated to future' },
    { symbol: '<', type: 'task' as const, status: 'scheduled' as const, label: 'Scheduled', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskScheduled, '#1E40AF'), description: 'Task scheduled in calendar' },
    { symbol: '—', type: 'task' as const, status: 'cancelled' as const, label: 'Cancelled', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.taskCancelled, '#9CA3AF'), description: 'Task no longer relevant' },
    
    // Other Entry Types - Always incomplete when created
    { symbol: '○', type: 'event' as const, status: 'incomplete' as const, label: 'Event', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.event, '#0F2A44'), description: 'Appointments and experiences' },
    { symbol: '–', type: 'note' as const, status: 'incomplete' as const, label: 'Note', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.note, '#6B7280'), description: 'Ideas, thoughts, observations' },
    { symbol: '!', type: 'inspiration' as const, status: 'incomplete' as const, label: 'Inspiration', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.inspiration, '#EAB308'), description: 'Ideas that inspire action' },
    { symbol: '?', type: 'research' as const, status: 'incomplete' as const, label: 'Research', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.research, '#7C3AED'), description: 'Things to investigate or explore' },
    { symbol: '◇', type: 'memory' as const, status: 'incomplete' as const, label: 'Memory', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.memory, '#BE185D'), description: 'Gratitude, memories, and reflections' },
  ];
  
  const priorities = [
    { level: 'none' as const, symbol: '', label: 'None', 
      color: safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93') },
    { level: 'low' as const, symbol: '↓', label: 'Low', 
      color: safeThemeAccess(theme, t => t.colors.textTertiary, '#9CA3AF') },
    { level: 'medium' as const, symbol: '*', label: 'Medium', 
      color: safeThemeAccess(theme, t => t.colors.warning, '#D97706') },
    { level: 'high' as const, symbol: '!', label: 'High', 
      color: safeThemeAccess(theme, t => t.colors.bujo?.inspiration, '#EAB308') },
  ];

  const currentBullet = bullets[selectedBullet];
  const currentPriority = priorities.find(p => p.level === priority) || priorities[0];

  const extractTags = (text: string): string[] => {
    const matches = text.match(/#([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractContexts = (text: string): string[] => {
    const matches = text.match(/@([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(context => context.substring(1)) : [];
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please enter some content for your bullet journal entry.');
      return;
    }

    const tags = extractTags(content);
    const contexts = extractContexts(content);

    try {
      if (editEntry) {
        // Update existing entry
        updateEntry(editEntry.id, {
          type: currentBullet.type,
          content: content.trim(),
          status: currentBullet.status,
          priority,
          tags,
          contexts,
          collectionDate: targetDate,
        });
        
        Alert.alert('Success', 'Entry updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new entry
        const entry: Omit<BuJoEntry, 'id' | 'createdAt'> = {
          type: currentBullet.type,
          status: currentBullet.status,
          content: content.trim(),
          priority,
          tags,
          contexts,
          collection: 'daily',
          collectionDate: targetDate,
        };

        addEntry(entry);
        
        Alert.alert(
          'Entry Added',
          `Your ${currentBullet.label.toLowerCase()} has been added to your journal.`,
          [
            { text: 'Add Another', onPress: () => setContent('') },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  return (
    <PaperBackground variant="lined" showMargin={false} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Card variant="elevated" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="callout" color="textSecondary">Cancel</Typography>
          </TouchableOpacity>
          <Typography variant="headline" color="text">
            {editEntry ? 'Edit Entry' : 'Quick Capture'}
          </Typography>
          <PaperButton 
            variant="ink" 
            size="sm" 
            onPress={handleSave}
            style={styles.saveButtonContainer}
          >
            <BuJoSymbol type={currentBullet.type} status={currentBullet.status} size="sm" />
            <Typography variant="callout" style={styles.saveButtonText}>
              Save {currentBullet.label}
            </Typography>
          </PaperButton>
        </Card>

        <ScrollView style={styles.content}>
          {/* Bullet Type Selection */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Typography variant="title3" color="text" style={styles.sectionTitle}>Entry Type</Typography>
            <View style={styles.bulletGrid}>
              {bullets.map((bullet, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bulletOption,
                    selectedBullet === index && styles.selectedBulletOption
                  ]}
                  onPress={() => setSelectedBullet(index)}
                >
                  <BuJoSymbol 
                    type={bullet.type} 
                    status={bullet.status} 
                    size="sm"
                    style={styles.bulletSymbolContainer}
                  />
                  <Typography 
                    variant="footnote" 
                    style={[
                      styles.bulletLabel,
                      selectedBullet === index && { 
                        color: safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                      }
                    ]}
                  >
                    {bullet.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            
            <Card variant="flat" padding="md" style={styles.bulletDescription}>
              <Typography variant="footnote" color="textSecondary">
                {currentBullet.description}
              </Typography>
            </Card>
          </Card>

          {/* Priority Selection (for tasks only) */}
          {currentBullet.type === 'task' && (
            <Card variant="elevated" padding="lg" style={styles.section}>
              <Typography variant="title3" color="text" style={styles.sectionTitle}>Priority</Typography>
              <View style={styles.priorityRow}>
                {priorities.map((priorityOption) => (
                  <TouchableOpacity
                    key={priorityOption.level}
                    style={[
                      styles.priorityOption,
                      priority === priorityOption.level && styles.selectedPriorityOption
                    ]}
                    onPress={() => setPriority(priorityOption.level)}
                  >
                    {priorityOption.symbol ? (
                      <Typography 
                        variant="callout" 
                        style={[styles.prioritySymbol, { color: priorityOption.color }]}
                      >
                        {priorityOption.symbol}
                      </Typography>
                    ) : (
                      <View style={styles.noPrioritySymbol} />
                    )}
                    <Typography 
                      variant="caption1" 
                      style={[
                        styles.priorityLabel,
                        priority === priorityOption.level && { 
                          color: safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                        }
                      ]}
                    >
                      {priorityOption.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Content Input */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Typography variant="title3" color="text" style={styles.sectionTitle}>Content</Typography>
            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
                  borderColor: safeThemeAccess(theme, t => t.colors.border, '#E8E3D5'),
                  color: safeThemeAccess(theme, t => t.colors.text, '#2B2B2B')
                }
              ]}
              value={content}
              onChangeText={setContent}
              placeholder={`Enter your ${currentBullet.label.toLowerCase()}...`}
              placeholderTextColor={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')}
              multiline
              autoFocus={!editEntry}
              textAlignVertical="top"
            />
            <Typography variant="caption1" color="textSecondary" style={styles.helpText}>
              Use #tags and @contexts to organize your entries
            </Typography>
          </Card>

          {/* Date Selection */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Typography variant="title3" color="text" style={styles.sectionTitle}>Date</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {getDateOptions().map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateOption,
                    targetDate === date && styles.selectedDateOption
                  ]}
                  onPress={() => setTargetDate(date)}
                >
                  <Typography 
                    variant="footnote" 
                    style={[
                      styles.dateLabel,
                      targetDate === date && { 
                        color: safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') 
                      }
                    ]}
                  >
                    {formatDate(date)}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>

          {/* Preview */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Typography variant="title3" color="text" style={styles.sectionTitle}>Preview</Typography>
            <Card variant="flat" padding="md" style={styles.previewContainer}>
              <BuJoSymbol 
                type={currentBullet.type} 
                status={currentBullet.status} 
                size="md"
              />
              {currentPriority.symbol && (
                <Typography 
                  variant="callout" 
                  style={[styles.prioritySymbol, { color: currentPriority.color }]}
                >
                  {currentPriority.symbol}
                </Typography>
              )}
              <Typography variant="callout" color="text" style={styles.previewContent}>
                {content || `Sample ${currentBullet.label.toLowerCase()}...`}
              </Typography>
            </Card>
          </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    marginLeft: 4,
  },
  saveButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  bulletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bulletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    marginBottom: 8,
    marginRight: 8,
  },
  selectedBulletOption: {
    borderWidth: 2,
  },
  bulletSymbolContainer: {
    marginRight: 8,
  },
  bulletLabel: {
    fontWeight: '500',
  },
  bulletDescription: {
    marginTop: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
  },
  selectedPriorityOption: {
    borderWidth: 2,
  },
  prioritySymbol: {
    marginBottom: 4,
    fontWeight: '600',
  },
  noPrioritySymbol: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  priorityLabel: {
    fontWeight: '500',
  },
  contentInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
  },
  helpText: {
    marginTop: 8,
    lineHeight: 16,
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateOption: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateOption: {
    borderWidth: 2,
  },
  dateLabel: {
    fontWeight: '500',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewContent: {
    flex: 1,
    lineHeight: 22,
  },
});