import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry, QuarterlyPlan, QuarterlyGoal } from '../../types/BuJo';

interface FutureLogScreenProps {
  navigation: any;
}

interface MonthData {
  month: string;
  year: number;
  entries: BuJoEntry[];
}

export const FutureLogScreen: React.FC<FutureLogScreenProps> = ({ navigation }) => {
  const { entries, quarterlyPlans, addQuarterlyPlan, updateQuarterlyPlan, getQuarterlyPlan } = useBuJoStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [viewMode, setViewMode] = useState<'months' | 'quarters'>('quarters');

  // Generate next 6 months
  const generateFutureMonths = (): MonthData[] => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthString = date.toISOString().substring(0, 7); // YYYY-MM format
      
      // Filter entries for this month
      const monthEntries = entries.filter(entry => 
        entry.collectionDate.startsWith(monthString) &&
        new Date(entry.collectionDate) > today
      );

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear(),
        entries: monthEntries,
      });
    }

    return months;
  };

  const futureMonths = generateFutureMonths();

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'task': return '#007AFF';
      case 'event': return '#FF3B30';
      case 'note': return '#32D74B';
      case 'idea': return '#FFD60A';
      default: return '#8E8E93';
    }
  };

  const getBulletSymbol = (entry: BuJoEntry) => {
    if (entry.type === 'task') {
      return entry.status === 'complete' ? '✓' : '•';
    } else if (entry.type === 'event') {
      return '○';
    } else if (entry.type === 'note') {
      return '—';
    } else if (entry.type === 'inspiration') {
      return '★';
    } else if (entry.type === 'research') {
      return '&';
    } else if (entry.type === 'memory') {
      return '◇';
    }
    return '•';
  };
  
  const getCurrentQuarter = (): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  };
  
  const getQuarterMonths = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): number[] => {
    switch (quarter) {
      case 'Q1': return [0, 1, 2];
      case 'Q2': return [3, 4, 5];
      case 'Q3': return [6, 7, 8];
      case 'Q4': return [9, 10, 11];
    }
  };
  
  const getQuarterData = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    const plan = getQuarterlyPlan(quarter, currentYear);
    const months = getQuarterMonths(quarter);
    const quarterEntries = entries.filter(entry => {
      const entryDate = new Date(entry.collectionDate);
      return entryDate.getFullYear() === currentYear && 
             months.includes(entryDate.getMonth());
    });
    
    return {
      plan: plan || null,
      entries: quarterEntries,
      months: months.map(m => new Date(currentYear, m, 1).toLocaleDateString('en-US', { month: 'long' }))
    };
  };
  
  const handleAddGoal = () => {
    if (!selectedQuarter || !newGoalTitle.trim()) return;
    
    const quarterPlan = getQuarterlyPlan(selectedQuarter, currentYear);
    const newGoal: QuarterlyGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle,
      description: newGoalDescription,
      progress: 0,
      status: 'not_started',
      milestones: [],
      completedMilestones: []
    };
    
    if (quarterPlan) {
      updateQuarterlyPlan(quarterPlan.id, {
        goals: [...quarterPlan.goals, newGoal]
      });
    } else {
      addQuarterlyPlan({
        quarter: selectedQuarter,
        year: currentYear,
        goals: [newGoal],
        entries: []
      });
    }
    
    setNewGoalTitle('');
    setNewGoalDescription('');
    setShowGoalModal(false);
  };

  const getReflectionPrompts = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', isReview: boolean = false): string[] => {
    const basePrompts = {
      Q1: [
        "What are your main priorities for this new year?",
        "What habits do you want to develop in the coming months?",
        "What projects or goals excite you most right now?",
        "What did you learn about yourself in the previous quarter?",
        "How do you want to grow personally and professionally this year?"
      ],
      Q2: [
        "How are you progressing toward your yearly goals?",
        "What has been working well in your routines so far?",
        "What adjustments do you need to make to your plans?",
        "What opportunities have emerged that you didn't expect?",
        "How can you better balance your priorities moving forward?"
      ],
      Q3: [
        "What have been your biggest wins so far this year?",
        "Which goals need more focus in the remaining months?",
        "What have you accomplished that you're most proud of?",
        "How can you maintain momentum through the busy season ahead?",
        "What relationships or connections do you want to strengthen?"
      ],
      Q4: [
        "How do you want to finish this year strong?",
        "What are you most grateful for from this year?",
        "What lessons have you learned that will guide you forward?",
        "How can you prepare for a successful transition to next year?",
        "What legacy do you want to create with your remaining time this year?"
      ]
    };

    if (isReview) {
      return [
        `Reflecting on ${quarter} ${currentYear}, what were your biggest achievements?`,
        "What challenges did you face and how did you overcome them?",
        "What would you do differently if you could repeat this quarter?",
        "What are you most grateful for from this time period?",
        "What insights or lessons will you carry forward?"
      ];
    }

    return basePrompts[quarter];
  };

  const handleSaveReflection = () => {
    if (!selectedQuarter || !reflectionText.trim()) return;
    
    const quarterPlan = getQuarterlyPlan(selectedQuarter, currentYear);
    
    if (quarterPlan) {
      updateQuarterlyPlan(quarterPlan.id, {
        reflection: reflectionText.trim()
      });
    } else {
      addQuarterlyPlan({
        quarter: selectedQuarter,
        year: currentYear,
        goals: [],
        entries: [],
        reflection: reflectionText.trim()
      });
    }
    
    setReflectionText('');
    setShowReflectionModal(false);
  };

  const openReflectionModal = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setSelectedQuarter(quarter);
    const existingPlan = getQuarterlyPlan(quarter, currentYear);
    setReflectionText(existingPlan?.reflection || '');
    setShowReflectionModal(true);
  };

  const openGoalModal = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setSelectedQuarter(quarter);
    setShowGoalModal(true);
  };

  const isQuarterComplete = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): boolean => {
    const now = new Date();
    const quarterEndMonths = { Q1: 2, Q2: 5, Q3: 8, Q4: 11 }; // 0-indexed
    
    if (currentYear < now.getFullYear()) return true;
    if (currentYear > now.getFullYear()) return false;
    
    return now.getMonth() > quarterEndMonths[quarter];
  };

  const renderMonthCard = (monthData: MonthData, index: number) => (
    <View key={`${monthData.month}-${monthData.year}`} style={styles.monthCard}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>
          {monthData.month} {monthData.year}
        </Text>
        <Text style={styles.entryCount}>
          {monthData.entries.length} {monthData.entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      <View style={styles.entriesContainer}>
        {monthData.entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={24} color="#C7C7CC" />
            <Text style={styles.emptyText}>No future entries</Text>
          </View>
        ) : (
          monthData.entries.slice(0, 5).map((entry) => (
            <TouchableOpacity key={entry.id} style={styles.entryItem}>
              <Text
                style={[
                  styles.bullet,
                  { color: getEntryTypeColor(entry.type) }
                ]}
              >
                {getBulletSymbol(entry)}
              </Text>
              <View style={styles.entryContent}>
                <Text style={styles.entryText}>{entry.content}</Text>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.collectionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                  {(entry.tags.length > 0 || entry.contexts.length > 0) && (
                    <View style={styles.tagContainer}>
                      {entry.contexts.slice(0, 2).map(ctx => (
                        <Text key={ctx} style={styles.contextTag}>@{ctx}</Text>
                      ))}
                      {entry.tags.slice(0, 2).map(tag => (
                        <Text key={tag} style={styles.hashTag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {monthData.entries.length > 5 && (
          <TouchableOpacity style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>
              +{monthData.entries.length - 5} more entries
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Future Log - {currentYear}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('QuickCapture')}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'quarters' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('quarters')}
        >
          <Text style={[styles.viewModeText, viewMode === 'quarters' && styles.viewModeTextActive]}>
            Quarterly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'months' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('months')}
        >
          <Text style={[styles.viewModeText, viewMode === 'months' && styles.viewModeTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'quarters' ? (
          <>
            <Text style={styles.subtitle}>
              Quarterly planning and goal tracking for {currentYear}
            </Text>
            
            {/* Quarterly Cards */}
            <View style={styles.quartersContainer}>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => {
                const data = getQuarterData(quarter);
                const isCurrentQuarter = getCurrentQuarter() === quarter;
                const isComplete = isQuarterComplete(quarter);
                
                return (
                  <View 
                    key={quarter} 
                    style={[styles.quarterCard, isCurrentQuarter && styles.quarterCardActive]}
                  >
                    <View style={styles.quarterHeader}>
                      <Text style={styles.quarterTitle}>{quarter} {currentYear}</Text>
                      {isCurrentQuarter && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.quarterMonths}>
                      {data.months.join(' • ')}
                    </Text>
                    
                    {/* Goals Progress */}
                    {data.plan && data.plan.goals.length > 0 ? (
                      <View style={styles.goalsContainer}>
                        <Text style={styles.goalsTitle}>Goals ({data.plan.goals.length})</Text>
                        {data.plan.goals.slice(0, 3).map((goal) => (
                          <View key={goal.id} style={styles.goalItem}>
                            <View style={styles.goalProgress}>
                              <View style={[styles.goalProgressBar, { width: `${goal.progress}%` }]} />
                            </View>
                            <Text style={styles.goalTitle} numberOfLines={1}>
                              {goal.title}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addGoalButton}
                        onPress={() => openGoalModal(quarter)}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                        <Text style={styles.addGoalText}>Add Goals</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Action Buttons */}
                    <View style={styles.quarterActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.reflectionButton]}
                        onPress={() => openReflectionModal(quarter)}
                      >
                        <Ionicons 
                          name={data.plan?.reflection ? "document-text" : "document-text-outline"} 
                          size={16} 
                          color="#5856D6" 
                        />
                        <Text style={styles.actionButtonText}>
                          {isComplete ? 'Review' : 'Reflect'}
                        </Text>
                      </TouchableOpacity>
                      
                      {!isComplete && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.goalButton]}
                          onPress={() => openGoalModal(quarter)}
                        >
                          <Ionicons name="target" size={16} color="#007AFF" />
                          <Text style={styles.actionButtonText}>Goals</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Entry Count */}
                    <View style={styles.quarterStats}>
                      <Text style={styles.quarterStatText}>
                        {data.entries.length} entries
                      </Text>
                      {data.plan?.reflection && (
                        <View style={styles.reflectionIndicator}>
                          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                          <Text style={styles.reflectionIndicatorText}>Reflected</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Monthly view for future planning
            </Text>
            <View style={styles.monthsContainer}>
              {futureMonths.map((monthData, index) => renderMonthCard(monthData, index))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Goal Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Goal for {selectedQuarter}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Goal title"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optional)"
              value={newGoalDescription}
              onChangeText={setNewGoalDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowGoalModal(false);
                  setNewGoalTitle('');
                  setNewGoalDescription('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonSave}
                onPress={handleAddGoal}
              >
                <Text style={styles.modalButtonSaveText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reflection Modal */}
      <Modal
        visible={showReflectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReflectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reflectionModalContent}>
            <View style={styles.reflectionModalHeader}>
              <Text style={styles.modalTitle}>
                {selectedQuarter && isQuarterComplete(selectedQuarter) ? 'Review' : 'Reflect on'} {selectedQuarter}
              </Text>
              <TouchableOpacity onPress={() => setShowReflectionModal(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reflectionContent} showsVerticalScrollIndicator={false}>
              {/* Reflection Prompts */}
              <View style={styles.promptsSection}>
                <Text style={styles.promptsTitle}>Reflection Prompts</Text>
                <Text style={styles.promptsSubtitle}>
                  Consider these questions as you reflect on your quarter:
                </Text>
                
                {selectedQuarter && getReflectionPrompts(selectedQuarter, isQuarterComplete(selectedQuarter)).map((prompt, index) => (
                  <View key={index} style={styles.promptItem}>
                    <View style={styles.promptBullet}>
                      <Text style={styles.promptBulletText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </View>
                ))}
              </View>

              {/* Reflection Input */}
              <View style={styles.reflectionInputSection}>
                <Text style={styles.reflectionInputLabel}>Your Reflection</Text>
                <TextInput
                  style={styles.reflectionInput}
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  placeholder={selectedQuarter && isQuarterComplete(selectedQuarter) 
                    ? "Looking back on this quarter, what are your key insights and takeaways?"
                    : "What are your thoughts, plans, and intentions for this quarter?"
                  }
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{reflectionText.length}/2000</Text>
              </View>
            </ScrollView>

            <View style={styles.reflectionModalActions}>
              <TouchableOpacity 
                style={styles.reflectionCancelButton}
                onPress={() => {
                  setShowReflectionModal(false);
                  setReflectionText('');
                }}
              >
                <Text style={styles.reflectionCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.reflectionSaveButton}
                onPress={handleSaveReflection}
                disabled={!reflectionText.trim()}
              >
                <Text style={[
                  styles.reflectionSaveText, 
                  !reflectionText.trim() && styles.reflectionSaveTextDisabled
                ]}>
                  Save Reflection
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  monthsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  entryCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  entriesContainer: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  contextTag: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  hashTag: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  showMoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  quickAddSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  quickAddText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Quarterly View Styles
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  quartersContainer: {
    gap: 16,
    marginBottom: 32,
  },
  quarterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quarterCardActive: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  quarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quarterTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  currentBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  quarterMonths: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  goalsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  goalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  goalItem: {
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    marginTop: 4,
  },
  goalProgress: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addGoalText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  quarterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  quarterStatText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Quarter Action Styles
  quarterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  reflectionButton: {
    backgroundColor: '#F3F2FF',
    borderWidth: 1,
    borderColor: '#5856D6',
  },
  goalButton: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5856D6',
  },
  reflectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reflectionIndicatorText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#34C759',
  },
  // Reflection Modal Styles
  reflectionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    flex: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  reflectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  reflectionContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  promptsSection: {
    marginVertical: 20,
  },
  promptsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  promptsSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  promptBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  promptBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  reflectionInputSection: {
    marginBottom: 20,
  },
  reflectionInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  reflectionInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    lineHeight: 24,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  reflectionModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  reflectionCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignItems: 'center',
  },
  reflectionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  reflectionSaveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#5856D6',
    alignItems: 'center',
  },
  reflectionSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reflectionSaveTextDisabled: {
    opacity: 0.5,
  },
});