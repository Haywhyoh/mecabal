// Centralized connection types and interfaces
export interface NeighborProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  estate: string;
  building?: string;
  apartment?: string;
  joinedDate: string;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  trustScore: number;
  profileImage?: string;
  connectionStats: {
    totalConnections: number;
    trustedConnections: number;
    mutualConnections: number;
    followerCount: number;
    followingCount: number;
  };
  badges: string[];
  interests: string[];
  bio?: string;
  lastSeen?: string;
  privacySettings: {
    allowConnections: boolean;
    requireApproval: boolean;
    showLocation: boolean;
    showActivity: boolean;
    showMutualConnections: boolean;
  };
}

export interface NeighborConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  initiatedBy: string;
  createdAt: string;
  acceptedAt?: string;
  metadata?: {
    proximityLevel: string;
    sharedInterests: string[];
    mutualConnections: number;
    notes?: string;
  };
}

export type ConnectionType = 'connect' | 'follow' | 'trusted' | 'colleague' | 'neighbor' | 'family';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type ConnectionAction = 'connect' | 'follow' | 'trust' | 'disconnect' | 'block' | 'accept' | 'decline';

export interface ConnectionTypeInfo {
  id: ConnectionType;
  name: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  permissions: string[];
}

export interface MutualConnection {
  neighbor: NeighborProfile;
  connectionWithCurrent: NeighborConnection;
  connectionWithTarget: NeighborConnection;
  connectionStrength: number;
  sharedInterests: string[];
  sharedActivities: string[];
  introducedDate?: string;
  lastInteraction?: string;
}

export interface ConnectionPath {
  id: string;
  path: NeighborProfile[];
  strength: number;
  commonInterests: string[];
  pathType: 'direct' | 'through_mutual' | 'through_community';
  description: string;
}

export interface NetworkAnalysis {
  totalMutualConnections: number;
  strongConnections: number;
  averageConnectionStrength: number;
  sharedNetworkDensity: number;
  connectionPaths: ConnectionPath[];
  networkOverlap: number;
  trustabilityScore: number;
}

export interface TrustLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  minScore: number;
  maxScore: number;
  benefits: string[];
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  connectionType: ConnectionType;
  message?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
  fromUserProfile: NeighborProfile;
}

export interface ConnectionNotification {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'trust_upgrade' | 'mutual_connection';
  fromUserId: string;
  targetUserId: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionRequired: boolean;
  relatedConnectionId?: string;
}

// Props interfaces for components
export interface MutualConnectionsDisplayProps {
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

export interface NeighborConnectionComponentProps {
  neighborProfile: NeighborProfile;
  currentConnection?: NeighborConnection;
  userId: string;
  compactMode?: boolean;
  showConnectionButton?: boolean;
  showTrustScore?: boolean;
  showRequestBadge?: boolean;
  pendingRequestCount?: number;
  onConnectionChange?: (action: ConnectionAction, connectionType: ConnectionType) => void;
  onRequestAction?: (action: 'accept' | 'decline', requestId: string) => void;
}

export interface ConnectionStatusBadgeProps {
  connection?: NeighborConnection;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export interface TrustScoreDisplayProps {
  trustScore: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}

export interface ConnectionActionButtonsProps {
  neighborProfile: NeighborProfile;
  currentConnection?: NeighborConnection;
  loading?: boolean;
  compactMode?: boolean;
  pendingRequestCount?: number;
  onAction: (action: ConnectionAction, connectionType?: ConnectionType) => void;
}

export interface NetworkAnalysisModalProps {
  visible: boolean;
  networkAnalysis: NetworkAnalysis | null;
  targetUserName: string;
  onClose: () => void;
}

// State management interfaces
export interface ConnectionState {
  connections: { [userId: string]: NeighborConnection };
  mutualConnections: { [pairKey: string]: MutualConnection[] };
  networkAnalyses: { [pairKey: string]: NetworkAnalysis };
  pendingRequests: ConnectionRequest[];
  notifications: ConnectionNotification[];
  loading: boolean;
  error: string | null;
}

export interface ConnectionContextType {
  state: ConnectionState;
  actions: {
    sendConnectionRequest: (targetUserId: string, connectionType: ConnectionType, message?: string) => Promise<void>;
    acceptConnectionRequest: (requestId: string) => Promise<void>;
    declineConnectionRequest: (requestId: string) => Promise<void>;
    upgradeConnection: (userId: string, newConnectionType: ConnectionType) => Promise<void>;
    disconnectFromUser: (userId: string) => Promise<void>;
    blockUser: (userId: string) => Promise<void>;
    loadMutualConnections: (currentUserId: string, targetUserId: string) => Promise<MutualConnection[]>;
    loadNetworkAnalysis: (currentUserId: string, targetUserId: string) => Promise<NetworkAnalysis>;
    markNotificationAsRead: (notificationId: string) => void;
    clearError: () => void;
  };
}

// Utility types
export type ConnectionStrengthLevel = 'weak' | 'moderate' | 'strong' | 'very_strong';
export type ProximityLevel = 'same_apartment' | 'same_building' | 'same_estate' | 'same_area' | 'same_city';

// Constants
export const CONNECTION_STRENGTH_THRESHOLDS = {
  VERY_STRONG: 90,
  STRONG: 75,
  MODERATE: 60,
  WEAK: 0,
} as const;

export const TRUST_SCORE_LEVELS = {
  ESTATE_ELDER: { min: 90, max: 100 },
  COMMUNITY_PILLAR: { min: 75, max: 89 },
  TRUSTED_NEIGHBOR: { min: 50, max: 74 },
  KNOWN_NEIGHBOR: { min: 25, max: 49 },
  NEW_NEIGHBOR: { min: 0, max: 24 },
} as const;