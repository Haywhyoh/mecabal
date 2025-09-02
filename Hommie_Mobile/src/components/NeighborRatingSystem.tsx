import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

interface NeighborRating {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  rating: number;
  categories: {
    helpfulness: number;
    communication: number;
    reliability: number;
    friendliness: number;
    safety: number;
  };
  comment?: string;
  tags: string[];
  timestamp: string;
  context: 'general' | 'service' | 'event' | 'safety' | 'favor';
  isVerified: boolean;
}

interface RatingStats {
  overallRating: number;
  totalRatings: number;
  categoryAverages: {
    helpfulness: number;
    communication: number;
    reliability: number;
    friendliness: number;
    safety: number;
  };
  ratingDistribution: { [key: number]: number };
  topTags: { tag: string; count: number; }[];
  recentTrend: 'up' | 'down' | 'stable';
}

interface NeighborRatingSystemProps {
  userId: string;
  targetUserId?: string;
  targetUserName?: string;
  showMyRatings?: boolean;
  allowRating?: boolean;
  compactMode?: boolean;
  context?: 'general' | 'service' | 'event' | 'safety' | 'favor';
  onRatingSubmitted?: (rating: NeighborRating) => void;
}

const RATING_CATEGORIES = [
  { id: 'helpfulness', name: 'Helpfulness', icon: 'hand-heart', description: 'Willingness to help neighbors' },
  { id: 'communication', name: 'Communication', icon: 'message-text', description: 'Clear and respectful communication' },
  { id: 'reliability', name: 'Reliability', icon: 'check-circle', description: 'Keeps promises and follows through' },
  { id: 'friendliness', name: 'Friendliness', icon: 'account-heart', description: 'Warm and welcoming personality' },
  { id: 'safety', name: 'Safety Awareness', icon: 'shield-account', description: 'Contributes to community safety' }
];

const HELPFUL_TAGS = [
  'Always Available', 'Quick Response', 'Goes Above & Beyond', 'Great Listener',
  'Problem Solver', 'Community Leader', 'Safety Conscious', 'Reliable',
  'Friendly', 'Professional', 'Trustworthy', 'Respectful',
  'Good Communicator', 'Emergency Helper', 'Event Organizer', 'Local Expert'
];

const RATING_CONTEXTS = {
  general: { name: 'General Neighbor Rating', icon: 'account-group' },
  service: { name: 'Service Experience', icon: 'wrench' },
  event: { name: 'Event Participation', icon: 'calendar-star' },
  safety: { name: 'Safety Assistance', icon: 'shield-check' },
  favor: { name: 'Favor/Help Request', icon: 'hand-heart' }
};

