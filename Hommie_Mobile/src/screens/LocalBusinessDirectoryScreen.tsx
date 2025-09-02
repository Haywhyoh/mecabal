import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../utils/navigationUtils';
import { BUSINESS_CATEGORIES, SERVICE_AREAS, formatNairaCurrency } from '../constants/businessData';
import { NIGERIAN_STATES } from '../constants/nigerianData';

interface BusinessListing {
  id: string;
  businessName: string;
  category: string;
  subcategory: string;
  ownerName: string;
  profileImage?: string;
  rating: number;
  reviewCount: number;
  description: string;
  serviceArea: string;
  location: {
    estate: string;
    area: string;
    distance: number; // in km
  };
  contactInfo: {
    phone: string;
    whatsapp?: string;
  };
  pricing: {
    model: string;
    range: { min: number; max: number };
  };
  availability: string;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  isActive: boolean;
  responseTime: string;
  completedJobs: number;
  joinedDate: string;
  specialties: string[];
  badges: string[];
}

export default function LocalBusinessDirectoryScreen() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServiceArea, setSelectedServiceArea] = useState<string>('neighborhood');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'price'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Mock business listings
  const [businesses] = useState<BusinessListing[]>([
    {
      id: '1',
      businessName: "Adebayo's Home Repairs",
      category: 'household-services',
      subcategory: 'Home Repairs',
      ownerName: 'Adebayo Ogundimu',
      rating: 4.8,
      reviewCount: 43,
      description: 'Professional home repair and maintenance services. Specializing in plumbing, electrical, and general repairs.',
      serviceArea: 'neighborhood',
      location: {
        estate: 'Victoria Island Estate',
        area: 'Victoria Island',
        distance: 0.5
      },
      contactInfo: {
        phone: '+234 803 123 4567',
        whatsapp: '+234 803 123 4567'
      },
      pricing: {
        model: 'fixed-rate',
        range: { min: 5000, max: 25000 }
      },
      availability: 'business-hours',
      verificationLevel: 'enhanced',
      isActive: true,
      responseTime: '< 2 hours',
      completedJobs: 127,
      joinedDate: '2024-03-15',
      specialties: ['Plumbing', 'Electrical', 'Carpentry'],
      badges: ['Verified', 'Top Rated', 'Quick Response']
    },
    {
      id: '2',
      businessName: 'Lagos Prime Cleaning',
      category: 'household-services',
      subcategory: 'Cleaning Services',
      ownerName: 'Sarah Adamu',
      rating: 4.9,
      reviewCount: 67,
      description: 'Professional cleaning services for homes and offices. Eco-friendly products and reliable staff.',
      serviceArea: 'district',
      location: {
        estate: 'Lekki Phase 1',
        area: 'Lekki',
        distance: 1.2
      },
      contactInfo: {
        phone: '+234 809 876 5432'
      },
      pricing: {
        model: 'hourly-rate',
        range: { min: 3000, max: 5000 }
      },
      availability: 'extended-hours',
      verificationLevel: 'premium',
      isActive: true,
      responseTime: '< 1 hour',
      completedJobs: 289,
      joinedDate: '2024-01-10',
      specialties: ['Deep Cleaning', 'Office Cleaning', 'Post-Construction'],
      badges: ['Premium Verified', 'Top Rated', 'Eco-Friendly']
    },
    {
      id: '3',
      businessName: 'TechFix Nigeria',
      category: 'technology',
      subcategory: 'Computer Repair',
      ownerName: 'Emeka Okoro',
      rating: 4.6,
      reviewCount: 28,
      description: 'Computer and phone repair services. Data recovery, virus removal, and hardware upgrades.',
      serviceArea: 'city-wide',
      location: {
        estate: 'Ikeja GRA',
        area: 'Ikeja',
        distance: 3.5
      },
      contactInfo: {
        phone: '+234 702 345 6789',
        whatsapp: '+234 702 345 6789'
      },
      pricing: {
        model: 'project-based',
        range: { min: 8000, max: 50000 }
      },
      availability: 'flexible',
      verificationLevel: 'basic',
      isActive: true,
      responseTime: '< 4 hours',
      completedJobs: 95,
      joinedDate: '2024-06-20',
      specialties: ['Laptop Repair', 'Data Recovery', 'Virus Removal'],
      badges: ['Verified', 'Tech Expert']
    }
  ]);

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
                         business.subcategory.toLowerCase().includes(searchText.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    
    return matchesSearch && matchesCategory && business.isActive;
  });

  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return a.location.distance - b.location.distance;
      case 'price':
        return a.pricing.range.min - b.pricing.range.min;
      default:
        return 0;
    }
  });

  const handleContactBusiness = (business: BusinessListing) => {
    Alert.alert(
      `Contact ${business.businessName}`,
      'Choose how to contact this business:',
      [
        {
          text: 'Call',
          onPress: () => Alert.alert('Call Business', `Calling ${business.contactInfo.phone}`)
        },
        ...(business.contactInfo.whatsapp ? [{
          text: 'WhatsApp',
          onPress: () => Alert.alert('WhatsApp Business', `Opening WhatsApp for ${business.contactInfo.whatsapp}`)
        }] : []),
        {
          text: 'Message',
          onPress: () => Alert.alert('Send Message', 'Opening chat with business owner')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleBookService = (business: BusinessListing) => {
    Alert.alert(
      'Book Service',
      `Request a service quote from ${business.businessName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Quote',
          onPress: () => Alert.alert('Quote Requested', 'Your service request has been sent. The business will contact you shortly.')
        }
      ]
    );
  };

  const handleViewProfile = (business: BusinessListing) => {
    Alert.alert('Business Profile', `Navigate to full profile for ${business.businessName}`);
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'premium': return 'shield-crown';
      case 'enhanced': return 'shield-star';
      case 'basic': return 'shield-check';
      default: return 'shield-outline';
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'premium': return '#FFC107';
      case 'enhanced': return '#0066CC';
      case 'basic': return '#00A651';
      default: return '#8E8E8E';
    }
  };

  const renderBusinessCard = (business: BusinessListing) => {
    const category = BUSINESS_CATEGORIES.find(cat => cat.id === business.category);

    return (
      <TouchableOpacity 
        key={business.id} 
        style={styles.businessCard}
        onPress={() => handleViewProfile(business)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.businessInfo}>
            <View style={styles.avatarContainer}>
              {business.profileImage ? (
                <Image source={{ uri: business.profileImage }} style={styles.businessAvatar} />
              ) : (
                <View style={[styles.businessAvatar, { backgroundColor: category?.color || '#00A651' }]}>
                  <MaterialCommunityIcons 
                    name={category?.icon as any || 'store'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
              )}
              {business.isActive && (
                <View style={styles.statusDotOnAvatar} />
              )}
            </View>
            
            <View style={styles.businessDetails}>
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>{business.businessName}</Text>
                <MaterialCommunityIcons 
                  name={getVerificationIcon(business.verificationLevel)} 
                  size={16} 
                  color={getVerificationColor(business.verificationLevel)} 
                />
              </View>
              
              <Text style={styles.subcategory}>{business.subcategory}</Text>
              
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                <Text style={styles.rating}>{business.rating}</Text>
                <Text style={styles.reviewCount}>({business.reviewCount} reviews)</Text>
                <Text style={styles.distance}>• {business.location.distance}km away</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{business.description}</Text>


        {business.badges.length > 0 && (
          <View style={styles.badgeContainer}>
            {business.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => handleContactBusiness(business)}
          >
            <MaterialCommunityIcons name="phone" size={16} color="#0066CC" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => handleBookService(business)}
          >
            <MaterialCommunityIcons name="calendar-plus" size={16} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Book Service</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => contextAwareGoBack(navigation, 'main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Businesses</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses, services..."
            placeholderTextColor="#8E8E8E"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            
            {BUSINESS_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.filterChip, selectedCategory === category.id && styles.filterChipActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : category.color} 
                />
                <Text style={[styles.filterText, selectedCategory === category.id && styles.filterTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            {['rating', 'distance', 'price'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
                onPress={() => setSortBy(option as any)}
              >
                <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {sortedBusinesses.length} business{sortedBusinesses.length !== 1 ? 'es' : ''} found
        </Text>
        <Text style={styles.resultsLocation}>in your area</Text>
      </View>

      {/* Business Listings */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedBusinesses.map(renderBusinessCard)}
        
        {sortedBusinesses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="store-search" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Businesses Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 
                `No businesses match "${searchText}". Try a different search term.` :
                'No businesses available in the selected category.'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
    marginRight: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#00A651',
  },
  filterText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 4,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sortLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: '#E8F5E8',
  },
  sortText: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  sortTextActive: {
    color: '#00A651',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  resultsLocation: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotOnAvatar: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00A651',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  businessDetails: {
    flex: 1,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    marginRight: 8,
  },
  subcategory: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 2,
  },
  distance: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  description: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#00A651',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    marginLeft: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00A651',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
});