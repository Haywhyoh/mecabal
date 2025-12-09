import type { 
  NeighborProfile, 
  NeighborConnection, 
  MutualConnection, 
  NetworkAnalysis,
  ConnectionType,
  ConnectionStatus,
  ConnectionAction,
  TrustLevel,
  ConnectionRequest,
  ConnectionStrengthLevel,
} from '../types/connectionTypes';
import { 
  CONNECTION_STRENGTH_THRESHOLDS,
  TRUST_SCORE_LEVELS
} from '../types/connectionTypes';
import { 
  connectionApi,
} from './api/connectionApi';
import type {
  Connection as ApiConnection,
  ConnectionFilter,
  PaginatedConnections,
  ConnectionRecommendation,
  CreateConnectionRequest,
  NeighborProfile as ApiNeighborProfile,
} from './api/connectionApi';

export class ConnectionService {
  // API Methods - Instance methods for API calls
  async getConnections(filter?: ConnectionFilter): Promise<PaginatedConnections> {
    return connectionApi.getConnections(filter);
  }

  async getConnectionRequests(): Promise<{ incoming: ApiConnection[]; outgoing: ApiConnection[] }> {
    return connectionApi.getConnectionRequests();
  }

  async getRecommendations(limit: number = 10): Promise<ConnectionRecommendation[]> {
    return connectionApi.getRecommendations(limit);
  }

  async sendConnectionRequest(
    toUserId: string,
    connectionType: 'connect' | 'follow' | 'trusted' | 'neighbor' | 'colleague' | 'family',
    metadata?: Record<string, any>
  ): Promise<ApiConnection> {
    const request: CreateConnectionRequest = {
      toUserId,
      connectionType,
      metadata,
    };
    return connectionApi.sendConnectionRequest(request);
  }

  async acceptConnection(connectionId: string): Promise<ApiConnection> {
    return connectionApi.acceptConnection(connectionId);
  }

  async rejectConnection(connectionId: string): Promise<void> {
    return connectionApi.rejectConnection(connectionId);
  }

  async removeConnection(connectionId: string): Promise<void> {
    return connectionApi.removeConnection(connectionId);
  }

  async discoverNeighbors(filter?: ConnectionFilter): Promise<PaginatedConnections> {
    return connectionApi.discoverNeighbors(filter);
  }

  async getMutualConnections(userId: string): Promise<ApiNeighborProfile[]> {
    return connectionApi.getMutualConnections(userId);
  }
  
  // Trust Level Calculations
  static getTrustLevel(trustScore: number): TrustLevel {
    const trustLevels: TrustLevel[] = [
      {
        id: 'estate_elder',
        name: 'Estate Elder',
        description: 'Highly respected community leader',
        icon: 'crown',
        color: '#FFD700',
        minScore: TRUST_SCORE_LEVELS.ESTATE_ELDER.min,
        maxScore: TRUST_SCORE_LEVELS.ESTATE_ELDER.max,
        benefits: ['Community leadership', 'Moderation privileges', 'Priority support']
      },
      {
        id: 'community_pillar',
        name: 'Community Pillar',
        description: 'Trusted and active community member',
        icon: 'shield-star',
        color: '#0066CC',
        minScore: TRUST_SCORE_LEVELS.COMMUNITY_PILLAR.min,
        maxScore: TRUST_SCORE_LEVELS.COMMUNITY_PILLAR.max,
        benefits: ['Event hosting', 'Business verification', 'Extended network']
      },
      {
        id: 'trusted_neighbor',
        name: 'Trusted Neighbor',
        description: 'Reliable and trustworthy neighbor',
        icon: 'shield-check',
        color: '#00A651',
        minScore: TRUST_SCORE_LEVELS.TRUSTED_NEIGHBOR.min,
        maxScore: TRUST_SCORE_LEVELS.TRUSTED_NEIGHBOR.max,
        benefits: ['Private groups', 'Service recommendations', 'Safety alerts']
      },
      {
        id: 'known_neighbor',
        name: 'Known Neighbor',
        description: 'Familiar face in the community',
        icon: 'account-check',
        color: '#FF6B35',
        minScore: TRUST_SCORE_LEVELS.KNOWN_NEIGHBOR.min,
        maxScore: TRUST_SCORE_LEVELS.KNOWN_NEIGHBOR.max,
        benefits: ['Basic connections', 'Community access', 'Profile visibility']
      },
      {
        id: 'new_neighbor',
        name: 'New Neighbor',
        description: 'New to the community',
        icon: 'account-outline',
        color: '#8E8E8E',
        minScore: TRUST_SCORE_LEVELS.NEW_NEIGHBOR.min,
        maxScore: TRUST_SCORE_LEVELS.NEW_NEIGHBOR.max,
        benefits: ['Basic access', 'Getting started guide', 'Welcome support']
      }
    ];

    return trustLevels.find(level => 
      trustScore >= level.minScore && trustScore <= level.maxScore
    ) || trustLevels[trustLevels.length - 1];
  }

