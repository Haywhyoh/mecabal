import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  TRUSTED_NEIGHBOR_LEVELS,
  CONNECTION_TYPES,
  NeighborProfile,
  NeighborConnection,
  TrustedNeighborLevel
} from '../constants/socialNetworkingData';

interface TrustedNeighborNetworkProps {
  userId: string;
  compactMode?: boolean;
  maxDisplay?: number;
  showNetworkStats?: boolean;
  onNetworkUpdate?: (networkSize: number, trustLevel: string) => void;
}

interface TrustedConnectionDetails extends NeighborConnection {
  neighbor: NeighborProfile;
  trustActions: TrustAction[];
  emergencyPermissions: EmergencyPermission[];
}

interface TrustAction {
  id: string;
  type: 'key_holding' | 'property_watching' | 'emergency_contact' | 'family_pickup' | 'business_reference';
  status: 'active' | 'paused' | 'completed';
  description: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface EmergencyPermission {
  id: string;
  type: 'gate_access' | 'apartment_key' | 'emergency_contact' | 'medical_proxy' | 'child_pickup';
  isActive: boolean;
  grantedDate: string;
  expiryDate?: string;
  conditions?: string[];
  emergencyNumbers?: string[];
}

interface NetworkStats {
  totalTrustedConnections: number;
  emergencyNetworkSize: number;
  averageTrustScore: number;
  networkTrustLevel: string;
  keyHoldingArrangements: number;
  emergencyContactPermissions: number;
}

export default function TrustedNeighborNetwork({
  userId,
  compactMode = false,
  maxDisplay = 10,
  showNetworkStats = true,
  onNetworkUpdate
}: TrustedNeighborNetworkProps) {
  const [trustedConnections, setTrustedConnections] = useState<TrustedConnectionDetails[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<TrustedConnectionDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const mockTrustedConnections: TrustedConnectionDetails[] = [
    {
      id: 'trust_1',
      fromUserId: userId,
      toUserId: 'neighbor_001',
      connectionType: 'trusted',
      status: 'accepted',
      initiatedBy: userId,
      createdAt: '2024-01-15',
      acceptedAt: '2024-01-16',
      metadata: {
        proximityLevel: 'same_building',
        sharedInterests: ['Estate Security', 'Emergency Response'],
        mutualConnections: 5
      },
      neighbor: {
        id: 'neighbor_001',
        firstName: 'Adebayo',
        lastName: 'Ogundimu',
        displayName: 'Adebayo O.',
        estate: 'Green Valley Estate',
        building: 'Block A',
        apartment: 'Apt 12',
        joinedDate: 'Dec 2023',
        isVerified: true,
        verificationLevel: 'premium',
        trustScore: 92,
        connectionStats: {
          totalConnections: 28,
          trustedConnections: 8,
          mutualConnections: 5,
          followerCount: 45,
          followingCount: 32
        },
        badges: ['verified_neighbor', 'safety_champion', 'estate_committee'],
        interests: ['Estate Security', 'Emergency Response', 'Community Events'],
        bio: 'Estate security coordinator, emergency response trained',
        lastSeen: '2 hours ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      trustActions: [
        {
          id: 'trust_action_1',
          type: 'property_watching',
          status: 'active',
          description: 'Watching apartment while traveling for work',
          startDate: '2024-01-20',
          endDate: '2024-02-05',
          notes: 'Check daily, water plants on weekends'
        },
        {
          id: 'trust_action_2',
          type: 'emergency_contact',
          status: 'active',
          description: 'Primary emergency contact for estate incidents',
          startDate: '2024-01-16'
        }
      ],
      emergencyPermissions: [
        {
          id: 'emergency_1',
          type: 'gate_access',
          isActive: true,
          grantedDate: '2024-01-16',
          conditions: ['Emergency situations only', 'Must notify immediately'],
          emergencyNumbers: ['+234-803-XXX-XXXX']
        }
      ]
    },
    {
      id: 'trust_2',
      fromUserId: userId,
      toUserId: 'neighbor_002',
      connectionType: 'trusted',
      status: 'accepted',
      initiatedBy: 'neighbor_002',
      createdAt: '2024-01-10',
      acceptedAt: '2024-01-12',
      metadata: {
        proximityLevel: 'same_estate',
        sharedInterests: ['Parenting', 'Child Education', 'Family Activities'],
        mutualConnections: 7
      },
      neighbor: {
        id: 'neighbor_002',
        firstName: 'Funmilayo',
        lastName: 'Adegoke',
        displayName: 'Funmi A.',
        estate: 'Green Valley Estate',
        building: 'Block C',
        apartment: 'Apt 7',
        joinedDate: 'Nov 2023',
        isVerified: true,
        verificationLevel: 'enhanced',
        trustScore: 88,
        connectionStats: {
          totalConnections: 22,
          trustedConnections: 6,
          mutualConnections: 7,
          followerCount: 38,
          followingCount: 25
        },
        badges: ['verified_neighbor', 'helpful_neighbor', 'nin_verified'],
        interests: ['Parenting', 'Child Education', 'Family Activities', 'Local Business'],
        bio: 'Mother of two, teacher, loves organizing family events',
        lastSeen: '1 day ago',
        privacySettings: {
          allowConnections: true,
          requireApproval: true,
          showLocation: true,
          showActivity: true,
          showMutualConnections: true
        }
      },
      trustActions: [
        {
          id: 'trust_action_3',
          type: 'child_pickup',
          status: 'active',
          description: 'Emergency child pickup from school',
          startDate: '2024-01-12',
          notes: 'Authorized for both primary and secondary schools'
        }
      ],
      emergencyPermissions: [
        {
          id: 'emergency_2',
          type: 'child_pickup',
          isActive: true,
          grantedDate: '2024-01-12',
          conditions: ['Emergency situations only', 'Must have written authorization'],
          emergencyNumbers: ['+234-701-XXX-XXXX', '+234-814-XXX-XXXX']
        }
      ]
    }
  ];

  const mockNetworkStats: NetworkStats = {
    totalTrustedConnections: 8,
    emergencyNetworkSize: 12,
    averageTrustScore: 87.5,
    networkTrustLevel: 'Community Pillar',
    keyHoldingArrangements: 3,
    emergencyContactPermissions: 5
  };

  useEffect(() => {
    loadTrustedNetwork();
  }, [userId]);

  useEffect(() => {
    if (networkStats && onNetworkUpdate) {
      onNetworkUpdate(networkStats.totalTrustedConnections, networkStats.networkTrustLevel);
    }
  }, [networkStats]);

  const loadTrustedNetwork = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setTrustedConnections(mockTrustedConnections);
        setNetworkStats(mockNetworkStats);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load trusted network');
    }
  };

