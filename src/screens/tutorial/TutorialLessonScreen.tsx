import React from 'react';
import { CoreSignifiersScreen } from './lessons/L01_CoreSignifiersScreen';
import { EntryTypesScreen } from './lessons/L02_EntryTypesScreen';
import { MigrationScreen } from './lessons/L03_MigrationScreen';

interface TutorialLessonScreenProps {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      mode: 'quickStart' | 'complete';
      fromGuide?: boolean;
    };
  };
}

export const TutorialLessonScreen: React.FC<TutorialLessonScreenProps> = (props) => {
  const { lessonId } = props.route.params;

  switch (lessonId) {
    case 'core-signifiers':
      return <CoreSignifiersScreen {...props} />;
    
    case 'entry-types':
      return <EntryTypesScreen {...props} />;
    
    case 'migration':
      return <MigrationScreen {...props} />;
    
    // Advanced lessons (to be implemented)
    case 'collections':
    case 'modern-extensions':
    case 'swipe-actions':
    case 'advanced-practice':
    case 'mastery-assessment':
      // For now, return a placeholder that navigates back
      return <CoreSignifiersScreen {...props} />;
    
    default:
      // Fallback to first lesson
      return <CoreSignifiersScreen {...props} />;
  }
};