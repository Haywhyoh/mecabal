// Nigerian-specific data for cultural integration

export const NIGERIAN_STATES = [
  { id: 'abia', name: 'Abia', region: 'South East', capital: 'Umuahia' },
  { id: 'adamawa', name: 'Adamawa', region: 'North East', capital: 'Yola' },
  { id: 'akwa-ibom', name: 'Akwa Ibom', region: 'South South', capital: 'Uyo' },
  { id: 'anambra', name: 'Anambra', region: 'South East', capital: 'Awka' },
  { id: 'bauchi', name: 'Bauchi', region: 'North East', capital: 'Bauchi' },
  { id: 'bayelsa', name: 'Bayelsa', region: 'South South', capital: 'Yenagoa' },
  { id: 'benue', name: 'Benue', region: 'North Central', capital: 'Makurdi' },
  { id: 'borno', name: 'Borno', region: 'North East', capital: 'Maiduguri' },
  { id: 'cross-river', name: 'Cross River', region: 'South South', capital: 'Calabar' },
  { id: 'delta', name: 'Delta', region: 'South South', capital: 'Asaba' },
  { id: 'ebonyi', name: 'Ebonyi', region: 'South East', capital: 'Abakaliki' },
  { id: 'edo', name: 'Edo', region: 'South South', capital: 'Benin City' },
  { id: 'ekiti', name: 'Ekiti', region: 'South West', capital: 'Ado-Ekiti' },
  { id: 'enugu', name: 'Enugu', region: 'South East', capital: 'Enugu' },
  { id: 'fct', name: 'Federal Capital Territory', region: 'North Central', capital: 'Abuja' },
  { id: 'gombe', name: 'Gombe', region: 'North East', capital: 'Gombe' },
  { id: 'imo', name: 'Imo', region: 'South East', capital: 'Owerri' },
  { id: 'jigawa', name: 'Jigawa', region: 'North West', capital: 'Dutse' },
  { id: 'kaduna', name: 'Kaduna', region: 'North West', capital: 'Kaduna' },
  { id: 'kano', name: 'Kano', region: 'North West', capital: 'Kano' },
  { id: 'katsina', name: 'Katsina', region: 'North West', capital: 'Katsina' },
  { id: 'kebbi', name: 'Kebbi', region: 'North West', capital: 'Birnin Kebbi' },
  { id: 'kogi', name: 'Kogi', region: 'North Central', capital: 'Lokoja' },
  { id: 'kwara', name: 'Kwara', region: 'North Central', capital: 'Ilorin' },
  { id: 'lagos', name: 'Lagos', region: 'South West', capital: 'Ikeja' },
  { id: 'nasarawa', name: 'Nasarawa', region: 'North Central', capital: 'Lafia' },
  { id: 'niger', name: 'Niger', region: 'North Central', capital: 'Minna' },
  { id: 'ogun', name: 'Ogun', region: 'South West', capital: 'Abeokuta' },
  { id: 'ondo', name: 'Ondo', region: 'South West', capital: 'Akure' },
  { id: 'osun', name: 'Osun', region: 'South West', capital: 'Osogbo' },
  { id: 'oyo', name: 'Oyo', region: 'South West', capital: 'Ibadan' },
  { id: 'plateau', name: 'Plateau', region: 'North Central', capital: 'Jos' },
  { id: 'rivers', name: 'Rivers', region: 'South South', capital: 'Port Harcourt' },
  { id: 'sokoto', name: 'Sokoto', region: 'North West', capital: 'Sokoto' },
  { id: 'taraba', name: 'Taraba', region: 'North East', capital: 'Jalingo' },
  { id: 'yobe', name: 'Yobe', region: 'North East', capital: 'Damaturu' },
  { id: 'zamfara', name: 'Zamfara', region: 'North West', capital: 'Gusau' },
];

