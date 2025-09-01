export const quickStartLessons = [
  { id: 'core-signifiers', title: 'Core Signifiers', duration: '5 min', icon: 'radio-button-off' },
  { id: 'entry-types', title: 'Entry Types', duration: '5 min', icon: 'list' },
  { id: 'migration', title: 'Migration & States', duration: '5 min', icon: 'arrow-forward' },
];

export const completeLessons = [
  ...quickStartLessons,
  { id: 'collections', title: 'Collections & Organization', duration: '8 min', icon: 'folder' },
  { id: 'modern-extensions', title: 'Modern Extensions', duration: '7 min', icon: 'star' },
  { id: 'swipe-actions', title: 'Digital Workflows', duration: '10 min', icon: 'swap-horizontal' },
  { id: 'advanced-practice', title: 'Advanced Practice', duration: '10 min', icon: 'create' },
  { id: 'mastery-assessment', title: 'Mastery Check', duration: '5 min', icon: 'checkmark-circle' },
];

export const getLessonList = (mode: 'quickStart' | 'complete') => {
  return mode === 'quickStart' ? quickStartLessons : completeLessons;
};

export const getNextLessonId = (currentLessonId: string, mode: 'quickStart' | 'complete'): string | null => {
  const lessons = getLessonList(mode);
  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId);
  
  if (currentIndex === -1 || currentIndex === lessons.length - 1) {
    return null; // Last lesson or lesson not found
  }
  
  return lessons[currentIndex + 1].id;
};

export const getPreviousLessonId = (currentLessonId: string, mode: 'quickStart' | 'complete'): string | null => {
  const lessons = getLessonList(mode);
  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId);
  
  if (currentIndex === -1 || currentIndex === 0) {
    return null; // First lesson or lesson not found
  }
  
  return lessons[currentIndex - 1].id;
};

export const isLastLesson = (lessonId: string, mode: 'quickStart' | 'complete'): boolean => {
  const lessons = getLessonList(mode);
  return lessons[lessons.length - 1].id === lessonId;
};