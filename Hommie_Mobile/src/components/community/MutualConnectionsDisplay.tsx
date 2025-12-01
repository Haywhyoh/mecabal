import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  NeighborProfile,
  NeighborConnection,
  CONNECTION_TYPES
} from '../constants/socialNetworkingData';

interface MutualConnectionsDisplayProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName?: string;
  showCount?: boolean;
  compactMode?: boolean;
  maxDisplay?: number;
  showConnectionStrength?: boolean;
  onConnectionPress?: (neighborId: string) => void;
  onConnectionAnalysis?: (mutualCount: number, connectionStrength: number) => void;
}

interface MutualConnection {
  neighbor: NeighborProfile;
  connectionWithCurrent: NeighborConnection;
  connectionWithTarget: NeighborConnection;
  connectionStrength: number;
  sharedInterests: string[];
  sharedActivities: string[];
  introducedDate?: string;
  lastInteraction?: string;
}

interface ConnectionPath {
  id: string;
  path: NeighborProfile[];
  strength: number;
  commonInterests: string[];
  pathType: 'direct' | 'through_mutual' | 'through_community';
  description: string;
}

interface NetworkAnalysis {
  totalMutualConnections: number;
  strongConnections: number;
  averageConnectionStrength: number;
  sharedNetworkDensity: number;
  connectionPaths: ConnectionPath[];
  networkOverlap: number;
  trustabilityScore: number;
}

