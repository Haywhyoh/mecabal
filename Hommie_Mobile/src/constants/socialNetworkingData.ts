// Social Networking Data for Neighbor Connections
// Nigerian-focused neighbor relationship and connection system

export interface NeighborConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  connectionType: 'follow' | 'connect' | 'trusted' | 'family' | 'colleague';
  status: 'pending' | 'accepted' | 'blocked' | 'rejected';
  initiatedBy: string;
  createdAt: string;
  acceptedAt?: string;
  metadata?: {
    howTheyMet?: string;
    sharedInterests?: string[];
    mutualConnections?: number;
    proximityLevel?: 'same_building' | 'same_estate' | 'nearby_estate' | 'same_area';
  };
}

export interface TrustedNeighborLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: string[];
  privileges: string[];
  minConnections: number;
  trustScore: number;
}

export interface NeighborProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  profileImage?: string;
  estate: string;
  building?: string;
  apartment?: string;
  joinedDate: string;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  trustScore: number;
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
  lastSeen: string;
  privacySettings: {
    allowConnections: boolean;
    requireApproval: boolean;
    showLocation: boolean;
    showActivity: boolean;
    showMutualConnections: boolean;
  };
}

export interface ConnectionRecommendation {
  id: string;
  neighbor: NeighborProfile;
  recommendationScore: number;
  reasons: {
    type: 'proximity' | 'mutual_connections' | 'shared_interests' | 'activity_similarity' | 'safety_network';
    description: string;
    strength: number;
  }[];
  mutualConnections: NeighborProfile[];
  sharedInterests: string[];
  proximityInfo: {
    distance: number;
    location: string;
    sameBuilding: boolean;
    sameEstate: boolean;
  };
}

export interface SocialActivity {
  id: string;
  type: 'connection_made' | 'event_attended_together' | 'mutual_help' | 'shared_post' | 'group_activity';
  participants: string[];
  description: string;
  timestamp: string;
  location?: string;
  pointsEarned?: number;
}

// Connection Types with Nigerian Context
export const CONNECTION_TYPES = [
  {
    id: 'follow',
    name: 'Follow',
    description: 'Stay updated with their activities',
    icon: 'account-plus',
    color: '#0066CC',
    isReciprocal: false,
    requiresApproval: false,
    privileges: ['view_public_posts', 'see_activity_updates']
  },
  {
    id: 'connect',
    name: 'Connect',
    description: 'Build a mutual neighbor relationship',
    icon: 'account-multiple-plus',
    color: '#00A651',
    isReciprocal: true,
    requiresApproval: true,
    privileges: ['direct_messaging', 'event_invitations', 'favor_requests']
  },
  {
    id: 'trusted',
    name: 'Trusted Neighbor',
    description: 'Close neighbor for important matters',
    icon: 'shield-account',
    color: '#FF6B35',
    isReciprocal: true,
    requiresApproval: true,
    privileges: ['emergency_contacts', 'key_holding', 'property_watching', 'family_notifications']
  },
  {
    id: 'family',
    name: 'Family Member',
    description: 'Immediate or extended family',
    icon: 'account-heart',
    color: '#FF69B4',
    isReciprocal: true,
    requiresApproval: false,
    privileges: ['all_access', 'emergency_override', 'family_group_access']
  },
  {
    id: 'colleague',
    name: 'Work Colleague',
    description: 'Professional neighbor relationship',
    icon: 'briefcase-account',
    color: '#7B68EE',
    isReciprocal: true,
    requiresApproval: true,
    privileges: ['professional_network', 'business_referrals', 'work_carpooling']
  }
];

// Trusted Neighbor Levels
export const TRUSTED_NEIGHBOR_LEVELS: TrustedNeighborLevel[] = [
  {
    id: 'new_neighbor',
    name: 'New Neighbor',
    description: 'Recently joined the community',
    icon: 'account',
    color: '#8E8E8E',
    requirements: ['Verified phone number', 'Basic profile completion'],
    privileges: ['Basic connections', 'Public area access'],
    minConnections: 0,
    trustScore: 0
  },
  {
    id: 'known_neighbor',
    name: 'Known Neighbor',
    description: 'Established presence in the community',
    icon: 'account-check',
    color: '#00A651',
    requirements: ['5+ connections', '1+ month in estate', 'Positive ratings'],
    privileges: ['Group invitations', 'Event hosting', 'Favor requests'],
    minConnections: 5,
    trustScore: 25
  },
  {
    id: 'trusted_neighbor',
    name: 'Trusted Neighbor',
    description: 'Reliable and well-connected community member',
    icon: 'account-star',
    color: '#0066CC',
    requirements: ['15+ connections', '3+ months in estate', 'High ratings', 'Safety contributions'],
    privileges: ['Emergency network', 'Property watching', 'Committee nominations'],
    minConnections: 15,
    trustScore: 50
  },
  {
    id: 'community_pillar',
    name: 'Community Pillar',
    description: 'Highly trusted and respected neighbor',
    icon: 'account-tie',
    color: '#FF6B35',
    requirements: ['30+ connections', '6+ months in estate', 'Excellent ratings', 'Leadership roles'],
    privileges: ['Key holding', 'Emergency response', 'Conflict mediation', 'New neighbor mentoring'],
    minConnections: 30,
    trustScore: 75
  },
  {
    id: 'estate_elder',
    name: 'Estate Elder',
    description: 'Most trusted and experienced community member',
    icon: 'crown',
    color: '#FFD700',
    requirements: ['50+ connections', '1+ year in estate', 'Outstanding reputation', 'Community leadership'],
    privileges: ['All privileges', 'Emergency coordination', 'Estate representation', 'Wisdom council'],
    minConnections: 50,
    trustScore: 100
  }
];

