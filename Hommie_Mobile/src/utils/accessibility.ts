import { AccessibilityInfo, Platform } from 'react-native';

// Accessibility utilities following iOS Human Interface Guidelines

export interface AccessibilityConfig {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
  };

  private constructor() {
    this.initializeAccessibility();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private async initializeAccessibility() {
    try {
      this.config.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.config.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      this.config.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      this.config.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
      this.config.isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
      this.config.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();

      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChanged);
      AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChanged);
      AccessibilityInfo.addEventListener('reduceTransparencyChanged', this.handleReduceTransparencyChanged);
      AccessibilityInfo.addEventListener('boldTextChanged', this.handleBoldTextChanged);
      AccessibilityInfo.addEventListener('grayscaleChanged', this.handleGrayscaleChanged);
      AccessibilityInfo.addEventListener('invertColorsChanged', this.handleInvertColorsChanged);
    } catch (error) {
      console.warn('Failed to initialize accessibility:', error);
    }
  }

  private handleScreenReaderChanged = (isEnabled: boolean) => {
    this.config.isScreenReaderEnabled = isEnabled;
  };

  private handleReduceMotionChanged = (isEnabled: boolean) => {
    this.config.isReduceMotionEnabled = isEnabled;
  };

  private handleReduceTransparencyChanged = (isEnabled: boolean) => {
    this.config.isReduceTransparencyEnabled = isEnabled;
  };

  private handleBoldTextChanged = (isEnabled: boolean) => {
    this.config.isBoldTextEnabled = isEnabled;
  };

  private handleGrayscaleChanged = (isEnabled: boolean) => {
    this.config.isGrayscaleEnabled = isEnabled;
  };

  private handleInvertColorsChanged = (isEnabled: boolean) => {
    this.config.isInvertColorsEnabled = isEnabled;
  };

  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  public isScreenReaderEnabled(): boolean {
    return this.config.isScreenReaderEnabled;
  }

  public isReduceMotionEnabled(): boolean {
    return this.config.isReduceMotionEnabled;
  }

  public isReduceTransparencyEnabled(): boolean {
    return this.config.isReduceTransparencyEnabled;
  }

  public isBoldTextEnabled(): boolean {
    return this.config.isBoldTextEnabled;
  }

  public isGrayscaleEnabled(): boolean {
    return this.config.isGrayscaleEnabled;
  }

  public isInvertColorsEnabled(): boolean {
    return this.config.isInvertColorsEnabled;
  }
}

// Accessibility helper functions
export const getAccessibilityProps = (
  label: string,
  hint?: string,
  role?: string,
  state?: any
) => {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityState: state,
  };
};

export const getButtonAccessibilityProps = (
  label: string,
  hint?: string,
  disabled?: boolean,
  selected?: boolean
) => {
  return getAccessibilityProps(
    label,
    hint,
    'button',
    { disabled, selected }
  );
};

export const getImageAccessibilityProps = (
  label: string,
  hint?: string
) => {
  return getAccessibilityProps(label, hint, 'image');
};

export const getTextAccessibilityProps = (
  label: string,
  hint?: string
) => {
  return getAccessibilityProps(label, hint, 'text');
};

export const getHeaderAccessibilityProps = (
  label: string,
  level: number = 1
) => {
  return {
    ...getAccessibilityProps(label, undefined, 'header'),
    accessibilityLevel: level,
  };
};

export const getLinkAccessibilityProps = (
  label: string,
  hint?: string
) => {
  return getAccessibilityProps(label, hint, 'link');
};

export const getSearchAccessibilityProps = (
  label: string,
  hint?: string
) => {
  return getAccessibilityProps(label, hint, 'search');
};

export const getTabAccessibilityProps = (
  label: string,
  hint?: string,
  selected?: boolean
) => {
  return getAccessibilityProps(
    label,
    hint,
    'tab',
    { selected }
  );
};

export const getSwitchAccessibilityProps = (
  label: string,
  hint?: string,
  checked?: boolean
) => {
  return getAccessibilityProps(
    label,
    hint,
    'switch',
    { checked }
  );
};

export const getSliderAccessibilityProps = (
  label: string,
  hint?: string,
  min?: number,
  max?: number,
  value?: number
) => {
  return {
    ...getAccessibilityProps(label, hint, 'adjustable'),
    accessibilityValue: {
      min,
      max,
      now: value,
    },
  };
};

// Dynamic Type support for iOS
export const getDynamicTypeStyle = (baseStyle: any, isBoldTextEnabled?: boolean) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  const boldTextEnabled = isBoldTextEnabled ?? accessibilityManager.isBoldTextEnabled();

  if (boldTextEnabled) {
    return {
      ...baseStyle,
      fontWeight: 'bold',
    };
  }

  return baseStyle;
};

// Reduce Motion support
export const getAnimationConfig = (defaultConfig: any) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  
  if (accessibilityManager.isReduceMotionEnabled()) {
    return {
      ...defaultConfig,
      duration: 0,
      useNativeDriver: true,
    };
  }

  return defaultConfig;
};

// High contrast support
export const getHighContrastColors = (normalColors: any, isHighContrast?: boolean) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  const highContrast = isHighContrast ?? accessibilityManager.isInvertColorsEnabled();

  if (highContrast) {
    return {
      ...normalColors,
      primary: '#000000',
      secondary: '#FFFFFF',
      text: '#000000',
      background: '#FFFFFF',
    };
  }

  return normalColors;
};

// Screen reader announcements
export const announceForAccessibility = (message: string) => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

// Focus management
export const setAccessibilityFocus = (ref: any) => {
  if (ref && ref.current) {
    ref.current.focus();
  }
};

export default AccessibilityManager;
