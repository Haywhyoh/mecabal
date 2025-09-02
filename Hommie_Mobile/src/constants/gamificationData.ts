// Gamification Data for Community Engagement
// Nigerian-focused achievements and community contribution system

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'community' | 'safety' | 'social' | 'business' | 'events' | 'leadership';
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    count: number;
    description: string;
  };
  unlockedBy?: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'verified' | 'contribution' | 'leadership' | 'safety' | 'social' | 'business';
  requirements: string;
  isActive: boolean;
}

export interface ContributionActivity {
  id: string;
  type: 'post' | 'comment' | 'event_created' | 'event_attended' | 'safety_alert' | 'business_review' | 'neighbor_help' | 'community_project';
  name: string;
  description: string;
  basePoints: number;
  multiplier: number;
  icon: string;
  color: string;
}

// Nigerian Community Achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Community Builder Achievements
  {
    id: 'new_neighbor',
    name: 'New Neighbor',
    description: 'Welcome to the community! Complete your profile to get started.',
    icon: 'home-heart',
    color: '#00A651',
    category: 'community',
    points: 50,
    rarity: 'common',
    requirements: {
      type: 'profile_completion',
      count: 1,
      description: 'Complete your profile information'
    }
  },
  {
    id: 'first_post',
    name: 'Breaking the Ice',
    description: 'Made your first post to the community feed.',
    icon: 'message-text',
    color: '#0066CC',
    category: 'social',
    points: 100,
    rarity: 'common',
    requirements: {
      type: 'posts_created',
      count: 1,
      description: 'Create your first community post'
    }
  },
  {
    id: 'helpful_neighbor',
    name: 'Helpful Neighbor',
    description: 'Received 10 helpful votes from fellow neighbors.',
    icon: 'hand-heart',
    color: '#FFC107',
    category: 'social',
    points: 250,
    rarity: 'uncommon',
    requirements: {
      type: 'helpful_votes',
      count: 10,
      description: 'Receive 10 helpful votes on your posts or comments'
    }
  },
  {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Active contributor with 50+ posts and excellent neighbor rating.',
    icon: 'trophy',
    color: '#FF6B35',
    category: 'leadership',
    points: 500,
    rarity: 'rare',
    requirements: {
      type: 'combined_activity',
      count: 50,
      description: '50+ posts with 4.5+ neighbor rating'
    }
  },

  // Safety & Security Achievements
  {
    id: 'safety_first',
    name: 'Safety First',
    description: 'Reported your first safety concern to help keep the community safe.',
    icon: 'shield-alert',
    color: '#E74C3C',
    category: 'safety',
    points: 150,
    rarity: 'common',
    requirements: {
      type: 'safety_reports',
      count: 1,
      description: 'Submit your first safety alert'
    }
  },
  {
    id: 'neighborhood_watch',
    name: 'Neighborhood Watch',
    description: 'Contributed to 5 safety alerts that helped protect neighbors.',
    icon: 'shield-check',
    color: '#E74C3C',
    category: 'safety',
    points: 400,
    rarity: 'uncommon',
    requirements: {
      type: 'safety_contributions',
      count: 5,
      description: 'Contribute to 5 verified safety incidents'
    }
  },
  {
    id: 'security_guardian',
    name: 'Security Guardian',
    description: 'Estate security coordinator with proven track record.',
    icon: 'shield-crown',
    color: '#7B68EE',
    category: 'leadership',
    points: 750,
    rarity: 'epic',
    requirements: {
      type: 'security_leadership',
      count: 1,
      description: 'Appointed as estate security coordinator'
    }
  },

  // Event & Social Achievements
  {
    id: 'event_goer',
    name: 'Event Enthusiast',
    description: 'Attended your first community event.',
    icon: 'calendar-heart',
    color: '#FF69B4',
    category: 'events',
    points: 100,
    rarity: 'common',
    requirements: {
      type: 'events_attended',
      count: 1,
      description: 'Attend your first community event'
    }
  },
  {
    id: 'event_organizer',
    name: 'Event Organizer',
    description: 'Successfully organized a community event with 10+ attendees.',
    icon: 'account-group',
    color: '#FF69B4',
    category: 'leadership',
    points: 300,
    rarity: 'uncommon',
    requirements: {
      type: 'events_organized',
      count: 1,
      description: 'Organize an event with 10+ attendees'
    }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Connected with 25+ neighbors in your estate.',
    icon: 'butterfly',
    color: '#FF69B4',
    category: 'social',
    points: 350,
    rarity: 'uncommon',
    requirements: {
      type: 'neighbor_connections',
      count: 25,
      description: 'Connect with 25 neighbors'
    }
  },

  // Business & Professional Achievements
  {
    id: 'local_business',
    name: 'Local Business Owner',
    description: 'Registered your business and started serving the community.',
    icon: 'store',
    color: '#228B22',
    category: 'business',
    points: 200,
    rarity: 'common',
    requirements: {
      type: 'business_registration',
      count: 1,
      description: 'Register your business profile'
    }
  },
  {
    id: 'trusted_service',
    name: 'Trusted Service Provider',
    description: 'Achieved 4.8+ rating with 20+ customer reviews.',
    icon: 'star-check',
    color: '#228B22',
    category: 'business',
    points: 450,
    rarity: 'rare',
    requirements: {
      type: 'business_rating',
      count: 20,
      description: 'Maintain 4.8+ rating with 20+ reviews'
    }
  },

  // Leadership Achievements
  {
    id: 'estate_leader',
    name: 'Estate Leader',
    description: 'Elected or appointed to estate management committee.',
    icon: 'account-tie',
    color: '#7B68EE',
    category: 'leadership',
    points: 600,
    rarity: 'rare',
    requirements: {
      type: 'leadership_role',
      count: 1,
      description: 'Appointed to estate management position'
    }
  },
  {
    id: 'community_legend',
    name: 'Community Legend',
    description: 'Outstanding community contribution over 6+ months.',
    icon: 'crown',
    color: '#FFD700',
    category: 'leadership',
    points: 1000,
    rarity: 'legendary',
    requirements: {
      type: 'legendary_status',
      count: 1,
      description: 'Exceptional community leadership over 6 months'
    }
  }
];

