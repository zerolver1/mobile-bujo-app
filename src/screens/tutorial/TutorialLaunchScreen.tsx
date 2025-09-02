import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { useTutorialProgress } from './hooks/useTutorialProgress';
import { getLessonList, quickStartLessons, completeLessons } from './utils/lessonConfig';

interface TutorialLaunchScreenProps {
  navigation: any;
  route: {
    params: {
      mode: 'quickStart' | 'complete' | 'practice';
    };
  };
}

export const TutorialLaunchScreen: React.FC<TutorialLaunchScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { mode } = route.params;
  const { theme } = useTheme();
  const { progress, getOverallProgress, hasStarted } = useTutorialProgress();
  const [selectedPath, setSelectedPath] = useState<'quickStart' | 'complete'>(mode === 'practice' ? 'quickStart' : mode);

  const getCurrentLessons = () => {
    return getLessonList(selectedPath);
  };

  const getTotalDuration = () => {
    const lessons = getCurrentLessons();
    const totalMinutes = lessons.reduce((sum, lesson) => {
      const minutes = parseInt(lesson.duration.replace(' min', ''));
      return sum + minutes;
    }, 0);
    return `${totalMinutes} minutes`;
  };

  const getProgressForPath = () => {
    const lessons = getCurrentLessons();
    const completedCount = lessons.filter(lesson => progress[lesson.id]?.completed).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  const handleStartLearning = () => {
    const lessons = getCurrentLessons();
    const firstIncompleteLesson = lessons.find(lesson => !progress[lesson.id]?.completed) || lessons[0];
    
    navigation.navigate('TutorialLesson', {
      lessonId: firstIncompleteLesson.id,
      mode: selectedPath,
      fromGuide: true,
    });
  };

  const handlePracticeMode = () => {
    navigation.navigate('TutorialPractice', { exerciseType: 'mixed' });
  };

  const handleLessonPress = (lessonId: string) => {
    navigation.navigate('TutorialLesson', {
      lessonId,
      mode: selectedPath,
      fromGuide: true,
    });
  };

  const renderLessonList = () => {
    const lessons = getCurrentLessons();
    
    return (
      <View style={styles.lessonList}>
        {lessons.map((lesson, index) => {
          const isCompleted = progress[lesson.id]?.completed || false;
          const isInProgress = progress[lesson.id]?.started && !isCompleted;
          
          return (
            <TouchableOpacity 
              key={lesson.id} 
              style={styles.lessonItem}
              onPress={() => handleLessonPress(lesson.id)}
            >
              <View style={[
                styles.lessonNumber, 
                {
                  backgroundColor: isCompleted ? '#34C759' : isInProgress ? '#FF9500' : safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
                }
              ]}>
                <Typography variant="caption" style={[
                  styles.lessonNumberText,
                  { color: isCompleted || isInProgress ? '#FFFFFF' : '#8E8E93' }
                ]}>
                  {index + 1}
                </Typography>
              </View>
              <View style={styles.lessonContent}>
                <View style={styles.lessonHeader}>
                  <Ionicons 
                    name={lesson.icon as any} 
                    size={16} 
                    color={isCompleted ? '#34C759' : '#8E8E93'} 
                  />
                  <Typography variant="body" style={[
                    styles.lessonTitle,
                    { color: isCompleted ? '#34C759' : safeThemeAccess(theme, t => t.colors.text, '#1C1C1E') }
                  ]}>
                    {lesson.title}
                  </Typography>
                  {isCompleted && (
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  )}
                </View>
                <Typography variant="caption" style={styles.lessonDuration}>
                  {lesson.duration}
                </Typography>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (mode === 'practice') {
    return (
      <PaperBackground variant="lined" showMargin={true} intensity="light">
        <View style={styles.container}>
          {/* Header */}
          <Card variant="flat" padding="md" style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            </TouchableOpacity>
            <Typography variant="headline" color="text">Practice Mode</Typography>
            <View style={{ width: 24 }} />
          </Card>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card variant="elevated" padding="lg" style={styles.section}>
              <View style={styles.practiceHeader}>
                <Ionicons name="create" size={48} color="#5856D6" />
                <Typography variant="title2" style={styles.practiceTitle}>
                  Interactive Exercises
                </Typography>
                <Typography variant="body" style={styles.practiceSubtitle}>
                  Practice your bullet journal skills with hands-on exercises
                </Typography>
              </View>
              
              <PaperButton
                variant="primary"
                size="lg"
                title="Start Practice Session"
                onPress={handlePracticeMode}
                style={styles.practiceButton}
              />
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
          <Typography variant="headline" color="text">BuJo Academy</Typography>
          <View style={{ width: 24 }} />
        </Card>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Learning Path Selection */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Typography variant="title2" color="text" style={styles.sectionTitle}>
              Choose Your Learning Path
            </Typography>
            
            <View style={styles.pathSelector}>
              <TouchableOpacity
                style={[
                  styles.pathOption,
                  selectedPath === 'quickStart' && styles.selectedPath
                ]}
                onPress={() => setSelectedPath('quickStart')}
              >
                <View style={styles.pathIcon}>
                  <Ionicons name="flash" size={24} color="#FF9500" />
                </View>
                <Typography variant="headline" style={styles.pathName}>Quick Start</Typography>
                <Typography variant="body" style={styles.pathTime}>15 minutes</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.pathOption,
                  selectedPath === 'complete' && styles.selectedPath
                ]}
                onPress={() => setSelectedPath('complete')}
              >
                <View style={styles.pathIcon}>
                  <Ionicons name="trophy" size={24} color="#34C759" />
                </View>
                <Typography variant="headline" style={styles.pathName}>Complete Course</Typography>
                <Typography variant="body" style={styles.pathTime}>45 minutes</Typography>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Progress Card (if user has started) */}
          {hasStarted() && (
            <Card variant="elevated" padding="lg" style={styles.section}>
              <View style={styles.progressHeader}>
                <Typography variant="subtitle" color="text">Your Progress</Typography>
                <Typography variant="body" style={styles.progressPercentage}>
                  {getProgressForPath()}% Complete
                </Typography>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { width: `${getProgressForPath()}%` }
                ]} />
              </View>
            </Card>
          )}

          {/* Lesson Overview */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <View style={styles.overviewHeader}>
              <Typography variant="title2" color="text" style={styles.sectionTitle}>
                {selectedPath === 'quickStart' ? 'Essential Lessons' : 'Complete Curriculum'}
              </Typography>
              <Typography variant="body" style={styles.totalTime}>
                Total: {getTotalDuration()}
              </Typography>
            </View>
            
            {renderLessonList()}
          </Card>

          {/* Start Button */}
          <Card variant="flat" padding="lg" style={styles.startSection}>
            <PaperButton
              variant="primary"
              size="lg"
              title={hasStarted() ? "Continue Learning" : "Start Learning Journey"}
              onPress={handleStartLearning}
              style={styles.startButton}
            />
            
            <TouchableOpacity
              style={styles.guideLink}
              onPress={() => navigation.navigate('BuJoGuide')}
            >
              <Typography variant="body" style={styles.guideLinkText}>
                Need reference material? View the complete guide
              </Typography>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </Card>

          <View style={{ height: 40 }} />
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
  content: {
    flex: 1,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  section: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  pathSelector: {
    flexDirection: 'row',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  pathOption: {
    flex: 1,
    alignItems: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  selectedPath: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  pathIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  pathName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  pathTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  totalTime: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  lessonList: {
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  lessonNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.sm,
    marginTop: 2,
  },
  lessonNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  startSection: {
    alignItems: 'center',
  },
  startButton: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  guideLinkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  // Practice Mode Styles
  practiceHeader: {
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  practiceTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  practiceSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    lineHeight: 22,
  },
  practiceButton: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
  },
});