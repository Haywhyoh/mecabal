import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  ConnectionRecommendation,
  NeighborProfile,
  RECOMMENDATION_REASONS,
  TRUSTED_NEIGHBOR_LEVELS,
  NIGERIAN_CONNECTION_CONTEXTS
} from '../constants/socialNetworkingData';

interface NeighborRecommendationSystemProps {
  userId: string;
  maxRecommendations?: number;
  prioritizeProximity?: boolean;
  showRecommendationReasons?: boolean;
  compactMode?: boolean;
  filterCategories?: ('proximity' | 'mutual_connections' | 'shared_interests' | 'activity_similarity' | 'safety_network')[];
  onConnectionRequest?: (neighborId: string, connectionType: string) => void;
  onRecommendationDismiss?: (recommendationId: string) => void;
}

interface RecommendationFilter {
  category: string;
  label: string;
  icon: string;
  isActive: boolean;
  count: number;
}

interface RecommendationInsight {
  id: string;
  type: 'trending' | 'high_value' | 'safety_critical' | 'community_builder';
  title: string;
  description: string;
  recommendations: ConnectionRecommendation[];
  priority: number;
}

export default function NeighborRecommendationSystem({
  userId,
  maxRecommendations = 10,
  prioritizeProximity = true,
  showRecommendationReasons = true,
  compactMode = false,
  filterCategories,
  onConnectionRequest,
  onRecommendationDismiss
}: NeighborRecommendationSystemProps) {
  const [recommendations, setRecommendations] = useState<ConnectionRecommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<ConnectionRecommendation[]>([]);
  const [recommendationInsights, setRecommendationInsights] = useState<RecommendationInsight[]>([]);
  const [activeFilters, setActiveFilters] = useState<RecommendationFilter[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ConnectionRecommendation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Mock data - replace with actual API calls
  const mockRecommendations: ConnectionRecommendation[] = [
    {
      id: 'rec_001',
      recommendationScore: 94,
      neighbor: {
        id: 'neighbor_101',
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        displayName: 'Emeka O.',
        estate: 'Green Valley Estate',
        building: 'Block A',
        apartment: 'Apt 5',
        joinedDate: 'Jan 2024',
        isVerified: true,
        verificationLevel: 'enhanced',
        trustScore: 87,
        connectionStats: {
          totalConnections: 24,
          trustedConnections: 6,
          mutualConnections: 8,
          followerCount: 32,
          followingCount: 28
        },
        badges: ['verified_neighbor', 'safety_champion', 'helpful_neighbor'],
        interests: ['Estate Security', 'Emergency Response', 'Generator Maintenance', 'Professional Networking'],
        bio: 'Security professional, emergency response trainer, estate safety coordinator',
        lastSeen: '2 hours ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      reasons: [
        {
          type: 'proximity',
          description: 'Lives in your building',
          strength: 40
        },
        {
          type: 'safety_network',
          description: 'Important for safety network',
          strength: 20
        },
        {
          type: 'shared_interests',
          description: 'Many shared interests',
          strength: 30
        },
        {
          type: 'mutual_connections',
          description: 'Several mutual connections',
          strength: 25
        }
      ],
      mutualConnections: [
        {
          id: 'mutual_101',
          firstName: 'Kemi',
          lastName: 'Oladele',
          displayName: 'Kemi O.',
          estate: 'Green Valley Estate',
          building: 'Block B',
          joinedDate: 'Oct 2023',
          isVerified: true,
          verificationLevel: 'enhanced',
          trustScore: 85,
          connectionStats: {
            totalConnections: 32,
            trustedConnections: 8,
            mutualConnections: 12,
            followerCount: 45,
            followingCount: 28
          },
          badges: ['verified_neighbor', 'helpful_neighbor'],
          interests: ['Event Planning', 'Community Service'],
          lastSeen: '3 hours ago',
          privacySettings: {
            allowConnections: true,
            requireApproval: true,
            showLocation: true,
            showActivity: true,
            showMutualConnections: true
          }
        }
      ],
      sharedInterests: ['Estate Security', 'Emergency Response', 'Professional Networking'],
      proximityInfo: {
        distance: 50,
        location: 'Block A',
        sameBuilding: true,
        sameEstate: true
      }
    },
    {
      id: 'rec_002',
      recommendationScore: 88,
      neighbor: {
        id: 'neighbor_102',
        firstName: 'Adanna',
        lastName: 'Okoro',
        displayName: 'Adanna O.',
        estate: 'Green Valley Estate',
        building: 'Block C',
        apartment: 'Apt 12',
        joinedDate: 'Dec 2023',
        isVerified: true,
        verificationLevel: 'premium',
        trustScore: 91,
        connectionStats: {
          totalConnections: 38,
          trustedConnections: 12,
          mutualConnections: 15,
          followerCount: 52,
          followingCount: 35
        },
        badges: ['verified_neighbor', 'nin_verified', 'business_verified', 'top_contributor'],
        interests: ['Local Business', 'Event Planning', 'Parenting', 'Community Events', 'Nigerian Cuisine'],
        bio: 'Event planner, local business owner, community organizer',
        lastSeen: '1 day ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      reasons: [
        {
          type: 'mutual_connections',
          description: 'Many mutual connections',
          strength: 35
        },
        {
          type: 'shared_interests',
          description: 'Some shared interests',
          strength: 20
        },
        {
          type: 'activity_similarity',
          description: 'Similar activity patterns',
          strength: 25
        },
        {
          type: 'proximity',
          description: 'Lives in your estate',
          strength: 30
        }
      ],
      mutualConnections: [
        {
          id: 'mutual_102',
          firstName: 'Bisi',
          lastName: 'Adebayo',
          displayName: 'Bisi A.',
          estate: 'Green Valley Estate',
          building: 'Block C',
          joinedDate: 'Nov 2023',
          isVerified: true,
          verificationLevel: 'enhanced',
          trustScore: 91,
          connectionStats: {
            totalConnections: 41,
            trustedConnections: 12,
            mutualConnections: 18,
            followerCount: 62,
            followingCount: 35
          },
          badges: ['verified_neighbor', 'helpful_neighbor', 'safety_champion'],
          interests: ['Safety Advocacy', 'Family Activities'],
          lastSeen: '6 hours ago',
          privacySettings: {
            allowConnections: true,
            requireApproval: true,
            showLocation: true,
            showActivity: true,
            showMutualConnections: true
          }
        }
      ],
      sharedInterests: ['Event Planning', 'Community Events', 'Local Business'],
      proximityInfo: {
        distance: 120,
        location: 'Block C',
        sameBuilding: false,
        sameEstate: true
      }
    },
    {
      id: 'rec_003',
      recommendationScore: 82,
      neighbor: {
        id: 'neighbor_103',
        firstName: 'Tunde',
        lastName: 'Bakare',
        displayName: 'Tunde B.',
        estate: 'Green Valley Estate',
        building: 'Block B',
        apartment: 'Apt 18',
        joinedDate: 'Jan 2024',
        isVerified: true,
        verificationLevel: 'enhanced',
        trustScore: 79,
        connectionStats: {
          totalConnections: 19,
          trustedConnections: 4,
          mutualConnections: 6,
          followerCount: 28,
          followingCount: 22
        },
        badges: ['verified_neighbor', 'business_verified'],
        interests: ['Generator Maintenance', 'Tech Industry', 'Local Business', 'Professional Networking'],
        bio: 'IT consultant, generator maintenance specialist',
        lastSeen: '4 hours ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      reasons: [
        {
          type: 'shared_interests',
          description: 'Many shared interests',
          strength: 30
        },
        {
          type: 'proximity',
          description: 'Lives in your estate',
          strength: 30
        },
        {
          type: 'mutual_connections',
          description: 'Few mutual connections',
          strength: 15
        },
        {
          type: 'safety_network',
          description: 'Could enhance safety network',
          strength: 15
        }
      ],
      mutualConnections: [],
      sharedInterests: ['Professional Networking', 'Tech Industry', 'Generator Maintenance'],
      proximityInfo: {
        distance: 80,
        location: 'Block B',
        sameBuilding: false,
        sameEstate: true
      }
    }
  ];

  const mockInsights: RecommendationInsight[] = [
    {
      id: 'insight_001',
      type: 'safety_critical',
      title: 'Safety Network Expansion',
      description: 'Connect with security-focused neighbors to strengthen your safety network',
      recommendations: [mockRecommendations[0]],
      priority: 1
    },
    {
      id: 'insight_002',
      type: 'community_builder',
      title: 'Community Connectors',
      description: 'These neighbors are well-connected and can help expand your network',
      recommendations: [mockRecommendations[1]],
      priority: 2
    },
    {
      id: 'insight_003',
      type: 'high_value',
      title: 'Service Providers',
      description: 'Connect with neighbors who offer valuable services',
      recommendations: [mockRecommendations[2]],
      priority: 3
    }
  ];

  const defaultFilters: RecommendationFilter[] = [
    { category: 'all', label: 'All', icon: 'account-group', isActive: true, count: 0 },
    { category: 'proximity', label: 'Nearby', icon: 'map-marker', isActive: false, count: 0 },
    { category: 'mutual_connections', label: 'Mutual', icon: 'account-multiple', isActive: false, count: 0 },
    { category: 'shared_interests', label: 'Interests', icon: 'heart', isActive: false, count: 0 },
    { category: 'safety_network', label: 'Safety', icon: 'shield-account', isActive: false, count: 0 },
    { category: 'activity_similarity', label: 'Active', icon: 'chart-line', isActive: false, count: 0 }
  ];

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [recommendations, activeFilters]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const sortedRecommendations = prioritizeProximity 
          ? mockRecommendations.sort((a, b) => {
              if (a.proximityInfo.sameBuilding && !b.proximityInfo.sameBuilding) return -1;
              if (!a.proximityInfo.sameBuilding && b.proximityInfo.sameBuilding) return 1;
              return b.recommendationScore - a.recommendationScore;
            })
          : mockRecommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

        setRecommendations(sortedRecommendations.slice(0, maxRecommendations));
        setRecommendationInsights(mockInsights);
        
        // Update filter counts
        const updatedFilters = defaultFilters.map(filter => ({
          ...filter,
          count: filter.category === 'all' 
            ? sortedRecommendations.length 
            : sortedRecommendations.filter(rec => 
                rec.reasons.some(reason => reason.type === filter.category)
              ).length
        }));
        setActiveFilters(updatedFilters);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load recommendations');
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const applyFilters = () => {
    const activeCategory = activeFilters.find(filter => filter.isActive)?.category;
    
    if (!activeCategory || activeCategory === 'all') {
      setFilteredRecommendations(recommendations.filter(rec => !dismissedIds.includes(rec.id)));
      return;
    }

    const filtered = recommendations.filter(rec => 
      !dismissedIds.includes(rec.id) &&
      rec.reasons.some(reason => reason.type === activeCategory)
    );
    
    setFilteredRecommendations(filtered);
  };

  const handleFilterChange = (category: string) => {
    const updatedFilters = activeFilters.map(filter => ({
      ...filter,
      isActive: filter.category === category
    }));
    setActiveFilters(updatedFilters);
  };

  const handleConnectionRequest = (neighborId: string, connectionType: 'follow' | 'connect' = 'connect') => {
    if (onConnectionRequest) {
      onConnectionRequest(neighborId, connectionType);
    } else {
      Alert.alert(
        'Connection Request',
        `Send ${connectionType} request?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => {
              Alert.alert('Success', `${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)} request sent!`);
            }
          }
        ]
      );
    }
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setDismissedIds([...dismissedIds, recommendationId]);
    if (onRecommendationDismiss) {
      onRecommendationDismiss(recommendationId);
    }
  };

  const handleShowDetails = (recommendation: ConnectionRecommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsModal(true);
  };

  const getTrustLevel = (trustScore: number) => {
    return TRUSTED_NEIGHBOR_LEVELS.find(level => 
      trustScore >= level.trustScore
    ) || TRUSTED_NEIGHBOR_LEVELS[0];
  };

  const getRecommendationScoreColor = (score: number) => {
    if (score >= 90) return '#00A651';
    if (score >= 75) return '#0066CC';
    if (score >= 60) return '#FF6B35';
    return '#8E8E8E';
  };

  const renderRecommendationCard = ({ item }: { item: ConnectionRecommendation }) => {
    const trustLevel = getTrustLevel(item.neighbor.trustScore);
    const scoreColor = getRecommendationScoreColor(item.recommendationScore);
    const topReason = item.reasons.sort((a, b) => b.strength - a.strength)[0];

    return (
      <TouchableOpacity 
        style={styles.recommendationCard}
        onPress={() => handleShowDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.neighborInfo}>
            <View style={styles.neighborAvatar}>
              <Text style={styles.avatarText}>
                {item.neighbor.firstName.charAt(0)}{item.neighbor.lastName.charAt(0)}
              </Text>
            </View>
            
            <View style={styles.neighborDetails}>
              <View style={styles.nameSection}>
                <Text style={styles.neighborName}>{item.neighbor.displayName}</Text>
                {item.neighbor.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#00A651" />
                )}
              </View>
              
              <View style={styles.locationSection}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#8E8E8E" />
                <Text style={styles.neighborLocation}>
                  {item.neighbor.building}, {item.neighbor.estate}
                </Text>
                {item.proximityInfo.sameBuilding && (
                  <View style={styles.proximityBadge}>
                    <Text style={styles.proximityText}>Same Building</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.neighborBio} numberOfLines={2}>
                {item.neighbor.bio}
              </Text>
            </View>
          </View>

          <View style={styles.scoreSection}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>
                {item.recommendationScore}%
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={() => handleDismissRecommendation(item.id)}
            >
              <MaterialCommunityIcons name="close" size={16} color="#8E8E8E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reasonsSection}>
          <View style={styles.topReason}>
            <MaterialCommunityIcons 
              name={getReasonIcon(topReason.type)} 
              size={12} 
              color="#0066CC" 
            />
            <Text style={styles.reasonText}>{topReason.description}</Text>
          </View>
          
          {item.mutualConnections.length > 0 && (
            <View style={styles.mutualConnectionsInfo}>
              <MaterialCommunityIcons name="account-group" size={12} color="#8E8E8E" />
              <Text style={styles.mutualText}>
                {item.mutualConnections.length} mutual connection{item.mutualConnections.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.interestsSection}>
          {item.sharedInterests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
          {item.sharedInterests.length > 3 && (
            <Text style={styles.moreInterests}>+{item.sharedInterests.length - 3}</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.followButton]}
            onPress={() => handleConnectionRequest(item.neighbor.id, 'follow')}
          >
            <MaterialCommunityIcons name="account-plus" size={14} color="#0066CC" />
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.connectButton]}
            onPress={() => handleConnectionRequest(item.neighbor.id, 'connect')}
          >
            <MaterialCommunityIcons name="account-multiple-plus" size={14} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getReasonIcon = (reasonType: string) => {
    const icons = {
      proximity: 'map-marker',
      mutual_connections: 'account-group',
      shared_interests: 'heart',
      activity_similarity: 'chart-line',
      safety_network: 'shield-account'
    };
    return icons[reasonType] || 'account';
  };

  const renderFilters = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {activeFilters.map((filter) => (
          <TouchableOpacity
            key={filter.category}
            style={[
              styles.filterButton,
              filter.isActive && styles.activeFilterButton
            ]}
            onPress={() => handleFilterChange(filter.category)}
          >
            <MaterialCommunityIcons 
              name={filter.icon as any} 
              size={14} 
              color={filter.isActive ? '#FFFFFF' : '#8E8E8E'} 
            />
            <Text style={[
              styles.filterText,
              filter.isActive && styles.activeFilterText
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderInsightsSection = () => {
    if (compactMode || recommendationInsights.length === 0) return null;

    return (
      <View style={styles.insightsSection}>
        <Text style={styles.insightsTitle}>Recommendation Insights</Text>
        {recommendationInsights.slice(0, 2).map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <MaterialCommunityIcons 
              name={getInsightIcon(insight.type)} 
              size={16} 
              color={getInsightColor(insight.type)} 
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
            <View style={styles.insightCount}>
              <Text style={styles.insightCountText}>{insight.recommendations.length}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      trending: 'trending-up',
      high_value: 'star',
      safety_critical: 'shield-alert',
      community_builder: 'account-group'
    };
    return icons[type] || 'lightbulb';
  };

  const getInsightColor = (type: string) => {
    const colors = {
      trending: '#FF6B35',
      high_value: '#FFD700',
      safety_critical: '#E74C3C',
      community_builder: '#00A651'
    };
    return colors[type] || '#0066CC';
  };

  const renderDetailsModal = () => {
    if (!selectedRecommendation) return null;

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Connection Recommendation</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Neighbor Profile */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Neighbor Profile</Text>
              <View style={styles.profileCard}>
                <View style={styles.neighborInfo}>
                  <View style={styles.neighborAvatar}>
                    <Text style={styles.avatarText}>
                      {selectedRecommendation.neighbor.firstName.charAt(0)}{selectedRecommendation.neighbor.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.neighborDetails}>
                    <Text style={styles.neighborName}>{selectedRecommendation.neighbor.displayName}</Text>
                    <Text style={styles.neighborLocation}>
                      {selectedRecommendation.neighbor.building}, {selectedRecommendation.neighbor.estate}
                    </Text>
                    <Text style={styles.neighborBio}>{selectedRecommendation.neighbor.bio}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Recommendation Reasons */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Why We Recommend</Text>
              {selectedRecommendation.reasons.map((reason, index) => (
                <View key={index} style={styles.reasonCard}>
                  <MaterialCommunityIcons 
                    name={getReasonIcon(reason.type)} 
                    size={16} 
                    color="#0066CC" 
                  />
                  <View style={styles.reasonContent}>
                    <Text style={styles.reasonTitle}>{reason.description}</Text>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthFill,
                          { width: `${(reason.strength / 40) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={styles.strengthScore}>{reason.strength}%</Text>
                </View>
              ))}
            </View>

            {/* Shared Interests */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Shared Interests</Text>
              <View style={styles.interestsList}>
                {selectedRecommendation.sharedInterests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Mutual Connections */}
            {selectedRecommendation.mutualConnections.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Mutual Connections</Text>
                {selectedRecommendation.mutualConnections.map((mutual) => (
                  <View key={mutual.id} style={styles.mutualConnectionCard}>
                    <View style={styles.mutualAvatar}>
                      <Text style={styles.mutualAvatarText}>
                        {mutual.firstName.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.mutualName}>{mutual.displayName}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.followButton]}
              onPress={() => {
                handleConnectionRequest(selectedRecommendation.neighbor.id, 'follow');
                setShowDetailsModal(false);
              }}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => {
                handleConnectionRequest(selectedRecommendation.neighbor.id, 'connect');
                setShowDetailsModal(false);
              }}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={24} color="#00A651" />
        <Text style={styles.loadingText}>Finding neighbor recommendations...</Text>
      </View>
    );
  }

  if (compactMode) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons name="account-plus" size={16} color="#0066CC" />
          <Text style={styles.compactTitle}>
            Suggested Neighbors ({filteredRecommendations.length})
          </Text>
        </View>
        
        <FlatList
          data={filteredRecommendations.slice(0, 3)}
          renderItem={renderRecommendationCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Recommended Neighbors ({filteredRecommendations.length})
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshRecommendations}
        >
          <MaterialCommunityIcons name="refresh" size={16} color="#00A651" />
        </TouchableOpacity>
      </View>

      {renderFilters()}
      {renderInsightsSection()}
      
      <FlatList
        data={filteredRecommendations}
        renderItem={renderRecommendationCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshRecommendations}
            colors={['#00A651']}
            tintColor="#00A651"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color="#8E8E8E" />
            <Text style={styles.emptyStateTitle}>No Recommendations</Text>
            <Text style={styles.emptyStateText}>
              We'll find new neighbor recommendations for you soon!
            </Text>
          </View>
        }
      />

      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  compactContainer: {
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
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  refreshButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: '#00A651',
  },
  filterText: {
    fontSize: 11,
    color: '#8E8E8E',
    marginLeft: 4,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  insightsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  insightContent: {
    flex: 1,
    marginLeft: 8,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  insightDescription: {
    fontSize: 10,
    color: '#8E8E8E',
    marginTop: 2,
  },
  insightCount: {
    backgroundColor: '#F5F5F5',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  neighborInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  neighborAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  neighborDetails: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  neighborName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 6,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  neighborLocation: {
    fontSize: 11,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  proximityBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  proximityText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#00A651',
  },
  neighborBio: {
    fontSize: 12,
    color: '#2C2C2C',
    lineHeight: 16,
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  reasonsSection: {
    marginBottom: 12,
  },
  topReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 11,
    color: '#0066CC',
    marginLeft: 6,
    fontWeight: '600',
  },
  mutualConnectionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutualText: {
    fontSize: 10,
    color: '#8E8E8E',
    marginLeft: 6,
  },
  interestsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 9,
    color: '#00A651',
    fontWeight: '600',
  },
  moreInterests: {
    fontSize: 9,
    color: '#8E8E8E',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#0066CC',
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: '#00A651',
    marginLeft: 8,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    marginLeft: 4,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  closeButton: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonContent: {
    flex: 1,
    marginLeft: 8,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
  },
  strengthFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 2,
  },
  strengthScore: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066CC',
    marginLeft: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mutualConnectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  mutualAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mutualAvatarText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mutualName: {
    fontSize: 11,
    color: '#2C2C2C',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
});