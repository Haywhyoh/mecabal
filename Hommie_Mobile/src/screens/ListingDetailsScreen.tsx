import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { ListingsService, Listing } from '../services/listingsService';
import { ENV, validateEnvironment } from '../config/environment';

interface ListingDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      listingId: string;
    };
  };
}

const { width } = Dimensions.get('window');

export default function ListingDetailsScreen({ navigation, route }: ListingDetailsScreenProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const listingsService = ListingsService.getInstance();
  const { listingId } = route.params;

  // Fetch listing details
  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching listing:', listingId);
      console.log('🔍 API URL:', ENV.API.BASE_URL);
      console.log('🔍 Environment validation:', validateEnvironment());

      const data = await listingsService.getListing(listingId);

      console.log('✅ Listing fetched successfully:', data);
      console.log('📋 Listing type:', data.listingType);
      console.log('👤 Author:', data.author);
      console.log('💰 Price:', data.price);
      console.log('📍 Location:', data.location);
      console.log('📸 Media count:', data.media?.length || 0);

      setListing(data);
      setIsSaved(data.isSaved);

      // Increment view count
      await listingsService.incrementView(listingId);
      console.log('📊 View count incremented');
    } catch (error: any) {
      console.error('❌ Error fetching listing:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      Alert.alert('Error', 'Failed to load listing details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Handle save/unsave
  const handleSave = useCallback(async () => {
    try {
      if (isSaved) {
        await listingsService.unsaveListing(listingId);
      } else {
        await listingsService.saveListing(listingId);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      Alert.alert('Error', 'Failed to save listing');
    }
  }, [isSaved, listingId]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!listing) return;

    try {
      await Share.share({
        message: `Check out this listing: ${listing.title}\n₦${listing.price.toLocaleString()}\n\nShared via MeCabal`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [listing]);

  // Handle contact seller
  const handleContact = useCallback(() => {
    if (!listing) return;

    Alert.alert(
      'Contact Seller',
      `Would you like to message ${listing.author.firstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message',
          onPress: () => {
            // Navigate to messaging screen
            navigation.navigate('Messages', {
              recipientId: listing.author.id,
              recipientName: `${listing.author.firstName} ${listing.author.lastName}`,
            });
          },
        },
      ]
    );
  }, [listing, navigation]);

  // Format price
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Render service-specific details
  const renderServiceDetails = () => {
    if (!listing || listing.listingType !== 'service') return null;

    console.log('🔧 Rendering service details for listing:', listing.id);
    console.log('🔧 Service fields:', {
      serviceType: listing.serviceType,
      availabilitySchedule: listing.availabilitySchedule,
      serviceRadius: listing.serviceRadius,
      responseTime: listing.responseTime,
      pricingModel: listing.pricingModel,
      professionalCredentials: listing.professionalCredentials
    });

    return (
      <View style={styles.serviceSection}>
        <Text style={styles.sectionTitle}>Service Details</Text>

        {/* Availability Schedule */}
        {listing.availabilitySchedule && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={styles.infoValue}>
              {listing.availabilitySchedule.days.join(', ')}
            </Text>
          </View>
        )}

        {/* Service Radius */}
        {listing.serviceRadius && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Service Radius</Text>
            <Text style={styles.infoValue}>{listing.serviceRadius} km</Text>
          </View>
        )}

        {/* Response Time */}
        {listing.responseTime && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Response Time</Text>
            <Text style={styles.infoValue}>Within {listing.responseTime} hours</Text>
          </View>
        )}

        {/* Pricing Model */}
        {listing.pricingModel && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Pricing Model</Text>
            <Text style={styles.infoValue}>
              {listing.pricingModel.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Professional Credentials */}
        {listing.professionalCredentials && (
          <>
            <Text style={styles.subsectionTitle}>Professional Credentials</Text>

            {listing.professionalCredentials.experience > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={20} color={colors.textTertiary} />
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>
                  {listing.professionalCredentials.experience} years
                </Text>
              </View>
            )}

            {listing.professionalCredentials.licenses && listing.professionalCredentials.licenses.length > 0 && (
              <View style={styles.credentialsList}>
                <Text style={styles.credentialsLabel}>Licenses:</Text>
                {listing.professionalCredentials.licenses.map((license, index) => (
                  <View key={index} style={styles.credentialBadge}>
                    <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
                    <Text style={styles.credentialText}>{license}</Text>
                  </View>
                ))}
              </View>
            )}

            {listing.professionalCredentials.certifications && listing.professionalCredentials.certifications.length > 0 && (
              <View style={styles.credentialsList}>
                <Text style={styles.credentialsLabel}>Certifications:</Text>
                {listing.professionalCredentials.certifications.map((cert, index) => (
                  <View key={index} style={styles.credentialBadge}>
                    <Ionicons name="medal-outline" size={16} color={colors.primary} />
                    <Text style={styles.credentialText}>{cert}</Text>
                  </View>
                ))}
              </View>
            )}

            {listing.professionalCredentials.insurance && (
              <View style={styles.insuranceBadge}>
                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                <Text style={styles.insuranceText}>Insured Professional</Text>
              </View>
            )}
          </>
        )}

        {/* Fallback: Show basic service information if no specific fields */}
        {!listing.availabilitySchedule && !listing.serviceRadius && !listing.responseTime && !listing.pricingModel && !listing.professionalCredentials && (
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Service Type</Text>
            <Text style={styles.infoValue}>
              {listing.serviceType ? listing.serviceType.replace('_', ' ').toUpperCase() : 'Service Offering'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render job-specific details
  const renderJobDetails = () => {
    if (!listing || listing.listingType !== 'job') return null;

    return (
      <View style={styles.jobSection}>
        <Text style={styles.sectionTitle}>Job Details</Text>

        {/* Employment Type */}
        {listing.employmentType && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Employment Type</Text>
            <Text style={styles.infoValue}>
              {listing.employmentType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Salary Range */}
        {listing.salaryMin && listing.salaryMax && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Salary Range</Text>
            <Text style={styles.infoValue}>
              ₦{listing.salaryMin.toLocaleString()} - ₦{listing.salaryMax.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Work Location */}
        {listing.workLocation && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Work Location</Text>
            <Text style={styles.infoValue}>
              {listing.workLocation.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* Application Deadline */}
        {listing.applicationDeadline && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Application Deadline</Text>
            <Text style={styles.infoValue}>
              {formatDate(listing.applicationDeadline)}
            </Text>
          </View>
        )}

        {/* Required Skills */}
        {listing.requiredSkills && listing.requiredSkills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.subsectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {listing.requiredSkills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Required Experience */}
        {listing.requiredExperience && (
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Required Experience</Text>
            <Text style={styles.infoValue}>{listing.requiredExperience}</Text>
          </View>
        )}

        {/* Education */}
        {listing.education && (
          <View style={styles.infoRow}>
            <Ionicons name="book-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Education</Text>
            <Text style={styles.infoValue}>{listing.education}</Text>
          </View>
        )}

        {/* Benefits */}
        {listing.benefits && listing.benefits.length > 0 && (
          <View style={styles.benefitsSection}>
            <Text style={styles.subsectionTitle}>Benefits</Text>
            {listing.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Company Info */}
        {listing.companyInfo && (
          <View style={styles.companySection}>
            <Text style={styles.subsectionTitle}>About the Company</Text>
            <Text style={styles.companyName}>{listing.companyInfo.name}</Text>
            <View style={styles.companyDetails}>
              <Text style={styles.companyDetailText}>
                Size: {listing.companyInfo.size}
              </Text>
              <Text style={styles.companyDetailText}>
                Industry: {listing.companyInfo.industry}
              </Text>
              {listing.companyInfo.website && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(listing.companyInfo!.website!)}
                >
                  <Text style={styles.companyWebsite}>
                    {listing.companyInfo.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render enhanced property details
  const renderEnhancedPropertyDetails = () => {
    if (!listing || listing.listingType !== 'property') return null;

    return (
      <View style={styles.propertySection}>
        <Text style={styles.sectionTitle}>Property Details</Text>

        {/* Rental Period */}
        {listing.rentalPeriod && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Rental Period</Text>
            <Text style={styles.infoValue}>
              {listing.rentalPeriod.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Property Size */}
        {listing.propertySize && (
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Property Size</Text>
            <Text style={styles.infoValue}>{listing.propertySize} m²</Text>
          </View>
        )}

        {/* Land Size */}
        {listing.landSize && (
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Land Size</Text>
            <Text style={styles.infoValue}>{listing.landSize} m²</Text>
          </View>
        )}

        {/* Parking */}
        {listing.parkingSpaces && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Parking</Text>
            <Text style={styles.infoValue}>{listing.parkingSpaces} spaces</Text>
          </View>
        )}

        {/* Pet Policy */}
        {listing.petPolicy && (
          <View style={styles.infoRow}>
            <Ionicons name="paw-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Pet Policy</Text>
            <Text style={styles.infoValue}>
              {listing.petPolicy.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <View style={styles.amenitiesSection}>
            <Text style={styles.subsectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {listing.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Utilities Included */}
        {listing.utilitiesIncluded && listing.utilitiesIncluded.length > 0 && (
          <View style={styles.utilitiesSection}>
            <Text style={styles.subsectionTitle}>Utilities Included</Text>
            {listing.utilitiesIncluded.map((utility, index) => (
              <View key={index} style={styles.utilityItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.utilityText}>{utility}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Security Features */}
        {listing.securityFeatures && listing.securityFeatures.length > 0 && (
          <View style={styles.securitySection}>
            <Text style={styles.subsectionTitle}>Security Features</Text>
            {listing.securityFeatures.map((feature, index) => (
              <View key={index} style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={styles.securityText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render contact preferences
  const renderContactPreferences = () => {
    if (!listing || !listing.contactPreferences) return null;

    return (
      <View style={styles.contactPreferencesSection}>
        <Text style={styles.sectionTitle}>Contact Preferences</Text>
        <View style={styles.preferencesList}>
          {listing.contactPreferences.allowCalls && (
            <View style={styles.preferenceItem}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.preferenceText}>Phone calls accepted</Text>
            </View>
          )}
          {listing.contactPreferences.allowMessages && (
            <View style={styles.preferenceItem}>
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
              <Text style={styles.preferenceText}>In-app messages accepted</Text>
            </View>
          )}
          {listing.contactPreferences.allowWhatsApp && (
            <View style={styles.preferenceItem}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.success} />
              <Text style={styles.preferenceText}>WhatsApp available</Text>
            </View>
          )}
          {listing.contactPreferences.preferredTime && (
            <View style={styles.preferenceItem}>
              <Ionicons name="time" size={20} color={colors.textTertiary} />
              <Text style={styles.preferenceText}>
                Best time: {listing.contactPreferences.preferredTime}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.errorText}>Listing not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {listing.media.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / width
                  );
                  setCurrentImageIndex(index);
                }}
              >
                {listing.media.map((media, index) => (
                  <Image
                    key={media.id}
                    source={{ uri: media.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Image indicators */}
              {listing.media.length > 1 && (
                <View style={styles.imageIndicators}>
                  {listing.media.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color={colors.textTertiary} />
            </View>
          )}

          {/* Status Badge */}
          {listing.status === 'sold' && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>SOLD</Text>
            </View>
          )}
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {listing.priceType !== 'fixed' && (
              <View style={styles.priceTypeBadge}>
                <Text style={styles.priceTypeText}>
                  {listing.priceType.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{listing.title}</Text>
        </View>

        {/* Basic Info Section */}
        <View style={styles.infoSection}>
          {/* Category */}
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{listing.category.name}</Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {listing.location.address}
            </Text>
          </View>

          {/* Basic Property Details */}
          {listing.listingType === 'property' && (
            <>
              {listing.propertyType && (
                <View style={styles.infoRow}>
                  <Ionicons name="home-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{listing.propertyType}</Text>
                </View>
              )}
              {listing.bedrooms && (
                <View style={styles.infoRow}>
                  <Ionicons name="bed-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Bedrooms</Text>
                  <Text style={styles.infoValue}>{listing.bedrooms}</Text>
                </View>
              )}
              {listing.bathrooms && (
                <View style={styles.infoRow}>
                  <Ionicons name="water-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Bathrooms</Text>
                  <Text style={styles.infoValue}>{listing.bathrooms}</Text>
                </View>
              )}
            </>
          )}

          {/* Basic Item Details */}
          {listing.listingType === 'item' && (
            <>
              {listing.condition && (
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Condition</Text>
                  <Text style={styles.infoValue}>
                    {listing.condition.replace('_', ' ')}
                  </Text>
                </View>
              )}
              {listing.brand && (
                <View style={styles.infoRow}>
                  <Ionicons name="star-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Brand</Text>
                  <Text style={styles.infoValue}>{listing.brand}</Text>
                </View>
              )}
              {listing.model && (
                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{listing.model}</Text>
                </View>
              )}
              {listing.year && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Year</Text>
                  <Text style={styles.infoValue}>{listing.year}</Text>
                </View>
              )}
              {listing.warranty && (
                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Warranty</Text>
                  <Text style={styles.infoValue}>{listing.warranty}</Text>
                </View>
              )}
            </>
          )}

          {/* Basic Service Details */}
          {listing.listingType === 'service' && (
            <>
              {listing.serviceType && (
                <View style={styles.infoRow}>
                  <Ionicons name="construct-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Service Type</Text>
                  <Text style={styles.infoValue}>
                    {listing.serviceType.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Basic Job Details */}
          {listing.listingType === 'job' && (
            <>
              {listing.employmentType && (
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Employment Type</Text>
                  <Text style={styles.infoValue}>
                    {listing.employmentType.replace('_', ' ')}
                  </Text>
                </View>
              )}
              {listing.workLocation && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>Work Location</Text>
                  <Text style={styles.infoValue}>
                    {listing.workLocation.charAt(0).toUpperCase() + listing.workLocation.slice(1)}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Views */}
          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Views</Text>
            <Text style={styles.infoValue}>{listing.viewsCount}</Text>
          </View>

          {/* Posted Date */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.infoLabel}>Posted</Text>
            <Text style={styles.infoValue}>{formatDate(listing.createdAt)}</Text>
          </View>

          {/* Estate Information */}
          {listing.estateId && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Estate</Text>
              <Text style={styles.infoValue}>Estate Property</Text>
            </View>
          )}

          {/* City and State */}
          {(listing.city || listing.state) && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Area</Text>
              <Text style={styles.infoValue}>
                {[listing.city, listing.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Verification Status */}
          {listing.verificationStatus && (
            <View style={styles.infoRow}>
              <Ionicons 
                name={listing.verificationStatus === 'verified' ? 'shield-checkmark' : 'time-outline'} 
                size={20} 
                color={listing.verificationStatus === 'verified' ? colors.success : colors.warning} 
              />
              <Text style={styles.infoLabel}>Verification</Text>
              <Text style={styles.infoValue}>
                {listing.verificationStatus.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Featured/Boosted Status */}
          {(listing.featured || listing.boosted) && (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={20} color={colors.warning} />
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {[listing.featured && 'Featured', listing.boosted && 'Boosted'].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Type-specific details */}
        {renderServiceDetails()}
        {renderJobDetails()}
        {renderEnhancedPropertyDetails()}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Contact Preferences */}
        {renderContactPreferences()}

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>
            {listing.author.businessProfile ? 'Business Information' : 'Seller Information'}
          </Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              {listing.author.profilePicture ? (
                <Image
                  source={{ uri: listing.author.profilePicture }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color={colors.textTertiary} />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>
                  {listing.author.businessProfile 
                    ? listing.author.businessProfile.businessName
                    : `${listing.author.firstName} ${listing.author.lastName}`
                  }
                </Text>
                {listing.author.isVerified && (
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                )}
              </View>
              
              {listing.author.businessProfile && (
                <Text style={styles.businessType}>
                  {listing.author.businessProfile.businessType}
                </Text>
              )}
              
              {listing.author.businessProfile && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={styles.ratingText}>
                    {listing.author.businessProfile.rating.toFixed(1)} 
                    ({listing.author.businessProfile.reviewCount} reviews)
                  </Text>
                </View>
              )}
              
              {listing.author.isVerified && (
                <Text style={styles.verifiedText}>
                  {listing.author.businessProfile ? 'Verified Business' : 'Verified Seller'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bottom spacing for fixed button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Contact Button */}
      {listing.status === 'active' && (
        <View style={styles.contactContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.white} />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  imageGallery: {
    position: 'relative',
  },
  image: {
    width: width,
    height: width * 0.8,
    backgroundColor: colors.neutral.lightGray,
  },
  placeholderImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  soldBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    ...shadows.medium,
  },
  soldText: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.white,
  },
  priceSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  price: {
    fontSize: 34,
    fontWeight: '700' as any,
    lineHeight: 41,
    color: colors.primary,
  },
  priceTypeBadge: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceTypeText: {
    fontSize: 12,
    fontWeight: '400' as any,
    lineHeight: 16,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 20,
    fontWeight: '400' as any,
    lineHeight: 25,
    color: colors.text,
  },
  infoSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textTertiary,
    flex: 1,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '500' as any,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22 * 1.2,
    color: colors.textSecondary,
  },
  sellerSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.text,
  },
  verifiedText: {
    fontSize: 15,
    fontWeight: '400' as any,
    lineHeight: 20,
    color: colors.primary,
  },
  bottomSpacing: {
    height: spacing['2xl'],
  },
  contactContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.lightGray,
    ...shadows.large,
  },
  contactButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    ...shadows.medium,
  },
  contactButtonText: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.white,
  },
  // New styles for enhanced details
  detailsSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  detailItem: {
    marginBottom: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '400' as any,
    lineHeight: 20,
    color: colors.text,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22 * 1.2,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500' as any,
    lineHeight: 16,
    color: colors.primary,
  },
  availabilityContainer: {
    marginTop: spacing.xs,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  dayLabel: {
    fontSize: 17,
    fontWeight: '500' as any,
    lineHeight: 22,
    color: colors.text,
    minWidth: 80,
  },
  timeLabel: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  benefitsList: {
    marginTop: spacing.xs,
  },
  businessType: {
    fontSize: 15,
    fontWeight: '400' as any,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  // New styles for enhanced details
  serviceSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  jobSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  propertySection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600' as any,
    lineHeight: 20,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  credentialsList: {
    marginTop: spacing.sm,
  },
  credentialsLabel: {
    fontSize: 12,
    fontWeight: '400' as any,
    lineHeight: 16,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  credentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  credentialText: {
    fontSize: 12,
    fontWeight: '400' as any,
    lineHeight: 16,
    color: colors.primary,
  },
  insuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  insuranceText: {
    fontSize: 15,
    fontWeight: '600' as any,
    lineHeight: 20,
    color: colors.success,
  },
  skillsSection: {
    marginTop: spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  skillChip: {
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '400' as any,
    lineHeight: 16,
    color: colors.text,
  },
  benefitsSection: {
    marginTop: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  benefitText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
    flex: 1,
  },
  companySection: {
    marginTop: spacing.md,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  companyDetails: {
    gap: spacing.xs,
  },
  companyDetailText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  companyWebsite: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  amenitiesSection: {
    marginTop: spacing.md,
  },
  amenitiesGrid: {
    gap: spacing.sm,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  amenityText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  utilitiesSection: {
    marginTop: spacing.md,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  utilityText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  securitySection: {
    marginTop: spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  securityText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  contactPreferencesSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  preferencesList: {
    gap: spacing.sm,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  preferenceText: {
    fontSize: 17,
    fontWeight: '400' as any,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