export const NIGERIAN_LANGUAGES = [
  { 
    id: 'english', 
    name: 'English', 
    nativeName: 'English',
    greeting: 'Hello',
    description: 'Official language of Nigeria',
    isPrimary: true
  },
  { 
    id: 'hausa', 
    name: 'Hausa', 
    nativeName: 'Harshen Hausa',
    greeting: 'Sannu',
    description: 'Widely spoken in Northern Nigeria',
    isPrimary: true
  },
  { 
    id: 'yoruba', 
    name: 'Yoruba', 
    nativeName: 'Èdè Yorùbá',
    greeting: 'Pẹlẹ o',
    description: 'Widely spoken in South West Nigeria',
    isPrimary: true
  },
  { 
    id: 'igbo', 
    name: 'Igbo', 
    nativeName: 'Asụsụ Igbo',
    greeting: 'Ndewo',
    description: 'Widely spoken in South East Nigeria',
    isPrimary: true
  },
  { 
    id: 'pidgin', 
    name: 'Nigerian Pidgin', 
    nativeName: 'Naija',
    greeting: 'How far?',
    description: 'Widely understood across Nigeria',
    isPrimary: false
  },
  { 
    id: 'fulfulde', 
    name: 'Fulfulde', 
    nativeName: 'Fulfulde',
    greeting: 'Jam tan',
    description: 'Spoken by Fulani people',
    isPrimary: false
  },
  { 
    id: 'kanuri', 
    name: 'Kanuri', 
    nativeName: 'Kanuri',
    greeting: 'Lakwu ngakale',
    description: 'Spoken in North East Nigeria',
    isPrimary: false
  },
  { 
    id: 'ijaw', 
    name: 'Ijaw', 
    nativeName: 'Ịjọ',
    greeting: 'Bagha',
    description: 'Spoken in Niger Delta region',
    isPrimary: false
  },
];

export const CULTURAL_BACKGROUNDS = [
  { id: 'yoruba', name: 'Yoruba', region: 'South West' },
  { id: 'igbo', name: 'Igbo', region: 'South East' },
  { id: 'hausa', name: 'Hausa', region: 'North' },
  { id: 'fulani', name: 'Fulani', region: 'Various' },
  { id: 'ijaw', name: 'Ijaw', region: 'South South' },
  { id: 'kanuri', name: 'Kanuri', region: 'North East' },
  { id: 'tiv', name: 'Tiv', region: 'North Central' },
  { id: 'edo', name: 'Edo', region: 'South South' },
  { id: 'nupe', name: 'Nupe', region: 'North Central' },
  { id: 'ibibio', name: 'Ibibio', region: 'South South' },
  { id: 'mixed', name: 'Mixed Heritage', region: 'Various' },
  { id: 'other', name: 'Other', region: 'Various' },
  { id: 'prefer-not-to-say', name: 'Prefer not to say', region: '' },
];