export default function MutualConnectionsDisplay({
  currentUserId,
  targetUserId,
  targetUserName = 'this neighbor',
  showCount = true,
  compactMode = false,
  maxDisplay = 5,
  showConnectionStrength = true,
  onConnectionPress,
  onConnectionAnalysis
}: MutualConnectionsDisplayProps) {
  const [mutualConnections, setMutualConnections] = useState<MutualConnection[]>([]);
  const [networkAnalysis, setNetworkAnalysis] = useState<NetworkAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedView, setExpandedView] = useState(false);

  // Mock data - replace with actual API calls
  const mockMutualConnections: MutualConnection[] = [
    {
      neighbor: {
        id: 'mutual_001',
        firstName: 'Kemi',
        lastName: 'Oladele',
        displayName: 'Kemi O.',
        estate: 'Green Valley Estate',
        building: 'Block B',
        apartment: 'Apt 15',
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
        badges: ['verified_neighbor', 'helpful_neighbor', 'estate_committee'],
        interests: ['Event Planning', 'Community Service', 'Estate Security', 'Local Business'],
        bio: 'Estate committee member, loves organizing community events',
        lastSeen: '3 hours ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      connectionWithCurrent: {
        id: 'conn_current_001',
        fromUserId: currentUserId,
        toUserId: 'mutual_001',
        connectionType: 'connect',
        status: 'accepted',
        initiatedBy: currentUserId,
        createdAt: '2024-01-10',
        acceptedAt: '2024-01-12',
        metadata: {
          proximityLevel: 'same_estate',
          sharedInterests: ['Event Planning', 'Community Service'],
          mutualConnections: 8
        }
      },
      connectionWithTarget: {
        id: 'conn_target_001',
        fromUserId: targetUserId,
        toUserId: 'mutual_001',
        connectionType: 'trusted',
        status: 'accepted',
        initiatedBy: 'mutual_001',
        createdAt: '2024-01-05',
        acceptedAt: '2024-01-06',
        metadata: {
          proximityLevel: 'same_building',
          sharedInterests: ['Estate Security', 'Event Planning'],
          mutualConnections: 15
        }
      },
      connectionStrength: 92,
      sharedInterests: ['Event Planning', 'Community Service', 'Estate Security'],
      sharedActivities: ['Estate Committee Meeting', 'Security Training', 'New Year Event'],
      introducedDate: '2024-01-15',
      lastInteraction: '2 days ago'
    },
    {
      neighbor: {
        id: 'mutual_002',
        firstName: 'Chidi',
        lastName: 'Nwosu',
        displayName: 'Chidi N.',
        estate: 'Green Valley Estate',
        building: 'Block A',
        apartment: 'Apt 8',
        joinedDate: 'Dec 2023',
        isVerified: true,
        verificationLevel: 'premium',
        trustScore: 78,
        connectionStats: {
          totalConnections: 18,
          trustedConnections: 5,
          mutualConnections: 7,
          followerCount: 25,
          followingCount: 22
        },
        badges: ['verified_neighbor', 'nin_verified', 'business_verified'],
        interests: ['Professional Networking', 'Tech Industry', 'Local Business', 'Generator Maintenance'],
        bio: 'Software engineer, tech consultant for estate automation',
        lastSeen: '1 day ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      connectionWithCurrent: {
        id: 'conn_current_002',
        fromUserId: currentUserId,
        toUserId: 'mutual_002',
        connectionType: 'colleague',
        status: 'accepted',
        initiatedBy: 'mutual_002',
        createdAt: '2024-01-20',
        acceptedAt: '2024-01-21',
        metadata: {
          proximityLevel: 'same_estate',
          sharedInterests: ['Professional Networking', 'Tech Industry'],
          mutualConnections: 4
        }
      },
      connectionWithTarget: {
        id: 'conn_target_002',
        fromUserId: targetUserId,
        toUserId: 'mutual_002',
        connectionType: 'connect',
        status: 'accepted',
        initiatedBy: targetUserId,
        createdAt: '2024-01-18',
        acceptedAt: '2024-01-19',
        metadata: {
          proximityLevel: 'same_estate',
          sharedInterests: ['Generator Maintenance', 'Tech Industry'],
          mutualConnections: 6
        }
      },
      connectionStrength: 74,
      sharedInterests: ['Professional Networking', 'Tech Industry', 'Local Business'],
      sharedActivities: ['Tech Meetup', 'Generator Maintenance', 'Professional Workshop'],
      introducedDate: '2024-01-25',
      lastInteraction: '5 days ago'
    },
    {
      neighbor: {
        id: 'mutual_003',
        firstName: 'Bisi',
        lastName: 'Adebayo',
        displayName: 'Bisi A.',
        estate: 'Green Valley Estate',
        building: 'Block C',
        apartment: 'Apt 3',
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
        interests: ['Safety Advocacy', 'Family Activities', 'Parenting', 'Community Events'],
        bio: 'Safety coordinator, mother of three, community advocate',
        lastSeen: '6 hours ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      connectionWithCurrent: {
        id: 'conn_current_003',
        fromUserId: currentUserId,
        toUserId: 'mutual_003',
        connectionType: 'trusted',
        status: 'accepted',
        initiatedBy: currentUserId,
        createdAt: '2024-01-08',
        acceptedAt: '2024-01-09',
        metadata: {
          proximityLevel: 'same_estate',
          sharedInterests: ['Safety Advocacy', 'Community Events'],
          mutualConnections: 11
        }
      },
      connectionWithTarget: {
        id: 'conn_target_003',
        fromUserId: targetUserId,
        toUserId: 'mutual_003',
        connectionType: 'trusted',
        status: 'accepted',
        initiatedBy: 'mutual_003',
        createdAt: '2024-01-12',
        acceptedAt: '2024-01-13',
        metadata: {
          proximityLevel: 'same_estate',
          sharedInterests: ['Safety Advocacy', 'Family Activities'],
          mutualConnections: 14
        }
      },
      connectionStrength: 96,
      sharedInterests: ['Safety Advocacy', 'Family Activities', 'Community Events'],
      sharedActivities: ['Safety Training', 'Emergency Drill', 'Family Fun Day', 'Community Meeting'],
      introducedDate: '2024-01-14',
      lastInteraction: '1 day ago'
    }
  ];

  const mockNetworkAnalysis: NetworkAnalysis = {
    totalMutualConnections: 8,
    strongConnections: 5,
    averageConnectionStrength: 84.2,
    sharedNetworkDensity: 0.68,
    networkOverlap: 0.34,
    trustabilityScore: 87,
    connectionPaths: [
      {
        id: 'path_1',
        path: [mockMutualConnections[0].neighbor, mockMutualConnections[2].neighbor],
        strength: 95,
        commonInterests: ['Safety Advocacy', 'Community Events'],
        pathType: 'through_mutual',
        description: 'Strong connection through safety and community activities'
      },
      {
        id: 'path_2',
        path: [mockMutualConnections[1].neighbor],
        strength: 74,
        commonInterests: ['Professional Networking', 'Tech Industry'],
        pathType: 'through_community',
        description: 'Professional connection through tech community'
      }
    ]
  };

  useEffect(() => {
    loadMutualConnections();
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    if (networkAnalysis && onConnectionAnalysis) {
      onConnectionAnalysis(
        networkAnalysis.totalMutualConnections,
        networkAnalysis.averageConnectionStrength
      );
    }
  }, [networkAnalysis]);

  const loadMutualConnections = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setMutualConnections(mockMutualConnections);
        setNetworkAnalysis(mockNetworkAnalysis);
        setLoading(false);
      }, 800);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load mutual connections');
    }
  };

  const getConnectionTypeDetails = (connectionType: string) => {
    return CONNECTION_TYPES.find(type => type.id === connectionType) || CONNECTION_TYPES[0];
  };

  const getConnectionStrengthColor = (strength: number) => {
    if (strength >= 90) return '#00A651';
    if (strength >= 75) return '#0066CC';
    if (strength >= 60) return '#FF6B35';
    return '#8E8E8E';
  };

  const getConnectionStrengthLabel = (strength: number) => {
    if (strength >= 90) return 'Very Strong';
    if (strength >= 75) return 'Strong';
    if (strength >= 60) return 'Moderate';
    return 'Weak';
  };

  const handleConnectionPress = (neighborId: string) => {
    if (onConnectionPress) {
      onConnectionPress(neighborId);
    } else {
      Alert.alert('Profile', `Opening ${neighborId}'s profile...`);
    }
  };

  const handleShowAnalysis = () => {
    setShowAnalysisModal(true);
  };

  const renderMutualConnection = ({ item, index }: { item: MutualConnection; index: number }) => {
    const currentConnectionType = getConnectionTypeDetails(item.connectionWithCurrent.connectionType);
    const targetConnectionType = getConnectionTypeDetails(item.connectionWithTarget.connectionType);
    const strengthColor = getConnectionStrengthColor(item.connectionStrength);

    return (
      <TouchableOpacity 
        style={styles.connectionCard}
        onPress={() => handleConnectionPress(item.neighbor.id)}
      >
        <View style={styles.connectionHeader}>
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
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#00A651" />
                )}
              </View>
              
              <View style={styles.locationSection}>
                <MaterialCommunityIcons name="map-marker" size={10} color="#8E8E8E" />
                <Text style={styles.neighborLocation}>
                  {item.neighbor.building}, {item.neighbor.estate}
                </Text>
              </View>
              
              {showConnectionStrength && (
                <View style={styles.strengthSection}>
                  <View style={[styles.strengthBadge, { backgroundColor: strengthColor + '20' }]}>
                    <MaterialCommunityIcons name="connection" size={10} color={strengthColor} />
                    <Text style={[styles.strengthText, { color: strengthColor }]}>
                      {getConnectionStrengthLabel(item.connectionStrength)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.connectionTypes}>
            <View style={[styles.connectionTypeBadge, { backgroundColor: currentConnectionType.color + '20' }]}>
              <MaterialCommunityIcons 
                name={currentConnectionType.icon as any} 
                size={10} 
                color={currentConnectionType.color} 
              />
              <Text style={[styles.connectionTypeText, { color: currentConnectionType.color }]}>
                You
              </Text>
            </View>
            
            <View style={[styles.connectionTypeBadge, { backgroundColor: targetConnectionType.color + '20' }]}>
              <MaterialCommunityIcons 
                name={targetConnectionType.icon as any} 
                size={10} 
                color={targetConnectionType.color} 
              />
              <Text style={[styles.connectionTypeText, { color: targetConnectionType.color }]}>
                {targetUserName.split(' ')[0]}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sharedInterestsSection}>
          <Text style={styles.sharedInterestsLabel}>Shared interests:</Text>
          <View style={styles.interestsList}>
            {item.sharedInterests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {item.sharedInterests.length > 3 && (
              <Text style={styles.moreInterests}>+{item.sharedInterests.length - 3}</Text>
            )}
          </View>
        </View>

        {item.lastInteraction && (
          <View style={styles.lastInteractionSection}>
            <MaterialCommunityIcons name="clock-outline" size={10} color="#8E8E8E" />
            <Text style={styles.lastInteractionText}>
              Last interaction: {item.lastInteraction}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNetworkAnalysisModal = () => {
    if (!networkAnalysis) return null;

    return (
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAnalysisModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Network Analysis</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Network Overview */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Network Overview</Text>
              <View style={styles.analysisGrid}>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisNumber}>{networkAnalysis.totalMutualConnections}</Text>
                  <Text style={styles.analysisLabel}>Mutual Connections</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisNumber}>{networkAnalysis.strongConnections}</Text>
                  <Text style={styles.analysisLabel}>Strong Connections</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisNumber}>{networkAnalysis.averageConnectionStrength.toFixed(1)}</Text>
                  <Text style={styles.analysisLabel}>Avg. Strength</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisNumber}>{networkAnalysis.trustabilityScore}</Text>
                  <Text style={styles.analysisLabel}>Trust Score</Text>
                </View>
              </View>
            </View>

            {/* Network Density */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Network Density</Text>
              <View style={styles.densityCard}>
                <View style={styles.densityIndicator}>
                  <View 
                    style={[
                      styles.densityBar, 
                      { width: `${networkAnalysis.sharedNetworkDensity * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.densityText}>
                  {(networkAnalysis.sharedNetworkDensity * 100).toFixed(0)}% network overlap
                </Text>
              </View>
              <Text style={styles.densityDescription}>
                You and {targetUserName} share a significant portion of your social networks, 
                indicating strong community ties and potential for trustworthy relationship.
              </Text>
            </View>

            {/* Connection Paths */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Connection Paths</Text>
              {networkAnalysis.connectionPaths.map((path, index) => (
                <View key={path.id} style={styles.pathCard}>
                  <View style={styles.pathHeader}>
                    <MaterialCommunityIcons 
                      name={path.pathType === 'through_mutual' ? 'account-group' : 'community'} 
                      size={16} 
                      color="#0066CC" 
                    />
                    <Text style={styles.pathStrength}>{path.strength}% strength</Text>
                  </View>
                  <Text style={styles.pathDescription}>{path.description}</Text>
                  <View style={styles.pathInterests}>
                    {path.commonInterests.map((interest, idx) => (
                      <View key={idx} style={styles.pathInterestTag}>
                        <Text style={styles.pathInterestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Trust Recommendations */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Trust Recommendations</Text>
              <View style={styles.recommendationCard}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#00A651" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>High Trust Potential</Text>
                  <Text style={styles.recommendationText}>
                    Based on your shared connections and network analysis, {targetUserName} shows 
                    high potential for a trustworthy relationship. Consider upgrading to a trusted connection.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={connectionStyles.container}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <MaterialCommunityIcons name="account-group" size={16} color={connectionColors.secondary} />
            <View style={[{ backgroundColor: connectionColors.backgroundSecondary, height: 14, width: 120, borderRadius: 4 }]} />
          </View>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.connectionCard, { opacity: 0.6 }]}>
            <View style={styles.connectionHeader}>
              <View style={styles.neighborInfo}>
                <View style={[styles.neighborAvatar, { backgroundColor: connectionColors.backgroundSecondary }]} />
                <View style={styles.neighborDetails}>
                  <View style={[{ backgroundColor: connectionColors.backgroundSecondary, height: 12, borderRadius: 4, marginBottom: 4, width: '60%' }]} />
                  <View style={[{ backgroundColor: connectionColors.backgroundSecondary, height: 10, width: '80%', borderRadius: 4 }]} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (mutualConnections.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="account-group-outline" size={32} color="#8E8E8E" />
        <Text style={styles.emptyStateText}>
          No mutual connections with {targetUserName}
        </Text>
      </View>
    );
  }

  if (compactMode) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity 
          style={styles.compactHeader}
          onPress={() => setExpandedView(!expandedView)}
        >
          <MaterialCommunityIcons name="account-group" size={14} color="#0066CC" />
          <Text style={styles.compactTitle}>
            {mutualConnections.length} mutual connection{mutualConnections.length !== 1 ? 's' : ''}
          </Text>
          <MaterialCommunityIcons 
            name={expandedView ? "chevron-up" : "chevron-down"} 
            size={14} 
            color="#8E8E8E" 
          />
        </TouchableOpacity>
        
        {expandedView && (
          <View style={styles.compactExpanded}>
            {mutualConnections.slice(0, maxDisplay).map((connection, index) => (
              <TouchableOpacity 
                key={connection.neighbor.id}
                style={styles.compactConnectionItem}
                onPress={() => handleConnectionPress(connection.neighbor.id)}
              >
                <View style={styles.compactAvatar}>
                  <Text style={styles.compactAvatarText}>
                    {connection.neighbor.firstName.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.compactConnectionName}>
                  {connection.neighbor.displayName}
                </Text>
                {showConnectionStrength && (
                  <View style={[
                    styles.compactStrengthDot,
                    { backgroundColor: ConnectionService.getStrengthColor(connection.connectionStrength) }
                  ]} />
                )}
              </TouchableOpacity>
            ))}
            
            {mutualConnections.length > maxDisplay && (
              <Text style={styles.compactMoreText}>
                +{mutualConnections.length - maxDisplay} more
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={connectionStyles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <MaterialCommunityIcons name="account-group" size={16} color="#0066CC" />
          <Text style={styles.headerTitle}>
            Mutual Connections {showCount && `(${mutualConnections.length})`}
          </Text>
        </View>
        
        {networkAnalysis && (
          <TouchableOpacity 
            style={styles.analysisButton}
            onPress={handleShowAnalysis}
          >
            <MaterialCommunityIcons name="chart-line" size={14} color="#00A651" />
            <Text style={styles.analysisButtonText}>Analysis</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={mutualConnections}
        renderItem={renderMutualConnection}
        keyExtractor={(item) => item.neighbor.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!compactMode}
      />

      {renderNetworkAnalysisModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact mode specific styles
  compactContainer: {
    backgroundColor: connectionColors.backgroundSecondary,
    borderRadius: 8,
    padding: connectionSizes.spacingSmall,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTitle: {
    ...connectionStyles.captionText,
    fontWeight: '600',
    color: connectionColors.textPrimary,
    flex: 1,
    marginLeft: 6,
  },
  compactExpanded: {
    marginTop: connectionSizes.spacingSmall,
    paddingTop: connectionSizes.spacingSmall,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  compactConnectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  compactAvatar: {
    width: connectionSizes.avatarTiny,
    height: connectionSizes.avatarTiny,
    borderRadius: connectionSizes.avatarTiny / 2,
    backgroundColor: connectionColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: connectionSizes.spacingXSmall,
  },
  compactAvatarText: {
    fontSize: 9,
    fontWeight: '600',
    color: connectionColors.textLight,
  },
  compactConnectionName: {
    fontSize: 11,
    color: connectionColors.textPrimary,
    flex: 1,
  },
  compactStrengthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  compactMoreText: {
    fontSize: 10,
    color: connectionColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: connectionSizes.spacingXSmall,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: connectionSizes.spacingMedium,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...connectionStyles.secondaryText,
    fontWeight: '600',
    color: connectionColors.textPrimary,
    marginLeft: 6,
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: connectionSizes.spacingXSmall,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analysisButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: connectionColors.primary,
    marginLeft: 3,
  },
  
  // Connection card styles
  connectionCard: {
    backgroundColor: connectionColors.backgroundSecondary,
    borderRadius: 8,
    padding: connectionSizes.spacingSmall,
    marginBottom: connectionSizes.spacingXSmall,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: connectionSizes.spacingXSmall,
  },
  neighborInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  neighborAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: connectionColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: connectionColors.textLight,
  },
  neighborDetails: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  neighborName: {
    fontSize: 12,
    fontWeight: '600',
    color: connectionColors.textPrimary,
    marginRight: 4,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  neighborLocation: {
    fontSize: 10,
    color: connectionColors.textSecondary,
    marginLeft: 3,
  },
  strengthSection: {
    marginTop: 2,
  },
  strengthBadge: {
    ...connectionStyles.badge,
    ...connectionStyles.smallBadge,
  },
  strengthText: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
  },
  connectionTypes: {
    alignItems: 'flex-end',
    gap: 2,
  },
  
  // Shared interests
  sharedInterestsSection: {
    marginBottom: 6,
  },
  sharedInterestsLabel: {
    fontSize: 9,
    color: connectionColors.textSecondary,
    marginBottom: 4,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  moreInterests: {
    fontSize: 8,
    color: connectionColors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Last interaction
  lastInteractionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastInteractionText: {
    fontSize: 9,
    color: connectionColors.textSecondary,
    marginLeft: 3,
  },
});