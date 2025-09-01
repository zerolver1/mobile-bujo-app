import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { 
  PaperBackground, 
  Typography, 
  Card,
  PaperButton,
  PAPER_DESIGN_TOKENS,
  safeThemeAccess 
} from '../../../components/ui/paperComponents';
import { useTutorialProgress } from '../hooks/useTutorialProgress';
import { LessonNavigation } from '../components/LessonNavigation';
import { getNextLessonId, isLastLesson } from '../utils/lessonConfig';

interface MigrationScreenProps {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      mode: 'quickStart' | 'complete';
      fromGuide?: boolean;
    };
  };
}

const taskStates = [
  {
    symbol: '•',
    name: 'Incomplete Task',
    description: 'Task that hasn\'t been started or completed yet',
    color: '#007AFF',
    example: '• Buy groceries for dinner party'
  },
  {
    symbol: '✕',
    name: 'Complete Task', 
    description: 'Task that has been finished successfully',
    color: '#34C759',
    example: '✕ Buy groceries for dinner party'
  },
  {
    symbol: '>',
    name: 'Migrated Task',
    description: 'Task moved to future date or collection',
    color: '#FF9500', 
    example: '> Buy groceries for dinner party'
  },
  {
    symbol: '<',
    name: 'Scheduled Task',
    description: 'Task added to calendar or future log',
    color: '#5856D6',
    example: '< Buy groceries for dinner party'
  },
  {
    symbol: '~',
    name: 'Cancelled Task',
    description: 'Task no longer relevant or needed',
    color: '#8E8E93',
    example: '~ Buy groceries for dinner party'
  }
];

const migrationScenarios = [
  {
    task: '• Finish quarterly report',
    situation: 'End of day - report is 80% done but deadline is next week',
    options: [
      { action: 'migrate', symbol: '>', reason: 'Move to tomorrow to finish' },
      { action: 'schedule', symbol: '<', reason: 'Add to calendar for specific time' },
      { action: 'complete', symbol: '✕', reason: 'Not appropriate - still needs work' }
    ],
    correct: 'migrate',
    explanation: 'Since work is in progress but not complete, migrate (>) to continue tomorrow.'
  },
  {
    task: '• Call dentist for checkup',
    situation: 'You realize you had a checkup last month and don\'t need another yet',
    options: [
      { action: 'cancel', symbol: '~', reason: 'No longer needed right now' },
      { action: 'schedule', symbol: '<', reason: 'Put in future log for 6 months' },
      { action: 'migrate', symbol: '>', reason: 'Move to tomorrow' }
    ],
    correct: 'cancel',
    explanation: 'Task is no longer relevant right now, so cancel (~) it.'
  },
  {
    task: '• Research vacation destinations',
    situation: 'Haven\'t started yet, but vacation is 3 months away',
    options: [
      { action: 'migrate', symbol: '>', reason: 'Move to tomorrow to start' },
      { action: 'schedule', symbol: '<', reason: 'Add to future log for later' },
      { action: 'cancel', symbol: '~', reason: 'Not needed anymore' }
    ],
    correct: 'schedule',
    explanation: 'Task has a future timeline, so schedule (<) it for later when more relevant.'
  }
];

