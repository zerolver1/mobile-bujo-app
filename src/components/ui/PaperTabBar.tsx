import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Typography } from './Typography';
import { PAPER_DESIGN_TOKENS } from '../../theme/paperDesignTokens';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

/**
 * Paper-themed bottom tab bar component
 * Simulates a notebook's bottom edge with tabs as bookmarks
 */
export const PaperTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Ink-style icons for each tab
  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconSize = 24;
    const color = focused 
      ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44') // Fountain pen blue
      : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280'); // Graphite

    let iconName: keyof typeof Ionicons.glyphMap;
    
    switch (routeName) {
      case 'DailyLog':
        // Book/journal icon for daily entries
        iconName = focused ? 'book' : 'book-outline';
        break;
      case 'Capture':
        // Quill/pen icon for capturing
        iconName = focused ? 'create' : 'create-outline';
        break;
      case 'Collections':
        // Filing/archive icon for collections
        iconName = focused ? 'albums' : 'albums-outline';
        break;
      case 'Settings':
        // Gear with paper feel
        iconName = focused ? 'construct' : 'construct-outline';
        break;
      default:
        iconName = 'ellipse-outline';
    }

    return <Ionicons name={iconName} size={iconSize} color={color} />;
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingBottom: insets.bottom,
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
        }
      ]}
    >
      {/* Paper texture line at top - like a torn edge */}
      <View 
        style={[
          styles.topBorder,
          { 
            backgroundColor: safeThemeAccess(theme, t => t.colors.border, '#E8E3D5'),
          }
        ]} 
      />
      
      {/* Subtle ruled line */}
      <View 
        style={[
          styles.ruledLine,
          { 
            backgroundColor: safeThemeAccess(theme, t => t.colors.borderLight, 'rgba(0, 0, 0, 0.06)'),
          }
        ]} 
      />

      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {/* Tab indicator - like a bookmark ribbon */}
              {isFocused && (
                <View 
                  style={[
                    styles.activeIndicator,
                    { 
                      backgroundColor: safeThemeAccess(theme, t => t.colors.primary, '#0F2A44'),
                    }
                  ]} 
                />
              )}
              
              {/* Icon with ink-like appearance */}
              <View style={styles.iconContainer}>
                {getTabIcon(route.name, isFocused)}
              </View>
              
              {/* Label with handwritten feel */}
              <Typography
                variant="caption2"
                style={[
                  styles.label,
                  {
                    color: isFocused 
                      ? safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')
                      : safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280'),
                    fontWeight: isFocused ? '600' : '400',
                  }
                ]}
              >
                {label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: 'rgba(139, 69, 19, 0.1)', // Warm paper shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topBorder: {
    height: 0.5,
    opacity: 0.3,
  },
  ruledLine: {
    height: 0.5,
    marginTop: 0.5,
    opacity: 0.2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingTop: PAPER_DESIGN_TOKENS.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? PAPER_DESIGN_TOKENS.spacing.xs : PAPER_DESIGN_TOKENS.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: PAPER_DESIGN_TOKENS.radius.full,
    opacity: 0.8,
  },
  iconContainer: {
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.3, // Slightly spaced like handwriting
  },
});