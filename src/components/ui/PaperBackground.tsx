import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line, Circle, Filter, FeTurbulence, FeColorMatrix } from 'react-native-svg';
import { useTheme } from '../../theme';

export interface PaperBackgroundProps {
  children: React.ReactNode;
  variant?: 'lined' | 'grid' | 'dotted' | 'blank' | 'subtle';
  showMargin?: boolean;
  intensity?: 'minimal' | 'light' | 'normal';
  style?: ViewStyle;
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  children,
  variant = 'subtle',
  showMargin = false,
  intensity = 'light',
  style,
}) => {
  const { theme } = useTheme();

  const getOpacity = () => {
    const intensities = {
      minimal: 0.03,   // Slightly more visible for paper feel
      light: 0.08,     // More prominent paper lines
      normal: 0.15,    // Clear but not overwhelming
    };
    return intensities[intensity];
  };

  const getPaperColors = () => {
    // Use ink-like colors for paper patterns
    return {
      lineColor: theme.isDark 
        ? `rgba(157, 156, 161, ${getOpacity()})` // Warm light gray for dark paper
        : `rgba(75, 85, 99, ${getOpacity()})`,   // Graphite pencil color for light paper
      marginColor: theme.isDark 
        ? 'rgba(96, 165, 250, 0.12)'  // Soft blue for margin on dark paper
        : 'rgba(30, 64, 175, 0.1)',   // Fountain pen blue for margin
      dotColor: theme.isDark 
        ? `rgba(156, 163, 175, ${getOpacity()})` // Light dots on dark paper
        : `rgba(107, 114, 128, ${getOpacity()})`, // Graphite dots on light paper
      rulingColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.06)' // Very subtle ruling on dark paper
        : 'rgba(0, 0, 0, 0.04)',      // Very subtle ruling on light paper
    };
  };

  const renderPattern = () => {
    const { lineColor, marginColor, dotColor, rulingColor } = getPaperColors();

    switch (variant) {
      case 'subtle':
        return (
          <Svg 
            height="100%" 
            width="100%" 
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              {/* Paper grain texture */}
              <Filter id="paperGrain" x="0%" y="0%" width="100%" height="100%">
                <FeTurbulence
                  baseFrequency="0.7"
                  numOctaves="2"
                  result="grain"
                />
                <FeColorMatrix
                  in="grain"
                  type="saturate"
                  values="0"
                />
              </Filter>
              
              {/* Subtle paper fibers */}
              <Pattern
                id="paperFibers"
                x="0"
                y="0"
                width="200"
                height="200"
                patternUnits="userSpaceOnUse"
              >
                <Rect width="200" height="200" fill="transparent" />
                {/* Random fiber-like lines */}
                <Line x1="20" y1="30" x2="45" y2="35" stroke={rulingColor} strokeWidth="0.2" />
                <Line x1="80" y1="60" x2="95" y2="58" stroke={rulingColor} strokeWidth="0.1" />
                <Line x1="140" y1="20" x2="165" y2="25" stroke={rulingColor} strokeWidth="0.2" />
                <Line x1="30" y1="120" x2="50" y2="118" stroke={rulingColor} strokeWidth="0.1" />
                <Line x1="110" y1="150" x2="130" y2="155" stroke={rulingColor} strokeWidth="0.2" />
                <Line x1="170" y1="90" x2="185" y2="92" stroke={rulingColor} strokeWidth="0.1" />
              </Pattern>
            </Defs>
            
            {/* Base paper texture */}
            <Rect 
              width="100%" 
              height="100%" 
              fill={theme.colors.background}
              filter="url(#paperGrain)"
              opacity={getOpacity() * 0.3}
            />
            
            {/* Paper fibers overlay */}
            <Rect 
              width="100%" 
              height="100%" 
              fill="url(#paperFibers)"
              opacity={getOpacity() * 0.5}
            />
          </Svg>
        );

      case 'lined':
        return (
          <Svg 
            height="100%" 
            width="100%" 
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <Pattern
                id="lines"
                x="0"
                y="0"
                width="100%"
                height="28" // Slightly closer lines like real notebook paper
                patternUnits="userSpaceOnUse"
              >
                {/* Main ruling line with slight imperfection */}
                <Line
                  x1="0"
                  y1="28"
                  x2="100%"
                  y2="27.8" // Slight slant for realism
                  stroke={lineColor}
                  strokeWidth="0.4"
                />
                {/* Very faint baseline guide */}
                <Line
                  x1="0"
                  y1="14"
                  x2="100%"
                  y2="13.9"
                  stroke={rulingColor}
                  strokeWidth="0.2"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            
            {/* Base paper texture */}
            <Rect 
              width="100%" 
              height="100%" 
              fill={theme.colors.background}
              opacity="0.05"
            />
            
            {/* Ruling lines */}
            <Rect width="100%" height="100%" fill="url(#lines)" />
            
            {/* Left margin line */}
            {showMargin && (
              <>
                {/* Main margin line */}
                <Line
                  x1="72"
                  y1="0"
                  x2="72"
                  y2="100%"
                  stroke={marginColor}
                  strokeWidth="0.8"
                />
                {/* Hole punches if it's a spiral notebook */}
                <Circle cx="20" cy="60" r="3" fill={rulingColor} opacity="0.3" />
                <Circle cx="20" cy="140" r="3" fill={rulingColor} opacity="0.3" />
                <Circle cx="20" cy="220" r="3" fill={rulingColor} opacity="0.3" />
              </>
            )}
          </Svg>
        );

      case 'grid':
        return (
          <Svg 
            height="100%" 
            width="100%" 
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <Pattern
                id="grid"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <Line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="24"
                  stroke={lineColor}
                  strokeWidth="0.3"
                />
                <Line
                  x1="0"
                  y1="0"
                  x2="24"
                  y2="0"
                  stroke={lineColor}
                  strokeWidth="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        );

      case 'dotted':
        return (
          <Svg 
            height="100%" 
            width="100%" 
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <Pattern
                id="dots"
                x="0"
                y="0"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <Circle
                  cx="16"
                  cy="16"
                  r="0.8"
                  fill={dotColor}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dots)" />
          </Svg>
        );

      case 'blank':
        return null;

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
      {renderPattern()}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});