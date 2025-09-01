import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { 
  Typography, 
  Card,
  PaperButton,
  PAPER_DESIGN_TOKENS,
  safeThemeAccess 
} from '../../../components/ui/paperComponents';

interface LessonNavigationProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  showProgress?: boolean;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  title,
  currentStep,
  totalSteps,
  onBack,
  onPrevious,
  onNext,
  onComplete,
  nextLabel = "Next",
  showProgress = true,
}) => {
  const { theme } = useTheme();

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <>
      {/* Header */}
      <Card variant="flat" padding="md" style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="headline" color="text" style={styles.headerTitle}>
            {title}
          </Typography>
          {showProgress && (
            <Typography variant="caption" style={styles.stepIndicator}>
              Step {currentStep} of {totalSteps}
            </Typography>
          )}
        </View>
        <View style={{ width: 24 }} />
      </Card>

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]} />
          </View>
          <View style={styles.progressSteps}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressStep,
                  {
                    backgroundColor: index < currentStep 
                      ? '#007AFF' 
                      : index === currentStep - 1 
                        ? '#007AFF' 
                        : '#E5E5E7'
                  }
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <Card variant="flat" padding="md" style={styles.navigationCard}>
        <View style={styles.navigationButtons}>
          {onPrevious ? (
            <PaperButton
              variant="outline"
              size="md"
              title="Previous"
              onPress={onPrevious}
              style={styles.navButton}
            />
          ) : (
            <View style={styles.navButton} />
          )}
          
          {onComplete ? (
            <PaperButton
              variant="primary"
              size="md"
              title={nextLabel}
              onPress={onComplete}
              style={styles.navButton}
            />
          ) : onNext ? (
            <PaperButton
              variant="primary"
              size="md"
              title={nextLabel}
              onPress={onNext}
              style={styles.navButton}
            />
          ) : (
            <View style={styles.navButton} />
          )}
        </View>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigationCard: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.lg,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    minWidth: 120,
  },
});