import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { BUSINESS_CATEGORIES, SERVICE_AREAS, formatNairaCurrency } from '../../constants/businessData';
import { NIGERIAN_STATES } from '../../constants/nigerianData';
import { businessSearchApi } from '../../services/api';
import { BusinessProfile } from '../../services/types/business.types';
import { SearchFilters } from './AdvancedSearchFiltersScreen';

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

  // API state
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({});

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, [selectedCategory, selectedServiceArea, sortBy, advancedFilters]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        serviceArea: selectedServiceArea,
        isActive: true,
        sortBy: sortBy === 'rating' ? 'rating' : sortBy === 'distance' ? 'distance' : undefined,
        sortOrder: 'DESC' as const,
        ...advancedFilters,
      };

      const response = await businessSearchApi.searchBusinesses(searchParams);
      setBusinesses(response.businesses);
    } catch (err: any) {
      setError(err.message || 'Failed to load businesses');
      console.error('Error loading businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBusinesses();
    setRefreshing(false);
  }, [selectedCategory, selectedServiceArea, sortBy]);

  // Debounced search
  useEffect(() => {
    if (searchText.trim()) {
      const timer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      loadBusinesses();
    }
  }, [searchText]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await businessSearchApi.searchBusinesses({
        search: searchText.trim(),
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        serviceArea: selectedServiceArea,
        isActive: true,
        sortBy: sortBy === 'rating' ? 'rating' : sortBy === 'distance' ? 'distance' : undefined,
        sortOrder: 'DESC' as const,
      });

      setBusinesses(response.businesses);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      console.error('Error searching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock business listings (kept for fallback/reference)
  const mockBusinesses: BusinessListing[] = [
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
  ];

  // Businesses are already filtered and sorted by the API
  const displayedBusinesses = businesses;

  const handleContactBusiness = (business: BusinessProfile) => {
    Alert.alert(
      `Contact ${business.businessName}`,
      'Choose how to contact this business:',
      [
        {
          text: 'Call',
          onPress: () => Alert.alert('Call Business', `Calling ${business.phone}`)
        },
        ...(business.whatsapp ? [{
          text: 'WhatsApp',
          onPress: () => Alert.alert('WhatsApp Business', `Opening WhatsApp for ${business.whatsapp}`)
        }] : []),
        {
          text: 'Message',
          onPress: () => Alert.alert('Send Message', 'Opening chat with business owner')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleBookService = (business: BusinessProfile) => {
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

  const handleViewProfile = (business: BusinessProfile) => {
    navigation?.navigate('BusinessDetail', { businessId: business.id });
  };

  const handleOpenAdvancedFilters = () => {
    navigation?.navigate('AdvancedSearchFilters', {
      currentFilters: advancedFilters,
      onApplyFilters: (filters: SearchFilters) => {
        setAdvancedFilters(filters);
      },
    });
  };

  const getActiveFilterCount = () => {
    return Object.keys(advancedFilters).filter(
      key => advancedFilters[key as keyof SearchFilters] !== undefined
    ).length;
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

  const renderBusinessCard = (business: BusinessProfile) => {
    const category = BUSINESS_CATEGORIES.find(cat => cat.id === business.category);
    const verificationLevel = business.isVerified ? 'enhanced' : 'basic';

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
                  name={getVerificationIcon(verificationLevel)}
                  size={16}
                  color={getVerificationColor(verificationLevel)}
                />
              </View>

              <Text style={styles.subcategory}>{business.subcategory || business.category}</Text>

              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                <Text style={styles.rating}>{business.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.reviewCount}>({business.reviewCount || 0} reviews)</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{business.description || 'No description available'}</Text>

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
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.headerButton}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#00A651" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenAdvancedFilters} style={styles.headerButton}>
            <MaterialCommunityIcons name="tune" size={24} color="#00A651" />
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
      {!loading && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {displayedBusinesses.length} business{displayedBusinesses.length !== 1 ? 'es' : ''} found
          </Text>
          <Text style={styles.resultsLocation}>in your area</Text>
        </View>
      )}

      {/* Business Listings */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A651" />
            <Text style={styles.loadingText}>Finding businesses...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.emptyTitle}>Error Loading</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadBusinesses}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : displayedBusinesses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="store-search" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Businesses Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText
                ? `No businesses match "${searchText}". Try a different search term.`
                : 'No businesses available in the selected category.'}
            </Text>
          </View>
        ) : (
          displayedBusinesses.map(renderBusinessCard)
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});