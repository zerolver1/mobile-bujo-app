import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { 
  PaperBackground, 
  Typography, 
  Card,
  PaperButton,
  PAPER_DESIGN_TOKENS,
  safeThemeAccess 
} from '../../components/ui/paperComponents';

interface TutorialPracticeScreenProps {
  navigation: any;
  route: {
    params: {
      exerciseType: 'mixed' | 'signifiers' | 'migration' | 'collections';
    };
  };
}

const practiceExercises = {
  mixed: [
    { text: 'Team meeting at 3pm tomorrow', answer: 'event', symbol: '○', explanation: 'This is a scheduled event with a specific time.' },
    { text: 'Buy groceries after work', answer: 'task', symbol: '•', explanation: 'This is something you need to do - a task.' },
    { text: 'Great quote from the conference', answer: 'note', symbol: '—', explanation: 'This is information to remember - a note.' },
    { text: 'Call mom on her birthday', answer: 'event', symbol: '○', explanation: 'This is a time-specific occasion - an event.' },
    { text: 'Research best practices for React', answer: 'task', symbol: '•', explanation: 'This is work you need to complete - a task.' },
    { text: 'Interesting idea about productivity', answer: 'note', symbol: '—', explanation: 'This is a thought or insight to capture - a note.' },
  ],
  signifiers: [
    { text: 'Doctor appointment at 2pm', answer: 'event', symbol: '○' },
    { text: 'Read the new book', answer: 'task', symbol: '•' },
    { text: 'Interesting conversation with Sarah', answer: 'note', symbol: '—' },
    { text: 'Submit quarterly report', answer: 'task', symbol: '•' },
    { text: 'Birthday party this weekend', answer: 'event', symbol: '○' },
  ],
  migration: [
    { text: 'Task completed yesterday', answer: 'completed', symbol: '✕', explanation: 'Mark completed tasks with X.' },
    { text: 'Task not relevant anymore', answer: 'irrelevant', symbol: '~', explanation: 'Strike through irrelevant tasks.' },
    { text: 'Move task to next month', answer: 'scheduled', symbol: '<', explanation: 'Use < to schedule tasks for future months.' },
    { text: 'Move task to future log', answer: 'migrated', symbol: '>', explanation: 'Use > to migrate tasks to future log.' },
  ],
};

const signifierOptions = [
  { name: 'task', symbol: '•', color: '#007AFF' },
  { name: 'event', symbol: '○', color: '#FF3B30' },
  { name: 'note', symbol: '—', color: '#32D74B' },
];

const migrationOptions = [
  { name: 'completed', symbol: '✕', color: '#34C759' },
  { name: 'migrated', symbol: '>', color: '#007AFF' },
  { name: 'scheduled', symbol: '<', color: '#FF9500' },
  { name: 'irrelevant', symbol: '~', color: '#8E8E93' },
];