// Nigerian Community Badges
export const BADGES: Badge[] = [
  {
    id: 'verified_neighbor',
    name: 'Verified Neighbor',
    description: 'Phone number and address verified',
    icon: 'check-decagram',
    color: '#00A651',
    type: 'verified',
    requirements: 'Complete phone and address verification',
    isActive: true
  },
  {
    id: 'nin_verified',
    name: 'NIN Verified',
    description: 'National Identity Number verified',
    icon: 'shield-check',
    color: '#0066CC',
    type: 'verified',
    requirements: 'Verify National Identity Number',
    isActive: true
  },
  {
    id: 'estate_committee',
    name: 'Estate Committee',
    description: 'Estate management committee member',
    icon: 'account-group',
    color: '#7B68EE',
    type: 'leadership',
    requirements: 'Elected or appointed to estate committee',
    isActive: true
  },
  {
    id: 'security_coordinator',
    name: 'Security Coordinator',
    description: 'Estate security team coordinator',
    icon: 'shield-account',
    color: '#E74C3C',
    type: 'safety',
    requirements: 'Appointed as security coordinator',
    isActive: true
  },
  {
    id: 'top_contributor',
    name: 'Top Contributor',
    description: 'Top 10% community contributor this month',
    icon: 'trending-up',
    color: '#FFC107',
    type: 'contribution',
    requirements: 'Top 10% activity score this month',
    isActive: true
  },
  {
    id: 'helpful_neighbor',
    name: 'Helpful Neighbor',
    description: 'Consistently helpful to neighbors',
    icon: 'hand-heart',
    color: '#FF69B4',
    type: 'social',
    requirements: '4.5+ neighbor helpfulness rating',
    isActive: true
  },
  {
    id: 'business_verified',
    name: 'Verified Business',
    description: 'Verified local business owner',
    icon: 'store-check',
    color: '#228B22',
    type: 'business',
    requirements: 'Complete business verification process',
    isActive: true
  },
  {
    id: 'safety_champion',
    name: 'Safety Champion',
    description: 'Active in community safety initiatives',
    icon: 'shield-star',
    color: '#E74C3C',
    type: 'safety',
    requirements: 'Contribute to 10+ safety reports',
    isActive: true
  }
];

