import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../components/ScreenHeader';
import SendInquiryModal from '../components/SendInquiryModal';
import { businessApi, businessReviewApi } from '../services/api';
import { BusinessProfile, BusinessReview } from '../services/types/business.types';
import { BUSINESS_VERIFICATION_LEVELS, BUSINESS_CATEGORIES } from '../constants/businessData';

interface BusinessDetailScreenProps {
  navigation?: any;
  route?: {
    params: {
      businessId: string;
    };
  };
}

export default function BusinessDetailScreen({ navigation, route }: BusinessDetailScreenProps) {
  const businessId = route?.params?.businessId;

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadBusinessDetails();
      loadReviews();
    }
  }, [businessId]);

  const loadBusinessDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessApi.getBusinessById(businessId);
      setBusiness(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load business details');
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await businessReviewApi.getBusinessReviews(businessId, {
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      setReviews(response.reviews);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleCall = () => {
    if (business?.phone) {
      Linking.openURL(`tel:${business.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (business?.whatsapp) {
      Linking.openURL(`whatsapp://send?phone=${business.whatsapp.replace(/\+/g, '')}`);
    }
  };

  const handleMessage = () => {
    Alert.alert('Send Message', 'Opening chat with business owner');
  };

  const handleRequestQuote = () => {
    setShowInquiryModal(true);
  };

  const handleViewAllReviews = () => {
    navigation?.navigate('BusinessReviews', { businessId });
  };

  const getVerificationInfo = () => {
    if (!business) return null;
    return BUSINESS_VERIFICATION_LEVELS.find(level =>
      level.id === (business.isVerified ? 'enhanced' : 'basic')
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half-full' : 'star-outline'}
          size={16}
          color="#FFC107"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Details" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !business) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Details" navigation={navigation} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error || 'Business not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBusinessDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verificationInfo = getVerificationInfo();
  const category = BUSINESS_CATEGORIES.find(cat => cat.id === business.category);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Business Details" navigation={navigation} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover & Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.coverImage}>
            {business.coverImage ? (
              <Image source={{ uri: business.coverImage }} style={styles.coverImageFull} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialCommunityIcons name="image" size={32} color="#8E8E8E" />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              {business.profileImage ? (
                <Image source={{ uri: business.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: category?.color || '#00A651' }]}>
                  <MaterialCommunityIcons name={category?.icon as any || 'store'} size={32} color="#FFFFFF" />
                </View>
              )}
              {business.isActive && (
                <View style={styles.statusDot} />
              )}
            </View>

            <View style={styles.businessInfo}>
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>{business.businessName}</Text>
                {verificationInfo && (
                  <MaterialCommunityIcons
                    name={verificationInfo.badge as any}
                    size={20}
                    color={verificationInfo.color}
                  />
                )}
              </View>

              <Text style={styles.subcategory}>{business.subcategory || business.category}</Text>

              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {renderStars(business.rating || 0)}
                </View>
                <Text style={styles.rating}>{(business.rating || 0).toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({business.reviewCount || 0} reviews)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#00A651" />
            <Text style={styles.statNumber}>{business.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#0066CC" />
            <Text style={styles.statNumber}>{business.responseTime || 'N/A'}</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar" size={20} color="#FF6B35" />
            <Text style={styles.statNumber}>{business.yearsOfExperience || 0}y</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.actionsCard}>
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <MaterialCommunityIcons name="phone" size={24} color="#0066CC" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            {business.whatsapp && (
              <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
                <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <MaterialCommunityIcons name="message" size={24} color="#8E8E8E" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.requestQuoteButton} onPress={handleRequestQuote}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color="#FFFFFF" />
            <Text style={styles.requestQuoteText}>Request Quote</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About This Business</Text>
          <Text style={styles.description}>{business.description || 'No description available'}</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#8E8E8E" />
              <Text style={styles.detailLabel}>Service Area:</Text>
              <Text style={styles.detailValue}>{business.serviceArea}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-ngn" size={18} color="#8E8E8E" />
              <Text style={styles.detailLabel}>Pricing:</Text>
              <Text style={styles.detailValue}>{business.pricingModel}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock" size={18} color="#8E8E8E" />
              <Text style={styles.detailLabel}>Availability:</Text>
              <Text style={styles.detailValue}>{business.availability}</Text>
            </View>

            {business.hasInsurance && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="shield-check" size={18} color="#00A651" />
                <Text style={styles.detailLabel}>Insurance:</Text>
                <Text style={[styles.detailValue, { color: '#00A651' }]}>Covered</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Methods */}
        {business.acceptedPaymentMethods && business.acceptedPaymentMethods.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
            <View style={styles.paymentMethods}>
              {business.acceptedPaymentMethods.map((method, index) => (
                <View key={index} style={styles.paymentChip}>
                  <Text style={styles.paymentChipText}>{method}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.sectionCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviews.length > 0 && (
              <TouchableOpacity onPress={handleViewAllReviews}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#00A651" style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.noReviews}>
              <MaterialCommunityIcons name="comment-outline" size={40} color="#8E8E8E" />
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>User</Text>
                      <View style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={3}>
                    {review.comment}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Send Inquiry Modal */}
      {business && (
        <SendInquiryModal
          visible={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          businessId={business.id}
          businessName={business.businessName}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  coverImage: {
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  coverImageFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -40,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00A651',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 8,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    flex: 1,
    marginRight: 8,
  },
  subcategory: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginTop: 4,
  },
  requestQuoteButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  requestQuoteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentChipText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '500',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  reviewComment: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginLeft: 48,
  },
});
