import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode } from './types';
import { lightTheme, darkTheme } from './themes';

// Fallback theme for when main theme is not available - using paper colors
const fallbackTheme: Theme = {
  colors: {
    primary: '#0F2A44',        // Fountain pen blue
    primaryLight: 'rgba(15, 42, 68, 0.1)',
    primaryDark: '#0D1F35',    // Gel pen deep blue
    secondary: '#15803D',      // Forest green ink
    secondaryLight: 'rgba(21, 128, 61, 0.1)',
    secondaryDark: '#14532D',
    background: '#F9F6F0',     // Cream paper
    backgroundSecondary: '#F5F2E8', // Parchment
    backgroundTertiary: '#F2EFE5',  // Aged paper
    surface: '#F9F6F0',        // Cream paper
    surfaceSecondary: '#F5F2E8', // Parchment
    text: '#2B2B2B',           // Warm black ink
    textSecondary: '#6B7280',  // Graphite pencil
    textTertiary: '#9CA3AF',   // Light pencil
    textDisabled: '#D1D5DB',
    border: '#E8E3D5',         // Paper margin
    borderLight: 'rgba(0, 0, 0, 0.06)', // Ruled lines
    success: '#15803D',        // Green ink
    successLight: 'rgba(21, 128, 61, 0.1)',
    warning: '#D97706',        // Orange ink
    warningLight: 'rgba(217, 119, 6, 0.1)',
    error: '#B91C1C',          // Red ink
    errorLight: 'rgba(185, 28, 28, 0.1)',
    info: '#1E40AF',           // Royal blue ink
    infoLight: 'rgba(30, 64, 175, 0.1)',
    bujo: {
      task: '#2B2B2B',         // Black ink
      taskComplete: '#15803D', // Green ink
      taskMigrated: '#D97706',  // Orange ink
      taskScheduled: '#1E40AF', // Royal blue
      taskCancelled: '#9CA3AF', // Light pencil
      event: '#0F2A44',        // Fountain pen blue
      note: '#6B7280',         // Graphite
      inspiration: '#EAB308',   // Golden ink
      research: '#7C3AED',      // Purple ink
      memory: '#BE185D',        // Magenta ink
    },
  },
  typography: {
    textStyles: {
      largeTitle: { fontSize: 34, lineHeight: 41, letterSpacing: 0.374, fontWeight: '400', fontFamily: 'System' },
      title1: { fontSize: 28, lineHeight: 34, letterSpacing: 0.364, fontWeight: '400', fontFamily: 'System' },
      title2: { fontSize: 22, lineHeight: 28, letterSpacing: 0.352, fontWeight: '400', fontFamily: 'System' },
      title3: { fontSize: 20, lineHeight: 25, letterSpacing: 0.38, fontWeight: '400', fontFamily: 'System' },
      headline: { fontSize: 17, lineHeight: 22, letterSpacing: -0.408, fontWeight: '600', fontFamily: 'System' },
      body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.408, fontWeight: '400', fontFamily: 'System' },
      callout: { fontSize: 16, lineHeight: 21, letterSpacing: -0.32, fontWeight: '400', fontFamily: 'System' },
      subheadline: { fontSize: 15, lineHeight: 20, letterSpacing: -0.24, fontWeight: '400', fontFamily: 'System' },
      footnote: { fontSize: 13, lineHeight: 18, letterSpacing: -0.078, fontWeight: '400', fontFamily: 'System' },
      caption1: { fontSize: 12, lineHeight: 16, letterSpacing: 0, fontWeight: '400', fontFamily: 'System' },
      caption2: { fontSize: 11, lineHeight: 13, letterSpacing: 0.066, fontWeight: '400', fontFamily: 'System' },
    },
    fontFamily: { display: 'System', text: 'System', rounded: 'System', mono: 'monospace' },
    dynamicType: { scale: 1.0, minimumScale: 0.82, maximumScale: 2.76 },
  },
  spacing: { xs: 2, sm: 4, md: 8, lg: 12, xl: 16, xl2: 20, xl3: 24, xl4: 32 },
  borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadow: {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  },
  isDark: false,
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@bullet_journal_theme_mode';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme mode from storage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme mode from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeMode();
  }, []);

  // Save theme mode to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.warn('Failed to save theme mode to storage:', error);
      setThemeModeState(mode);
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const currentEffectiveTheme = getEffectiveTheme(themeMode, systemColorScheme);
    const newMode = currentEffectiveTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Get the effective theme based on mode and system preference
  const getEffectiveTheme = (mode: ThemeMode, systemScheme: 'light' | 'dark' | null | undefined): 'light' | 'dark' => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  };

  const effectiveTheme = getEffectiveTheme(themeMode, systemColorScheme);
  let theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  // Use fallback theme if main theme is invalid
  if (!theme?.colors || !theme?.typography || !theme?.spacing || !theme?.shadow) {
    theme = fallbackTheme;
  }

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  // Don't render until theme loading is complete
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};