// Activity Types and Point Values
export const CONTRIBUTION_ACTIVITIES: ContributionActivity[] = [
  {
    id: 'create_post',
    type: 'post',
    name: 'Create Post',
    description: 'Share news, ask questions, or start discussions',
    basePoints: 10,
    multiplier: 1.0,
    icon: 'message-plus',
    color: '#0066CC'
  },
  {
    id: 'helpful_comment',
    type: 'comment',
    name: 'Helpful Comment',
    description: 'Provide helpful responses to neighbor questions',
    basePoints: 5,
    multiplier: 1.2,
    icon: 'comment-check',
    color: '#00A651'
  },
  {
    id: 'organize_event',
    type: 'event_created',
    name: 'Organize Event',
    description: 'Create and organize community events',
    basePoints: 25,
    multiplier: 1.5,
    icon: 'calendar-plus',
    color: '#FF69B4'
  },
  {
    id: 'attend_event',
    type: 'event_attended',
    name: 'Attend Event',
    description: 'Participate in community events',
    basePoints: 8,
    multiplier: 1.0,
    icon: 'calendar-check',
    color: '#FF6B35'
  },
  {
    id: 'safety_report',
    type: 'safety_alert',
    name: 'Safety Report',
    description: 'Report safety concerns to help protect neighbors',
    basePoints: 20,
    multiplier: 1.8,
    icon: 'shield-alert',
    color: '#E74C3C'
  },
  {
    id: 'business_review',
    type: 'business_review',
    name: 'Business Review',
    description: 'Review local businesses to help neighbors',
    basePoints: 8,
    multiplier: 1.1,
    icon: 'star',
    color: '#FFC107'
  },
  {
    id: 'neighbor_help',
    type: 'neighbor_help',
    name: 'Help Neighbor',
    description: 'Provide direct assistance to neighbors',
    basePoints: 15,
    multiplier: 1.3,
    icon: 'hand-heart',
    color: '#7B68EE'
  },
  {
    id: 'community_project',
    type: 'community_project',
    name: 'Community Project',
    description: 'Lead or participate in estate improvement projects',
    basePoints: 30,
    multiplier: 2.0,
    icon: 'hammer-wrench',
    color: '#228B22'
  }
];

// Contribution Score Levels
export interface ContributionLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
}

export const CONTRIBUTION_LEVELS: ContributionLevel[] = [
  {
    level: 1,
    name: 'New Neighbor',
    minPoints: 0,
    maxPoints: 99,
    color: '#8E8E8E',
    icon: 'home',
    benefits: ['Basic community access', 'Profile creation']
  },
  {
    level: 2,
    name: 'Active Neighbor',
    minPoints: 100,
    maxPoints: 249,
    color: '#00A651',
    icon: 'account',
    benefits: ['Event creation', 'Business reviews', 'Direct messaging']
  },
  {
    level: 3,
    name: 'Helpful Neighbor',
    minPoints: 250,
    maxPoints: 499,
    color: '#0066CC',
    icon: 'hand-heart',
    benefits: ['Safety alerts', 'Event promotion', 'Neighbor recommendations']
  },
  {
    level: 4,
    name: 'Community Builder',
    minPoints: 500,
    maxPoints: 999,
    color: '#FF6B35',
    icon: 'account-group',
    benefits: ['Community polls', 'Group creation', 'Business promotion']
  },
  {
    level: 5,
    name: 'Estate Champion',
    minPoints: 1000,
    maxPoints: 1999,
    color: '#7B68EE',
    icon: 'trophy',
    benefits: ['Leadership roles', 'Event sponsorship', 'Premium features']
  },
  {
    level: 6,
    name: 'Community Legend',
    minPoints: 2000,
    maxPoints: 9999,
    color: '#FFD700',
    icon: 'crown',
    benefits: ['All features', 'Special recognition', 'Leadership council']
  }
];

// Nigerian-specific community titles
export const NIGERIAN_COMMUNITY_TITLES = [
  'Odogwu', // Igbo: Champion/Strong person
  'Oga/Madam', // General: Boss/Leader
  'Chief', // Traditional title
  'Alhaji/Alhaja', // Northern: Religious/Respected person
  'Baba/Mama', // Yoruba: Father/Mother figure
  'Elder', // Community elder
  'Captain', // Security/Safety leader
  'Ambassador' // Community representative
];

// Leaderboard Categories
export const LEADERBOARD_CATEGORIES = [
  {
    id: 'overall',
    name: 'Overall Contribution',
    description: 'Top contributors across all activities',
    icon: 'trophy',
    color: '#FFD700'
  },
  {
    id: 'safety',
    name: 'Safety Champions',
    description: 'Most active in community safety',
    icon: 'shield-star',
    color: '#E74C3C'
  },
  {
    id: 'events',
    name: 'Event Leaders',
    description: 'Top event organizers and participants',
    icon: 'calendar-star',
    color: '#FF69B4'
  },
  {
    id: 'helpful',
    name: 'Helpful Neighbors',
    description: 'Most helpful community members',
    icon: 'hand-heart',
    color: '#00A651'
  },
  {
    id: 'business',
    name: 'Business Leaders',
    description: 'Top-rated local service providers',
    icon: 'store-star',
    color: '#228B22'
  }
];

export default {
  ACHIEVEMENTS,
  BADGES,
  CONTRIBUTION_ACTIVITIES,
  CONTRIBUTION_LEVELS,
  NIGERIAN_COMMUNITY_TITLES,
  LEADERBOARD_CATEGORIES
};