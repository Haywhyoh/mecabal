// Demo data for development and testing purposes

export const DEMO_LOCATIONS = [
  {
    id: 1,
    name: 'Lagos, Nigeria',
    type: 'City',
    description: 'Largest city in Nigeria, major economic hub',
    population: '21M+',
    isCurrent: true,
    neighborhoods: ['Victoria Island', 'Lekki', 'Ikeja', 'Surulere', 'Yaba']
  },
  {
    id: 2,
    name: 'Abuja, Nigeria',
    type: 'Capital',
    description: 'Federal capital territory, government center',
    population: '3.2M+',
    isCurrent: false,
    neighborhoods: ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Jabi']
  },
  {
    id: 3,
    name: 'Kano, Nigeria',
    type: 'City',
    description: 'Major commercial center in northern Nigeria',
    population: '4.1M+',
    isCurrent: false,
    neighborhoods: ['Nasarawa', 'Fagge', 'Dala', 'Municipal', 'Tarauni']
  },
  {
    id: 4,
    name: 'Ibadan, Nigeria',
    type: 'City',
    description: 'Largest city in West Africa by landmass',
    population: '3.6M+',
    isCurrent: false,
    neighborhoods: ['Bodija', 'Agbowo', 'Mokola', 'Sango', 'Challenge']
  },
  {
    id: 5,
    name: 'Port Harcourt, Nigeria',
    type: 'City',
    description: 'Oil and gas hub in the Niger Delta',
    population: '2.1M+',
    isCurrent: false,
    neighborhoods: ['GRA', 'Old GRA', 'New GRA', 'D-Line', 'Aba Road']
  },
];

export const DEMO_INVITATION_CODES = [
  'HOMLAG001',
  'HOMLAG002', 
  'HOMLAG003',
  'HOMLAG004',
  'HOMLAG005'
];

export const DEMO_ZIP_CODES = [
  '100001',
  '100002',
  '100003', 
  '100004',
  '100005'
];

export const DEMO_PHONE_NUMBERS = [
  '08012345678',
  '08023456789',
  '08034567890',
  '08045678901',
  '08056789012'
];

export const DEMO_NEIGHBORHOODS = [
  {
    id: 1,
    name: 'Victoria Island',
    city: 'Lagos',
    type: 'Residential',
    description: 'Upscale residential and business district',
    population: '50K+',
    features: ['Beach access', 'Shopping centers', 'Restaurants', 'Business district']
  },
  {
    id: 2,
    name: 'Lekki',
    city: 'Lagos', 
    type: 'Residential',
    description: 'Fast-growing residential area with modern developments',
    population: '200K+',
    features: ['New developments', 'Shopping malls', 'Schools', 'Hospitals']
  },
  {
    id: 3,
    name: 'Ikeja',
    city: 'Lagos',
    type: 'Mixed',
    description: 'State capital with government offices and residential areas',
    population: '150K+',
    features: ['Government offices', 'Airport', 'Shopping centers', 'Residential areas']
  },
  {
    id: 4,
    name: 'Garki',
    city: 'Abuja',
    type: 'Mixed',
    description: 'Central business district with government presence',
    population: '100K+',
    features: ['Government buildings', 'Business centers', 'Hotels', 'Restaurants']
  },
  {
    id: 5,
    name: 'Bodija',
    city: 'Ibadan',
    type: 'Residential',
    description: 'Popular residential area near university',
    population: '80K+',
    features: ['University proximity', 'Markets', 'Residential estates', 'Schools']
  }
];

export const DEMO_USER_PROFILES = [
  {
    id: 1,
    name: 'Adebayo Adebisi',
    location: 'Victoria Island, Lagos',
    joinDate: '2023',
    verified: true,
    interests: ['Community events', 'Local business', 'Safety alerts']
  },
  {
    id: 2,
    name: 'Fatima Hassan',
    location: 'Garki, Abuja',
    joinDate: '2023',
    verified: true,
    interests: ['Neighborhood watch', 'Local recommendations', 'Community meetings']
  },
  {
    id: 3,
    name: 'Chukwudi Okonkwo',
    location: 'Bodija, Ibadan',
    joinDate: '2023',
    verified: true,
    interests: ['Local news', 'Community support', 'Safety information']
  }
];

export const DEMO_COMMUNITY_EVENTS = [
  {
    id: 1,
    title: 'Neighborhood Clean-up Day',
    date: '2024-01-15',
    time: '9:00 AM',
    location: 'Victoria Island Park',
    description: 'Join us for a community clean-up to keep our neighborhood beautiful',
    attendees: 45,
    organizer: 'Victoria Island Community Group'
  },
  {
    id: 2,
    title: 'Local Business Networking',
    date: '2024-01-20',
    time: '6:00 PM',
    location: 'Lekki Business Center',
    description: 'Connect with local business owners and entrepreneurs',
    attendees: 32,
    organizer: 'Lekki Business Association'
  },
  {
    id: 3,
    title: 'Community Safety Meeting',
    date: '2024-01-25',
    time: '7:00 PM',
    location: 'Ikeja Community Hall',
    description: 'Discuss neighborhood safety and security measures',
    attendees: 28,
    organizer: 'Ikeja Neighborhood Watch'
  }
];

export const DEMO_SAFETY_ALERTS = [
  {
    id: 1,
    type: 'Suspicious Activity',
    location: 'Victoria Island',
    description: 'Report of suspicious vehicle in the area',
    time: '2 hours ago',
    status: 'Active',
    reportedBy: 'Anonymous'
  },
  {
    id: 2,
    type: 'Road Hazard',
    location: 'Lekki Expressway',
    description: 'Large pothole causing traffic delays',
    time: '4 hours ago',
    status: 'Reported',
    reportedBy: 'Community Member'
  },
  {
    id: 3,
    type: 'Power Outage',
    location: 'Ikeja',
    description: 'Extended power outage affecting multiple streets',
    time: '6 hours ago',
    status: 'Resolved',
    reportedBy: 'Local Resident'
  }
];