  const refreshNetwork = async () => {
    setRefreshing(true);
    await loadTrustedNetwork();
    setRefreshing(false);
  };

  const getTrustLevel = (trustScore: number): TrustedNeighborLevel => {
    return TRUSTED_NEIGHBOR_LEVELS.find(level => 
      trustScore >= level.trustScore
    ) || TRUSTED_NEIGHBOR_LEVELS[0];
  };

  const handleConnectionDetails = (connection: TrustedConnectionDetails) => {
    setSelectedConnection(connection);
    setShowDetailsModal(true);
  };

  const handleEmergencySettings = (connection: TrustedConnectionDetails) => {
    setSelectedConnection(connection);
    setShowEmergencyModal(true);
  };

  const handleTrustAction = (action: 'revoke_trust' | 'pause_permissions' | 'update_permissions') => {
    if (!selectedConnection) return;

    const actionMessages = {
      revoke_trust: `Remove ${selectedConnection.neighbor.displayName} from your trusted network?`,
      pause_permissions: `Temporarily pause all permissions for ${selectedConnection.neighbor.displayName}?`,
      update_permissions: `Update emergency permissions for ${selectedConnection.neighbor.displayName}?`
    };

    Alert.alert(
      'Trust Network Action',
      actionMessages[action],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'revoke_trust' ? 'Remove' : 'Confirm',
          style: action === 'revoke_trust' ? 'destructive' : 'default',
          onPress: () => {
            // Simulate API call
            Alert.alert('Success', 'Trust network updated successfully');
            setShowDetailsModal(false);
            setShowEmergencyModal(false);
            refreshNetwork();
          }
        }
      ]
    );
  };

  const renderTrustedConnection = ({ item }: { item: TrustedConnectionDetails }) => {
    const trustLevel = getTrustLevel(item.neighbor.trustScore);
    const activeTrustActions = item.trustActions.filter(action => action.status === 'active').length;
    const activePermissions = item.emergencyPermissions.filter(permission => permission.isActive).length;

    return (
      <TouchableOpacity 
        style={styles.connectionCard}
        onPress={() => handleConnectionDetails(item)}
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
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#00A651" />
                )}
              </View>
              
              <View style={styles.locationSection}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#8E8E8E" />
                <Text style={styles.neighborLocation}>
                  {item.neighbor.building}, {item.neighbor.estate}
                </Text>
              </View>
              
              <View style={styles.trustSection}>
                <View style={[styles.trustBadge, { backgroundColor: trustLevel.color + '20' }]}>
                  <MaterialCommunityIcons name={trustLevel.icon as any} size={12} color={trustLevel.color} />
                  <Text style={[styles.trustText, { color: trustLevel.color }]}>
                    {item.neighbor.trustScore}
                  </Text>
                </View>
                
                <Text style={styles.connectionDate}>
                  Trusted since {new Date(item.acceptedAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => handleEmergencySettings(item)}
          >
            <MaterialCommunityIcons name="shield-account" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        <View style={styles.trustActionsSection}>
          <View style={styles.actionsRow}>
            <View style={styles.actionStat}>
              <MaterialCommunityIcons name="clipboard-check" size={14} color="#00A651" />
              <Text style={styles.actionStatText}>{activeTrustActions} active</Text>
            </View>
            
            <View style={styles.actionStat}>
              <MaterialCommunityIcons name="key" size={14} color="#FF6B35" />
              <Text style={styles.actionStatText}>{activePermissions} permissions</Text>
            </View>
            
            <View style={styles.actionStat}>
              <MaterialCommunityIcons name="account-group" size={14} color="#0066CC" />
              <Text style={styles.actionStatText}>{item.metadata?.mutualConnections} mutual</Text>
            </View>
          </View>

          {item.trustActions.slice(0, 2).map((action, index) => (
            <View key={action.id} style={styles.trustActionItem}>
              <MaterialCommunityIcons 
                name={getTrustActionIcon(action.type)} 
                size={12} 
                color="#8E8E8E" 
              />
              <Text style={styles.trustActionText}>{action.description}</Text>
              <View style={[styles.actionStatusBadge, { 
                backgroundColor: action.status === 'active' ? '#E8F5E8' : '#FFF4E6' 
              }]}>
                <Text style={[styles.actionStatusText, { 
                  color: action.status === 'active' ? '#00A651' : '#FF6B35' 
                }]}>
                  {action.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const getTrustActionIcon = (actionType: string) => {
    const icons = {
      key_holding: 'key',
      property_watching: 'home-eye',
      emergency_contact: 'phone-alert',
      child_pickup: 'car-child-seat',
      business_reference: 'briefcase-check'
    };
    return icons[actionType] || 'clipboard-check';
  };

  const renderNetworkStats = () => {
    if (!showNetworkStats || !networkStats) return null;

    return (
      <View style={styles.networkStatsCard}>
        <View style={styles.statsHeader}>
          <MaterialCommunityIcons name="shield-account-outline" size={20} color="#FF6B35" />
          <Text style={styles.statsTitle}>Trust Network Overview</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{networkStats.totalTrustedConnections}</Text>
            <Text style={styles.statLabel}>Trusted Neighbors</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{networkStats.emergencyNetworkSize}</Text>
            <Text style={styles.statLabel}>Emergency Network</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{networkStats.averageTrustScore}</Text>
            <Text style={styles.statLabel}>Avg Trust Score</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{networkStats.keyHoldingArrangements}</Text>
            <Text style={styles.statLabel}>Key Holdings</Text>
          </View>
        </View>
        
        <View style={styles.networkLevelSection}>
          <Text style={styles.networkLevelLabel}>Your Network Trust Level:</Text>
          <View style={styles.networkLevelBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
            <Text style={styles.networkLevelText}>{networkStats.networkTrustLevel}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderConnectionDetailsModal = () => {
    if (!selectedConnection) return null;

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
            <Text style={styles.modalTitle}>Trust Connection Details</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Neighbor Profile Section */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Neighbor Profile</Text>
              <View style={styles.neighborProfileCard}>
                <View style={styles.neighborInfo}>
                  <View style={styles.neighborAvatar}>
                    <Text style={styles.avatarText}>
                      {selectedConnection.neighbor.firstName.charAt(0)}{selectedConnection.neighbor.lastName.charAt(0)}
                    </Text>
                  </View>
                  
                  <View style={styles.neighborDetails}>
                    <Text style={styles.neighborName}>{selectedConnection.neighbor.displayName}</Text>
                    <Text style={styles.neighborLocation}>
                      {selectedConnection.neighbor.building}, {selectedConnection.neighbor.estate}
                    </Text>
                    <Text style={styles.neighborBio}>{selectedConnection.neighbor.bio}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Active Trust Actions */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Active Trust Actions</Text>
              {selectedConnection.trustActions.map((action) => (
                <View key={action.id} style={styles.trustActionCard}>
                  <View style={styles.actionHeader}>
                    <MaterialCommunityIcons 
                      name={getTrustActionIcon(action.type)} 
                      size={16} 
                      color="#FF6B35" 
                    />
                    <Text style={styles.actionTitle}>{action.description}</Text>
                    <View style={[styles.actionStatusBadge, { 
                      backgroundColor: action.status === 'active' ? '#E8F5E8' : '#FFF4E6' 
                    }]}>
                      <Text style={[styles.actionStatusText, { 
                        color: action.status === 'active' ? '#00A651' : '#FF6B35' 
                      }]}>
                        {action.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.actionDates}>
                    {action.startDate} {action.endDate && ` - ${action.endDate}`}
                  </Text>
                  {action.notes && <Text style={styles.actionNotes}>{action.notes}</Text>}
                </View>
              ))}
            </View>

            {/* Emergency Permissions */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Emergency Permissions</Text>
              {selectedConnection.emergencyPermissions.map((permission) => (
                <View key={permission.id} style={styles.permissionCard}>
                  <View style={styles.permissionHeader}>
                    <MaterialCommunityIcons name="shield-key" size={16} color="#0066CC" />
                    <Text style={styles.permissionTitle}>{permission.type.replace('_', ' ').toUpperCase()}</Text>
                    <View style={[styles.permissionStatusBadge, { 
                      backgroundColor: permission.isActive ? '#E8F5E8' : '#F5F5F5' 
                    }]}>
                      <Text style={[styles.permissionStatusText, { 
                        color: permission.isActive ? '#00A651' : '#8E8E8E' 
                      }]}>
                        {permission.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.permissionDate}>Granted: {permission.grantedDate}</Text>
                  {permission.conditions && (
                    <View style={styles.conditionsSection}>
                      <Text style={styles.conditionsTitle}>Conditions:</Text>
                      {permission.conditions.map((condition, index) => (
                        <Text key={index} style={styles.conditionText}>• {condition}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleTrustAction('pause_permissions')}
            >
              <Text style={styles.secondaryButtonText}>Pause Permissions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleTrustAction('revoke_trust')}
            >
              <Text style={styles.dangerButtonText}>Remove Trust</Text>
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
        <Text style={styles.loadingText}>Loading trusted network...</Text>
      </View>
    );
  }

  if (compactMode) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons name="shield-account" size={16} color="#FF6B35" />
          <Text style={styles.compactTitle}>Trusted Network</Text>
          <Text style={styles.compactCount}>({trustedConnections.length})</Text>
        </View>
        
        <View style={styles.compactConnections}>
          {trustedConnections.slice(0, maxDisplay).map((connection) => (
            <TouchableOpacity 
              key={connection.id}
              style={styles.compactConnectionItem}
              onPress={() => handleConnectionDetails(connection)}
            >
              <View style={styles.compactAvatar}>
                <Text style={styles.compactAvatarText}>
                  {connection.neighbor.firstName.charAt(0)}
                </Text>
              </View>
              <Text style={styles.compactConnectionName}>
                {connection.neighbor.displayName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
          
          {trustedConnections.length > maxDisplay && (
            <TouchableOpacity style={styles.compactMoreButton}>
              <Text style={styles.compactMoreText}>+{trustedConnections.length - maxDisplay}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderNetworkStats()}
      
      <View style={styles.connectionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trusted Neighbors ({trustedConnections.length})</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshNetwork}
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#00A651" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={trustedConnections}
          renderItem={renderTrustedConnection}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refreshNetwork}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="shield-account-outline" size={48} color="#8E8E8E" />
              <Text style={styles.emptyStateTitle}>No Trusted Neighbors</Text>
              <Text style={styles.emptyStateText}>
                Build trust with your neighbors to create a reliable support network
              </Text>
            </View>
          }
        />
      </View>

      {renderConnectionDetailsModal()}
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
  compactCount: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  compactConnections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  compactConnectionItem: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactConnectionName: {
    fontSize: 10,
    color: '#2C2C2C',
    textAlign: 'center',
  },
  compactMoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMoreText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E8E',
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
  networkStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 2,
  },
  networkLevelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
  },
  networkLevelLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  networkLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  connectionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  refreshButton: {
    padding: 4,
  },
  connectionCard: {
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
    backgroundColor: '#FF6B35',
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
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  connectionDate: {
    fontSize: 9,
    color: '#8E8E8E',
  },
  emergencyButton: {
    padding: 8,
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
  },
  trustActionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionStatText: {
    fontSize: 10,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  trustActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  trustActionText: {
    fontSize: 11,
    color: '#2C2C2C',
    flex: 1,
    marginLeft: 6,
  },
  actionStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionStatusText: {
    fontSize: 9,
    fontWeight: '600',
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
  neighborProfileCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  neighborBio: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  trustActionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    marginLeft: 8,
  },
  actionDates: {
    fontSize: 10,
    color: '#8E8E8E',
    marginBottom: 4,
  },
  actionNotes: {
    fontSize: 11,
    color: '#2C2C2C',
    fontStyle: 'italic',
  },
  permissionCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    marginLeft: 8,
  },
  permissionStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  permissionStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  permissionDate: {
    fontSize: 10,
    color: '#8E8E8E',
    marginBottom: 4,
  },
  conditionsSection: {
    marginTop: 4,
  },
  conditionsTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  conditionText: {
    fontSize: 10,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  dangerButton: {
    backgroundColor: '#FFE6E6',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
});