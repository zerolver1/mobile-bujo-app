import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon = 'chevron-forward',
  rightElement,
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  const handlePress = onPress && !disabled ? onPress : undefined;

  const getItemStyle = () => {
    return {
      ...styles.listItem,
      backgroundColor: theme.colors.surface,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTitleStyle = () => ({
    ...theme.typography.textStyles.body,
    color: theme.colors.text,
    marginBottom: subtitle ? 2 : 0,
  });

  const getSubtitleStyle = () => ({
    ...theme.typography.textStyles.subheadline,
    color: theme.colors.textSecondary,
  });

  const getIconColor = () => theme.colors.primary;
  const getChevronColor = () => theme.colors.textTertiary;

  return (
    <TouchableOpacity
      style={[getItemStyle(), style]}
      onPress={handlePress}
      disabled={!handlePress}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={[styles.iconContainer, { 
          backgroundColor: theme.colors.primaryLight,
          marginRight: 12,
        }]}>
          <Ionicons name={leftIcon} size={20} color={getIconColor()} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={getTitleStyle()}>{title}</Text>
        {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}
      </View>

      {rightElement || (handlePress && (
        <Ionicons 
          name={rightIcon} 
          size={18} 
          color={getChevronColor()} 
        />
      ))}
    </TouchableOpacity>
  );
};

export interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ListSection: React.FC<ListSectionProps> = ({
  title,
  children,
  style,
}) => {
  const { theme } = useTheme();

  // Safety check for theme
  if (!theme?.colors || !theme?.shadow) {
    return (
      <View style={[{ marginBottom: 24 }, style]}>
        {title && (
          <Text style={{ 
            fontSize: 13,
            fontWeight: '600',
            color: '#666',
            textTransform: 'uppercase',
            marginBottom: 4,
            marginHorizontal: 12,
          }}>
            {title}
          </Text>
        )}
        <View style={{ 
          backgroundColor: '#fff',
          borderRadius: 12,
          marginHorizontal: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, style]}>
      {title && (
        <Text style={[styles.sectionTitle, {
          ...theme.typography.textStyles.footnote,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 4,
          marginHorizontal: 12,
        }]}>
          {title}
        </Text>
      )}
      <View style={[styles.sectionCard, {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginHorizontal: 12,
        ...theme.shadow.sm,
      }]}>
        {children}
      </View>
    </View>
  );
};

export interface ListSeparatorProps {
  style?: ViewStyle;
}

export const ListSeparator: React.FC<ListSeparatorProps> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.separator, {
      backgroundColor: theme.colors.border,
      marginLeft: 48, // Account for icon + padding
    }, style]} />
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  separator: {
    height: 1,
  },
});