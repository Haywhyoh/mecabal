import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { VERIFICATION_BADGES } from '../constants/nigerianData';
import { ScreenHeader } from '../components/ui';

interface UserBadge {
  badgeId: string;
  earnedDate: string;
  isActive: boolean;
  progress?: number;
  requirement?: string;
}

interface BadgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: 'verification',
    name: 'Verification',
    description: 'Identity and residence verification badges',
    icon: 'shield-check',
    color: '#00A651',
  },
  {
    id: 'community',
    name: 'Community Leadership',
    description: 'Recognition for community involvement',
    icon: 'star-circle',
    color: '#FFC107',
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    description: 'Safety and neighborhood watch participation',
    icon: 'shield-star',
    color: '#0066CC',
  },
  {
    id: 'business',
    name: 'Local Business',
    description: 'Business owner and service provider badges',
    icon: 'store',
    color: '#228B22',
  },
  {
    id: 'professional',
    name: 'Professional Services',
    description: 'Licensed professional recognition',
    icon: 'briefcase',
    color: '#7B68EE',
  },
  {
    id: 'engagement',
    name: 'Community Engagement',
    description: 'Active participation and helpfulness',
    icon: 'hand-heart',
    color: '#FF6B35',
  },
];

interface BadgeSystemScreenProps {
  navigation?: any;
}

