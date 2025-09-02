// App Configuration
export const APP_CONFIG = {
  name: 'MeCabal',
  version: '1.0.0',
  description: 'NextDoor for Nigeria - Connect with your neighborhood',
  supportEmail: 'support@MeCabal.ng',
  website: 'https://MeCabal.ng',
};

// Colors - Following Nigerian Style Guide  
export const colors = {
  // Primary Colors
  primary: '#00A651', // Nigeria's green, main brand color
  deepGreen: '#007A3D', // For pressed states, emphasis
  lightGreen: '#E8F5E8', // Backgrounds, subtle highlights
  mintGreen: '#B8E6B8', // Success states, positive feedback
  
  // Core Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Neutral Colors
  neutral: {
    offWhite: '#FAFAFA',
    lightGray: '#F5F5F5',
    gray: '#8E8E8E',
    darkGray: '#2C2C2C',
  },
  
  // Text Colors
  text: {
    dark: '#2C2C2C',
    light: '#8E8E8E',
    inverse: '#FFFFFF',
  },
  
  // Accent Colors
  accent: {
    lagosOrange: '#FF6B35', // Energy, community alerts, celebrations
    trustBlue: '#0066CC', // Links, reliability, helpful information
    safetyRed: '#E74C3C', // Urgent alerts, safety notifications
    warmGold: '#FFC107', // Achievements, highlights, joy
    neighborPurple: '#7B68EE', // Community connections, social features
    marketGreen: '#228B22', // Local business, marketplace
    eveningBlue: '#4682B4', // Events, gatherings, nighttime activities
    sunrisePink: '#FF69B4', // Celebrations, positive news, community joy
  },
  
  // Legacy Accent Colors (for backward compatibility)
  orange: '#FF6B35', // Notifications, warnings, calls-to-action
  blue: '#0066CC', // Links, information, trust indicators
  red: '#E74C3C', // Errors, urgent notifications
  yellow: '#FFC107', // Alerts, pending states
  
  // Semantic Colors
  secondary: '#5856D6',
  success: '#00A651',
  warning: '#FFC107',
  danger: '#E74C3C',
  info: '#0066CC',
  
  // Legacy support
  error: '#E74C3C',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#2C2C2C',
  textSecondary: '#8E8E8E',
  textTertiary: '#8E8E8E',
  textInverse: '#FFFFFF',
  border: '#F5F5F5',
  borderLight: '#F0F0F0',
  online: '#00A651',
  offline: '#8E8E8E',
  busy: '#FF6B35',
};

// Keep COLORS export for backward compatibility
export const COLORS = colors;

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  lineHeights: {
    tight: 20,
    normal: 24,
    relaxed: 32,
  },
};

// Keep TYPOGRAPHY export for backward compatibility
export const TYPOGRAPHY = {
  fontSizes: typography.sizes,
  fontWeights: typography.weights,
  lineHeights: typography.lineHeights,
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Keep SPACING export for backward compatibility
export const SPACING = spacing;

// Border Radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Keep SHADOWS export for backward compatibility
export const SHADOWS = shadows;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.MeCabal.ng',
  timeout: 30000,
  retryAttempts: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  userToken: 'user_token',
  userProfile: 'user_profile',
  userPreferences: 'user_preferences',
  neighborhoodData: 'neighborhood_data',
  offlineData: 'offline_data',
};

// Validation Rules
export const VALIDATION = {
  phoneNumber: {
    minLength: 10,
    maxLength: 11,
    pattern: /^[0-9]+$/,
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  otp: {
    length: 6,
    pattern: /^[0-9]+$/,
  },
};

// App Features
export const FEATURES = {
  phoneAuth: true,
  locationServices: true,
  pushNotifications: true,
  offlineMode: true,
  mediaUpload: true,
  chat: true,
  payments: false, // Will be enabled in Phase 3
  safetyAlerts: false, // Will be enabled in Phase 3
};

// Nigerian States (for location selection)
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'Federal Capital Territory', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

// Post Categories
export const POST_CATEGORIES = [
  'General',
  'Events',
  'Lost & Found',
  'Safety Alerts',
  'Buy & Sell',
  'Recommendations',
  'News',
  'Community',
  'Services',
  'Jobs',
  'Housing',
  'Transportation',
];

// Marketplace Categories (Nigerian Context)
export const MARKETPLACE_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏪' },
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'services', name: 'Services', icon: '🔧' },
  { id: 'furniture', name: 'Furniture', icon: '🪑' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'food', name: 'Food & Drinks', icon: '🍽️' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'jobs', name: 'Jobs', icon: '💼' },
];

// Nigerian-Specific Service Categories
export const NIGERIAN_SERVICE_CATEGORIES = [
  'Plumbing', 'Electrical Work', 'Cleaning Services', 'Security Services',
  'Generator Repair', 'AC Repair', 'Catering', 'Event Planning',
  'Tailoring', 'Hair Styling', 'Makeup Artist', 'Photography',
  'Tutoring', 'Car Wash', 'Laundry', 'Gardening', 'Painting',
  'Carpentry', 'Phone Repair', 'Computer Repair'
];

// Import Nigerian context utilities
export * from './nigerianContext';

// Event Categories
export const EVENT_CATEGORIES = [
  'Community Meeting',
  'Social Gathering',
  'Workshop',
  'Sports',
  'Religious',
  'Educational',
  'Charity',
  'Business',
  'Entertainment',
  'Other',
];
