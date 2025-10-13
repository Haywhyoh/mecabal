import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { colors, darkColors, getColorScheme } from '../constants';

export interface Theme {
  colors: typeof colors;
  isDark: boolean;
  statusBarStyle: 'light-content' | 'dark-content';
  keyboardAppearance: 'default' | 'light' | 'dark';
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark' | 'system';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (initialTheme === 'system') {
      return Appearance.getColorScheme() === 'dark';
    }
    return initialTheme === 'dark';
  });

  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
      if (initialTheme === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [initialTheme]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const theme: Theme = {
    colors: isDark ? darkColors : colors,
    isDark,
    statusBarStyle: isDark ? 'light-content' : 'dark-content',
    keyboardAppearance: isDark ? 'dark' : 'light',
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting current theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook for checking if dark mode is enabled
export const useIsDarkMode = () => {
  const { theme } = useTheme();
  return theme.isDark;
};

// Hook for getting status bar style
export const useStatusBarStyle = () => {
  const { theme } = useTheme();
  return theme.statusBarStyle;
};

// Hook for getting keyboard appearance
export const useKeyboardAppearance = () => {
  const { theme } = useTheme();
  return theme.keyboardAppearance;
};

export default ThemeContext;