export default function BadgeSystemScreen({ navigation }: BadgeSystemScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('verification');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // Mock user badges
  const [userBadges] = useState<UserBadge[]>([
    {
      badgeId: 'estate-resident',
      earnedDate: '2024-08-15',
      isActive: true,
    },
    {
      badgeId: 'long-term-resident',
      earnedDate: '2024-10-01',
      isActive: true,
    },
    {
      badgeId: 'helpful-neighbor',
      earnedDate: '2024-09-20',
      isActive: true,
    },
    {
      badgeId: 'community-leader',
      earnedDate: '',
      isActive: false,
      progress: 75,
      requirement: 'Host 2 more community events',
    },
    {
      badgeId: 'safety-coordinator',
      earnedDate: '',
      isActive: false,
      progress: 30,
      requirement: 'Join neighborhood watch program',
    },
  ]);

  const getEarnedBadges = () => {
    return userBadges.filter(badge => badge.isActive);
  };

  const getAvailableBadges = () => {
    const earnedIds = userBadges.map(b => b.badgeId);
    return VERIFICATION_BADGES.filter(badge => !earnedIds.includes(badge.id));
  };

  const getInProgressBadges = () => {
    return userBadges.filter(badge => !badge.isActive && badge.progress);
  };

  const getBadgesByCategory = (categoryId: string) => {
    const categoryBadges = VERIFICATION_BADGES.filter(badge => {
      switch (categoryId) {
        case 'verification':
          return ['estate-resident', 'long-term-resident'].includes(badge.id);
        case 'community':
          return ['community-leader'].includes(badge.id);
        case 'safety':
          return ['safety-coordinator'].includes(badge.id);
        case 'business':
          return ['local-business'].includes(badge.id);
        case 'professional':
          return ['healthcare-provider', 'educator'].includes(badge.id);
        case 'engagement':
          return ['helpful-neighbor'].includes(badge.id);
        default:
          return false;
      }
    });

    return categoryBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
      return {
        ...badge,
        userBadge,
        isEarned: userBadge?.isActive || false,
        progress: userBadge?.progress || 0,
        requirement: userBadge?.requirement,
      };
    });
  };

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const BadgeCard = ({ badge, size = 'medium' }: { badge: any; size?: 'small' | 'medium' | 'large' }) => {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    return (
      <TouchableOpacity
        style={[
          styles.badgeCard,
          isSmall && styles.badgeCardSmall,
          isMedium && styles.badgeCardMedium,
          isLarge && styles.badgeCardLarge,
          !badge.isEarned && styles.badgeCardDisabled,
        ]}
        onPress={() => handleBadgePress(badge)}
      >
        <View style={[
          styles.badgeIcon,
          isSmall && styles.badgeIconSmall,
          isMedium && styles.badgeIconMedium,
          isLarge && styles.badgeIconLarge,
          !badge.isEarned && styles.badgeIconDisabled,
        ]}>
          <MaterialCommunityIcons
            name={badge.icon}
            size={isSmall ? 16 : isMedium ? 24 : 32}
            color={badge.isEarned ? badge.color : '#C0C0C0'}
          />
        </View>
        
        <Text style={[
          styles.badgeName,
          isSmall && styles.badgeNameSmall,
          !badge.isEarned && styles.badgeNameDisabled,
        ]}>
          {badge.name}
        </Text>
        
        {!isSmall && (
          <Text style={[
            styles.badgeDescription,
            !badge.isEarned && styles.badgeDescriptionDisabled,
          ]}>
            {badge.description}
          </Text>
        )}
        
        {badge.progress > 0 && !badge.isEarned && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${badge.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{badge.progress}% complete</Text>
          </View>
        )}
        
        {badge.isEarned && (
          <View style={styles.earnedBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
            <Text style={styles.earnedText}>Earned</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const BadgeModal = () => {
    if (!selectedBadge) return null;

    return (
      <Modal visible={showBadgeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBadgeModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Badge Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.modalBadgeContainer}>
              <View style={[
                styles.modalBadgeIcon,
                { backgroundColor: selectedBadge.isEarned ? selectedBadge.color + '20' : '#F5F5F5' }
              ]}>
                <MaterialCommunityIcons
                  name={selectedBadge.icon}
                  size={48}
                  color={selectedBadge.isEarned ? selectedBadge.color : '#C0C0C0'}
                />
              </View>
              <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
              <Text style={styles.modalBadgeDescription}>{selectedBadge.description}</Text>
            </View>

            <View style={styles.badgeInfo}>
              <Text style={styles.badgeInfoTitle}>Requirements</Text>
              <Text style={styles.badgeInfoText}>{selectedBadge.requirements}</Text>

              {selectedBadge.isEarned ? (
                <View style={styles.earnedInfo}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#00A651" />
                  <Text style={styles.earnedInfoText}>
                    You earned this badge on {selectedBadge.userBadge?.earnedDate}
                  </Text>
                </View>
              ) : selectedBadge.progress > 0 ? (
                <View style={styles.progressInfo}>
                  <Text style={styles.progressInfoTitle}>Your Progress</Text>
                  <View style={styles.modalProgressBar}>
                    <View style={[styles.modalProgressFill, { width: `${selectedBadge.progress}%` }]} />
                  </View>
                  <Text style={styles.progressInfoText}>
                    {selectedBadge.progress}% complete • {selectedBadge.requirement}
                  </Text>
                </View>
              ) : (
                <View style={styles.notStartedInfo}>
                  <MaterialCommunityIcons name="lock" size={20} color="#8E8E8E" />
                  <Text style={styles.notStartedText}>
                    You haven't started working towards this badge yet
                  </Text>
                </View>
              )}
            </View>

            {!selectedBadge.isEarned && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>
                  {selectedBadge.progress > 0 ? 'Continue Progress' : 'Start Working Towards This Badge'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Community Badges"
        navigation={navigation}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Badge Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getEarnedBadges().length}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getInProgressBadges().length}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{VERIFICATION_BADGES.length}</Text>
              <Text style={styles.statLabel}>Total Available</Text>
            </View>
          </View>
          
          <View style={styles.recentBadges}>
            <Text style={styles.recentTitle}>Recently Earned</Text>
            <View style={styles.recentBadgesList}>
              {getEarnedBadges().slice(0, 3).map(userBadge => {
                const badge = VERIFICATION_BADGES.find(b => b.id === userBadge.badgeId);
                return badge ? (
                  <BadgeCard key={badge.id} badge={{ ...badge, isEarned: true, userBadge }} size="small" />
                ) : null;
              })}
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Badge Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {BADGE_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons
                  name={category.icon as any}
                  size={24}
                  color={selectedCategory === category.id ? '#FFFFFF' : category.color}
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Category Badges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>
            {BADGE_CATEGORIES.find(c => c.id === selectedCategory)?.name} Badges
          </Text>
          <Text style={styles.sectionDescription}>
            {BADGE_CATEGORIES.find(c => c.id === selectedCategory)?.description}
          </Text>
          
          <View style={styles.badgesGrid}>
            {getBadgesByCategory(selectedCategory).map(badge => (
              <BadgeCard key={badge.id} badge={badge} size="medium" />
            ))}
          </View>
        </View>

        {/* In Progress Section */}
        {getInProgressBadges().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <Text style={styles.sectionDescription}>
              Badges you're currently working towards
            </Text>
            
            {getInProgressBadges().map(userBadge => {
              const badge = VERIFICATION_BADGES.find(b => b.id === userBadge.badgeId);
              return badge ? (
                <BadgeCard
                  key={badge.id}
                  badge={{
                    ...badge,
                    isEarned: false,
                    progress: userBadge.progress,
                    requirement: userBadge.requirement,
                    userBadge
                  }}
                  size="large"
                />
              ) : null;
            })}
          </View>
        )}
      </ScrollView>

      <BadgeModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  recentBadges: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  recentBadgesList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E8E',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryCardActive: {
    backgroundColor: '#00A651',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeCardSmall: {
    width: '30%',
    padding: 8,
  },
  badgeCardMedium: {
    width: '48%',
    padding: 12,
  },
  badgeCardLarge: {
    width: '100%',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCardDisabled: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  badgeIconMedium: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  badgeIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 0,
    marginRight: 16,
  },
  badgeIconDisabled: {
    backgroundColor: '#F0F0F0',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameSmall: {
    fontSize: 10,
    marginBottom: 0,
  },
  badgeNameDisabled: {
    color: '#C0C0C0',
  },
  badgeDescription: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeDescriptionDisabled: {
    color: '#C0C0C0',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  earnedText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
    marginLeft: 4,
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
  closeText: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalBadgeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 22,
  },
  badgeInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  badgeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  badgeInfoText: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
    marginBottom: 16,
  },
  earnedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  earnedInfoText: {
    fontSize: 14,
    color: '#00A651',
    marginLeft: 8,
  },
  progressInfo: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
  },
  progressInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 3,
  },
  progressInfoText: {
    fontSize: 12,
    color: '#0066CC',
  },
  notStartedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  notStartedText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});