  // Connection Strength Calculations
  static getConnectionStrengthLevel(strength: number): ConnectionStrengthLevel {
    if (strength >= CONNECTION_STRENGTH_THRESHOLDS.VERY_STRONG) return 'very_strong';
    if (strength >= CONNECTION_STRENGTH_THRESHOLDS.STRONG) return 'strong';
    if (strength >= CONNECTION_STRENGTH_THRESHOLDS.MODERATE) return 'moderate';
    return 'weak';
  }

  static getConnectionStrengthColor(strength: number): string {
    const level = this.getConnectionStrengthLevel(strength);
    const colors = {
      very_strong: '#00A651',
      strong: '#0066CC', 
      moderate: '#FF6B35',
      weak: '#8E8E8E'
    };
    return colors[level];
  }

  static getConnectionStrengthLabel(strength: number): string {
    const level = this.getConnectionStrengthLevel(strength);
    const labels = {
      very_strong: 'Very Strong',
      strong: 'Strong',
      moderate: 'Moderate', 
      weak: 'Weak'
    };
    return labels[level];
  }

  // Connection Type Information
  static getConnectionTypeInfo(connectionType: ConnectionType) {
    const connectionTypes = {
      connect: {
        id: 'connect' as ConnectionType,
        name: 'Connected',
        description: 'Basic neighborhood connection',
        icon: 'account-multiple',
        color: '#0066CC',
        level: 1,
        permissions: ['basic_profile', 'public_posts']
      },
      follow: {
        id: 'follow' as ConnectionType,
        name: 'Following',
        description: 'Following their updates',
        icon: 'account-plus',
        color: '#7B68EE',
        level: 0,
        permissions: ['public_posts']
      },
      trusted: {
        id: 'trusted' as ConnectionType,
        name: 'Trusted',
        description: 'Trusted neighbor connection',
        icon: 'shield-account',
        color: '#00A651',
        level: 3,
        permissions: ['full_profile', 'private_posts', 'direct_contact', 'recommendations']
      },
      colleague: {
        id: 'colleague' as ConnectionType,
        name: 'Colleague',
        description: 'Professional connection',
        icon: 'briefcase-account',
        color: '#FF6B35',
        level: 2,
        permissions: ['professional_profile', 'business_posts', 'networking']
      },
      neighbor: {
        id: 'neighbor' as ConnectionType,
        name: 'Neighbor',
        description: 'Close neighbor relationship',
        icon: 'home-account',
        color: '#228B22',
        level: 2,
        permissions: ['neighbor_profile', 'local_posts', 'safety_alerts']
      },
      family: {
        id: 'family' as ConnectionType,
        name: 'Family',
        description: 'Family member',
        icon: 'account-heart',
        color: '#E74C3C',
        level: 4,
        permissions: ['full_access', 'family_posts', 'emergency_contact']
      }
    };

    return connectionTypes[connectionType];
  }

  // Network Analysis Calculations
  static calculateNetworkAnalysis(
    currentUserId: string,
    targetUserId: string,
    mutualConnections: MutualConnection[]
  ): NetworkAnalysis {
    const strongConnections = mutualConnections.filter(
      conn => conn.connectionStrength >= CONNECTION_STRENGTH_THRESHOLDS.STRONG
    ).length;

    const averageStrength = mutualConnections.length > 0 
      ? mutualConnections.reduce((sum, conn) => sum + conn.connectionStrength, 0) / mutualConnections.length
      : 0;

    // Mock calculation - in real app, this would use actual network data
    const sharedNetworkDensity = Math.min(mutualConnections.length / 20, 1);
    const networkOverlap = mutualConnections.length > 0 ? sharedNetworkDensity * 0.5 : 0;
    const trustabilityScore = Math.min(averageStrength * 1.1, 100);

    const connectionPaths = this.generateConnectionPaths(mutualConnections);

    return {
      totalMutualConnections: mutualConnections.length,
      strongConnections,
      averageConnectionStrength: Math.round(averageStrength * 10) / 10,
      sharedNetworkDensity,
      networkOverlap,
      trustabilityScore: Math.round(trustabilityScore),
      connectionPaths
    };
  }

