import { StyleSheet } from 'react-native';

// Shared connection component styles
export const connectionStyles = StyleSheet.create({
  // Container styles
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  
  compactContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  // Avatar styles
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  compactAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Text styles
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },

  secondaryText: {
    fontSize: 14,
    color: '#8E8E8E',
  },

  captionText: {
    fontSize: 12,
    color: '#8E8E8E',
  },

  smallText: {
    fontSize: 10,
    color: '#8E8E8E',
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  smallBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Button styles
  primaryButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  ghostButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Button text styles
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginLeft: 4,
  },

  // Status indicators
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  onlineStatus: {
    backgroundColor: '#00A651',
  },

  offlineStatus: {
    backgroundColor: '#8E8E8E',
  },

  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  loadingText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 6,
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },

  emptyStateText: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
  },

  // Notification badge styles
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },

  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Interest tags
  interestTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },

  interestText: {
    fontSize: 9,
    color: '#00A651',
    fontWeight: '600',
  },

  // Divider styles
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },

  // Connection strength colors
  strengthVeryStrong: {
    color: '#00A651',
  },

  strengthStrong: {
    color: '#0066CC',
  },

  strengthModerate: {
    color: '#FF6B35',
  },

  strengthWeak: {
    color: '#8E8E8E',
  },

  // Trust level colors
  trustElder: {
    color: '#FFD700',
  },

  trustPillar: {
    color: '#0066CC',
  },

  trustTrusted: {
    color: '#00A651',
  },

  trustKnown: {
    color: '#FF6B35',
  },

  trustNew: {
    color: '#8E8E8E',
  },
});

// Color constants for consistent theming
export const connectionColors = {
  primary: '#00A651',
  secondary: '#0066CC',
  accent: '#FF6B35',
  success: '#00A651',
  warning: '#FFC107',
  error: '#E74C3C',
  info: '#0066CC',
  
  // Text colors
  textPrimary: '#2C2C2C',
  textSecondary: '#8E8E8E',
  textLight: '#FFFFFF',
  
  // Background colors
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#FAFAFA',
  
  // Connection type colors
  connectionConnect: '#0066CC',
  connectionFollow: '#7B68EE',
  connectionTrusted: '#00A651',
  connectionColleague: '#FF6B35',
  connectionNeighbor: '#228B22',
  connectionFamily: '#E74C3C',
  
  // Trust level colors
  trustElder: '#FFD700',
  trustPillar: '#0066CC',
  trustTrusted: '#00A651',
  trustKnown: '#FF6B35',
  trustNew: '#8E8E8E',
  
  // Connection strength colors
  strengthVeryStrong: '#00A651',
  strengthStrong: '#0066CC',
  strengthModerate: '#FF6B35',
  strengthWeak: '#8E8E8E',
};

// Size constants for consistent spacing
export const connectionSizes = {
  // Avatar sizes
  avatarLarge: 56,
  avatarMedium: 40,
  avatarSmall: 32,
  avatarTiny: 24,
  
  // Icon sizes
  iconLarge: 24,
  iconMedium: 20,
  iconSmall: 16,
  iconTiny: 12,
  
  // Badge sizes
  badgeLarge: { padding: 8, borderRadius: 10 },
  badgeMedium: { padding: 6, borderRadius: 8 },
  badgeSmall: { padding: 4, borderRadius: 6 },
  
  // Button heights
  buttonLarge: 48,
  buttonMedium: 40,
  buttonSmall: 32,
  
  // Spacing
  spacingXLarge: 32,
  spacingLarge: 24,
  spacingMedium: 16,
  spacingSmall: 12,
  spacingXSmall: 8,
  spacingTiny: 4,
};

// Animation constants
export const connectionAnimations = {
  timing: {
    short: 200,
    medium: 300,
    long: 500,
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Helper functions for dynamic styling
export const getConnectionColor = (connectionType: string): string => {
  const colorMap: { [key: string]: string } = {
    connect: connectionColors.connectionConnect,
    follow: connectionColors.connectionFollow,
    trusted: connectionColors.connectionTrusted,
    colleague: connectionColors.connectionColleague,
    neighbor: connectionColors.connectionNeighbor,
    family: connectionColors.connectionFamily,
  };
  
  return colorMap[connectionType] || connectionColors.connectionConnect;
};

export const getTrustColor = (trustScore: number): string => {
  if (trustScore >= 90) return connectionColors.trustElder;
  if (trustScore >= 75) return connectionColors.trustPillar;
  if (trustScore >= 50) return connectionColors.trustTrusted;
  if (trustScore >= 25) return connectionColors.trustKnown;
  return connectionColors.trustNew;
};

export const getStrengthColor = (strength: number): string => {
  if (strength >= 90) return connectionColors.strengthVeryStrong;
  if (strength >= 75) return connectionColors.strengthStrong;
  if (strength >= 60) return connectionColors.strengthModerate;
  return connectionColors.strengthWeak;
};

export const getAvatarSize = (size: 'tiny' | 'small' | 'medium' | 'large') => {
  const sizeMap = {
    tiny: connectionSizes.avatarTiny,
    small: connectionSizes.avatarSmall,
    medium: connectionSizes.avatarMedium,
    large: connectionSizes.avatarLarge,
  };
  
  return sizeMap[size];
};

export const getIconSize = (size: 'tiny' | 'small' | 'medium' | 'large') => {
  const sizeMap = {
    tiny: connectionSizes.iconTiny,
    small: connectionSizes.iconSmall,
    medium: connectionSizes.iconMedium,
    large: connectionSizes.iconLarge,
  };
  
  return sizeMap[size];
};