export const PROFESSIONAL_TITLES = [
  // Professional Services
  { category: 'Professional Services', title: 'Doctor (Medical)' },
  { category: 'Professional Services', title: 'Lawyer/Barrister' },
  { category: 'Professional Services', title: 'Engineer' },
  { category: 'Professional Services', title: 'Architect' },
  { category: 'Professional Services', title: 'Accountant' },
  { category: 'Professional Services', title: 'Pharmacist' },
  { category: 'Professional Services', title: 'Dentist' },
  { category: 'Professional Services', title: 'Veterinarian' },
  
  // Technology
  { category: 'Technology', title: 'Software Developer' },
  { category: 'Technology', title: 'Data Scientist' },
  { category: 'Technology', title: 'Product Manager' },
  { category: 'Technology', title: 'UI/UX Designer' },
  { category: 'Technology', title: 'DevOps Engineer' },
  { category: 'Technology', title: 'Cybersecurity Specialist' },
  { category: 'Technology', title: 'IT Support' },
  
  // Business & Finance
  { category: 'Business & Finance', title: 'Banker' },
  { category: 'Business & Finance', title: 'Financial Analyst' },
  { category: 'Business & Finance', title: 'Business Analyst' },
  { category: 'Business & Finance', title: 'Entrepreneur' },
  { category: 'Business & Finance', title: 'Project Manager' },
  { category: 'Business & Finance', title: 'Sales Representative' },
  { category: 'Business & Finance', title: 'Marketing Manager' },
  { category: 'Business & Finance', title: 'Human Resources' },
  
  // Education
  { category: 'Education', title: 'Teacher' },
  { category: 'Education', title: 'Professor/Lecturer' },
  { category: 'Education', title: 'School Administrator' },
  { category: 'Education', title: 'Education Consultant' },
  
  // Government & Public Service
  { category: 'Government & Public Service', title: 'Civil Servant' },
  { category: 'Government & Public Service', title: 'Military Officer' },
  { category: 'Government & Public Service', title: 'Police Officer' },
  { category: 'Government & Public Service', title: 'Diplomat' },
  { category: 'Government & Public Service', title: 'Judge/Magistrate' },
  
  // Healthcare
  { category: 'Healthcare', title: 'Nurse' },
  { category: 'Healthcare', title: 'Medical Technician' },
  { category: 'Healthcare', title: 'Physiotherapist' },
  { category: 'Healthcare', title: 'Healthcare Administrator' },
  
  // Media & Arts
  { category: 'Media & Arts', title: 'Journalist' },
  { category: 'Media & Arts', title: 'Artist' },
  { category: 'Media & Arts', title: 'Musician' },
  { category: 'Media & Arts', title: 'Actor/Actress' },
  { category: 'Media & Arts', title: 'Photographer' },
  { category: 'Media & Arts', title: 'Writer/Author' },
  
  // Trade & Services
  { category: 'Trade & Services', title: 'Electrician' },
  { category: 'Trade & Services', title: 'Plumber' },
  { category: 'Trade & Services', title: 'Mechanic' },
  { category: 'Trade & Services', title: 'Carpenter' },
  { category: 'Trade & Services', title: 'Tailor/Fashion Designer' },
  { category: 'Trade & Services', title: 'Chef/Cook' },
  { category: 'Trade & Services', title: 'Driver' },
  { category: 'Trade & Services', title: 'Security Guard' },
  
  // Other
  { category: 'Other', title: 'Student' },
  { category: 'Other', title: 'Retiree' },
  { category: 'Other', title: 'Homemaker' },
  { category: 'Other', title: 'Unemployed' },
  { category: 'Other', title: 'Self-Employed' },
  { category: 'Other', title: 'Other' },
];

export const VERIFICATION_BADGES = [
  {
    id: 'estate-resident',
    name: 'Verified Estate Resident',
    description: 'Confirmed resident of the estate',
    icon: 'shield-check',
    color: '#00A651',
    requirements: 'Estate management verification'
  },
  {
    id: 'community-leader',
    name: 'Community Leader',
    description: 'Recognized community leader or committee member',
    icon: 'star-circle',
    color: '#FFC107',
    requirements: 'Community nomination and verification'
  },
  {
    id: 'safety-coordinator',
    name: 'Safety Coordinator',
    description: 'Neighborhood watch or security coordinator',
    icon: 'shield-star',
    color: '#0066CC',
    requirements: 'Safety committee appointment'
  },
  {
    id: 'local-business',
    name: 'Local Business Owner',
    description: 'Verified local business within the community',
    icon: 'store',
    color: '#228B22',
    requirements: 'Business registration and location verification'
  },
  {
    id: 'healthcare-provider',
    name: 'Healthcare Provider',
    description: 'Licensed medical professional in the community',
    icon: 'medical-bag',
    color: '#E74C3C',
    requirements: 'Professional license verification'
  },
  {
    id: 'educator',
    name: 'Community Educator',
    description: 'Teacher or education professional',
    icon: 'school',
    color: '#7B68EE',
    requirements: 'Educational credentials verification'
  },
  {
    id: 'long-term-resident',
    name: 'Long-term Resident',
    description: 'Resident for 2+ years',
    icon: 'home-heart',
    color: '#FF69B4',
    requirements: 'Residence duration verification'
  },
  {
    id: 'helpful-neighbor',
    name: 'Helpful Neighbor',
    description: 'Recognized for community assistance',
    icon: 'hand-heart',
    color: '#FF6B35',
    requirements: 'Community recognition points'
  },
];

