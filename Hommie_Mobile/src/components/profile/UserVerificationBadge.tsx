import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';

export type VerificationLevel = 'unverified' | 'phone' | 'identity' | 'full';
export type VerificationBadgeType = 'Estate Manager' | 'Community Leader' | 'Religious Leader' | 'Tech Professional' | 'Sports Coordinator' | 'Cultural Leader' | 'Business Owner' | 'Parent' | 'Verified Resident';

export interface UserVerification {
  level: VerificationLevel;
  badge?: VerificationBadgeType;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  communityEndorsements: number;
  eventsOrganized: number;
  rating?: number;
}

interface UserVerificationBadgeProps {
  verification: UserVerification;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onPress?: () => void;
  style?: any;
}

const UserVerificationBadge: React.FC<UserVerificationBadgeProps> = ({
  verification,
  size = 'medium',
  showDetails = false,
  onPress,
  style,
}) => {
  const getVerificationIcon = (level: VerificationLevel) => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    
    switch (level) {
      case 'full':
        return <MaterialCommunityIcons name="check-decagram" size={iconSize} color={colors.success} />;
      case 'identity':
        return <MaterialCommunityIcons name="check-circle" size={iconSize} color={colors.primary} />;
      case 'phone':
        return <MaterialCommunityIcons name="check" size={iconSize} color={colors.warning} />;
      default:
        return <MaterialCommunityIcons name="account-outline" size={iconSize} color={colors.neutral.gray} />;
    }
  };

  const getVerificationColor = (level: VerificationLevel) => {
    switch (level) {
      case 'full':
        return colors.success;
      case 'identity':
        return colors.primary;
      case 'phone':
        return colors.warning;
      default:
        return colors.neutral.gray;
    }
  };

  const getVerificationText = (level: VerificationLevel, badge?: VerificationBadgeType) => {
    if (badge) return badge;
    
    switch (level) {
      case 'full':
        return 'Verified Resident';
      case 'identity':
        return 'Identity Verified';
      case 'phone':
        return 'Phone Verified';
      default:
        return 'Unverified';
    }
  };

  const getVerificationDescription = (level: VerificationLevel) => {
    switch (level) {
      case 'full':
        return 'Phone, identity, and address verified';
      case 'identity':
        return 'Phone and identity verified';
      case 'phone':
        return 'Phone number verified';
      default:
        return 'No verification completed';
    }
  };

  const getTrustScore = (verification: UserVerification): number => {
    let score = 0;
    
    if (verification.phoneVerified) score += 20;
    if (verification.identityVerified) score += 30;
    if (verification.addressVerified) score += 30;
    if (verification.communityEndorsements > 0) score += Math.min(verification.communityEndorsements * 2, 10);
    if (verification.eventsOrganized > 0) score += Math.min(verification.eventsOrganized, 10);
    
    return Math.min(score, 100);
  };

  const styles = getStyles(size);
  const trustScore = getTrustScore(verification);
  const verificationColor = getVerificationColor(verification.level);

  if (size === 'small' && !showDetails) {
    return (
      <View style={[styles.smallBadge, style]}>
        {getVerificationIcon(verification.level)}
      </View>
    );
  }

  const BadgeContent = (
    <View style={[styles.container, { borderColor: verificationColor }, style]}>
      <View style={styles.iconContainer}>
        {getVerificationIcon(verification.level)}
        {verification.rating && (
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingText}>{verification.rating}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.badgeText, { color: verificationColor }]}>
          {getVerificationText(verification.level, verification.badge)}
        </Text>
        
        {showDetails && (
          <>
            <Text style={styles.descriptionText}>
              {getVerificationDescription(verification.level)}
            </Text>
            
            <View style={styles.detailsContainer}>
              <View style={styles.trustScoreContainer}>
                <Text style={styles.trustScoreLabel}>Trust Score</Text>
                <View style={styles.trustScoreBar}>
                  <View 
                    style={[
                      styles.trustScoreFill, 
                      { width: `${trustScore}%`, backgroundColor: verificationColor }
                    ]} 
                  />
                </View>
                <Text style={styles.trustScoreText}>{trustScore}%</Text>
              </View>
              
              <View style={styles.statsContainer}>
                {verification.communityEndorsements > 0 && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="heart" size={14} color={colors.danger} />
                    <Text style={styles.statText}>{verification.communityEndorsements} endorsements</Text>
                  </View>
                )}
                
                {verification.eventsOrganized > 0 && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="calendar-check" size={14} color={colors.primary} />
                    <Text style={styles.statText}>{verification.eventsOrganized} events organized</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
};

const getStyles = (size: 'small' | 'medium' | 'large') => {
  const fontSize = size === 'small' ? typography.sizes.xs : 
                  size === 'large' ? typography.sizes.base : typography.sizes.sm;
  
  const padding = size === 'small' ? spacing.xs : 
                 size === 'large' ? spacing.md : spacing.sm;

  return StyleSheet.create({
    smallBadge: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderRadius: 8,
      padding: padding,
    },
    iconContainer: {
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    ratingText: {
      fontSize: typography.sizes.xs,
      color: colors.neutral.gray,
      marginLeft: 2,
      fontWeight: '500',
    },
    textContainer: {
      flex: 1,
    },
    badgeText: {
      fontSize: fontSize,
      fontWeight: '600',
      marginBottom: 2,
    },
    descriptionText: {
      fontSize: typography.sizes.xs,
      color: colors.neutral.gray,
      marginBottom: spacing.sm,
    },
    detailsContainer: {
      marginTop: spacing.xs,
    },
    trustScoreContainer: {
      marginBottom: spacing.sm,
    },
    trustScoreLabel: {
      fontSize: typography.sizes.xs,
      color: colors.neutral.gray,
      marginBottom: 4,
    },
    trustScoreBar: {
      height: 4,
      backgroundColor: colors.neutral.lightGray,
      borderRadius: 2,
      marginBottom: 4,
    },
    trustScoreFill: {
      height: '100%',
      borderRadius: 2,
    },
    trustScoreText: {
      fontSize: typography.sizes.xs,
      color: colors.text.dark,
      fontWeight: '500',
      textAlign: 'right',
    },
    statsContainer: {
      flexDirection: 'column',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    statText: {
      fontSize: typography.sizes.xs,
      color: colors.neutral.gray,
      marginLeft: 4,
    },
  });
};

export default UserVerificationBadge;