import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LessonProgress {
  started: boolean;
  completed: boolean;
  completedAt?: Date;
  score?: number;
  timeSpent?: number;
}

export interface TutorialProgress {
  [lessonId: string]: LessonProgress;
}

const TUTORIAL_PROGRESS_KEY = '@tutorial_progress';

export const useTutorialProgress = () => {
  const [progress, setProgress] = useState<TutorialProgress>({});
  const [loading, setLoading] = useState(true);

  // Load progress from storage
  const loadProgress = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(lessonId => {
          if (parsed[lessonId].completedAt) {
            parsed[lessonId].completedAt = new Date(parsed[lessonId].completedAt);
          }
        });
        setProgress(parsed);
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save progress to storage
  const saveProgress = useCallback(async (newProgress: TutorialProgress) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving tutorial progress:', error);
    }
  }, []);

  // Mark lesson as started
  const startLesson = useCallback(async (lessonId: string) => {
    const newProgress = {
      ...progress,
      [lessonId]: {
        ...progress[lessonId],
        started: true,
      }
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Mark lesson as completed
  const completeLesson = useCallback(async (
    lessonId: string, 
    score?: number, 
    timeSpent?: number
  ) => {
    const newProgress = {
      ...progress,
      [lessonId]: {
        ...progress[lessonId],
        started: true,
        completed: true,
        completedAt: new Date(),
        score,
        timeSpent,
      }
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_PROGRESS_KEY);
      setProgress({});
    } catch (error) {
      console.error('Error resetting tutorial progress:', error);
    }
  }, []);

  // Get overall progress percentage
  const getOverallProgress = useCallback((lessonIds: string[]) => {
    const completedCount = lessonIds.filter(id => progress[id]?.completed).length;
    return Math.round((completedCount / lessonIds.length) * 100);
  }, [progress]);

  // Check if any lesson has been started
  const hasStarted = useCallback(() => {
    return Object.values(progress).some(p => p.started);
  }, [progress]);

  // Get next lesson to complete
  const getNextLesson = useCallback((lessonIds: string[]) => {
    return lessonIds.find(id => !progress[id]?.completed);
  }, [progress]);

  // Get completion stats
  const getStats = useCallback(() => {
    const values = Object.values(progress);
    const completed = values.filter(p => p.completed);
    const averageScore = completed.length > 0 
      ? completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length 
      : 0;
    const totalTimeSpent = values.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    
    return {
      totalLessons: values.length,
      completedLessons: completed.length,
      averageScore,
      totalTimeSpent,
    };
  }, [progress]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    startLesson,
    completeLesson,
    resetProgress,
    getOverallProgress,
    hasStarted,
    getNextLesson,
    getStats,
  };
};