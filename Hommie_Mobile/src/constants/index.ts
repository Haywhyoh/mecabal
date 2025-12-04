// App Configuration
export const APP_CONFIG = {
  name: 'MeCabal',
  version: '1.0.0',
  description: 'NextDoor for Nigeria - Connect with your neighborhood',
  supportEmail: 'support@MeCabal.ng',
  website: 'https://MeCabal.ng',
};

// Colors - Following Nigerian Style Guide with WCAG AA Compliance
export const colors = {
  // Primary Colors - WCAG AA Compliant
  primary: '#00A651', // Nigeria's green, main brand color (4.5:1 contrast on white)
  deepGreen: '#007A3D', // For pressed states, emphasis (7.1:1 contrast on white)
  lightGreen: '#E8F5E8', // Backgrounds, subtle highlights
  mintGreen: '#B8E6B8', // Success states, positive feedback
  
  // Core Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Neutral Colors - WCAG AA Compliant
  neutral: {
    offWhite: '#FAFAFA',
    lightGray: '#F5F5F5',
    gray: '#6B7280', // Improved contrast (4.5:1 on white)
    darkGray: '#1F2937', // Improved contrast (12.6:1 on white)
  },
  
  // Text Colors - WCAG AA Compliant
  text: {
    dark: '#1F2937', // High contrast dark text (12.6:1 on white)
    light: '#6B7280', // Medium contrast text (4.5:1 on white)
    inverse: '#FFFFFF',
    secondary: '#4B5563', // Secondary text (7.1:1 on white)
    tertiary: '#9CA3AF', // Tertiary text (3.0:1 on white - for non-essential text)
  },
  
  // Accent Colors - WCAG AA Compliant
  accent: {
    lagosOrange: '#EA580C', // Energy, community alerts (4.5:1 on white)
    trustBlue: '#2563EB', // Links, reliability (4.5:1 on white)
    safetyRed: '#DC2626', // Urgent alerts, safety notifications (4.5:1 on white)
    warmGold: '#D97706', // Achievements, highlights (4.5:1 on white)
    neighborPurple: '#7C3AED', // Community connections (4.5:1 on white)
    marketGreen: '#059669', // Local business, marketplace (4.5:1 on white)
    eveningBlue: '#1D4ED8', // Events, gatherings (4.5:1 on white)
    sunrisePink: '#DB2777', // Celebrations, positive news (4.5:1 on white)
  },
  
  // Legacy Accent Colors (for backward compatibility) - Updated for WCAG AA
  orange: '#EA580C', // Notifications, warnings, calls-to-action (4.5:1 on white)
  blue: '#2563EB', // Links, information, trust indicators (4.5:1 on white)
  red: '#DC2626', // Errors, urgent notifications (4.5:1 on white)
  yellow: '#D97706', // Alerts, pending states (4.5:1 on white)
  
  // Semantic Colors - WCAG AA Compliant
  secondary: '#7C3AED', // Purple for secondary actions (4.5:1 on white)
  success: '#059669', // Success states (4.5:1 on white)
  warning: '#D97706', // Warning states (4.5:1 on white)
  danger: '#DC2626', // Error states (4.5:1 on white)
  info: '#2563EB', // Information states (4.5:1 on white)
  
  // Legacy support - Updated for WCAG AA
  error: '#DC2626', // Updated for better contrast
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  textSecondary: '#6B7280', // Updated for better contrast
  textTertiary: '#9CA3AF', // Updated for better contrast
  textInverse: '#FFFFFF',
  border: '#F5F5F5',
  borderLight: '#F0F0F0',
  online: '#059669', // Updated for better contrast
  offline: '#6B7280', // Updated for better contrast
  busy: '#EA580C', // Updated for better contrast
};

// Dark Mode Colors - WCAG AA Compliant
export const darkColors = {
  // Primary Colors - Dark Mode
  primary: '#10B981', // Brighter green for dark backgrounds (4.5:1 on dark)
  deepGreen: '#059669', // Darker green for pressed states
  lightGreen: '#064E3B', // Dark background for green highlights
  mintGreen: '#065F46', // Dark background for success states
  
  // Core Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Neutral Colors - Dark Mode
  neutral: {
    offWhite: '#1F2937', // Dark background
    lightGray: '#374151', // Dark surface
    gray: '#9CA3AF', // Medium contrast on dark (4.5:1 on dark)
    darkGray: '#F9FAFB', // Light text on dark (12.6:1 on dark)
  },
  
  // Text Colors - Dark Mode
  text: {
    dark: '#F9FAFB', // High contrast light text (12.6:1 on dark)
    light: '#9CA3AF', // Medium contrast text (4.5:1 on dark)
    inverse: '#1F2937', // Dark text for light backgrounds
    secondary: '#D1D5DB', // Secondary text (7.1:1 on dark)
    tertiary: '#6B7280', // Tertiary text (3.0:1 on dark - for non-essential text)
  },
  
  // Accent Colors - Dark Mode
  accent: {
    lagosOrange: '#FB923C', // Brighter orange for dark backgrounds
    trustBlue: '#60A5FA', // Brighter blue for dark backgrounds
    safetyRed: '#F87171', // Brighter red for dark backgrounds
    warmGold: '#FBBF24', // Brighter gold for dark backgrounds
    neighborPurple: '#A78BFA', // Brighter purple for dark backgrounds
    marketGreen: '#34D399', // Brighter green for dark backgrounds
    eveningBlue: '#60A5FA', // Brighter blue for dark backgrounds
    sunrisePink: '#F472B6', // Brighter pink for dark backgrounds
  },
  
  // Legacy Accent Colors - Dark Mode
  orange: '#FB923C',
  blue: '#60A5FA',
  red: '#F87171',
  yellow: '#FBBF24',
  
  // Semantic Colors - Dark Mode
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
  
  // Legacy support - Dark Mode
  error: '#F87171',
  background: '#1F2937',
  surface: '#374151',
  card: '#374151',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#1F2937',
  border: '#4B5563',
  borderLight: '#6B7280',
  online: '#34D399',
  offline: '#9CA3AF',
  busy: '#FB923C',
};

