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

interface EntryTypesScreenProps {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      mode: 'quickStart' | 'complete';
      fromGuide?: boolean;
    };
  };
}

const entryTypes = [
  {
    symbol: '•',
    name: 'Tasks',
    type: 'task',
    description: 'Actionable items that need to be completed',
    color: '#007AFF',
    characteristics: [
      'Can be completed, migrated, or cancelled',
      'Have different states (•, ✕, >, <)',
      'Most important for productivity',
      'Can have due dates and priorities'
    ],
    examples: [
      '• Buy groceries for dinner party',
      '• Call dentist to schedule cleaning',
      '• Submit quarterly report by Friday',
      '• Research vacation destinations'
    ],
    whenToUse: 'When something needs to be done, has a clear completion state, or requires action from you.'
  },
  {
    symbol: '○',
    name: 'Events',
    type: 'event', 
    description: 'Time-bound scheduled occurrences',
    color: '#FF3B30',
    characteristics: [
      'Happen at specific times/dates',
      'Cannot be "completed" - they occur or don\'t',
      'Often generate follow-up tasks',
      'Usually involve other people or locations'
    ],
    examples: [
      '○ Team meeting Monday 2pm',
      '○ Sarah\'s birthday party Saturday',
      '○ Doctor appointment 10:30am',
      '○ Conference call with client'
    ],
    whenToUse: 'For scheduled appointments, meetings, deadlines, or any time-specific occurrence.'
  },
  {
    symbol: '—',
    name: 'Notes',
    type: 'note',
    description: 'Information, ideas, and observations to remember',
    color: '#32D74B',
    characteristics: [
      'Capture information and thoughts',
      'Don\'t require completion',
      'Can become tasks later',
      'Include ideas, quotes, observations'
    ],
    examples: [
      '— Great book recommendation: "Atomic Habits"',
      '— Meeting notes: New project timeline',
      '— Idea: Weekend hiking trail to explore',
      '— Quote: "Progress over perfection"'
    ],
    whenToUse: 'To capture thoughts, information, meeting notes, or anything you want to remember.'
  }
];

const practiceScenarios = [
  {
    text: 'Pick up dry cleaning before 6pm',
    correct: 'task',
    explanation: 'This has a clear action (pick up) and completion state, making it a task.'
  },
  {
    text: 'Weekly team standup meeting every Tuesday 9am', 
    correct: 'event',
    explanation: 'This is scheduled at a specific recurring time, making it an event.'
  },
  {
    text: 'Interesting article about productivity methods',
    correct: 'note',
    explanation: 'This captures information you want to remember, making it a note.'
  },
  {
    text: 'Send birthday card to Mom',
    correct: 'task', 
    explanation: 'This requires action from you with a clear completion state.'
  },
  {
    text: 'Concert tickets go on sale Friday 10am',
    correct: 'event',
    explanation: 'This happens at a specific time and you can\'t "complete" it.'
  },
  {
    text: 'Recipe idea: Mediterranean chicken bowls',
    correct: 'note',
    explanation: 'This captures an idea you want to remember for later.'
  }
];

