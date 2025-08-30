import { Theme } from './types';
import { lightColors, darkColors } from './colors';
import { typography, spacing, borderRadius, shadow } from './constants';

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadow,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadow,
  isDark: true,
};