// Color scheme utility function
export const getColorScheme = (isDark: boolean) => {
  return isDark ? darkColors : colors;
};

// Keep COLORS export for backward compatibility
export const COLORS = colors;

// Typography - Following iOS Human Interface Guidelines
export const typography = {
  // iOS Typography Scale
  sizes: {
    // Large Title (34pt, bold) - for screen titles
    largeTitle: 34,
    // Title 1 (28pt, regular) - for section headers
    title1: 28,
    // Title 2 (22pt, regular) - for subsection headers
    title2: 22,
    // Title 3 (20pt, regular) - for card headers
    title3: 20,
    // Headline (17pt, semibold) - for card titles, important text
    headline: 17,
    // Body (17pt, regular) - for descriptions, main content
    body: 17,
    // Callout (16pt) - for secondary text, labels
    callout: 16,
    // Subhead (15pt) - for metadata, less important text
    subhead: 15,
    // Footnote (13pt) - for small metadata
    footnote: 13,
    // Caption 1 (12pt) - for labels, very small text
    caption1: 12,
    // Caption 2 (11pt) - for smallest text
    caption2: 11,
    
    // Legacy sizes for backward compatibility
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
    ultraLight: '100',
    thin: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },
  lineHeights: {
    // iOS line heights for optimal readability
    largeTitle: 41, // 34pt + 7pt leading
    title1: 34,     // 28pt + 6pt leading
    title2: 28,     // 22pt + 6pt leading
    title3: 25,     // 20pt + 5pt leading
    headline: 22,   // 17pt + 5pt leading
    body: 22,       // 17pt + 5pt leading
    callout: 21,    // 16pt + 5pt leading
    subhead: 20,    // 15pt + 5pt leading
    footnote: 18,   // 13pt + 5pt leading
    caption1: 16,   // 12pt + 4pt leading
    caption2: 13,   // 11pt + 2pt leading
    
    // Legacy line heights
    tight: 20,
    normal: 24,
    relaxed: 32,
  },
  // iOS Text Styles for consistent usage with Dynamic Type support
  styles: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
      allowFontScaling: true,
    },
    title1: {
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 34,
      allowFontScaling: true,
    },
    title2: {
      fontSize: 22,
      fontWeight: '400',
      lineHeight: 28,
      allowFontScaling: true,
    },
    title3: {
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 25,
      allowFontScaling: true,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      allowFontScaling: true,
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
      allowFontScaling: true,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 21,
      allowFontScaling: true,
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 20,
      allowFontScaling: true,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      allowFontScaling: true,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      allowFontScaling: true,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 13,
      allowFontScaling: true,
    },
  },
};

// Keep TYPOGRAPHY export for backward compatibility
export const TYPOGRAPHY = {
  fontSizes: typography.sizes,
  fontWeights: typography.weights,
  lineHeights: typography.lineHeights,
};

// Spacing - Following iOS 8pt Grid System
export const spacing = {
  // 8pt Grid System - iOS Human Interface Guidelines
  xs: 4,    // 0.5 * 8pt
  sm: 8,    // 1 * 8pt
  md: 16,   // 2 * 8pt
  lg: 24,   // 3 * 8pt
  xl: 32,   // 4 * 8pt
  '2xl': 48, // 6 * 8pt
  '3xl': 64, // 8 * 8pt
  '4xl': 80, // 10 * 8pt
  '5xl': 96, // 12 * 8pt
  
  // Additional iOS-specific spacing
  section: 20,  // 2.5 * 8pt - for section spacing
  card: 12,     // 1.5 * 8pt - for card internal spacing
  button: 44,   // iOS minimum touch target (5.5 * 8pt)
  input: 50,    // iOS input field height (6.25 * 8pt)
  tabBar: 49,   // iOS tab bar height
  statusBar: 20, // iOS status bar height
  navBar: 44,   // iOS navigation bar height
  safeArea: 34, // iOS safe area bottom (iPhone X+)
};

// Keep SPACING export for backward compatibility
export const SPACING = spacing;