  private static generateConnectionPaths(mutualConnections: MutualConnection[]) {
    // Generate connection paths based on mutual connections
    return mutualConnections.slice(0, 3).map((connection, index) => ({
      id: `path_${index + 1}`,
      path: [connection.neighbor],
      strength: connection.connectionStrength,
      commonInterests: connection.sharedInterests.slice(0, 2),
      pathType: connection.connectionStrength >= CONNECTION_STRENGTH_THRESHOLDS.STRONG 
        ? 'through_mutual' as const 
        : 'through_community' as const,
      description: connection.connectionStrength >= CONNECTION_STRENGTH_THRESHOLDS.STRONG
        ? `Strong connection through ${connection.sharedInterests[0] || 'shared activities'}`
        : `Community connection through ${connection.neighbor.estate}`
    }));
  }

  // Connection Status Management
  static getConnectionStatus(connection?: NeighborConnection): ConnectionStatus | 'none' {
    return connection?.status || 'none';
  }

  static canUpgradeConnection(currentType?: ConnectionType, targetType?: ConnectionType): boolean {
    if (!currentType || !targetType) return false;
    
    const currentInfo = this.getConnectionTypeInfo(currentType);
    const targetInfo = this.getConnectionTypeInfo(targetType);
    
    return targetInfo.level > currentInfo.level;
  }

  static getUpgradeOptions(currentType?: ConnectionType): ConnectionType[] {
    if (!currentType) return ['connect', 'follow'];
    
    const currentInfo = this.getConnectionTypeInfo(currentType);
    const allTypes = ['follow', 'connect', 'neighbor', 'colleague', 'trusted', 'family'] as ConnectionType[];
    
    return allTypes.filter(type => {
      const typeInfo = this.getConnectionTypeInfo(type);
      return typeInfo.level > currentInfo.level;
    });
  }

  // Request Management  
  static getActionLabel(action: ConnectionAction): string {
    const labels = {
      connect: 'Connect',
      follow: 'Follow', 
      trust: 'Add to Trusted',
      disconnect: 'Disconnect',
      block: 'Block',
      accept: 'Accept',
      decline: 'Decline'
    };
    return labels[action];
  }

  static getActionMessage(action: ConnectionAction, neighborName: string): string {
    const messages = {
      connect: `Send connection request to ${neighborName}?`,
      follow: `Start following ${neighborName}?`,
      trust: `Add ${neighborName} to your trusted neighbors?`,
      disconnect: `Disconnect from ${neighborName}?`,
      block: `Block ${neighborName}? This will remove any existing connection.`,
      accept: `Accept connection request from ${neighborName}?`,
      decline: `Decline connection request from ${neighborName}?`
    };
    return messages[action];
  }

  static isDestructiveAction(action: ConnectionAction): boolean {
    return ['disconnect', 'block', 'decline'].includes(action);
  }

  // Mock Data Generators (for development)
  static generateMockMutualConnections(
    currentUserId: string, 
    targetUserId: string, 
    count: number = 3
  ): MutualConnection[] {
    // This would be replaced with actual API calls
    const mockProfiles: NeighborProfile[] = [
      {
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
      }
      // Add more mock profiles as needed
    ];

    return mockProfiles.slice(0, count).map((profile, index) => ({
      neighbor: profile,
      connectionWithCurrent: {
        id: `conn_current_${index}`,
        fromUserId: currentUserId,
        toUserId: profile.id,
        connectionType: 'connect',
        status: 'accepted',
        initiatedBy: currentUserId,
        createdAt: '2024-01-10',
        acceptedAt: '2024-01-12'
      },
      connectionWithTarget: {
        id: `conn_target_${index}`,
        fromUserId: targetUserId,
        toUserId: profile.id,
        connectionType: 'trusted',
        status: 'accepted',
        initiatedBy: profile.id,
        createdAt: '2024-01-05',
        acceptedAt: '2024-01-06'
      },
      connectionStrength: 85 + Math.random() * 10,
      sharedInterests: profile.interests.slice(0, 3),
      sharedActivities: ['Community Meeting', 'Safety Training'],
      introducedDate: '2024-01-15',
      lastInteraction: '2 days ago'
    }));
  }

  // Validation helpers
  static validateConnectionRequest(
    fromProfile: NeighborProfile,
    toProfile: NeighborProfile,
    connectionType: ConnectionType
  ): { valid: boolean; error?: string } {
    if (!toProfile.privacySettings.allowConnections) {
      return { valid: false, error: 'This user is not accepting new connections' };
    }

    if (connectionType === 'trusted' && fromProfile.trustScore < 50) {
      return { valid: false, error: 'Trust score too low for trusted connection' };
    }

    return { valid: true };
  }

  static formatConnectionCount(count: number): string {
    if (count === 0) return 'No connections';
    if (count === 1) return '1 connection';
    if (count < 1000) return `${count} connections`;
    return `${Math.round(count / 100) / 10}k connections`;
  }

  static formatLastSeen(lastSeen: string): string {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }
}