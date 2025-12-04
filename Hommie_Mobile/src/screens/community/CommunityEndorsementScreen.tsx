import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { default as UserVerificationBadge, UserVerification } from '../../components/profile/UserVerificationBadge';
import { colors, spacing, typography, shadows } from '../../constants';

interface Endorsement {
  id: string;
  fromUser: {
    id: string;
    name: string;
    avatar?: string;
    verification: UserVerification;
  };
  toUser: {
    id: string;
    name: string;
  };
  category: EndorsementCategory;
  message: string;
  date: string;
  eventContext?: {
    eventId: string;
    eventTitle: string;
  };
  isPublic: boolean;
  helpfulVotes: number;
}

type EndorsementCategory = 
  | 'helpful_neighbor' 
  | 'reliable_organizer' 
  | 'trustworthy_trader' 
  | 'community_leader' 
  | 'safety_conscious'
  | 'culturally_respectful'
  | 'great_communicator';

interface CommunityEndorsementScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
    };
  };
  navigation: any;
}

const endorsementCategories = [
  {
    id: 'helpful_neighbor' as EndorsementCategory,
    title: 'Helpful Neighbor',
    description: 'Always willing to lend a hand',
    icon: 'hand-heart',
    color: colors.success,
  },
  {
    id: 'reliable_organizer' as EndorsementCategory,
    title: 'Reliable Organizer',
    description: 'Organizes great community events',
    icon: 'calendar-star',
    color: colors.primary,
  },
  {
    id: 'trustworthy_trader' as EndorsementCategory,
    title: 'Trustworthy Trader',
    description: 'Fair and honest in transactions',
    icon: 'handshake',
    color: colors.warning,
  },
  {
    id: 'community_leader' as EndorsementCategory,
    title: 'Community Leader',
    description: 'Guides and inspires the community',
    icon: 'account-star',
    color: colors.blue,
  },
  {
    id: 'safety_conscious' as EndorsementCategory,
    title: 'Safety Conscious',
    description: 'Promotes community safety',
    icon: 'shield-check',
    color: colors.danger,
  },
  {
    id: 'culturally_respectful' as EndorsementCategory,
    title: 'Culturally Respectful',
    description: 'Respects all cultural backgrounds',
    icon: 'account-group',
    color: colors.orange,
  },
  {
    id: 'great_communicator' as EndorsementCategory,
    title: 'Great Communicator',
    description: 'Clear and respectful communication',
    icon: 'message-star',
    color: colors.info,
  },
];

const demoEndorsements: Endorsement[] = [
  {
    id: '1',
    fromUser: {
      id: '2',
      name: 'Fatima Ibrahim',
      avatar: 'https://via.placeholder.com/100/7B68EE/FFFFFF?text=FI',
      verification: {
        level: 'full',
        badge: 'Community Leader',
        phoneVerified: true,
        identityVerified: true,
        addressVerified: true,
        communityEndorsements: 15,
        eventsOrganized: 8,
        rating: 4.7,
      },
    },
    toUser: { id: '1', name: 'Adebayo Williams' },
    category: 'reliable_organizer',
    message: 'Adebayo consistently organizes well-planned estate meetings that address real community issues. He listens to everyone and finds practical solutions.',
    date: '2024-02-10T14:30:00Z',
    eventContext: {
      eventId: '1',
      eventTitle: 'Victoria Island Estate Monthly Meeting',
    },
    isPublic: true,
    helpfulVotes: 12,
  },
  {
    id: '2',
    fromUser: {
      id: '3',
      name: 'Emmanuel Johnson',
      avatar: 'https://via.placeholder.com/100/228B22/FFFFFF?text=EJ',
      verification: {
        level: 'identity',
        badge: 'Sports Coordinator',
        phoneVerified: true,
        identityVerified: true,
        addressVerified: false,
        communityEndorsements: 8,
        eventsOrganized: 12,
        rating: 4.9,
      },
    },
    toUser: { id: '1', name: 'Adebayo Williams' },
    category: 'community_leader',
    message: 'A natural leader who brings people together. During the security incident last month, he coordinated with everyone to ensure our safety.',
    date: '2024-01-28T16:45:00Z',
    isPublic: true,
    helpfulVotes: 8,
  },
  {
    id: '3',
    fromUser: {
      id: '4',
      name: 'Chioma Okafor',
      verification: {
        level: 'phone',
        phoneVerified: true,
        identityVerified: false,
        addressVerified: false,
        communityEndorsements: 3,
        eventsOrganized: 1,
      },
    },
    toUser: { id: '1', name: 'Adebayo Williams' },
    category: 'culturally_respectful',
    message: 'Always respectful of different traditions and makes sure everyone feels included in community activities.',
    date: '2024-01-15T10:20:00Z',
    isPublic: true,
    helpfulVotes: 5,
  },
];

