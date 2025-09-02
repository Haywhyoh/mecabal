export interface EventData {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  endTime?: string;
  location: {
    name: string;
    estate: string;
    city: string;
    state: string;
    landmark?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  organizer: {
    id: string;
    name: string;
    avatar?: string;
    verificationLevel: 'unverified' | 'phone' | 'identity' | 'full';
    verificationBadge?: string;
    rating?: number;
  };
  attendees: {
    count: number;
    limit?: number;
    avatars: string[];
  };
  price: {
    isFree: boolean;
    amount?: number;
    currency: 'NGN';
  };
  media: {
    coverImage?: string;
    gallery?: string[];
  };
  requirements?: {
    verificationRequired: boolean;
    ageRestriction?: string;
    culturalPreference?: string[];
  };
  tags: string[];
  language: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  rsvpStatus?: 'not_responded' | 'going' | 'maybe' | 'not_going';
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 
  | 'Religious'
  | 'Cultural'
  | 'Community'
  | 'Business'
  | 'Sports'
  | 'Educational'
  | 'Family'
  | 'Social'
  | 'Health'
  | 'Security';

export const eventCategories: Array<{
  id: EventCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    id: 'Religious',
    name: 'Religious Services',
    icon: 'church',
    color: '#7B68EE',
    description: 'Church services, mosque prayers, traditional worship'
  },
  {
    id: 'Cultural',
    name: 'Cultural Festivals',
    icon: 'festival',
    color: '#FF6B35',
    description: 'Traditional festivals, cultural celebrations, heritage events'
  },
  {
    id: 'Community',
    name: 'Estate Meetings',
    icon: 'account-group',
    color: '#00A651',
    description: 'Estate meetings, compound gatherings, community decisions'
  },
  {
    id: 'Business',
    name: 'Business & Networking',
    icon: 'briefcase',
    color: '#0066CC',
    description: 'Professional networking, business launches, workshops'
  },
  {
    id: 'Sports',
    name: 'Sports & Recreation',
    icon: 'soccer',
    color: '#228B22',
    description: 'Football matches, fitness classes, recreational activities'
  },
  {
    id: 'Educational',
    name: 'Educational',
    icon: 'school',
    color: '#FFC107',
    description: 'Workshops, seminars, skill development, tutoring'
  },
  {
    id: 'Family',
    name: 'Family & Children',
    icon: 'baby-face',
    color: '#FF69B4',
    description: 'Children parties, family gatherings, naming ceremonies'
  },
  {
    id: 'Social',
    name: 'Social Events',
    icon: 'party-popper',
    color: '#4682B4',
    description: 'Parties, social gatherings, entertainment events'
  },
  {
    id: 'Health',
    name: 'Health & Wellness',
    icon: 'medical-bag',
    color: '#E74C3C',
    description: 'Health screenings, wellness sessions, medical outreach'
  },
  {
    id: 'Security',
    name: 'Security & Safety',
    icon: 'shield-account',
    color: '#8E8E8E',
    description: 'Security meetings, safety awareness, emergency drills'
  }
];

export const nigerianStates = [
  'Lagos', 'Abuja', 'Kano', 'Rivers', 'Kaduna', 'Oyo', 'Delta', 'Edo', 'Anambra', 'Imo',
  'Ogun', 'Plateau', 'Cross River', 'Akwa Ibom', 'Bauchi', 'Borno', 'Osun', 'Ekiti', 'Kwara', 'Ondo'
];

export const demoEvents: EventData[] = [
  {
    id: '1',
    title: 'Victoria Island Estate Monthly Meeting',
    description: 'Monthly residents meeting to discuss estate security, infrastructure improvements, and community initiatives. Light refreshments will be served.',
    category: 'Community',
    date: '2024-02-15',
    time: '18:00',
    endTime: '20:00',
    location: {
      name: 'Estate Community Hall',
      estate: 'Victoria Island Estate',
      city: 'Ikeja',
      state: 'Lagos',
      landmark: 'Near Ikeja City Mall',
      coordinates: { latitude: 6.6018, longitude: 3.3515 }
    },
    organizer: {
      id: 'org1',
      name: 'Adebayo Williams',
      avatar: 'https://via.placeholder.com/100/00A651/FFFFFF?text=AW',
      verificationLevel: 'full',
      verificationBadge: 'Estate Manager',
      rating: 4.8
    },
    attendees: {
      count: 47,
      limit: 100,
      avatars: [
        'https://via.placeholder.com/50/FF6B35/FFFFFF?text=AB',
        'https://via.placeholder.com/50/7B68EE/FFFFFF?text=CD',
        'https://via.placeholder.com/50/228B22/FFFFFF?text=EF'
      ]
    },
    price: { isFree: true, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/00A651/FFFFFF?text=Estate+Meeting'
    },
    requirements: {
      verificationRequired: true,
      culturalPreference: ['English', 'Yoruba']
    },
    tags: ['Estate', 'Security', 'Infrastructure', 'Community'],
    language: ['English', 'Yoruba'],
    status: 'upcoming',
    rsvpStatus: 'going',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-10T14:30:00Z'
  },
  {
    id: '2',
    title: 'Eid-el-Fitr Community Celebration',
    description: 'Join us for a beautiful Eid celebration with traditional prayers, cultural performances, and delicious Nigerian delicacies. All faiths welcome!',
    category: 'Religious',
    date: '2024-02-18',
    time: '08:00',
    endTime: '14:00',
    location: {
      name: 'Central Mosque Compound',
      estate: 'Garki Estate',
      city: 'Garki',
      state: 'Abuja',
      landmark: 'Behind Garki Modern Market'
    },
    organizer: {
      id: 'org2',
      name: 'Imam Abdullah Musa',
      avatar: 'https://via.placeholder.com/100/7B68EE/FFFFFF?text=AM',
      verificationLevel: 'identity',
      verificationBadge: 'Religious Leader',
      rating: 4.9
    },
    attendees: {
      count: 156,
      limit: 300,
      avatars: [
        'https://via.placeholder.com/50/FF6B35/FFFFFF?text=MN',
        'https://via.placeholder.com/50/00A651/FFFFFF?text=OP',
        'https://via.placeholder.com/50/FFC107/FFFFFF?text=QR'
      ]
    },
    price: { isFree: true, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/7B68EE/FFFFFF?text=Eid+Celebration'
    },
    requirements: {
      verificationRequired: false,
      culturalPreference: ['Arabic', 'Hausa', 'English']
    },
    tags: ['Eid', 'Religious', 'Community', 'Cultural'],
    language: ['Arabic', 'Hausa', 'English'],
    status: 'upcoming',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-02-05T11:00:00Z'
  },
  {
    id: '3',
    title: 'Lagos Tech Meetup: AI in Nigerian Businesses',
    description: 'Learn how artificial intelligence is transforming Nigerian businesses. Network with tech professionals and discover new opportunities in the AI space.',
    category: 'Business',
    date: '2024-02-20',
    time: '17:30',
    endTime: '21:00',
    location: {
      name: 'Innovation Hub',
      estate: 'Yaba Tech Estate',
      city: 'Yaba',
      state: 'Lagos',
      landmark: 'Opposite Yaba College of Technology'
    },
    organizer: {
      id: 'org3',
      name: 'Funmi Adeyemi',
      avatar: 'https://via.placeholder.com/100/0066CC/FFFFFF?text=FA',
      verificationLevel: 'full',
      verificationBadge: 'Tech Professional',
      rating: 4.7
    },
    attendees: {
      count: 89,
      limit: 150,
      avatars: [
        'https://via.placeholder.com/50/228B22/FFFFFF?text=ST',
        'https://via.placeholder.com/50/FF69B4/FFFFFF?text=UV',
        'https://via.placeholder.com/50/4682B4/FFFFFF?text=WX'
      ]
    },
    price: { isFree: false, amount: 2500, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/0066CC/FFFFFF?text=Tech+Meetup'
    },
    requirements: {
      verificationRequired: true,
      culturalPreference: ['English']
    },
    tags: ['Technology', 'AI', 'Business', 'Networking'],
    language: ['English'],
    status: 'upcoming',
    rsvpStatus: 'maybe',
    createdAt: '2024-01-28T16:00:00Z',
    updatedAt: '2024-02-12T09:15:00Z'
  },
  {
    id: '4',
    title: 'Children\'s Birthday Party - Kemi turns 5!',
    description: 'Join us in celebrating little Kemi\'s 5th birthday! Fun activities, games, face painting, and lots of cake for the children in our compound.',
    category: 'Family',
    date: '2024-02-17',
    time: '15:00',
    endTime: '18:00',
    location: {
      name: 'Compound Playground',
      estate: 'Ikoyi Gardens',
      city: 'Ikoyi',
      state: 'Lagos',
      landmark: 'Block C Playground Area'
    },
    organizer: {
      id: 'org4',
      name: 'Mrs. Blessing Okafor',
      avatar: 'https://via.placeholder.com/100/FF69B4/FFFFFF?text=BO',
      verificationLevel: 'phone',
      verificationBadge: 'Parent',
      rating: 4.6
    },
    attendees: {
      count: 23,
      limit: 40,
      avatars: [
        'https://via.placeholder.com/50/FFC107/FFFFFF?text=YZ',
        'https://via.placeholder.com/50/E74C3C/FFFFFF?text=AA',
        'https://via.placeholder.com/50/00A651/FFFFFF?text=BB'
      ]
    },
    price: { isFree: true, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/FF69B4/FFFFFF?text=Birthday+Party'
    },
    requirements: {
      verificationRequired: false,
      ageRestriction: 'Family-friendly',
      culturalPreference: ['English', 'Igbo']
    },
    tags: ['Birthday', 'Children', 'Family', 'Fun'],
    language: ['English', 'Igbo'],
    status: 'upcoming',
    rsvpStatus: 'going',
    createdAt: '2024-02-03T12:00:00Z',
    updatedAt: '2024-02-14T10:30:00Z'
  },
  {
    id: '5',
    title: 'Estate Football Championship Finals',
    description: 'The exciting finals of our inter-compound football championship! Come support your favorite team. Refreshments and prizes for winners.',
    category: 'Sports',
    date: '2024-02-24',
    time: '16:00',
    endTime: '19:00',
    location: {
      name: 'Estate Football Field',
      estate: 'Festac Town Estate',
      city: 'Festac',
      state: 'Lagos',
      landmark: 'Behind Estate Shopping Complex'
    },
    organizer: {
      id: 'org5',
      name: 'Coach Emmanuel Nwosu',
      avatar: 'https://via.placeholder.com/100/228B22/FFFFFF?text=EN',
      verificationLevel: 'identity',
      verificationBadge: 'Sports Coordinator',
      rating: 4.9
    },
    attendees: {
      count: 78,
      limit: 200,
      avatars: [
        'https://via.placeholder.com/50/4682B4/FFFFFF?text=CC',
        'https://via.placeholder.com/50/FF6B35/FFFFFF?text=DD',
        'https://via.placeholder.com/50/7B68EE/FFFFFF?text=EE'
      ]
    },
    price: { isFree: true, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/228B22/FFFFFF?text=Football+Championship'
    },
    requirements: {
      verificationRequired: false,
      culturalPreference: ['English', 'Pidgin']
    },
    tags: ['Football', 'Championship', 'Sports', 'Competition'],
    language: ['English', 'Pidgin'],
    status: 'upcoming',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-02-18T16:45:00Z'
  },
  {
    id: '6',
    title: 'New Yam Festival Celebration',
    description: 'Traditional Igbo New Yam Festival with cultural displays, traditional music, dance performances, and authentic Nigerian cuisine. Come celebrate our rich heritage!',
    category: 'Cultural',
    date: '2024-02-25',
    time: '10:00',
    endTime: '18:00',
    location: {
      name: 'Cultural Center',
      estate: 'Independence Layout',
      city: 'Enugu',
      state: 'Enugu',
      landmark: 'Near Enugu State Broadcasting Service'
    },
    organizer: {
      id: 'org6',
      name: 'Chief Okwudili Eze',
      avatar: 'https://via.placeholder.com/100/FF6B35/FFFFFF?text=OE',
      verificationLevel: 'full',
      verificationBadge: 'Cultural Leader',
      rating: 4.8
    },
    attendees: {
      count: 134,
      limit: 400,
      avatars: [
        'https://via.placeholder.com/50/00A651/FFFFFF?text=FF',
        'https://via.placeholder.com/50/FFC107/FFFFFF?text=GG',
        'https://via.placeholder.com/50/E74C3C/FFFFFF?text=HH'
      ]
    },
    price: { isFree: false, amount: 1000, currency: 'NGN' },
    media: {
      coverImage: 'https://via.placeholder.com/400x200/FF6B35/FFFFFF?text=Yam+Festival'
    },
    requirements: {
      verificationRequired: false,
      culturalPreference: ['Igbo', 'English']
    },
    tags: ['Cultural', 'Festival', 'Traditional', 'Igbo', 'Heritage'],
    language: ['Igbo', 'English'],
    status: 'upcoming',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-02-15T13:20:00Z'
  }
];

export const getUserEvents = (userId: string): EventData[] => {
  return demoEvents.filter(event => 
    event.rsvpStatus === 'going' || event.organizer.id === userId
  );
};

export const getEventsByCategory = (category: EventCategory): EventData[] => {
  return demoEvents.filter(event => event.category === category);
};

export const getUpcomingEvents = (): EventData[] => {
  const today = new Date();
  return demoEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && event.status === 'upcoming';
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getFeaturedEvents = (): EventData[] => {
  return demoEvents
    .filter(event => event.attendees.count > 50 || event.organizer.rating > 4.7)
    .slice(0, 3);
};

export const searchEvents = (query: string): EventData[] => {
  const lowercaseQuery = query.toLowerCase();
  return demoEvents.filter(event => 
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.location.estate.toLowerCase().includes(lowercaseQuery) ||
    event.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};