export default function NeighborRatingSystem({
  userId,
  targetUserId = 'neighbor_123',
  targetUserName = 'Adebayo O.',
  showMyRatings = false,
  allowRating = true,
  compactMode = false,
  context = 'general',
  onRatingSubmitted
}: NeighborRatingSystemProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showViewRatingsModal, setShowViewRatingsModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<NeighborRating | null>(null);
  
  // Rating form state
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    helpfulness: 0,
    communication: 0,
    reliability: 0,
    friendliness: 0,
    safety: 0
  });
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - in real app, this would come from API
  const [ratingStats] = useState<RatingStats>({
    overallRating: 4.7,
    totalRatings: 23,
    categoryAverages: {
      helpfulness: 4.8,
      communication: 4.6,
      reliability: 4.7,
      friendliness: 4.9,
      safety: 4.5
    },
    ratingDistribution: { 5: 15, 4: 6, 3: 2, 2: 0, 1: 0 },
    topTags: [
      { tag: 'Quick Response', count: 8 },
      { tag: 'Always Available', count: 6 },
      { tag: 'Goes Above & Beyond', count: 5 },
      { tag: 'Great Listener', count: 4 }
    ],
    recentTrend: 'up'
  });

  const [recentRatings] = useState<NeighborRating[]>([
    {
      id: '1',
      fromUserId: 'user_456',
      fromUserName: 'Sarah A.',
      toUserId: targetUserId,
      rating: 5,
      categories: { helpfulness: 5, communication: 5, reliability: 5, friendliness: 5, safety: 4 },
      comment: 'Adebayo helped me fix my generator when it broke down. Very knowledgeable and patient!',
      tags: ['Quick Response', 'Problem Solver', 'Reliable'],
      timestamp: '2 days ago',
      context: 'favor',
      isVerified: true
    },
    {
      id: '2',
      fromUserId: 'user_789',
      fromUserName: 'Emeka K.',
      toUserId: targetUserId,
      rating: 4,
      categories: { helpfulness: 4, communication: 5, reliability: 4, friendliness: 5, safety: 4 },
      comment: 'Great neighbor, always willing to help with estate matters.',
      tags: ['Community Leader', 'Friendly', 'Good Communicator'],
      timestamp: '1 week ago',
      context: 'general',
      isVerified: true
    },
    {
      id: '3',
      fromUserId: 'user_101',
      fromUserName: 'Fatima M.',
      toUserId: targetUserId,
      rating: 5,
      categories: { helpfulness: 5, communication: 4, reliability: 5, friendliness: 5, safety: 5 },
      comment: 'Helped coordinate security during the recent break-in incidents. Very safety conscious.',
      tags: ['Safety Conscious', 'Emergency Helper', 'Trustworthy'],
      timestamp: '2 weeks ago',
      context: 'safety',
      isVerified: true
    }
  ]);

  const resetRatingForm = () => {
    setOverallRating(0);
    setCategoryRatings({
      helpfulness: 0,
      communication: 0,
      reliability: 0,
      friendliness: 0,
      safety: 0
    });
    setComment('');
    setSelectedTags([]);
  };

  const handleRatingSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newRating: NeighborRating = {
        id: Date.now().toString(),
        fromUserId: userId,
        fromUserName: 'You',
        toUserId: targetUserId,
        rating: overallRating,
        categories: categoryRatings,
        comment: comment.trim(),
        tags: selectedTags,
        timestamp: 'Just now',
        context,
        isVerified: true
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onRatingSubmitted?.(newRating);
      
      Alert.alert(
        'Rating Submitted!',
        `Thank you for rating ${targetUserName}. Your feedback helps build a stronger community.`,
        [{ text: 'OK', onPress: () => setShowRatingModal(false) }]
      );

      resetRatingForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderStarRating = (rating: number, onPress?: (rating: number) => void, size: number = 20) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
            style={styles.starButton}
          >
            <MaterialCommunityIcons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFC107' : '#E0E0E0'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCategoryRating = (categoryId: string, rating: number, average?: number) => {
    const category = RATING_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return null;

    return (
      <View style={styles.categoryRow}>
        <View style={styles.categoryInfo}>
          <MaterialCommunityIcons name={category.icon as any} size={20} color="#00A651" />
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <View style={styles.categoryRating}>
          {renderStarRating(rating, undefined, 16)}
          {average && (
            <Text style={styles.averageText}>avg {average.toFixed(1)}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderRatingModal = () => (
    <Modal
      visible={showRatingModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRatingModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRatingModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Rate {targetUserName}</Text>
          <TouchableOpacity onPress={handleRatingSubmit} disabled={isSubmitting}>
            <Text style={[styles.submitText, isSubmitting && styles.disabledText]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Context Info */}
          <View style={styles.contextCard}>
            <MaterialCommunityIcons 
              name={RATING_CONTEXTS[context].icon as any} 
              size={24} 
              color="#00A651" 
            />
            <Text style={styles.contextText}>{RATING_CONTEXTS[context].name}</Text>
          </View>

          {/* Overall Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.overallRatingContainer}>
              {renderStarRating(overallRating, setOverallRating, 32)}
              <Text style={styles.ratingText}>
                {overallRating > 0 ? `${overallRating}/5` : 'Tap to rate'}
              </Text>
            </View>
          </View>

          {/* Category Ratings */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Category Ratings (Optional)</Text>
            <Text style={styles.sectionDesc}>Help provide more detailed feedback</Text>
            
            {RATING_CATEGORIES.map(category => (
              <View key={category.id} style={styles.categoryRatingRow}>
                <View style={styles.categoryHeader}>
                  <MaterialCommunityIcons name={category.icon as any} size={20} color="#00A651" />
                  <View style={styles.categoryTextInfo}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <Text style={styles.categoryDesc}>{category.description}</Text>
                  </View>
                </View>
                {renderStarRating(
                  categoryRatings[category.id as keyof typeof categoryRatings], 
                  (rating) => setCategoryRatings(prev => ({ ...prev, [category.id]: rating })),
                  20
                )}
              </View>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Helpful Tags (Optional)</Text>
            <Text style={styles.sectionDesc}>Choose words that describe this neighbor</Text>
            
            <View style={styles.tagsContainer}>
              {HELPFUL_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.selectedTag
                  ]}
                  onPress={() => handleTagToggle(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Comment (Optional)</Text>
            <Text style={styles.sectionDesc}>Share your experience with this neighbor</Text>
            
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Tell the community about your experience..."
              placeholderTextColor="#8E8E8E"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderViewRatingsModal = () => (
    <Modal
      visible={showViewRatingsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowViewRatingsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowViewRatingsModal(false)}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>All Ratings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {recentRatings.map(rating => (
            <View key={rating.id} style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <View style={styles.raterInfo}>
                  <View style={styles.raterAvatar}>
                    <Text style={styles.avatarText}>{rating.fromUserName.charAt(0)}</Text>
                  </View>
                  <View style={styles.raterDetails}>
                    <Text style={styles.raterName}>{rating.fromUserName}</Text>
                    <Text style={styles.ratingTime}>{rating.timestamp}</Text>
                  </View>
                </View>
                <View style={styles.ratingValue}>
                  {renderStarRating(rating.rating, undefined, 16)}
                  <Text style={styles.ratingNumber}>{rating.rating}/5</Text>
                </View>
              </View>

              {rating.comment && (
                <Text style={styles.ratingComment}>{rating.comment}</Text>
              )}

              {rating.tags.length > 0 && (
                <View style={styles.ratingTags}>
                  {rating.tags.map(tag => (
                    <View key={tag} style={styles.ratingTag}>
                      <Text style={styles.ratingTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.ratingContext}>
                <MaterialCommunityIcons 
                  name={RATING_CONTEXTS[rating.context].icon as any} 
                  size={12} 
                  color="#8E8E8E" 
                />
                <Text style={styles.contextLabel}>{RATING_CONTEXTS[rating.context].name}</Text>
                {rating.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#00A651" />
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // Compact mode for profile displays
  if (compactMode) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRating}>
          {renderStarRating(ratingStats.overallRating, undefined, 16)}
          <Text style={styles.compactRatingText}>
            {ratingStats.overallRating.toFixed(1)} ({ratingStats.totalRatings})
          </Text>
        </View>
        {allowRating && (
          <TouchableOpacity 
            style={styles.compactRateButton}
            onPress={() => setShowRatingModal(true)}
          >
            <MaterialCommunityIcons name="star-plus" size={16} color="#00A651" />
            <Text style={styles.compactRateText}>Rate</Text>
          </TouchableOpacity>
        )}
        {renderRatingModal()}
      </View>
    );
  }

  // Full widget mode
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Neighbor Rating</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setShowViewRatingsModal(true)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
          {allowRating && (
            <TouchableOpacity 
              style={styles.rateButton}
              onPress={() => setShowRatingModal(true)}
            >
              <MaterialCommunityIcons name="star-plus" size={16} color="#FFFFFF" />
              <Text style={styles.rateButtonText}>Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Overall Rating */}
      <View style={styles.overallSection}>
        <View style={styles.ratingDisplay}>
          <Text style={styles.overallRatingNumber}>{ratingStats.overallRating.toFixed(1)}</Text>
          {renderStarRating(ratingStats.overallRating, undefined, 20)}
          <Text style={styles.totalRatings}>Based on {ratingStats.totalRatings} ratings</Text>
        </View>
        
        <View style={styles.trendIndicator}>
          <MaterialCommunityIcons 
            name={ratingStats.recentTrend === 'up' ? 'trending-up' : 
                  ratingStats.recentTrend === 'down' ? 'trending-down' : 'trending-neutral'} 
            size={16} 
            color={ratingStats.recentTrend === 'up' ? '#00A651' : 
                  ratingStats.recentTrend === 'down' ? '#E74C3C' : '#8E8E8E'} 
          />
          <Text style={styles.trendText}>Recent trend</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionLabel}>Rating Breakdown</Text>
        {Object.entries(ratingStats.categoryAverages).map(([category, average]) => 
          renderCategoryRating(category, Math.round(average), average)
        )}
      </View>

      {/* Top Tags */}
      <View style={styles.tagsSection}>
        <Text style={styles.sectionLabel}>Most Mentioned</Text>
        <View style={styles.topTags}>
          {ratingStats.topTags.map(({ tag, count }) => (
            <View key={tag} style={styles.topTag}>
              <Text style={styles.topTagText}>{tag}</Text>
              <Text style={styles.topTagCount}>×{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Ratings */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionLabel}>Recent Reviews</Text>
        {recentRatings.slice(0, 2).map(rating => (
          <View key={rating.id} style={styles.recentRating}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentRater}>{rating.fromUserName}</Text>
              {renderStarRating(rating.rating, undefined, 14)}
              <Text style={styles.recentTime}>{rating.timestamp}</Text>
            </View>
            {rating.comment && (
              <Text style={styles.recentComment} numberOfLines={2}>
                {rating.comment}
              </Text>
            )}
          </View>
        ))}
      </View>

      {renderRatingModal()}
      {renderViewRatingsModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  compactRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRatingText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  compactRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A651',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    marginRight: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '600',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A651',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  overallSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  overallRatingNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  totalRatings: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  trendIndicator: {
    alignItems: 'center',
  },
  trendText: {
    fontSize: 11,
    color: '#8E8E8E',
    marginTop: 2,
  },
  categoriesSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  categoryRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  tagsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  topTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topTagText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600',
  },
  topTagCount: {
    fontSize: 10,
    color: '#00A651',
    marginLeft: 4,
  },
  recentSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  recentRating: {
    marginBottom: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentRater: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 8,
  },
  recentTime: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  recentComment: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
  },
  starContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 2,
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
  cancelText: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  submitText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  disabledText: {
    color: '#8E8E8E',
  },
  placeholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  contextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 16,
  },
  overallRatingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  ratingText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 8,
  },
  categoryRatingRow: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTextInfo: {
    flex: 1,
    marginLeft: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTag: {
    backgroundColor: '#E8F5E8',
    borderColor: '#00A651',
  },
  tagText: {
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#00A651',
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2C2C2C',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 4,
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  raterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  raterDetails: {
    flex: 1,
  },
  raterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  ratingTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  ratingValue: {
    alignItems: 'flex-end',
  },
  ratingNumber: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  ratingComment: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  ratingTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingTagText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
  },
  ratingContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextLabel: {
    fontSize: 11,
    color: '#8E8E8E',
  },
});