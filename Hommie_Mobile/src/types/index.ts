// User Types
export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  neighborhood: string;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Post Types
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  media?: string[];
  category: PostCategory;
  likes: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export type PostCategory = 
  | 'General'
  | 'Events'
  | 'Lost & Found'
  | 'Safety Alerts'
  | 'Buy & Sell'
  | 'Recommendations'
  | 'News';

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  organizerId: string;
  organizerName: string;
  attendees: string[];
  maxAttendees?: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Types
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  sellerId: string;
  sellerName: string;
  images: string[];
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  isService: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Events: undefined;
  Marketplace: undefined;
  Profile: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'post' | 'event' | 'marketplace' | 'safety' | 'general';
  isRead: boolean;
  createdAt: Date;
}