const CommunityEndorsementScreen: React.FC<CommunityEndorsementScreenProps> = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const [endorsements, setEndorsements] = useState<Endorsement[]>(demoEndorsements);
  const [showEndorseModal, setShowEndorseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EndorsementCategory | null>(null);
  const [endorsementMessage, setEndorsementMessage] = useState('');
  const [isPublicEndorsement, setIsPublicEndorsement] = useState(true);
  
  const [currentUser] = useState({
    id: 'current_user',
    name: 'Current User',
    verification: {
      level: 'full' as const,
      phoneVerified: true,
      identityVerified: true,
      addressVerified: true,
      communityEndorsements: 5,
      eventsOrganized: 3,
      rating: 4.5,
    },
  });

  const endorsementsByCategory = endorsementCategories.reduce((acc, category) => {
    acc[category.id] = endorsements.filter(e => e.category === category.id);
    return acc;
  }, {} as Record<EndorsementCategory, Endorsement[]>);

  const totalEndorsements = endorsements.length;
  const averageHelpfulVotes = endorsements.length > 0 ? 
    endorsements.reduce((sum, e) => sum + e.helpfulVotes, 0) / endorsements.length : 0;

  const handleEndorse = () => {
    if (!selectedCategory || !endorsementMessage.trim()) {
      Alert.alert('Incomplete Endorsement', 'Please select a category and write a message.');
      return;
    }

    const newEndorsement: Endorsement = {
      id: Date.now().toString(),
      fromUser: currentUser,
      toUser: { id: userId, name: userName },
      category: selectedCategory,
      message: endorsementMessage.trim(),
      date: new Date().toISOString(),
      isPublic: isPublicEndorsement,
      helpfulVotes: 0,
    };

    setEndorsements([newEndorsement, ...endorsements]);
    setShowEndorseModal(false);
    setSelectedCategory(null);
    setEndorsementMessage('');
    
    Alert.alert(
      'Endorsement Sent!',
      `Your endorsement for ${userName} has been submitted and will help build community trust.`,
      [{ text: 'OK' }]
    );
  };

  const handleVoteHelpful = (endorsementId: string) => {
    setEndorsements(prev => 
      prev.map(e => 
        e.id === endorsementId 
          ? { ...e, helpfulVotes: e.helpfulVotes + 1 }
          : e
      )
    );
  };

  const renderEndorsementSummary = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Community Trust</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalEndorsements}</Text>
            <Text style={styles.statLabel}>Endorsements</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(averageHelpfulVotes)}</Text>
            <Text style={styles.statLabel}>Avg. Helpful</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.categoryBreakdown}>
        {endorsementCategories.map(category => {
          const count = endorsementsByCategory[category.id].length;
          return count > 0 ? (
            <View key={category.id} style={styles.categoryItem}>
              <MaterialCommunityIcons 
                name={category.icon as any} 
                size={20} 
                color={category.color} 
              />
              <Text style={styles.categoryCount}>{count}</Text>
              <Text style={styles.categoryName}>{category.title}</Text>
            </View>
          ) : null;
        })}
      </View>
    </View>
  );

  const renderEndorsement = (endorsement: Endorsement) => (
    <View key={endorsement.id} style={styles.endorsementCard}>
      <View style={styles.endorsementHeader}>
        <View style={styles.endorserInfo}>
          {endorsement.fromUser.avatar ? (
            <Image source={{ uri: endorsement.fromUser.avatar }} style={styles.endorserAvatar} />
          ) : (
            <View style={styles.endorserAvatarPlaceholder}>
              <Text style={styles.endorserInitials}>
                {endorsement.fromUser.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          
          <View style={styles.endorserDetails}>
            <Text style={styles.endorserName}>{endorsement.fromUser.name}</Text>
            <UserVerificationBadge 
              verification={endorsement.fromUser.verification}
              size="small"
            />
            <Text style={styles.endorsementDate}>
              {new Date(endorsement.date).toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        
        <View style={styles.categoryBadge}>
          <MaterialCommunityIcons 
            name={endorsementCategories.find(c => c.id === endorsement.category)?.icon as any}
            size={16} 
            color={colors.white} 
          />
          <Text style={styles.categoryBadgeText}>
            {endorsementCategories.find(c => c.id === endorsement.category)?.title}
          </Text>
        </View>
      </View>
      
      <Text style={styles.endorsementMessage}>{endorsement.message}</Text>
      
      {endorsement.eventContext && (
        <View style={styles.eventContext}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
          <Text style={styles.eventContextText}>From: {endorsement.eventContext.eventTitle}</Text>
        </View>
      )}
      
      <View style={styles.endorsementFooter}>
        <TouchableOpacity 
          style={styles.helpfulButton}
          onPress={() => handleVoteHelpful(endorsement.id)}
        >
          <MaterialCommunityIcons name="thumb-up-outline" size={16} color={colors.primary} />
          <Text style={styles.helpfulText}>
            Helpful ({endorsement.helpfulVotes})
          </Text>
        </TouchableOpacity>
        
        {endorsement.isPublic && (
          <View style={styles.publicBadge}>
            <MaterialCommunityIcons name="earth" size={12} color={colors.success} />
            <Text style={styles.publicText}>Public</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEndorseModal = () => (
    <Modal
      visible={showEndorseModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEndorseModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEndorseModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Endorse {userName}</Text>
          <TouchableOpacity 
            onPress={handleEndorse}
            disabled={!selectedCategory || !endorsementMessage.trim()}
          >
            <Text style={[
              styles.modalSend,
              (!selectedCategory || !endorsementMessage.trim()) && styles.modalSendDisabled
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>What type of endorsement?</Text>
          <View style={styles.categoryGrid}>
            {endorsementCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.id && { backgroundColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={24} 
                  color={selectedCategory === category.id ? colors.white : category.color} 
                />
                <Text style={[
                  styles.categoryOptionTitle,
                  { color: selectedCategory === category.id ? colors.white : colors.text.dark }
                ]}>
                  {category.title}
                </Text>
                <Text style={[
                  styles.categoryOptionDescription,
                  { color: selectedCategory === category.id ? 'rgba(255, 255, 255, 0.8)' : colors.neutral.gray }
                ]}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Your message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={`Tell the community why ${userName} deserves this endorsement...`}
            placeholderTextColor={colors.neutral.gray}
            multiline
            numberOfLines={4}
            value={endorsementMessage}
            onChangeText={setEndorsementMessage}
            maxLength={500}
          />
          <Text style={styles.charCount}>{endorsementMessage.length}/500</Text>
          
          <View style={styles.privacySection}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Public Endorsement</Text>
                <Text style={styles.switchSubLabel}>
                  Other community members can see this endorsement
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.switch,
                  isPublicEndorsement && styles.switchActive
                ]}
                onPress={() => setIsPublicEndorsement(!isPublicEndorsement)}
              >
                <View style={[
                  styles.switchThumb,
                  isPublicEndorsement && styles.switchThumbActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Community Endorsements</Text>
          <Text style={styles.headerSubtitle}>for {userName}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.endorseButton}
          onPress={() => setShowEndorseModal(true)}
        >
          <MaterialCommunityIcons name="heart-plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderEndorsementSummary()}
        
        <View style={styles.endorsementsList}>
          <Text style={styles.listTitle}>Community Feedback</Text>
          {endorsements.map(renderEndorsement)}
        </View>
        
        {endorsements.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="heart-outline" size={64} color={colors.neutral.lightGray} />
            <Text style={styles.emptyStateTitle}>No endorsements yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to endorse {userName} and help build community trust!
            </Text>
          </View>
        )}
      </ScrollView>

      {renderEndorseModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  endorseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.dark,
  },
  summaryStats: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: spacing.lg,
  },
  statNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.gray,
  },
  categoryBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  categoryCount: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.dark,
    marginHorizontal: spacing.xs,
  },
  categoryName: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  endorsementsList: {
    paddingHorizontal: spacing.md,
  },
  listTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  endorsementCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  endorsementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  endorserInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  endorserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  endorserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  endorserInitials: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  endorserDetails: {
    flex: 1,
  },
  endorserName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 2,
  },
  endorsementDate: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.gray,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
  endorsementMessage: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  eventContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  eventContextText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  endorsementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.neutral.offWhite,
    borderRadius: 16,
  },
  helpfulText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  publicText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    marginLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  modalCancel: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalSend: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: '600',
  },
  modalSendDisabled: {
    color: colors.neutral.gray,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryOption: {
    width: '50%',
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    alignItems: 'center',
  },
  categoryOptionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  categoryOptionDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCount: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  privacySection: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.dark,
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  switch: {
    width: 50,
    height: 30,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 26,
    height: 26,
    backgroundColor: colors.white,
    borderRadius: 13,
  },
  switchThumbActive: {
    marginLeft: 'auto',
  },
});

export default CommunityEndorsementScreen;