export const TutorialPracticeScreen: React.FC<TutorialPracticeScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { exerciseType } = route.params;
  const { theme } = useTheme();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const fadeAnim = new Animated.Value(1);

  const exercises = practiceExercises[exerciseType] || practiceExercises.mixed;
  const options = exerciseType === 'migration' ? migrationOptions : signifierOptions;

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    const correct = answer === exercises[currentExercise].answer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(score + 1);
    }
    
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
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
      
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentExercise(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setSessionComplete(false);
  };

  const getPerformanceMessage = () => {
    const percentage = Math.round((score / exercises.length) * 100);
    if (percentage >= 90) return "Outstanding! You've mastered the fundamentals.";
    if (percentage >= 70) return "Great work! You're getting the hang of it.";
    if (percentage >= 50) return "Good start! Keep practicing to improve.";
    return "Keep learning! Review the lessons and try again.";
  };

  const getExerciseTypeTitle = () => {
    switch (exerciseType) {
      case 'signifiers': return 'Core Signifiers Practice';
      case 'migration': return 'Migration & States Practice';
      case 'collections': return 'Collections Practice';
      default: return 'Mixed Practice Session';
    }
  };

  if (sessionComplete) {
    return (
      <PaperBackground variant="lined" showMargin={true} intensity="light">
        <View style={styles.container}>
          {/* Header */}
          <Card variant="flat" padding="md" style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            </TouchableOpacity>
            <Typography variant="headline" color="text">Practice Complete</Typography>
            <View style={{ width: 24 }} />
          </Card>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card variant="elevated" padding="lg" style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <View style={[styles.scoreCircle, { borderColor: score / exercises.length >= 0.7 ? '#34C759' : '#FF9500' }]}>
                  <Typography variant="title1" style={[styles.scoreText, { color: score / exercises.length >= 0.7 ? '#34C759' : '#FF9500' }]}>
                    {Math.round((score / exercises.length) * 100)}%
                  </Typography>
                </View>
                <Typography variant="title2" style={styles.resultsTitle}>
                  {getPerformanceMessage()}
                </Typography>
                <Typography variant="body" style={styles.resultsSubtitle}>
                  You got {score} out of {exercises.length} correct
                </Typography>
              </View>

              <View style={styles.resultsStats}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Typography variant="body" style={styles.statText}>
                    {score} Correct
                  </Typography>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Typography variant="body" style={styles.statText}>
                    {exercises.length - score} Missed
                  </Typography>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={20} color="#8E8E93" />
                  <Typography variant="body" style={styles.statText}>
                    {exercises.length} Questions
                  </Typography>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <PaperButton
                  variant="secondary"
                  size="lg"
                  title="Practice Again"
                  onPress={handleRestart}
                  style={styles.actionButton}
                />
                <PaperButton
                  variant="primary"
                  size="lg"
                  title="Back to Academy"
                  onPress={() => navigation.navigate('TutorialLaunch', { mode: 'practice' })}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          </ScrollView>
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <View style={styles.container}>
        {/* Header */}
        <Card variant="flat" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
          </TouchableOpacity>
          <Typography variant="headline" color="text">{getExerciseTypeTitle()}</Typography>
          <View style={{ width: 24 }} />
        </Card>

        {/* Progress Bar */}
        <Card variant="flat" padding="md" style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Typography variant="body" style={styles.progressText}>
              Question {currentExercise + 1} of {exercises.length}
            </Typography>
            <Typography variant="body" style={styles.scoreText}>
              Score: {score}/{exercises.length}
            </Typography>
          </View>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { width: `${((currentExercise + 1) / exercises.length) * 100}%` }
            ]} />
          </View>
        </Card>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card variant="elevated" padding="lg" style={styles.exerciseCard}>
              <Typography variant="title2" color="text" style={styles.questionTitle}>
                Classify this entry:
              </Typography>
              
              <View style={styles.questionBox}>
                <Typography variant="body" style={styles.questionText}>
                  "{exercises[currentExercise].text}"
                </Typography>
              </View>

              <View style={styles.optionsGrid}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.name}
                    style={[
                      styles.optionButton,
                      { borderColor: option.color },
                      selectedAnswer === option.name && styles.selectedOption,
                      showFeedback && selectedAnswer === option.name && isCorrect && styles.correctOption,
                      showFeedback && selectedAnswer === option.name && !isCorrect && styles.incorrectOption,
                      showFeedback && option.name === exercises[currentExercise].answer && selectedAnswer !== option.name && styles.correctAnswerOption,
                    ]}
                    onPress={() => handleAnswer(option.name)}
                    disabled={showFeedback}
                  >
                    <View style={[styles.symbolContainer, { backgroundColor: option.color }]}>
                      <Typography variant="body" style={styles.optionSymbol}>
                        {option.symbol}
                      </Typography>
                    </View>
                    <Typography variant="body" style={[styles.optionText, { color: option.color }]}>
                      {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              {showFeedback && (
                <Card variant="flat" padding="md" style={[
                  styles.feedbackCard, 
                  { backgroundColor: isCorrect ? '#E8F5E8' : '#FFF0F0' }
                ]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={isCorrect ? "#34C759" : "#FF3B30"} 
                    />
                    <Typography variant="headline" style={[
                      styles.feedbackTitle,
                      { color: isCorrect ? "#34C759" : "#FF3B30" }
                    ]}>
                      {isCorrect ? "Correct!" : "Not quite"}
                    </Typography>
                  </View>
                  
                  {exercises[currentExercise].explanation && (
                    <Typography variant="body" style={styles.feedbackText}>
                      {exercises[currentExercise].explanation}
                    </Typography>
                  )}
                  
                  <PaperButton
                    variant="primary"
                    size="md"
                    title={currentExercise < exercises.length - 1 ? "Next Question" : "See Results"}
                    onPress={handleNext}
                    style={styles.nextButton}
                  />
                </Card>
              )}
            </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  progressSection: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  exerciseCard: {
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  questionBox: {
    backgroundColor: '#F8F8F8',
    padding: PAPER_DESIGN_TOKENS.spacing.lg,
    borderRadius: 12,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  optionButton: {
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  correctOption: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E8',
  },
  incorrectOption: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  correctAnswerOption: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E8',
  },
  symbolContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  optionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackCard: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
    alignItems: 'center',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
    lineHeight: 20,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  nextButton: {
    minWidth: 120,
  },
  // Results screen styles
  resultsCard: {
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E7',
  },
  statItem: {
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 130,
  },
});