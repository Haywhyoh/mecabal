import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { safeGoBack } from '../../utils/navigationUtils';
import { 
  CONNECTION_TYPES,
  TRUSTED_NEIGHBOR_LEVELS,
  NIGERIAN_NEIGHBOR_INTERESTS,
  CONNECTION_PRIVACY_LEVELS,
  NeighborConnection,
  NeighborProfile,
  ConnectionRecommendation
} from '../../constants/socialNetworkingData';

const { width } = Dimensions.get('window');

interface NeighborConnectionsScreenProps {
  userId?: string;
}

export default function NeighborConnectionsScreen({ userId = 'user_123' }: NeighborConnectionsScreenProps) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'connections' | 'discover' | 'requests'>('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - in real app, this would come from API
  const [myConnections] = useState<NeighborConnection[]>([
    {
      id: '1',
      fromUserId: userId,
      toUserId: 'neighbor_001',
      connectionType: 'trusted',
      status: 'accepted',
      initiatedBy: userId,
      createdAt: '2024-01-15',
      acceptedAt: '2024-01-15',
      metadata: {
        howTheyMet: 'Estate security meeting',
        sharedInterests: ['Estate Security', 'Emergency Response'],
        mutualConnections: 5,
        proximityLevel: 'same_building'
      }
    },
    {
      id: '2',
      fromUserId: 'neighbor_002',
      toUserId: userId,
      connectionType: 'connect',
      status: 'accepted',
      initiatedBy: 'neighbor_002',
      createdAt: '2024-02-10',
      acceptedAt: '2024-02-10',
      metadata: {
        howTheyMet: 'Community event',
        sharedInterests: ['Event Planning', 'Family Activities'],
        mutualConnections: 3,
        proximityLevel: 'same_estate'
      }
    },
    {
      id: '3',
      fromUserId: userId,
      toUserId: 'neighbor_003',
      connectionType: 'follow',
      status: 'accepted',
      initiatedBy: userId,
      createdAt: '2024-03-05',
      acceptedAt: '2024-03-05',
      metadata: {
        sharedInterests: ['Local Business', 'Professional Networking'],
        mutualConnections: 2,
        proximityLevel: 'nearby_estate'
      }
    }
  ]);

  const [neighborProfiles] = useState<NeighborProfile[]>([
    {
      id: 'neighbor_001',
      firstName: 'Adebayo',
      lastName: 'Ogundimu',
      displayName: 'Adebayo O.',
      estate: 'Victoria Island Estate',
      building: 'Block A',
      apartment: 'Flat 5',
      joinedDate: '2024-01-10',
      isVerified: true,
      verificationLevel: 'enhanced',
      trustScore: 85,
      connectionStats: {
        totalConnections: 23,
        trustedConnections: 8,
        mutualConnections: 5,
        followerCount: 12,
        followingCount: 15
      },
      badges: ['safety_champion', 'verified_neighbor', 'estate_committee'],
      interests: ['Estate Security', 'Emergency Response', 'Community Service'],
      bio: 'Estate security coordinator and emergency response volunteer. Always ready to help neighbors.',
      lastSeen: '2 hours ago',
      privacySettings: {
        allowConnections: true,
        requireApproval: true,
        showLocation: true,
        showActivity: true,
        showMutualConnections: true
      }
    },
    {
      id: 'neighbor_002',
      firstName: 'Sarah',
      lastName: 'Adamu',
      displayName: 'Sarah A.',
      estate: 'Victoria Island Estate',
      building: 'Block B',
      apartment: 'Flat 12',
      joinedDate: '2024-02-01',
      isVerified: true,
      verificationLevel: 'premium',
      trustScore: 78,
      connectionStats: {
        totalConnections: 18,
        trustedConnections: 6,
        mutualConnections: 3,
        followerCount: 20,
        followingCount: 12
      },
      badges: ['helpful_neighbor', 'verified_neighbor', 'top_contributor'],
      interests: ['Event Planning', 'Family Activities', 'Nigerian Cuisine'],
      bio: 'Event organizer and mother of two. Love bringing the community together!',
      lastSeen: '1 day ago',
      privacySettings: {
        allowConnections: true,
        requireApproval: false,
        showLocation: true,
        showActivity: true,
        showMutualConnections: true
      }
    },
    {
      id: 'neighbor_003',
      firstName: 'Emeka',
      lastName: 'Okoro',
      displayName: 'Emeka K.',
      estate: 'Lekki Gardens',
      joinedDate: '2024-03-01',
      isVerified: true,
      verificationLevel: 'basic',
      trustScore: 65,
      connectionStats: {
        totalConnections: 12,
        trustedConnections: 3,
        mutualConnections: 2,
        followerCount: 8,
        followingCount: 15
      },
      badges: ['business_verified', 'verified_neighbor'],
      interests: ['Local Business', 'Professional Networking', 'Tech Industry'],
      bio: 'Tech entrepreneur and local business owner. Open to professional networking.',
      lastSeen: '3 days ago',
      privacySettings: {
        allowConnections: true,
        requireApproval: true,
        showLocation: false,
        showActivity: true,
        showMutualConnections: false
      }
    }
  ]);

  const [connectionRequests] = useState<NeighborConnection[]>([
    {
      id: 'req_1',
      fromUserId: 'neighbor_004',
      toUserId: userId,
      connectionType: 'connect',
      status: 'pending',
      initiatedBy: 'neighbor_004',
      createdAt: '1 day ago',
      metadata: {
        howTheyMet: 'New neighbor introduction',
        sharedInterests: ['Home Improvement', 'Gardening'],
        mutualConnections: 1,
        proximityLevel: 'same_building'
      }
    },
    {
      id: 'req_2',
      fromUserId: 'neighbor_005',
      toUserId: userId,
      connectionType: 'trusted',
      status: 'pending',
      initiatedBy: 'neighbor_005',
      createdAt: '2 days ago',
      metadata: {
        howTheyMet: 'Emergency response volunteer',
        sharedInterests: ['Emergency Response', 'Safety Advocacy'],
        mutualConnections: 3,
        proximityLevel: 'same_estate'
      }
    }
  ]);

  const [recommendations] = useState<ConnectionRecommendation[]>([
    {
      id: 'rec_1',
      neighbor: {
        id: 'neighbor_006',
        firstName: 'Fatima',
        lastName: 'Mohammed',
        displayName: 'Fatima M.',
        estate: 'Victoria Island Estate',
        building: 'Block C',
        joinedDate: '2024-01-20',
        isVerified: true,
        verificationLevel: 'enhanced',
        trustScore: 82,
        connectionStats: {
          totalConnections: 25,
          trustedConnections: 10,
          mutualConnections: 4,
          followerCount: 18,
          followingCount: 22
        },
        badges: ['helpful_neighbor', 'safety_champion'],
        interests: ['Estate Security', 'Community Service', 'Family Activities'],
        lastSeen: '1 hour ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      recommendationScore: 85,
      reasons: [
        { type: 'proximity', description: 'Lives in the same estate', strength: 30 },
        { type: 'mutual_connections', description: 'You have 4 mutual connections', strength: 25 },
        { type: 'shared_interests', description: 'Shares your interest in estate security', strength: 20 },
        { type: 'safety_network', description: 'Important for your safety network', strength: 10 }
      ],
      mutualConnections: [neighborProfiles[0], neighborProfiles[1]],
      sharedInterests: ['Estate Security', 'Community Service'],
      proximityInfo: {
        distance: 0.2,
        location: 'Block C',
        sameBuilding: false,
        sameEstate: true
      }
    }
  ]);

  const getConnectionsByType = (type: string) => {
    if (type === 'all') return myConnections;
    return myConnections.filter(conn => conn.connectionType === type);
  };

  const getNeighborProfile = (neighborId: string): NeighborProfile | undefined => {
    return neighborProfiles.find(profile => profile.id === neighborId);
  };

  const getTrustLevel = (trustScore: number): string => {
    if (trustScore >= 90) return 'estate_elder';
    if (trustScore >= 75) return 'community_pillar';
    if (trustScore >= 50) return 'trusted_neighbor';
    if (trustScore >= 25) return 'known_neighbor';
    return 'new_neighbor';
  };

  const handleConnectionAction = (action: 'accept' | 'reject' | 'block', connectionId: string) => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Connection`,
      `Are you sure you want to ${action} this connection request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            Alert.alert('Success', `Connection request ${action}ed successfully.`);
          }
        }
      ]
    );
  };

  const handleSendConnectionRequest = (neighborId: string, connectionType: string) => {
    const neighbor = getNeighborProfile(neighborId);
    Alert.alert(
      'Send Connection Request',
      `Send a ${connectionType} request to ${neighbor?.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Alert.alert('Request Sent', `Your ${connectionType} request has been sent to ${neighbor?.displayName}.`);
          }
        }
      ]
    );
  };

  const renderConnectionItem = (connection: NeighborConnection) => {
    const neighbor = getNeighborProfile(
      connection.fromUserId === userId ? connection.toUserId : connection.fromUserId
    );
    if (!neighbor) return null;

    const connectionTypeInfo = CONNECTION_TYPES.find(type => type.id === connection.connectionType);
    const trustLevel = TRUSTED_NEIGHBOR_LEVELS.find(level => level.id === getTrustLevel(neighbor.trustScore));

    return (
      <TouchableOpacity key={connection.id} style={styles.connectionItem}>
        <View style={styles.connectionHeader}>
          <View style={styles.neighborAvatar}>
            {neighbor.profileImage ? (
              <Text>📷</Text>
            ) : (
              <Text style={styles.avatarText}>{neighbor.firstName.charAt(0)}{neighbor.lastName.charAt(0)}</Text>
            )}
          </View>
          
          <View style={styles.connectionInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.neighborName}>{neighbor.displayName}</Text>
              {neighbor.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
              )}
            </View>
            
            <View style={styles.connectionDetails}>
              <View style={[styles.connectionTypeBadge, { backgroundColor: connectionTypeInfo?.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={connectionTypeInfo?.icon as any} 
                  size={12} 
                  color={connectionTypeInfo?.color} 
                />
                <Text style={[styles.connectionTypeText, { color: connectionTypeInfo?.color }]}>
                  {connectionTypeInfo?.name}
                </Text>
              </View>
              
              <Text style={styles.connectionDate}>Since {connection.acceptedAt || connection.createdAt}</Text>
            </View>
            
            <View style={styles.neighborMeta}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#8E8E8E" />
              <Text style={styles.neighborLocation}>
                {neighbor.building ? `${neighbor.building}, ` : ''}{neighbor.estate}
              </Text>
            </View>
          </View>
          
          <View style={styles.connectionActions}>
            <View style={[styles.trustBadge, { backgroundColor: trustLevel?.color + '20' }]}>
              <MaterialCommunityIcons name={trustLevel?.icon as any} size={14} color={trustLevel?.color} />
              <Text style={[styles.trustText, { color: trustLevel?.color }]}>{neighbor.trustScore}</Text>
            </View>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="message" size={16} color="#0066CC" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="dots-vertical" size={16} color="#8E8E8E" />
            </TouchableOpacity>
          </View>
        </View>
        
        {connection.metadata?.sharedInterests && connection.metadata.sharedInterests.length > 0 && (
          <View style={styles.sharedInterests}>
            <Text style={styles.sharedInterestsLabel}>Shared interests:</Text>
            <View style={styles.interestTags}>
              {connection.metadata.sharedInterests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
              {connection.metadata.sharedInterests.length > 3 && (
                <Text style={styles.moreInterests}>+{connection.metadata.sharedInterests.length - 3} more</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderConnectionRequest = (request: NeighborConnection) => {
    const neighbor = getNeighborProfile(request.fromUserId);
    if (!neighbor) return null;

    const connectionTypeInfo = CONNECTION_TYPES.find(type => type.id === request.connectionType);

    return (
      <View key={request.id} style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <View style={styles.neighborAvatar}>
            <Text style={styles.avatarText}>{neighbor.firstName.charAt(0)}{neighbor.lastName.charAt(0)}</Text>
          </View>
          
          <View style={styles.requestInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.neighborName}>{neighbor.displayName}</Text>
              {neighbor.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
              )}
            </View>
            
            <Text style={styles.requestText}>
              wants to {connectionTypeInfo?.name.toLowerCase()} with you
            </Text>
            
            <View style={styles.requestMeta}>
              <MaterialCommunityIcons name="clock" size={12} color="#8E8E8E" />
              <Text style={styles.requestTime}>{request.createdAt}</Text>
              {request.metadata?.mutualConnections && (
                <>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.mutualConnections}>
                    {request.metadata.mutualConnections} mutual connections
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleConnectionAction('reject', request.id)}
          >
            <Text style={styles.rejectButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleConnectionAction('accept', request.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRecommendation = (recommendation: ConnectionRecommendation) => {
    const { neighbor } = recommendation;

    return (
      <View key={recommendation.id} style={styles.recommendationItem}>
        <View style={styles.recommendationHeader}>
          <View style={styles.neighborAvatar}>
            <Text style={styles.avatarText}>
              {neighbor.firstName.charAt(0)}{neighbor.lastName.charAt(0)}
            </Text>
          </View>
          
          <View style={styles.recommendationInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.neighborName}>{neighbor.displayName}</Text>
              {neighbor.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
              )}
            </View>
            
            <Text style={styles.neighborLocation}>
              {recommendation.proximityInfo.location} • {recommendation.proximityInfo.distance}km away
            </Text>
            
            <View style={styles.recommendationReasons}>
              {recommendation.reasons.slice(0, 2).map((reason, index) => (
                <Text key={index} style={styles.reasonText}>• {reason.description}</Text>
              ))}
            </View>
          </View>
          
          <View style={styles.recommendationActions}>
            <Text style={styles.recommendationScore}>{recommendation.recommendationScore}% match</Text>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => handleSendConnectionRequest(neighbor.id, 'connect')}
            >
              <MaterialCommunityIcons name="account-plus" size={16} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {recommendation.sharedInterests.length > 0 && (
          <View style={styles.sharedInterests}>
            <Text style={styles.sharedInterestsLabel}>Shared interests:</Text>
            <View style={styles.interestTags}>
              {recommendation.sharedInterests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderConnectionsTab = () => {
    const filteredConnections = getConnectionsByType(selectedFilter);
    const totalConnections = myConnections.length;
    const trustedConnections = myConnections.filter(conn => conn.connectionType === 'trusted').length;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Connection Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalConnections}</Text>
            <Text style={styles.statLabel}>Total Connections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trustedConnections}</Text>
            <Text style={styles.statLabel}>Trusted Neighbors</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Following You</Text>
          </View>
        </View>

        {/* Connection Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
                All ({totalConnections})
              </Text>
            </TouchableOpacity>
            
            {CONNECTION_TYPES.map(type => {
              const count = myConnections.filter(conn => conn.connectionType === type.id).length;
              if (count === 0) return null;
              
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.filterChip, selectedFilter === type.id && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(type.id)}
                >
                  <MaterialCommunityIcons 
                    name={type.icon as any} 
                    size={14} 
                    color={selectedFilter === type.id ? '#FFFFFF' : type.color} 
                  />
                  <Text style={[styles.filterText, selectedFilter === type.id && styles.filterTextActive]}>
                    {type.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Connections List */}
        <View style={styles.connectionsList}>
          {filteredConnections.map(renderConnectionItem)}
        </View>
      </ScrollView>
    );
  };

  const renderDiscoverTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search neighbors by name, interests, or location..."
          placeholderTextColor="#8E8E8E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <Text style={styles.sectionSubtitle}>Neighbors you might want to connect with</Text>
        
        {recommendations.map(renderRecommendation)}
      </View>

      {/* Nearby Neighbors */}
      <View style={styles.nearbySection}>
        <Text style={styles.sectionTitle}>Nearby Neighbors</Text>
        <Text style={styles.sectionSubtitle}>People in your building and estate</Text>
        
        <TouchableOpacity style={styles.exploreButton}>
          <MaterialCommunityIcons name="map-search" size={20} color="#00A651" />
          <Text style={styles.exploreButtonText}>Explore Nearby</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#00A651" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRequestsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Pending Requests */}
      <View style={styles.requestsSection}>
        <Text style={styles.sectionTitle}>Connection Requests ({connectionRequests.length})</Text>
        <Text style={styles.sectionSubtitle}>Neighbors who want to connect with you</Text>
        
        {connectionRequests.length > 0 ? (
          connectionRequests.map(renderConnectionRequest)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-clock" size={48} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptySubtitle}>
              When neighbors send you connection requests, they'll appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Sent Requests */}
      <View style={styles.sentRequestsSection}>
        <Text style={styles.sectionTitle}>Sent Requests</Text>
        <Text style={styles.sectionSubtitle}>Requests you've sent to neighbors</Text>
        
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-clock-outline" size={48} color="#8E8E8E" />
          <Text style={styles.emptyTitle}>No Sent Requests</Text>
          <Text style={styles.emptySubtitle}>
            Connection requests you send will be tracked here.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => safeGoBack(navigation)}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Connections</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="cog" size={24} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <MaterialCommunityIcons 
            name="account-group" 
            size={20} 
            color={activeTab === 'connections' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
            Connections
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <MaterialCommunityIcons 
            name="compass" 
            size={20} 
            color={activeTab === 'discover' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <MaterialCommunityIcons 
            name="account-clock" 
            size={20} 
            color={activeTab === 'requests' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {connectionRequests.length > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>{connectionRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'connections' && renderConnectionsTab()}
      {activeTab === 'discover' && renderDiscoverTab()}
      {activeTab === 'requests' && renderRequestsTab()}
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
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeTab: {
    borderBottomColor: '#00A651',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00A651',
    fontWeight: '600',
  },
  requestsBadge: {
    position: 'absolute',
    top: 6,
    right: width / 6 - 20,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#00A651',
  },
  filterText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionsList: {
    paddingHorizontal: 16,
  },
  connectionItem: {
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
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  connectionInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  neighborName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 6,
  },
  connectionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  connectionTypeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  connectionDate: {
    fontSize: 11,
    color: '#8E8E8E',
  },
  neighborMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neighborLocation: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  connectionActions: {
    alignItems: 'flex-end',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  actionButton: {
    padding: 6,
    marginBottom: 4,
  },
  sharedInterests: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sharedInterestsLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 6,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  interestTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  interestTagText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
  },
  moreInterests: {
    fontSize: 10,
    color: '#8E8E8E',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  recommendationsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 16,
  },
  recommendationItem: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationReasons: {
    marginTop: 6,
  },
  reasonText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 2,
  },
  recommendationActions: {
    alignItems: 'flex-end',
  },
  recommendationScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A651',
    marginBottom: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A651',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  nearbySection: {
    paddingHorizontal: 16,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
    marginHorizontal: 8,
  },
  requestsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  requestItem: {
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
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 6,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  metaDivider: {
    fontSize: 12,
    color: '#8E8E8E',
    marginHorizontal: 6,
  },
  mutualConnections: {
    fontSize: 12,
    color: '#0066CC',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  acceptButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sentRequestsSection: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
});