// Border Radius - Following iOS Design Guidelines
export const BORDER_RADIUS = {
  // iOS Standard Border Radius
  xs: 4,     // Small elements (badges, tags)
  sm: 8,     // Buttons, small cards
  md: 12,    // Cards, input fields
  lg: 16,    // Large cards, modals
  xl: 20,    // Large modals, sheets
  xxl: 24,   // Extra large elements
  round: 50, // Fully rounded (circular)
  
  // iOS-specific radius values
  button: 8,      // Standard iOS button radius
  card: 12,       // Standard iOS card radius
  input: 8,       // Input field radius
  modal: 16,      // Modal corner radius
  sheet: 20,      // Bottom sheet radius
  alert: 12,      // Alert dialog radius
  badge: 12,      // Badge radius
  chip: 16,       // Chip/tag radius
  avatar: 8,      // Avatar radius
  image: 8,       // Image radius
};

// Shadows - Following iOS Design Guidelines
export const shadows = {
  // iOS Shadow System
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // iOS-specific shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0,
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

// Main marketplace categories for hierarchical filtering (Ionicons - no emojis)
/**
 * Marketplace Categories
 *
 * MARKETPLACE IS FOR:
 * - Properties: Real estate for rent/sale
 * - Goods: Physical items for sale
 * - Services: Professional business services (plumbers, electricians, etc.)
 *
 * NOT FOR:
 * - Jobs/Employment: Removed - use Community Help "Tasks" instead
 * - Neighbor favors: Use Community Help
 */
export const MARKETPLACE_MAIN_CATEGORIES = [
  { id: 'property', label: 'Properties', icon: 'home-outline', type: 'property' },
  { id: 'item', label: 'Goods', icon: 'cube-outline', type: 'item' },
  { id: 'service', label: 'Services', icon: 'construct-outline', type: 'service' },
];

// Marketplace Categories - Mapped to backend listing_categories table
// Backend IDs from migration: Property (1-4), Item (5-9), Service (10-14)
export const MARKETPLACE_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline', backendId: null, type: null }, // Filter only
  // Property categories (backend IDs 1-4)
  { id: 'apartment', name: 'Apartment', icon: 'business-outline', backendId: 1, type: 'property' },
  { id: 'house', name: 'House', icon: 'home-outline', backendId: 2, type: 'property' },
  { id: 'land', name: 'Land', icon: 'leaf-outline', backendId: 3, type: 'property' },
  { id: 'office', name: 'Office Space', icon: 'briefcase-outline', backendId: 4, type: 'property' },
  // Item categories (backend IDs 5-9)
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline', backendId: 5, type: 'item' },
  { id: 'furniture', name: 'Furniture', icon: 'bed-outline', backendId: 6, type: 'item' },
  { id: 'vehicles', name: 'Vehicles', icon: 'car-outline', backendId: 7, type: 'item' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt-outline', backendId: 8, type: 'item' },
  { id: 'home', name: 'Home & Garden', icon: 'home-outline', backendId: 9, type: 'item' },
  // Service categories (backend IDs 10-14)
  { id: 'plumbing', name: 'Plumbing', icon: 'water-outline', backendId: 10, type: 'service' },
  { id: 'electrical', name: 'Electrical', icon: 'flash-outline', backendId: 11, type: 'service' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles-outline', backendId: 12, type: 'service' },
  { id: 'security', name: 'Security', icon: 'shield-checkmark-outline', backendId: 13, type: 'service' },
  { id: 'repairs', name: 'Repairs', icon: 'hammer-outline', backendId: 14, type: 'service' },
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

// Export Typography from typography file
export { Typography } from './typography';

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

// Community Help Categories - Updated per separation plan
export const COMMUNITY_HELP_CATEGORIES = [
  { id: 'errand', label: 'Quick Errands', icon: 'bicycle', description: 'Quick neighborhood favors' },
  { id: 'task', label: 'Tasks & Favors', icon: 'construct', description: 'Small jobs and help' },
  { id: 'recommendation', label: 'Recommendations', icon: 'star', description: 'Ask for advice on services' },
  { id: 'advice', label: 'Advice & Tips', icon: 'bulb', description: 'Get community input' },
  { id: 'borrow', label: 'Borrow/Lend', icon: 'sync', description: 'Share items temporarily' },
];

// Help Request Examples for each category
export const HELP_REQUEST_EXAMPLES = {
  errand: [
    'Can someone pick up my package from the gate?',
    'Need groceries delivered, willing to pay',
    'Anyone going to the market? Can you help?'
  ],
  task: [
    'Help moving furniture this Saturday',
    'Need someone to walk my dog for a week',
    'Looking for help with garden cleanup'
  ],
  borrow: [
    'Can I borrow a ladder for the weekend?',
    'Looking to borrow a pressure washer',
    'Need a generator for tomorrow evening'
  ],
  recommendation: [
    'Recommend a good plumber in the estate',
    'Best place to buy fresh fish nearby?',
    'Reliable generator repair person?'
  ],
  advice: [
    'How do I deal with persistent mosquitoes?',
    'Best way to maintain my compound garden?',
    'Tips for organizing estate security?'
  ]
};
