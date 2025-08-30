import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { scaledTextStyle, getDynamicTypeScale, isAccessibilitySize, DynamicTypeSize } from '../../theme/dynamicType';

export type AppleTextStyle = 
  | 'largeTitle'
  | 'title1'
  | 'title2' 
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2';

export interface AppleTextProps {
  children: React.ReactNode;
  style?: AppleTextStyle;
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'custom';
  customColor?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'natural';
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  maxFontSizeMultiplier?: number;
  allowFontScaling?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  dynamicTypeSize?: DynamicTypeSize;
  textStyle?: TextStyle;
}

export const AppleText: React.FC<AppleTextProps> = ({
  children,
  style = 'body',
  color = 'primary',
  customColor,
  weight,
  align = 'natural',
  numberOfLines,
  adjustsFontSizeToFit = false,
  minimumFontScale = 0.5,
  maxFontSizeMultiplier = 3.0,
  allowFontScaling = true,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
  dynamicTypeSize,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getTextStyle = () => {
    // Get base text style from theme
    const baseStyle = theme.typography.textStyles[style];
    
    // Safety check - if theme is not loaded, return a fallback
    if (!baseStyle || !theme.colors) {
      return {
        fontSize: 17,
        lineHeight: 22,
        color: '#000000',
      };
    }
    
    // Apply Dynamic Type scaling
    const scaledStyle = scaledTextStyle(
      baseStyle, 
      maxFontSizeMultiplier,
      dynamicTypeSize
    );

    // Color variants using Apple's semantic colors
    const colorStyles = {
      primary: { color: theme.colors.text },
      secondary: { color: theme.colors.textSecondary },
      tertiary: { color: theme.colors.textTertiary },
      quaternary: { color: theme.colors.textDisabled },
      custom: { color: customColor || theme.colors.text },
    };

    // Weight overrides (if specified)
    const weightStyles = weight ? {
      fontWeight: {
        regular: '400',
        medium: '500', 
        semibold: '600',
        bold: '700',
      }[weight] as TextStyle['fontWeight'],
    } : {};

    // Text alignment
    const alignStyle = align !== 'natural' ? {
      textAlign: align as TextStyle['textAlign'],
    } : {};

    return {
      ...scaledStyle,
      ...colorStyles[color],
      ...weightStyles,
      ...alignStyle,
    };
  };

  const getFinalStyle = () => {
    const computedStyle = getTextStyle();
    
    // Merge with custom text style
    return [computedStyle, textStyle];
  };

  const getAccessibilityProps = () => {
    if (!accessible) return {};

    return {
      accessible: true,
      accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
      accessibilityHint,
      accessibilityRole,
      // Add Dynamic Type traits
      accessibilityTraits: isAccessibilitySize() ? ['adjustable'] : undefined,
    };
  };

  return (
    <Text
      style={getFinalStyle()}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      allowFontScaling={allowFontScaling}
      {...getAccessibilityProps()}
    >
      {children}
    </Text>
  );
};

// Convenience components for common text styles
export const LargeTitle: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="largeTitle" {...props} />
);

export const Title1: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="title1" {...props} />
);

export const Title2: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="title2" {...props} />
);

export const Title3: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="title3" {...props} />
);

export const Headline: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="headline" {...props} />
);

export const Body: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="body" {...props} />
);

export const Callout: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="callout" {...props} />
);

export const Subheadline: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="subheadline" {...props} />
);

export const Footnote: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="footnote" {...props} />
);

export const Caption1: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="caption1" {...props} />
);

export const Caption2: React.FC<Omit<AppleTextProps, 'style'>> = (props) => (
  <AppleText style="caption2" {...props} />
);