export const NIGERIAN_PHONE_PREFIXES = [
  // MTN
  { network: 'MTN', prefix: '0803', color: '#FFCC00' },
  { network: 'MTN', prefix: '0806', color: '#FFCC00' },
  { network: 'MTN', prefix: '0703', color: '#FFCC00' },
  { network: 'MTN', prefix: '0706', color: '#FFCC00' },
  { network: 'MTN', prefix: '0813', color: '#FFCC00' },
  { network: 'MTN', prefix: '0816', color: '#FFCC00' },
  { network: 'MTN', prefix: '0810', color: '#FFCC00' },
  { network: 'MTN', prefix: '0814', color: '#FFCC00' },
  { network: 'MTN', prefix: '0903', color: '#FFCC00' },
  { network: 'MTN', prefix: '0906', color: '#FFCC00' },
  
  // Airtel
  { network: 'Airtel', prefix: '0802', color: '#FF0000' },
  { network: 'Airtel', prefix: '0808', color: '#FF0000' },
  { network: 'Airtel', prefix: '0708', color: '#FF0000' },
  { network: 'Airtel', prefix: '0812', color: '#FF0000' },
  { network: 'Airtel', prefix: '0701', color: '#FF0000' },
  { network: 'Airtel', prefix: '0902', color: '#FF0000' },
  { network: 'Airtel', prefix: '0901', color: '#FF0000' },
  { network: 'Airtel', prefix: '0904', color: '#FF0000' },
  { network: 'Airtel', prefix: '0907', color: '#FF0000' },
  
  // Glo
  { network: 'Glo', prefix: '0805', color: '#00FF00' },
  { network: 'Glo', prefix: '0807', color: '#00FF00' },
  { network: 'Glo', prefix: '0705', color: '#00FF00' },
  { network: 'Glo', prefix: '0815', color: '#00FF00' },
  { network: 'Glo', prefix: '0811', color: '#00FF00' },
  { network: 'Glo', prefix: '0905', color: '#00FF00' },
  
  // 9mobile (formerly Etisalat)
  { network: '9mobile', prefix: '0809', color: '#0066CC' },
  { network: '9mobile', prefix: '0818', color: '#0066CC' },
  { network: '9mobile', prefix: '0817', color: '#0066CC' },
  { network: '9mobile', prefix: '0908', color: '#0066CC' },
  { network: '9mobile', prefix: '0909', color: '#0066CC' },
];

export const getStateByRegion = (region: string) => {
  return NIGERIAN_STATES.filter(state => state.region === region);
};

export const getPhoneNetworkInfo = (phoneNumber: string) => {
  const prefix = phoneNumber.substring(0, 4);
  return NIGERIAN_PHONE_PREFIXES.find(p => p.prefix === prefix);
};

export const validateNigerianPhone = (phoneNumber: string) => {
  // Remove spaces and formatting
  const cleanNumber = phoneNumber.replace(/\s+/g, '');
  
  // Check if it starts with +234 or 0 and has correct length
  if (cleanNumber.startsWith('+234')) {
    return cleanNumber.length === 14; // +234XXXXXXXXXX
  } else if (cleanNumber.startsWith('0')) {
    return cleanNumber.length === 11; // 0XXXXXXXXXX
  }
  
  return false;
};

export const formatNigerianPhone = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/\s+/g, '');
  
  if (cleanNumber.startsWith('+234')) {
    // +234 XXX XXX XXXX
    return cleanNumber.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  } else if (cleanNumber.startsWith('0')) {
    // 0XXX XXX XXXX
    return cleanNumber.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phoneNumber;
};