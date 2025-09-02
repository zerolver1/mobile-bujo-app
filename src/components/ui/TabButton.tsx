import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, PAPER_DESIGN_TOKENS, safeThemeAccess } from './paperComponents';
import { useTheme } from '../../theme';

export interface TabButtonProps {
  icon: string;
  label?: string;
  isActive?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export const TabButton: React.FC<TabButtonProps> = ({
  icon,
  label,
  isActive = false,
  onPress,
  style,
  size = 'md'
}) => {
  const { theme } = useTheme();
  
  const iconSize = size === 'sm' ? 16 : 18;
  const tabHeight = size === 'sm' ? 36 : 44;
  
  const dynamicStyles = {
    tab: {
      height: tabHeight,
      backgroundColor: isActive 
        ? safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
        : safeThemeAccess(theme, t => t.colors.background, '#F9F6F0'),
      borderColor: safeThemeAccess(theme, t => t.colors.border, '#E8E3D5'),
      // Tab shadow - like paper layering
      shadowColor: isActive 
        ? 'rgba(15, 42, 68, 0.15)' 
        : 'rgba(15, 42, 68, 0.08)',
      elevation: isActive ? 3 : 1,
    },
    icon: {
      color: isActive 
        ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')
        : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')
    }
  };

  return (
    <TouchableOpacity
      style={[styles.tab, dynamicStyles.tab, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        <Ionicons 
          name={icon as any} 
          size={iconSize} 
          color={dynamicStyles.icon.color}
        />
        {label && (
          <Typography 
            variant="caption2" 
            style={[styles.tabLabel, { color: dynamicStyles.icon.color }]}
          >
            {label}
          </Typography>
        )}
      </View>
      
      {/* Paper tab texture overlay */}
      <View style={[styles.tabTexture, { opacity: isActive ? 0.03 : 0.01 }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tab: {
    minWidth: 48,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.sm,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.xs,
    borderWidth: 1,
    borderBottomWidth: 0, // No bottom border for tab effect
    borderTopLeftRadius: PAPER_DESIGN_TOKENS.radius.soft,
    borderTopRightRadius: PAPER_DESIGN_TOKENS.radius.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: PAPER_DESIGN_TOKENS.spacing.xs,
    // Subtle paper shadow
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Tab positioning effect
    position: 'relative',
    top: 1, // Slight overlap with content below
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 10,
  },
  tabTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 1)', // Warm brown texture
    borderTopLeftRadius: PAPER_DESIGN_TOKENS.radius.soft,
    borderTopRightRadius: PAPER_DESIGN_TOKENS.radius.soft,
  },
});