export const EntryTypesScreen: React.FC<EntryTypesScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { lessonId, mode, fromGuide } = route.params;
  const { theme } = useTheme();
  const { startLesson, completeLesson } = useTutorialProgress();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<{[key: number]: string}>({});
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
    const correctAnswers = Object.values(practiceAnswers).filter((answer, index) => 
      answer === practiceScenarios[index]?.correct
    ).length;
    const score = Math.round((correctAnswers / practiceScenarios.length) * 100);
    
    await completeLesson(lessonId, score);
    
    // Navigate to next lesson
    if (mode === 'quickStart') {
      navigation.navigate('TutorialLesson', {
        lessonId: 'migration',
        mode,
        fromGuide,
      });
    } else {
      navigation.navigate('TutorialLaunch', { mode });
    }
  };

  const handlePracticeAnswer = (questionIndex: number, selectedAnswer: string) => {
    setPracticeAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }));
  };

  const renderTypeDetail = (entryType: typeof entryTypes[0]) => (
    <TouchableOpacity
      key={entryType.type}
      style={[
        styles.typeCard, 
        selectedType === entryType.type && styles.selectedTypeCard
      ]}
      onPress={() => setSelectedType(selectedType === entryType.type ? null : entryType.type)}
    >
      <View style={styles.typeHeader}>
        <View style={[styles.typeSymbol, { backgroundColor: entryType.color }]}>
          <Typography variant="title2" style={styles.symbolText}>
            {entryType.symbol}
          </Typography>
        </View>
        <View style={styles.typeInfo}>
          <Typography variant="headline" style={styles.typeName}>
            {entryType.name}
          </Typography>
          <Typography variant="body" style={styles.typeDescription}>
            {entryType.description}
          </Typography>
        </View>
        <Ionicons 
          name={selectedType === entryType.type ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#8E8E93" 
        />
      </View>
      
      {selectedType === entryType.type && (
        <View style={styles.typeDetails}>
          <View style={styles.detailSection}>
            <Typography variant="subtitle" style={styles.detailTitle}>
              Key Characteristics:
            </Typography>
            {entryType.characteristics.map((char, index) => (
              <Typography key={index} variant="body" style={styles.detailPoint}>
                • {char}
              </Typography>
            ))}
          </View>
          
          <View style={styles.detailSection}>
            <Typography variant="subtitle" style={styles.detailTitle}>
              Examples:
            </Typography>
            {entryType.examples.map((example, index) => (
              <Typography key={index} variant="caption" style={styles.exampleText}>
                {example}
              </Typography>
            ))}
          </View>
          
          <View style={styles.whenToUse}>
            <Typography variant="subtitle" style={styles.detailTitle}>
              When to use:
            </Typography>
            <Typography variant="body" style={styles.whenText}>
              {entryType.whenToUse}
            </Typography>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPracticeStep = () => (
    <Card variant="elevated" padding="lg" style={styles.practiceCard}>
      <Typography variant="title2" color="text" style={styles.stepTitle}>
        Practice: Classify Real Scenarios
      </Typography>
      <Typography variant="body" style={styles.stepDescription}>
        Read each scenario and decide if it's a Task (•), Event (○), or Note (—).
      </Typography>
      
      <View style={styles.practiceList}>
        {practiceScenarios.map((scenario, index) => (
          <View key={index} style={styles.practiceScenario}>
            <Typography variant="body" style={styles.scenarioText}>
              {scenario.text}
            </Typography>
            
            <View style={styles.answerOptions}>
              {entryTypes.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.answerOption,
                    {
                      borderColor: type.color,
                      backgroundColor: practiceAnswers[index] === type.type ? type.color : 'transparent'
                    }
                  ]}
                  onPress={() => handlePracticeAnswer(index, type.type)}
                >
                  <Typography variant="body" style={[
                    styles.answerSymbol,
                    { color: practiceAnswers[index] === type.type ? '#FFFFFF' : type.color }
                  ]}>
                    {type.symbol}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            
            {showResults && practiceAnswers[index] && (
              <View style={[
                styles.resultFeedback,
                {
                  backgroundColor: practiceAnswers[index] === scenario.correct ? '#D4EDDA' : '#F8D7DA'
                }
              ]}>
                <Typography variant="caption" style={[
                  styles.resultText,
                  { color: practiceAnswers[index] === scenario.correct ? '#155724' : '#721C24' }
                ]}>
                  {practiceAnswers[index] === scenario.correct ? '✓ Correct!' : '✗ Incorrect'}
                </Typography>
                <Typography variant="caption" style={styles.explanationText}>
                  {scenario.explanation}
                </Typography>
              </View>
            )}
          </View>
        ))}
      </View>
      
      {Object.keys(practiceAnswers).length === practiceScenarios.length && !showResults && (
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
            Score: {Object.values(practiceAnswers).filter((answer, index) => 
              answer === practiceScenarios[index]?.correct
            ).length}/{practiceScenarios.length}
          </Typography>
        </View>
      )}
    </Card>
  );

  const steps = [
    // Step 1: Introduction
    {
      title: "Understanding Entry Types",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Every bullet journal entry falls into one of three categories. Understanding 
            these types helps you process information quickly and take appropriate action.
          </Typography>
          
          <View style={styles.typesOverview}>
            {entryTypes.map((type, index) => (
              <View key={type.type} style={styles.typePreview}>
                <View style={[styles.previewSymbol, { backgroundColor: type.color }]}>
                  <Typography variant="headline" style={styles.previewSymbolText}>
                    {type.symbol}
                  </Typography>
                </View>
                <Typography variant="subtitle" style={styles.previewName}>
                  {type.name}
                </Typography>
              </View>
            ))}
          </View>
          
          <Typography variant="body" style={styles.stepDescription}>
            Let's explore each type in detail to understand when and how to use them.
          </Typography>
        </Card>
      )
    },
    // Step 2: Detailed Types
    {
      title: "Deep Dive: Each Entry Type",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Tap on each entry type to explore its characteristics, see examples, 
            and learn when to use it in your journal.
          </Typography>
          
          <View style={styles.typesList}>
            {entryTypes.map(renderTypeDetail)}
          </View>
        </Card>
      )
    },
    // Step 3: Practice
    {
      title: "Apply Your Knowledge",
      content: renderPracticeStep()
    }
  ];

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <View style={styles.container}>
        <LessonNavigation
          title="Entry Types"
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
  typesOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: PAPER_DESIGN_TOKENS.spacing.xl,
    width: '100%',
  },
  typePreview: {
    alignItems: 'center',
  },
  previewSymbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  previewSymbolText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  typesList: {
    gap: PAPER_DESIGN_TOKENS.spacing.md,
    width: '100%',
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    overflow: 'hidden',
  },
  selectedTypeCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.md,
  },
  typeSymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
  },
  symbolText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666666',
  },
  typeDetails: {
    padding: PAPER_DESIGN_TOKENS.spacing.md,
    paddingTop: 0,
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  detailSection: {
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  detailPoint: {
    fontSize: 14,
    color: '#666666',
    paddingLeft: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  exampleText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'monospace',
    paddingLeft: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  whenToUse: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  whenText: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
  },
  practiceCard: {
    backgroundColor: '#FFF8E1',
  },
  practiceList: {
    gap: PAPER_DESIGN_TOKENS.spacing.lg,
    marginVertical: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  practiceScenario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: PAPER_DESIGN_TOKENS.spacing.md,
  },
  scenarioText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
    color: '#1C1C1E',
  },
  answerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  answerOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerSymbol: {
    fontSize: 20,
    fontWeight: '600',
  },
  resultFeedback: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 6,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  explanationText: {
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