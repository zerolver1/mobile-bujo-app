import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface NotebookCardProps {
  children: React.ReactNode;
  variant?: 'page' | 'sticky' | 'torn';
  showHoles?: boolean;
  style?: ViewStyle;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({
  children,
  variant = 'page',
  showHoles = false,
  style,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    // Safety check for theme
    if (!theme?.colors || !theme?.shadow) {
      return {
        backgroundColor: '#FFFFFF',
        borderRadius: variant === 'torn' ? 0 : 2,
        padding: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E5E5E5',
      };
    }

    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: variant === 'torn' ? 0 : 2,
      padding: 12, // theme.spacing.lg equivalent
    };

    const variantStyles = {
      page: {
        ...theme.shadow.sm,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        // Subtle paper texture shadow
        shadowColor: theme.isDark ? '#000000' : 'rgba(139, 69, 19, 0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1,
        shadowRadius: 2,
      },
      sticky: {
        backgroundColor: theme.isDark 
          ? 'rgba(217, 119, 6, 0.25)'  // Warm orange sticky on dark paper
          : '#FEF3C7',                 // Classic yellow sticky note
        ...theme.shadow.md,
        borderWidth: 0,
        borderRadius: 2,
        // More realistic sticky note rotation
        transform: [{ rotate: '-0.8deg' }],
        // Sticky note shadow
        shadowColor: theme.isDark ? '#000000' : '#D97706',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: theme.isDark ? 0.4 : 0.15,
        shadowRadius: 3,
      },
      torn: {
        ...theme.shadow.sm,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        borderTopWidth: 1.5,
        borderTopColor: theme.colors.borderLight,
        borderStyle: 'dashed' as const,
        // Torn paper has irregular edges
        borderRadius: 1,
        // Slightly rough shadow for torn effect
        shadowColor: theme.isDark ? '#000000' : 'rgba(107, 114, 128, 0.2)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const renderHoles = () => {
    if (!showHoles) return null;

    // Safety check for theme
    const holeColor = theme?.isDark ? '#1A1814' : '#F9F6F0';
    const borderColor = theme?.colors?.border || '#E5E5E5';
    
    return (
      <View style={styles.holesContainer}>
        {[...Array(3)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.hole,
              { 
                backgroundColor: holeColor,
                borderColor: borderColor,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[getCardStyle(), style]}>
      {renderHoles()}
      <View style={showHoles ? styles.contentWithHoles : undefined}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  holesContainer: {
    position: 'absolute',
    left: 12,
    top: 20,
    bottom: 20,
    width: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  hole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  contentWithHoles: {
    marginLeft: 32,
  },
});