// Nigerian-specific interests for connection matching
export const NIGERIAN_NEIGHBOR_INTERESTS = [
  // Safety & Security
  'Estate Security', 'Neighborhood Watch', 'Emergency Response', 'Safety Advocacy',
  
  // Social & Cultural
  'Nigerian Cuisine', 'Traditional Music', 'Cultural Events', 'Religious Activities',
  'Yoruba Culture', 'Igbo Culture', 'Hausa Culture', 'Nigerian Movies (Nollywood)',
  
  // Professional & Business
  'Local Business', 'Professional Networking', 'Entrepreneurship', 'Tech Industry',
  'Banking & Finance', 'Oil & Gas', 'Healthcare', 'Education',
  
  // Family & Lifestyle
  'Parenting', 'Child Education', 'Family Activities', 'Elderly Care',
  'Home Improvement', 'Gardening', 'Cooking', 'Fashion',
  
  // Community Activities
  'Event Planning', 'Community Service', 'Environmental Care', 'Youth Mentoring',
  'Sports & Fitness', 'Book Clubs', 'Religious Groups', 'Social Clubs',
  
  // Local Services
  'Generator Maintenance', 'Water Supply', 'Waste Management', 'Transportation',
  'Shopping Groups', 'Bulk Buying', 'Local Markets', 'Service Recommendations',
  
  // Technology & Innovation
  'Smart Home', 'Internet & WiFi', 'Solar Power', 'Technology Reviews',
  'Digital Payments', 'Online Shopping', 'Social Media', 'Digital Skills'
];

// Connection recommendation reasons
export const RECOMMENDATION_REASONS = {
  proximity: {
    same_building: { score: 40, description: 'Lives in your building' },
    same_estate: { score: 30, description: 'Lives in your estate' },
    nearby_estate: { score: 20, description: 'Lives in a nearby estate' },
    same_area: { score: 15, description: 'Lives in your area' }
  },
  mutual_connections: {
    high: { score: 35, description: 'Many mutual connections' },
    medium: { score: 25, description: 'Several mutual connections' },
    low: { score: 15, description: 'Few mutual connections' }
  },
  shared_interests: {
    high: { score: 30, description: 'Many shared interests' },
    medium: { score: 20, description: 'Some shared interests' },
    low: { score: 10, description: 'Few shared interests' }
  },
  activity_similarity: {
    high: { score: 25, description: 'Similar activity patterns' },
    medium: { score: 15, description: 'Some activity overlap' },
    low: { score: 10, description: 'Occasional activity overlap' }
  },
  safety_network: {
    important: { score: 20, description: 'Important for safety network' },
    helpful: { score: 15, description: 'Could enhance safety network' },
    relevant: { score: 10, description: 'Relevant for safety network' }
  }
};

// Privacy settings for connections
export const CONNECTION_PRIVACY_LEVELS = [
  {
    id: 'open',
    name: 'Open to All',
    description: 'Anyone can connect with you',
    icon: 'earth',
    settings: {
      allowConnections: true,
      requireApproval: false,
      showLocation: true,
      showActivity: true,
      showMutualConnections: true
    }
  },
  {
    id: 'selective',
    name: 'Selective',
    description: 'Connections require your approval',
    icon: 'account-check',
    settings: {
      allowConnections: true,
      requireApproval: true,
      showLocation: true,
      showActivity: true,
      showMutualConnections: true
    }
  },
  {
    id: 'restricted',
    name: 'Restricted',
    description: 'Limited visibility and connections',
    icon: 'lock',
    settings: {
      allowConnections: true,
      requireApproval: true,
      showLocation: false,
      showActivity: false,
      showMutualConnections: false
    }
  },
  {
    id: 'private',
    name: 'Private',
    description: 'No new connections accepted',
    icon: 'lock-outline',
    settings: {
      allowConnections: false,
      requireApproval: true,
      showLocation: false,
      showActivity: false,
      showMutualConnections: false
    }
  }
];

// Nigerian estate-specific connection contexts
export const NIGERIAN_CONNECTION_CONTEXTS = [
  'Moved in recently and looking to connect',
  'Active in estate security matters',
  'Organizes community events',
  'Helps with generator/power issues',
  'Good for emergency situations',
  'Professional colleague in the estate',
  'Children attend same school',
  'Shares similar interests',
  'Helpful with local recommendations',
  'Active in estate committee',
  'Trusted for key holding',
  'Reliable for property watching',
  'Good neighbor for favors',
  'Similar work schedule for carpooling',
  'Shares bulk buying interests'
];

// Connection status messages
export const CONNECTION_STATUS_MESSAGES = {
  pending: {
    sent: 'Connection request sent',
    received: 'wants to connect with you'
  },
  accepted: {
    message: 'You are now connected neighbors'
  },
  rejected: {
    message: 'Connection request declined'
  },
  blocked: {
    message: 'This neighbor has been blocked'
  }
};

// Social networking metrics
export const SOCIAL_METRICS = {
  connection_points: {
    new_connection: 10,
    trusted_upgrade: 25,
    mutual_help: 15,
    event_together: 20,
    recommendation_accepted: 5
  },
  trust_score_factors: {
    connection_longevity: 0.3,
    mutual_connections: 0.25,
    positive_interactions: 0.2,
    community_contributions: 0.15,
    verification_level: 0.1
  }
};

export default {
  CONNECTION_TYPES,
  TRUSTED_NEIGHBOR_LEVELS,
  NIGERIAN_NEIGHBOR_INTERESTS,
  RECOMMENDATION_REASONS,
  CONNECTION_PRIVACY_LEVELS,
  NIGERIAN_CONNECTION_CONTEXTS,
  CONNECTION_STATUS_MESSAGES,
  SOCIAL_METRICS
};