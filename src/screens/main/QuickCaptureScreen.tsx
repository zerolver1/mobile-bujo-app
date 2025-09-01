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
import { PaperBackground, PaperButton, Typography, PAPER_DESIGN_TOKENS } from '../../components/ui/paperComponents';
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
  const [priority] = useState<'none' | 'low' | 'medium' | 'high'>(editEntry?.priority || 'none');
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
  // const currentPriority = priorities.find(p => p.level === priority) || priorities[0]; // Not used in simplified UI

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
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Simplified Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
          </TouchableOpacity>
          <Typography variant="h2" style={styles.headerTitle}>
            {editEntry ? 'Edit Entry' : 'New Entry'}
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Content Input - This is the main focus */}
        <View style={styles.heroSection}>
          <View style={styles.entryLine}>
            <BuJoSymbol 
              type={currentBullet.type} 
              status={currentBullet.status} 
              size="md"
              style={styles.leadingBullet}
            />
            <TextInput
              style={[
                styles.heroInput,
                {
                  color: safeThemeAccess(theme, t => t.colors.text, '#2B2B2B')
                }
              ]}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor={safeThemeAccess(theme, t => t.colors.textSecondary, '#9CA3AF')}
              multiline
              autoFocus={!editEntry}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.actionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsContent}>
            {/* Common Bullet Types - Just the essentials */}
            {[0, 5, 6].map((bulletIndex) => { // Task, Event, Note
              const bullet = bullets[bulletIndex];
              return (
                <TouchableOpacity
                  key={bulletIndex}
                  style={[
                    styles.quickBullet,
                    selectedBullet === bulletIndex && styles.selectedQuickBullet
                  ]}
                  onPress={() => setSelectedBullet(bulletIndex)}
                >
                  <BuJoSymbol 
                    type={bullet.type} 
                    status={bullet.status} 
                    size="sm"
                  />
                  <Typography variant="caption" style={styles.quickBulletLabel}>
                    {bullet.label}
                  </Typography>
                </TouchableOpacity>
              );
            })}
            
            {/* More Options Button */}
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => {
                // Show expanded options
                Alert.alert(
                  'Entry Types',
                  'Select the type of entry you want to create:',
                  bullets.map((bullet, index) => ({
                    text: `${bullet.symbol} ${bullet.label}`,
                    onPress: () => setSelectedBullet(index)
                  })).concat([{ text: 'Cancel', onPress: () => {} }])
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
              <Typography variant="caption" style={styles.quickBulletLabel}>
                More
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Simple Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => {
              Alert.alert(
                'Select Date',
                'Choose when to add this entry:',
                getDateOptions().map(date => ({
                  text: formatDate(date),
                  onPress: () => setTargetDate(date)
                })).concat([{ text: 'Cancel', onPress: () => {} }])
              );
            }}
          >
            <Ionicons name="calendar-outline" size={18} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
            <Typography variant="caption" style={{ color: safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280') }}>
              {formatDate(targetDate)}
            </Typography>
          </TouchableOpacity>

          <PaperButton 
            variant="ink" 
            size="lg" 
            title="Save Entry"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={!content.trim()}
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.md,
    paddingBottom: PAPER_DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cancelButton: {
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 20,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44, // Same as cancel button for balance
  },
  heroSection: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.xl2,
  },
  entryLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8, // Align with ruled paper margin
  },
  leadingBullet: {
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
    marginTop: 4, // Align with text baseline
  },
  heroInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'System', // Use system font for natural feel
    minHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: 'transparent', // Let paper show through
    paddingVertical: 0, // Remove default padding
    paddingHorizontal: 0,
  },
  actionsBar: {
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionsContent: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    alignItems: 'center',
  },
  quickBullet: {
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.md,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  selectedQuickBullet: {
    borderColor: '#0F2A44',
    backgroundColor: 'rgba(15, 42, 68, 0.08)',
  },
  quickBulletLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  moreButton: {
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.md,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.md,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  saveButton: {
    minWidth: 120,
  },
});