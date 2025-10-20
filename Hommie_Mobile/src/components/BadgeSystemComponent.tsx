import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  BADGES, 
  ACHIEVEMENTS, 
  NIGERIAN_COMMUNITY_TITLES,
  Badge,
  Achievement 
} from '../constants/gamificationData';

const { width } = Dimensions.get('window');

interface BadgeSystemProps {
  userId?: string;
  userBadges?: string[];
  userAchievements?: string[];
  compactMode?: boolean;
  showCategories?: boolean;
  maxDisplay?: number;
  onBadgePress?: (badge: Badge) => void;
}

interface BadgeProgress {
  badgeId: string;
  progress: number;
  maxProgress: number;
  isEligible: boolean;
  nextMilestone?: string;
}

export default function BadgeSystemComponent({
  userId = 'default',
  userBadges = ['verified_neighbor', 'helpful_neighbor', 'safety_champion'],
  userAchievements = ['new_neighbor', 'first_post', 'helpful_neighbor', 'safety_first'],
  compactMode = false,
  showCategories = true,
  maxDisplay = 6,
  onBadgePress
}: BadgeSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);

  useEffect(() => {
    initializeBadgeProgress();
  }, [userBadges, userAchievements]);

  const initializeBadgeProgress = () => {
    const progress: BadgeProgress[] = BADGES.map(badge => {
      const hasEarned = userBadges.includes(badge.id);
      let progressValue = 0;
      let maxProgressValue = 100;
      let isEligible = true;
      let nextMilestone = '';

      // Calculate progress based on badge type
      switch (badge.id) {
        case 'verified_neighbor':
          progressValue = hasEarned ? 100 : 75; // Assuming partial verification
          nextMilestone = hasEarned ? 'Complete' : 'Complete address verification';
          break;
        case 'nin_verified':
          progressValue = hasEarned ? 100 : 0;
          nextMilestone = hasEarned ? 'Complete' : 'Upload National ID';
          break;
        case 'top_contributor':
          progressValue = hasEarned ? 100 : 65;
          nextMilestone = hasEarned ? 'Complete' : '35% more activity to reach top 10%';
          break;
        case 'helpful_neighbor':
          progressValue = hasEarned ? 100 : 80;
          nextMilestone = hasEarned ? 'Complete' : 'Maintain 4.5+ rating for 2 more weeks';
          break;
        case 'safety_champion':
          progressValue = hasEarned ? 100 : 60;
          nextMilestone = hasEarned ? 'Complete' : '4 more safety reports needed';
          break;
        case 'business_verified':
          progressValue = hasEarned ? 100 : 0;
          isEligible = false; // Not a business owner
          nextMilestone = 'Register a business first';
          break;
        default:
          progressValue = hasEarned ? 100 : Math.floor(Math.random() * 50);
          nextMilestone = hasEarned ? 'Complete' : 'Continue community engagement';
      }

      return {
        badgeId: badge.id,
        progress: progressValue,
        maxProgress: maxProgressValue,
        isEligible,
        nextMilestone
      };
    });

    setBadgeProgress(progress);
  };

  const getBadgesByCategory = (category: string) => {
    if (category === 'all') return BADGES;
    return BADGES.filter(badge => badge.type === category);
  };

  const getBadgeProgress = (badgeId: string): BadgeProgress => {
    return badgeProgress.find(p => p.badgeId === badgeId) || {
      badgeId,
      progress: 0,
      maxProgress: 100,
      isEligible: true,
      nextMilestone: 'Unknown'
    };
  };

  const getEarnedBadges = (): Badge[] => {
    return BADGES.filter(badge => userBadges.includes(badge.id));
  };

  const getAvailableBadges = (): Badge[] => {
    return BADGES.filter(badge => !userBadges.includes(badge.id));
  };

  const getCommunityTitle = (): string => {
    const earnedBadges = getEarnedBadges();
    
    if (earnedBadges.some(b => b.id === 'estate_committee')) {
      return 'Chief';
    } else if (earnedBadges.some(b => b.id === 'security_coordinator')) {
      return 'Captain';
    } else if (earnedBadges.some(b => b.id === 'top_contributor')) {
      return 'Odogwu';
    } else if (earnedBadges.some(b => b.id === 'helpful_neighbor')) {
      return 'Elder';
    } else if (earnedBadges.length >= 3) {
      return 'Baba/Mama';
    } else {
      return 'Neighbor';
    }
  };

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
    onBadgePress?.(badge);
  };

  const handleClaimBadge = (badge: Badge) => {
    const progress = getBadgeProgress(badge.id);
    
    if (progress.progress >= 100 && !userBadges.includes(badge.id)) {
      Alert.alert(
        'Claim Badge?',
        `You've earned the "${badge.name}" badge! Claim it now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Claim',
            onPress: () => {
              // In real implementation, this would update the backend
              Alert.alert('Badge Claimed!', `You now have the "${badge.name}" badge!`);
              setShowBadgeModal(false);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Badge Requirements',
        `Requirements: ${badge.requirements}\n\nNext milestone: ${progress.nextMilestone}`
      );
    }
  };

  const renderBadgeItem = (badge: Badge, index: number) => {
    const isEarned = userBadges.includes(badge.id);
    const progress = getBadgeProgress(badge.id);
    const canClaim = progress.progress >= 100 && !isEarned;

    return (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeItem,
          isEarned && styles.earnedBadge,
          canClaim && styles.claimableBadge
        ]}
        onPress={() => handleBadgePress(badge)}
      >
        <View style={[
          styles.badgeIcon,
          { 
            backgroundColor: isEarned ? badge.color + '20' : '#F5F5F5',
            width: compactMode ? 32 : 48,
            height: compactMode ? 32 : 48,
            borderRadius: compactMode ? 16 : 24,
            marginBottom: compactMode ? 0 : 8,
            marginRight: compactMode ? 8 : 0,
          },
          canClaim && styles.glowEffect
        ]}>
          <MaterialCommunityIcons 
            name={badge.icon as any} 
            size={compactMode ? 20 : 24} 
            color={isEarned ? badge.color : '#8E8E8E'} 
          />
          {canClaim && (
            <View style={styles.claimIndicator}>
              <MaterialCommunityIcons name="new-box" size={12} color="#FFC107" />
            </View>
          )}
        </View>
        
        {!compactMode && (
          <>
            <Text style={[
              styles.badgeName,
              isEarned && styles.earnedBadgeName
            ]} numberOfLines={1}>
              {badge.name}
            </Text>
            
            {!isEarned && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress.progress}%`, backgroundColor: badge.color }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{progress.progress}%</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = () => {
    if (!selectedBadge) return null;
    
    const isEarned = userBadges.includes(selectedBadge.id);
    const progress = getBadgeProgress(selectedBadge.id);
    const canClaim = progress.progress >= 100 && !isEarned;

    return (
      <Modal
        visible={showBadgeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBadgeModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#8E8E8E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Badge Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.badgeDetailCard}>
              <View style={[
                styles.largeBadgeIcon,
                { backgroundColor: isEarned ? selectedBadge.color + '20' : '#F5F5F5' },
                canClaim && styles.glowEffect
              ]}>
                <MaterialCommunityIcons 
                  name={selectedBadge.icon as any} 
                  size={48} 
                  color={isEarned ? selectedBadge.color : '#8E8E8E'} 
                />
                {canClaim && (
                  <View style={styles.largeBadgeIndicator}>
                    <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  </View>
                )}
              </View>
              
              <Text style={styles.badgeDetailName}>{selectedBadge.name}</Text>
              <Text style={styles.badgeDetailDesc}>{selectedBadge.description}</Text>
              
              <View style={styles.badgeTypeContainer}>
                <Text style={styles.badgeType}>{selectedBadge.type.replace('_', ' ').toUpperCase()}</Text>
                {isEarned && (
                  <View style={styles.earnedIndicator}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
                    <Text style={styles.earnedText}>Earned</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Requirements Section */}
            <View style={styles.requirementsCard}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.requirementText}>{selectedBadge.requirements}</Text>
              
              {!isEarned && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <View style={styles.detailProgressBar}>
                    <View 
                      style={[
                        styles.detailProgressFill, 
                        { width: `${progress.progress}%`, backgroundColor: selectedBadge.color }
                      ]} 
                    />
                  </View>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressPercent}>{progress.progress}% Complete</Text>
                    <Text style={styles.nextMilestone}>{progress.nextMilestone}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Related Achievements */}
            <View style={styles.relatedCard}>
              <Text style={styles.sectionTitle}>Related Achievements</Text>
              <View style={styles.achievementsList}>
                {ACHIEVEMENTS.filter(achievement => 
                  achievement.category.includes(selectedBadge.type) || 
                  selectedBadge.type === 'contribution'
                ).slice(0, 3).map(achievement => (
                  <View key={achievement.id} style={styles.achievementItem}>
                    <MaterialCommunityIcons 
                      name={achievement.icon as any} 
                      size={20} 
                      color={userAchievements.includes(achievement.id) ? achievement.color : '#8E8E8E'} 
                    />
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementName}>{achievement.name}</Text>
                      <Text style={styles.achievementPoints}>+{achievement.points} points</Text>
                    </View>
                    {userAchievements.includes(achievement.id) && (
                      <MaterialCommunityIcons name="check" size={16} color="#00A651" />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isEarned && styles.earnedButton,
                canClaim && styles.claimButton,
                !progress.isEligible && styles.disabledButton
              ]}
              onPress={() => handleClaimBadge(selectedBadge)}
              disabled={!progress.isEligible}
            >
              <Text style={[
                styles.actionButtonText,
                isEarned && styles.earnedButtonText,
                canClaim && styles.claimButtonText,
                !progress.isEligible && styles.disabledButtonText
              ]}>
                {isEarned ? 'Earned' : canClaim ? 'Claim Badge' : progress.isEligible ? 'View Progress' : 'Not Available'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Compact mode for smaller displays
  if (compactMode) {
    const earnedBadges = getEarnedBadges();
    const displayBadges = earnedBadges.slice(0, maxDisplay);
    
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>
            {getCommunityTitle()} • {earnedBadges.length} badges
          </Text>
        </View>
        <View style={styles.compactBadges}>
          {displayBadges.map((badge, index) => renderBadgeItem(badge, index))}
          {earnedBadges.length > maxDisplay && (
            <View style={styles.moreBadges}>
              <Text style={styles.moreBadgesText}>+{earnedBadges.length - maxDisplay}</Text>
            </View>
          )}
        </View>
        {renderBadgeModal()}
      </View>
    );
  }

  // Full widget mode
  const earnedBadges = getEarnedBadges();
  const availableBadges = getAvailableBadges();
  const claimableBadges = availableBadges.filter(badge => {
    const progress = getBadgeProgress(badge.id);
    return progress.progress >= 100;
  });

  const categories = [
    { id: 'all', name: 'All', icon: 'view-grid' },
    { id: 'verified', name: 'Verified', icon: 'check-decagram' },
    { id: 'contribution', name: 'Contribution', icon: 'trending-up' },
    { id: 'leadership', name: 'Leadership', icon: 'account-tie' },
    { id: 'safety', name: 'Safety', icon: 'shield-star' },
    { id: 'social', name: 'Social', icon: 'account-group' },
    { id: 'business', name: 'Business', icon: 'store' }
  ];

  const displayBadges = getBadgesByCategory(selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Badge Collection</Text>
          <Text style={styles.subtitle}>
            {getCommunityTitle()} • {earnedBadges.length}/{BADGES.length} earned
          </Text>
        </View>
        
        {claimableBadges.length > 0 && (
          <View style={styles.claimableIndicator}>
            <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
            <Text style={styles.claimableText}>{claimableBadges.length}</Text>
          </View>
        )}
      </View>

      {/* Categories */}
      {showCategories && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialCommunityIcons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? '#FFFFFF' : '#8E8E8E'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Badges Grid */}
      <View style={styles.badgesGrid}>
        {displayBadges.map((badge, index) => renderBadgeItem(badge, index))}
      </View>

      {renderBadgeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  compactHeader: {
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  compactBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moreBadges: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  moreBadgesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  claimableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimableText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFC107',
    marginLeft: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#00A651',
  },
  categoryText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
  },
  earnedBadge: {
    backgroundColor: '#F9FFF9',
  },
  claimableBadge: {
    backgroundColor: '#FFF9E6',
  },
  badgeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    shadowColor: '#FFC107',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  claimIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFC107',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 4,
  },
  earnedBadgeName: {
    color: '#2C2C2C',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 1.5,
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 9,
    color: '#8E8E8E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
  },
  badgeDetailCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  largeBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  largeBadgeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFC107',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDetailDesc: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badgeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E8E',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  earnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A651',
    marginLeft: 4,
  },
  requirementsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  detailProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  detailProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  nextMilestone: {
    fontSize: 12,
    color: '#8E8E8E',
    flex: 1,
    textAlign: 'right',
  },
  relatedCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  achievementPoints: {
    fontSize: 12,
    color: '#00A651',
  },
  actionButton: {
    backgroundColor: '#00A651',
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  earnedButton: {
    backgroundColor: '#E8F5E8',
  },
  claimButton: {
    backgroundColor: '#FFC107',
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  earnedButtonText: {
    color: '#00A651',
  },
  claimButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#8E8E8E',
  },
});