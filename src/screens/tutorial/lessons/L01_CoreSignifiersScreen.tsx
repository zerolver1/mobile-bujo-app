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

interface CoreSignifiersScreenProps {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      mode: 'quickStart' | 'complete';
      fromGuide?: boolean;
    };
  };
}

const coreSignifiers = [
  {
    symbol: '•',
    name: 'Task',
    description: 'Something you need to do',
    color: '#007AFF',
    examples: [
      'Buy groceries',
      'Call dentist for appointment',
      'Finish project report',
    ]
  },
  {
    symbol: '○',
    name: 'Event',
    description: 'Time-bound occasions',
    color: '#FF3B30',
    examples: [
      'Meeting at 2pm',
      'Birthday party Saturday',
      'Doctor appointment',
    ]
  },
  {
    symbol: '—',
    name: 'Note',
    description: 'Information to remember',
    color: '#32D74B',
    examples: [
      'Great book recommendation',
      'Interesting conversation topic',
      'Ideas for weekend project',
    ]
  },
];

export const CoreSignifiersScreen: React.FC<CoreSignifiersScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { lessonId, mode, fromGuide } = route.params;
  const { theme } = useTheme();
  const { startLesson, completeLesson } = useTutorialProgress();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [practiceScore, setPracticeScore] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const fadeAnim = new Animated.Value(1);

  // Practice examples for classification
  const practiceExamples = [
    { text: 'Buy milk on way home', type: 'task', symbol: '•' },
    { text: 'Team standup meeting 9am', type: 'event', symbol: '○' },
    { text: 'Great quote from the book', type: 'note', symbol: '—' },
    { text: 'Submit expense report', type: 'task', symbol: '•' },
    { text: 'Concert tickets go on sale', type: 'event', symbol: '○' },
    { text: 'Recipe idea for dinner party', type: 'note', symbol: '—' },
  ];

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
    await completeLesson(lessonId, practiceScore);
    
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

  const handlePracticeAnswer = (selectedType: string, correctType: string) => {
    if (selectedType === correctType) {
      setPracticeScore(practiceScore + 1);
    }
  };

  const renderSignifierCard = (signifier: typeof coreSignifiers[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.signifierCard, selectedExample === signifier.symbol && styles.selectedCard]}
      onPress={() => setSelectedExample(selectedExample === signifier.symbol ? null : signifier.symbol)}
    >
      <View style={[styles.symbolContainer, { backgroundColor: signifier.color }]}>
        <Typography variant="title2" style={styles.symbol}>
          {signifier.symbol}
        </Typography>
      </View>
      <View style={styles.signifierContent}>
        <Typography variant="headline" style={styles.signifierName}>
          {signifier.name}
        </Typography>
        <Typography variant="body" style={styles.signifierDescription}>
          {signifier.description}
        </Typography>
        {selectedExample === signifier.symbol && (
          <View style={styles.examplesList}>
            {signifier.examples.map((example, idx) => (
              <Typography key={idx} variant="caption" style={styles.exampleText}>
                {signifier.symbol} {example}
              </Typography>
            ))}
          </View>
        )}
      </View>
      <Ionicons 
        name={selectedExample === signifier.symbol ? "chevron-up" : "chevron-down"} 
        size={16} 
        color="#8E8E93" 
      />
    </TouchableOpacity>
  );

  const renderPracticeStep = () => (
    <Card variant="elevated" padding="lg" style={styles.practiceCard}>
      <Typography variant="title2" color="text" style={styles.stepTitle}>
        Practice: Classify These Entries
      </Typography>
      <Typography variant="body" style={styles.stepDescription}>
        Tap the correct symbol for each entry. Think about whether it's something to do, 
        a scheduled event, or information to remember.
      </Typography>
      
      <View style={styles.practiceGrid}>
        {practiceExamples.slice(0, 3).map((example, index) => (
          <View key={index} style={styles.practiceItem}>
            <Typography variant="body" style={styles.practiceText}>
              {example.text}
            </Typography>
            <View style={styles.practiceOptions}>
              {coreSignifiers.map((sig) => (
                <TouchableOpacity
                  key={sig.symbol}
                  style={[
                    styles.practiceOption,
                    { borderColor: sig.color }
                  ]}
                  onPress={() => handlePracticeAnswer(sig.name.toLowerCase(), example.type)}
                >
                  <Typography variant="body" style={[styles.practiceSymbol, { color: sig.color }]}>
                    {sig.symbol}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
      
      <Typography variant="caption" style={styles.practiceScore}>
        Score: {practiceScore}/3
      </Typography>
    </Card>
  );

  const steps = [
    // Step 1: Introduction
    {
      title: "The Three Core Signifiers",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Bullet journaling starts with three simple symbols. These signifiers help you 
            quickly categorize and understand your entries at a glance.
          </Typography>
          
          <View style={styles.coreTriangle}>
            <View style={styles.triangleTop}>
              <View style={[styles.miniSymbol, { backgroundColor: '#007AFF' }]}>
                <Typography variant="body" style={styles.miniSymbolText}>•</Typography>
              </View>
            </View>
            <View style={styles.triangleBottom}>
              <View style={[styles.miniSymbol, { backgroundColor: '#FF3B30' }]}>
                <Typography variant="body" style={styles.miniSymbolText}>○</Typography>
              </View>
              <View style={[styles.miniSymbol, { backgroundColor: '#32D74B' }]}>
                <Typography variant="body" style={styles.miniSymbolText}>—</Typography>
              </View>
            </View>
          </View>
          
          <Typography variant="body" style={styles.stepDescription}>
            Master these three, and you've got the foundation of bullet journaling!
          </Typography>
        </Card>
      )
    },
    // Step 2: Detailed Signifiers
    {
      title: "Meet Each Signifier",
      content: (
        <Card variant="elevated" padding="lg" style={styles.stepCard}>
          <Typography variant="body" style={styles.stepDescription}>
            Tap on each signifier to see examples of how you'd use them in your journal.
          </Typography>
          
          <View style={styles.signifierList}>
            {coreSignifiers.map(renderSignifierCard)}
          </View>
        </Card>
      )
    },
    // Step 3: Practice
    {
      title: "Try It Yourself",
      content: renderPracticeStep()
    }
  ];

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <View style={styles.container}>
        <LessonNavigation
          title="Core Signifiers"
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
          
          <View style={{ height: 100 }} />
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
  coreTriangle: {
    alignItems: 'center',
    marginVertical: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  triangleTop: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  triangleBottom: {
    flexDirection: 'row',
    gap: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  miniSymbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSymbolText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signifierList: {
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  signifierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.md,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signifierContent: {
    flex: 1,
  },
  signifierName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  signifierDescription: {
    fontSize: 14,
    color: '#666666',
  },
  examplesList: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
    gap: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  practiceCard: {
    backgroundColor: '#FFF8E1',
  },
  practiceGrid: {
    gap: PAPER_DESIGN_TOKENS.spacing.lg,
    marginVertical: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  practiceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: PAPER_DESIGN_TOKENS.spacing.md,
  },
  practiceText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
  },
  practiceOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  practiceOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  practiceSymbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  practiceScore: {
    textAlign: 'center',
    color: '#666666',
    fontWeight: '600',
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
  },
});