export const MigrationScreen: React.FC<MigrationScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { lessonId, mode, fromGuide } = route.params;
  const { theme } = useTheme();
  const { startLesson, completeLesson } = useTutorialProgress();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [migrationAnswers, setMigrationAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    startLesson(lessonId);
  }, [lessonId, startLesson]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const correctAnswers = Object.entries(migrationAnswers).filter(([index, answer]) => 
      answer === migrationScenarios[parseInt(index)].correct
    ).length;
    const score = Math.round((correctAnswers / migrationScenarios.length) * 100);
    
    await completeLesson(lessonId, score);
    
    const nextLessonId = getNextLessonId(lessonId, mode);
    
    if (nextLessonId) {
      // Navigate to next lesson
      navigation.navigate('TutorialLesson', {
        lessonId: nextLessonId,
        mode,
        fromGuide,
      });
    } else {
      // Last lesson completed, return to launch screen
      navigation.navigate('TutorialLaunch', { mode });
    }
  };

  const handleMigrationAnswer = (scenarioIndex: number, selectedAnswer: string) => {
    setMigrationAnswers(prev => ({
      ...prev,
      [scenarioIndex]: selectedAnswer
    }));
  };

  const renderStateCard = (state: typeof taskStates[0]) => (
    <TouchableOpacity
      key={state.symbol}
      style={[
        styles.stateCard,
        selectedState === state.symbol && styles.selectedStateCard
      ]}
      onPress={() => setSelectedState(selectedState === state.symbol ? null : state.symbol)}
    >
      <View style={styles.stateHeader}>
        <View style={[styles.stateSymbol, { backgroundColor: state.color }]}>
          <Typography variant="headline" style={styles.symbolText}>
            {state.symbol}
          </Typography>
        </View>
        <View style={styles.stateInfo}>
          <Typography variant="subtitle" style={styles.stateName}>
            {state.name}
          </Typography>
          <Typography variant="body" style={styles.stateDescription}>
            {state.description}
          </Typography>
        </View>
        <Ionicons 
          name={selectedState === state.symbol ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#8E8E93" 
        />
      </View>
      
      {selectedState === state.symbol && (
        <View style={styles.stateDetails}>
          <Typography variant="caption" style={styles.exampleLabel}>Example:</Typography>
          <Typography variant="body" style={styles.exampleText}>
            {state.example}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMigrationScenario = (scenario: typeof migrationScenarios[0], index: number) => (
    <View key={index} style={styles.scenarioCard}>
      <Typography variant="subtitle" style={styles.scenarioTask}>
        {scenario.task}
      </Typography>
      <Typography variant="body" style={styles.scenarioSituation}>
        Situation: {scenario.situation}
      </Typography>
      
      <Typography variant="body" style={styles.scenarioQuestion}>
        What should you do at the end of the day?
      </Typography>
      
      <View style={styles.scenarioOptions}>
        {scenario.options.map((option, optIndex) => (
          <TouchableOpacity
            key={optIndex}
            style={[
              styles.scenarioOption,
              migrationAnswers[index] === option.action && styles.selectedOption
            ]}
            onPress={() => handleMigrationAnswer(index, option.action)}
          >
            <View style={styles.optionSymbol}>
              <Typography variant="body" style={styles.optionSymbolText}>
                {option.symbol}
              </Typography>
            </View>
            <Typography variant="body" style={styles.optionReason}>
              {option.reason}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
      
      {showResults && migrationAnswers[index] && (
        <View style={[
          styles.scenarioResult,
          {
            backgroundColor: migrationAnswers[index] === scenario.correct ? '#D4EDDA' : '#F8D7DA'
          }
        ]}>
          <Typography variant="caption" style={[
            styles.resultStatus,
            { color: migrationAnswers[index] === scenario.correct ? '#155724' : '#721C24' }
          ]}>
            {migrationAnswers[index] === scenario.correct ? '✓ Correct!' : '✗ Try again'}
          </Typography>
          <Typography variant="caption" style={styles.resultExplanation}>
            {scenario.explanation}
          </Typography>
        </View>
      )}
    </View>
  );

  const renderMigrationPractice = () => (
    <Card variant="elevated" padding="lg" style={styles.practiceCard}>
      <Typography variant="title2" color="text" style={styles.stepTitle}>
        Practice: Migration Decisions
      </Typography>
      <Typography variant="body" style={styles.stepDescription}>
        Read each scenario and choose the appropriate action. Think about what makes 
        the most sense for each situation.
      </Typography>
      
      <View style={styles.scenariosList}>
        {migrationScenarios.map(renderMigrationScenario)}
      </View>
      
      {Object.keys(migrationAnswers).length === migrationScenarios.length && !showResults && (
        <PaperButton
          variant="outline"
          size="md"
          title="Show Results"
          onPress={() => setShowResults(true)}
          style={styles.resultsButton}
        />
      )}
      
      {showResults && (
        <View style={styles.scoreCard}>
          <Typography variant="headline" style={styles.scoreText}>
            Score: {Object.entries(migrationAnswers).filter(([index, answer]) => 
              answer === migrationScenarios[parseInt(index)].correct
            ).length}/{migrationScenarios.length}
          </Typography>
        </View>
      )}
    </Card>
  );

  const steps = [
    // Step 1: Introduction
    {
      title: "The Power of Migration",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Migration is the heart of bullet journaling. At the end of each day or month, 
            you review incomplete tasks and decide their fate. This keeps your journal 
            current and prevents tasks from getting lost.
          </Typography>
          
          <View style={styles.migrationFlow}>
            <View style={styles.flowStep}>
              <View style={[styles.flowIcon, { backgroundColor: '#007AFF' }]}>
                <Typography variant="body" style={styles.flowIconText}>•</Typography>
              </View>
              <Typography variant="caption" style={styles.flowLabel}>Start</Typography>
            </View>
            
            <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
            
            <View style={styles.flowStep}>
              <View style={[styles.flowIcon, { backgroundColor: '#FF9500' }]}>
                <Typography variant="body" style={styles.flowIconText}>?</Typography>
              </View>
              <Typography variant="caption" style={styles.flowLabel}>Review</Typography>
            </View>
            
            <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
            
            <View style={styles.flowStep}>
              <View style={[styles.flowIcon, { backgroundColor: '#34C759' }]}>
                <Typography variant="body" style={styles.flowIconText}>✕</Typography>
              </View>
              <Typography variant="caption" style={styles.flowLabel}>Action</Typography>
            </View>
          </View>
          
          <Typography variant="body" style={styles.stepDescription}>
            Let's learn the different states a task can have and when to use each one.
          </Typography>
        </Card>
      )
    },
    // Step 2: Task States
    {
      title: "Task States & Signifiers",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Every task can be in one of five states. Tap on each to see when and why you'd use it.
          </Typography>
          
          <View style={styles.statesList}>
            {taskStates.map(renderStateCard)}
          </View>
          
          <View style={styles.migrationTip}>
            <Ionicons name="lightbulb" size={20} color="#FFD60A" />
            <Typography variant="body" style={styles.tipText}>
              The key is being honest about what you'll actually do with each task.
            </Typography>
          </View>
        </Card>
      )
    },
    // Step 3: Practice
    {
      title: "Make Migration Decisions",
      content: renderMigrationPractice()
    }
  ];

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <View style={styles.container}>
        <LessonNavigation
          title="Migration & States"
          currentStep={currentStep + 1}
          totalSteps={steps.length}
          onBack={() => navigation.goBack()}
          onPrevious={currentStep > 0 ? handlePrevious : undefined}
          onNext={handleNext}
          onComplete={currentStep === steps.length - 1 ? handleComplete : undefined}
          nextLabel={currentStep === steps.length - 1 ? "Complete Lesson" : "Next"}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Typography variant="title2" color="text" style={styles.stepTitle}>
              {steps[currentStep].title}
            </Typography>
            {steps[currentStep].content}
          </Animated.View>
          
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  stepContainer: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  stepCard: {
    alignItems: 'center',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#666666',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  migrationFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
    marginVertical: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  flowIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flowLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statesList: {
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
    width: '100%',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  selectedStateCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  stateSymbol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stateInfo: {
    flex: 1,
  },
  stateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stateDescription: {
    fontSize: 13,
    color: '#666666',
  },
  stateDetails: {
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    paddingTop: 0,
    backgroundColor: '#F8F9FA',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#495057',
  },
  migrationTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
    backgroundColor: '#FFFBF0',
    padding: PAPER_DESIGN_TOKENS.spacing.md,
    borderRadius: 8,
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  tipText: {
    fontSize: 14,
    color: '#8A6914',
    flex: 1,
  },
  practiceCard: {
    backgroundColor: '#FFF8E1',
  },
  scenariosList: {
    gap: PAPER_DESIGN_TOKENS.spacing.xl,
    marginVertical: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: PAPER_DESIGN_TOKENS.spacing.md,
  },
  scenarioTask: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
    fontFamily: 'monospace',
  },
  scenarioSituation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
    fontStyle: 'italic',
  },
  scenarioQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
  },
  scenarioOptions: {
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  scenarioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  optionSymbol: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  optionSymbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  optionReason: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  scenarioResult: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 6,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultExplanation: {
    fontSize: 12,
    color: '#495057',
  },
  resultsButton: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
    alignSelf: 'center',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: PAPER_DESIGN_TOKENS.spacing.md,
    alignItems: 'center',
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});