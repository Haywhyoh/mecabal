import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface NeighborRating {
  id: string;
  neighborName: string;
  neighborId: string;
  profileImage?: string;
  location: string;
  overallRating: number;
  categories: {
    helpfulness: number;
    reliability: number;
    communication: number;
    trustworthiness: number;
    expertise: number;
  };
  reviewCount: number;
  badges: string[];
  recentReviews: Review[];
  joinedDate: string;
  responseTime: string;
  helpfulVotes: number;
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerId: string;
  rating: number;
  comment: string;
  category: 'help' | 'service' | 'advice' | 'safety' | 'general';
  timestamp: string;
  helpfulVotes: number;
  verified: boolean;
}

interface RatingCriteria {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
}

const RATING_CRITERIA: RatingCriteria[] = [
  {
    id: 'helpfulness',
    name: 'Helpfulness',
    description: 'How willing they are to assist neighbors',
    icon: 'hand-heart',
    color: '#00A651',
    examples: [
      'Offers assistance without being asked',
      'Shares useful information with community',
      'Volunteers for community activities',
      'Helps neighbors in emergencies'
    ]
  },
  {
    id: 'reliability',
    name: 'Reliability',
    description: 'How dependable they are with commitments',
    icon: 'clock-check',
    color: '#0066CC',
    examples: [
      'Follows through on promises',
      'Shows up on time for appointments',
      'Consistent in their behavior',
      'Can be counted on in situations'
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'How well they communicate with neighbors',
    icon: 'message-text',
    color: '#FF6B35',
    examples: [
      'Responds promptly to messages',
      'Communicates clearly and politely',
      'Listens to others\' concerns',
      'Provides helpful feedback'
    ]
  },
  {
    id: 'trustworthiness',
    name: 'Trustworthiness',
    description: 'How much neighbors can trust them',
    icon: 'shield-account',
    color: '#7B68EE',
    examples: [
      'Keeps confidential information private',
      'Honest in all dealings',
      'Respects others\' property and privacy',
      'Acts with integrity'
    ]
  },
  {
    id: 'expertise',
    name: 'Expertise',
    description: 'Knowledge and skills they bring to community',
    icon: 'school',
    color: '#FFC107',
    examples: [
      'Shares professional knowledge',
      'Provides accurate advice',
      'Has relevant experience',
      'Helps solve complex problems'
    ]
  }
];

export default function NeighborRatingScreen() {
  const [selectedNeighbor, setSelectedNeighbor] = useState<NeighborRating | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'recent'>('rating');

  // Mock neighbor data
  const [neighbors] = useState<NeighborRating[]>([
    {
      id: '1',
      neighborName: 'Sarah Adebayo',
      neighborId: 'user_001',
      location: 'Block A, Flat 12',
      overallRating: 4.8,
      categories: {
        helpfulness: 4.9,
        reliability: 4.7,
        communication: 4.8,
        trustworthiness: 4.9,
        expertise: 4.6
      },
      reviewCount: 23,
      badges: ['Community Champion', 'Helpful Neighbor', 'Safety Coordinator'],
      recentReviews: [
        {
          id: 'r1',
          reviewerName: 'Michael O.',
          reviewerId: 'user_002',
          rating: 5,
          comment: 'Sarah helped organize our building security meeting. Very knowledgeable and approachable!',
          category: 'safety',
          timestamp: '2024-08-15T10:30:00Z',
          helpfulVotes: 12,
          verified: true
        },
        {
          id: 'r2',
          reviewerName: 'Grace L.',
          reviewerId: 'user_003',
          rating: 5,
          comment: 'Always quick to respond and genuinely cares about the community. Recommended a great plumber!',
          category: 'help',
          timestamp: '2024-08-10T14:20:00Z',
          helpfulVotes: 8,
          verified: true
        }
      ],
      joinedDate: '2024-03-15',
      responseTime: '< 2 hours',
      helpfulVotes: 89
    },
    {
      id: '2',
      neighborName: 'Dr. James Okoro',
      neighborId: 'user_004',
      location: 'Block C, Flat 8',
      overallRating: 4.9,
      categories: {
        helpfulness: 4.8,
        reliability: 5.0,
        communication: 4.9,
        trustworthiness: 5.0,
        expertise: 4.9
      },
      reviewCount: 31,
      badges: ['Medical Expert', 'Community Leader', 'Verified Professional'],
      recentReviews: [
        {
          id: 'r3',
          reviewerName: 'Mary K.',
          reviewerId: 'user_005',
          rating: 5,
          comment: 'Dr. Okoro provided excellent health advice during the community health session.',
          category: 'advice',
          timestamp: '2024-08-12T16:45:00Z',
          helpfulVotes: 15,
          verified: true
        }
      ],
      joinedDate: '2024-01-20',
      responseTime: '< 1 hour',
      helpfulVotes: 126
    },
    {
      id: '3',
      neighborName: 'Kemi Johnson',
      neighborId: 'user_006',
      location: 'Block B, Flat 15',
      overallRating: 4.6,
      categories: {
        helpfulness: 4.7,
        reliability: 4.5,
        communication: 4.6,
        trustworthiness: 4.8,
        expertise: 4.4
      },
      reviewCount: 18,
      badges: ['Event Organizer', 'Active Neighbor'],
      recentReviews: [
        {
          id: 'r4',
          reviewerName: 'Tony A.',
          reviewerId: 'user_007',
          rating: 4,
          comment: 'Kemi organized a great kids\' party. Could improve on timing but overall excellent effort.',
          category: 'service',
          timestamp: '2024-08-08T12:00:00Z',
          helpfulVotes: 6,
          verified: true
        }
      ],
      joinedDate: '2024-05-10',
      responseTime: '< 4 hours',
      helpfulVotes: 42
    }
  ]);

  // Rating state
  const [newRating, setNewRating] = useState({
    neighborId: '',
    overallRating: 0,
    categories: {
      helpfulness: 0,
      reliability: 0,
      communication: 0,
      trustworthiness: 0,
      expertise: 0
    },
    comment: '',
    category: 'general' as const
  });

  const filteredNeighbors = neighbors.filter(neighbor =>
    neighbor.neighborName.toLowerCase().includes(searchText.toLowerCase()) ||
    neighbor.location.toLowerCase().includes(searchText.toLowerCase())
  );

  const sortedNeighbors = [...filteredNeighbors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.overallRating - a.overallRating;
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      case 'recent':
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      default:
        return 0;
    }
  });

  const handleRateNeighbor = (neighbor: NeighborRating) => {
    setNewRating({
      neighborId: neighbor.neighborId,
      overallRating: 0,
      categories: {
        helpfulness: 0,
        reliability: 0,
        communication: 0,
        trustworthiness: 0,
        expertise: 0
      },
      comment: '',
      category: 'general'
    });
    setSelectedNeighbor(neighbor);
    setShowRateModal(true);
  };

  const handleSubmitRating = () => {
    if (newRating.overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating before submitting.');
      return;
    }

    Alert.alert(
      'Rating Submitted',
      'Thank you for your feedback! Your rating helps build a stronger community.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowRateModal(false);
            setSelectedNeighbor(null);
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderStarRating = (rating: number, size: number = 16, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <MaterialCommunityIcons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFC107' : '#E0E0E0'}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderNeighborCard = (neighbor: NeighborRating) => (
    <TouchableOpacity key={neighbor.id} style={styles.neighborCard} onPress={() => {
      setSelectedNeighbor(neighbor);
      setShowReviewModal(true);
    }}>
      <View style={styles.neighborHeader}>
        <View style={styles.neighborAvatar}>
          <Text style={styles.avatarText}>
            {neighbor.neighborName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.neighborInfo}>
          <Text style={styles.neighborName}>{neighbor.neighborName}</Text>
          <Text style={styles.neighborLocation}>{neighbor.location}</Text>
          
          <View style={styles.ratingRow}>
            {renderStarRating(neighbor.overallRating)}
            <Text style={styles.ratingText}>{neighbor.overallRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({neighbor.reviewCount} reviews)</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => handleRateNeighbor(neighbor)}
        >
          <MaterialCommunityIcons name="star-plus" size={20} color="#00A651" />
        </TouchableOpacity>
      </View>

      {neighbor.badges.length > 0 && (
        <View style={styles.badgeContainer}>
          {neighbor.badges.slice(0, 2).map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
          {neighbor.badges.length > 2 && (
            <Text style={styles.moreBadges}>+{neighbor.badges.length - 2} more</Text>
          )}
        </View>
      )}

      <View style={styles.neighborStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#8E8E8E" />
          <Text style={styles.statText}>{neighbor.responseTime}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="thumb-up" size={14} color="#8E8E8E" />
          <Text style={styles.statText}>{neighbor.helpfulVotes} helpful</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const RatingModal = () => {
    if (!selectedNeighbor) return null;

    return (
      <Modal visible={showRateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rate Neighbor</Text>
            <TouchableOpacity onPress={handleSubmitRating}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingNeighborName}>{selectedNeighbor.neighborName}</Text>
              <Text style={styles.ratingLocation}>{selectedNeighbor.location}</Text>
            </View>

            <View style={styles.overallRatingSection}>
              <Text style={styles.ratingLabel}>Overall Rating *</Text>
              <View style={styles.overallStars}>
                {renderStarRating(newRating.overallRating, 32, (rating) => 
                  setNewRating(prev => ({ ...prev, overallRating: rating }))
                )}
              </View>
            </View>

            <View style={styles.categoryRatings}>
              <Text style={styles.categoryTitle}>Rate by Category (Optional)</Text>
              {RATING_CRITERIA.map((criteria) => (
                <View key={criteria.id} style={styles.categoryRatingItem}>
                  <View style={styles.categoryInfo}>
                    <MaterialCommunityIcons name={criteria.icon as any} size={20} color={criteria.color} />
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{criteria.name}</Text>
                      <Text style={styles.categoryDesc}>{criteria.description}</Text>
                    </View>
                  </View>
                  {renderStarRating(
                    newRating.categories[criteria.id as keyof typeof newRating.categories], 
                    20,
                    (rating) => setNewRating(prev => ({
                      ...prev,
                      categories: { ...prev.categories, [criteria.id]: rating }
                    }))
                  )}
                </View>
              ))}
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Add a Review (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={newRating.comment}
                onChangeText={(text) => setNewRating(prev => ({ ...prev, comment: text }))}
                placeholder="Share your experience with this neighbor..."
                placeholderTextColor="#8E8E8E"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const ReviewModal = () => {
    if (!selectedNeighbor) return null;

    return (
      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Neighbor Profile</Text>
            <TouchableOpacity onPress={() => {
              setShowReviewModal(false);
              handleRateNeighbor(selectedNeighbor);
            }}>
              <MaterialCommunityIcons name="star-plus" size={24} color="#00A651" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {selectedNeighbor.neighborName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>{selectedNeighbor.neighborName}</Text>
              <Text style={styles.profileLocation}>{selectedNeighbor.location}</Text>
              
              <View style={styles.profileRating}>
                {renderStarRating(selectedNeighbor.overallRating, 20)}
                <Text style={styles.profileRatingText}>
                  {selectedNeighbor.overallRating.toFixed(1)} ({selectedNeighbor.reviewCount} reviews)
                </Text>
              </View>
            </View>

            <View style={styles.categoryBreakdown}>
              <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
              {RATING_CRITERIA.map((criteria) => (
                <View key={criteria.id} style={styles.breakdownItem}>
                  <MaterialCommunityIcons name={criteria.icon as any} size={16} color={criteria.color} />
                  <Text style={styles.breakdownName}>{criteria.name}</Text>
                  <View style={styles.breakdownRating}>
                    {renderStarRating(selectedNeighbor.categories[criteria.id as keyof typeof selectedNeighbor.categories], 14)}
                    <Text style={styles.breakdownValue}>
                      {selectedNeighbor.categories[criteria.id as keyof typeof selectedNeighbor.categories].toFixed(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.recentReviews}>
              <Text style={styles.reviewsTitle}>Recent Reviews</Text>
              {selectedNeighbor.recentReviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <View style={styles.reviewRating}>
                      {renderStarRating(review.rating, 12)}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewDate}>{formatTimestamp(review.timestamp)}</Text>
                    {review.verified && (
                      <View style={styles.verifiedReview}>
                        <MaterialCommunityIcons name="check-decagram" size={12} color="#00A651" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neighbor Ratings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search neighbors..."
            placeholderTextColor="#8E8E8E"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.sortButtons}>
          {(['rating', 'reviews', 'recent'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedNeighbors.map(renderNeighborCard)}

        {sortedNeighbors.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Neighbors Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 
                `No neighbors match "${searchText}". Try a different search.` :
                'No neighbors available to rate at this time.'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <RatingModal />
      <ReviewModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#00A651',
  },
  sortText: {
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  neighborCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  neighborHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  neighborAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  neighborInfo: {
    flex: 1,
  },
  neighborName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  neighborLocation: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  rateButton: {
    padding: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
  },
  moreBadges: {
    fontSize: 10,
    color: '#8E8E8E',
    alignSelf: 'center',
  },
  neighborStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
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
  cancelText: {
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
  submitText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ratingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingNeighborName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  ratingLocation: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  overallRatingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  overallStars: {
    marginBottom: 8,
  },
  categoryRatings: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  categoryRatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDetails: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
    height: 80,
    textAlignVertical: 'top',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  profileRating: {
    alignItems: 'center',
  },
  profileRatingText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginTop: 4,
  },
  categoryBreakdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownName: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
    flex: 1,
  },
  breakdownRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 4,
  },
  recentReviews: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  reviewRating: {
    marginBottom: 0,
  },
  reviewComment: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  verifiedReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#00A651',
    marginLeft: 4,
  },
});