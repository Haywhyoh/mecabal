import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { BusinessService, BusinessProfile } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';

interface ServiceDetailsScreenProps {
  route: {
    params: {
      service: BusinessService;
      business: BusinessProfile;
    };
  };
  navigation?: any;
}

export default function ServiceDetailsScreen({ route, navigation }: ServiceDetailsScreenProps) {
  const { service, business } = route.params;
  const [loading, setLoading] = useState(false);

  const priceRange =
    service.priceMin && service.priceMax
      ? `${formatNairaCurrency(service.priceMin)} - ${formatNairaCurrency(service.priceMax)}`
      : service.priceMin
      ? `From ${formatNairaCurrency(service.priceMin)}`
      : 'Price on request';

  const handleBookService = () => {
    navigation?.navigate('BookService', { service, business });
  };

  const handleMessageProvider = () => {
    navigation?.navigate('Chat', {
      conversationId: `business-${business.id}`,
      recipientName: business.businessName,
    });
  };

  const handleViewProvider = () => {
    navigation?.navigate('BusinessDetail', { businessId: business.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Service Details"
        navigation={navigation}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Header */}
        <View style={styles.headerSection}>
          <Text style={styles.serviceName}>{service.serviceName}</Text>
          <View style={styles.priceContainer}>
            <MaterialCommunityIcons name="currency-ngn" size={20} color="#00A651" />
            <Text style={styles.priceText}>{priceRange}</Text>
          </View>
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <TouchableOpacity
            style={styles.providerHeader}
            onPress={handleViewProvider}
            activeOpacity={0.7}
          >
            {business.profileImageUrl ? (
              <Image
                source={{ uri: business.profileImageUrl }}
                style={styles.providerImage}
              />
            ) : (
              <View style={styles.providerImagePlaceholder}>
                <MaterialCommunityIcons name="store" size={24} color="#8E8E93" />
              </View>
            )}
            <View style={styles.providerInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>{business.businessName}</Text>
                {business.isVerified && (
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={20}
                    color="#00A651"
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingText}>
                  {business.rating.toFixed(1)} ({business.reviewCount} reviews)
                </Text>
              </View>
              {business.completedJobs > 0 && (
                <Text style={styles.jobsText}>
                  {business.completedJobs} completed jobs
                </Text>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          {/* Verification Badges */}
          <View style={styles.badgesContainer}>
            {business.isVerified && (
              <View style={styles.badge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#00A651" />
                <Text style={styles.badgeText}>Estate Verified</Text>
              </View>
            )}
            {business.hasInsurance && (
              <View style={styles.badge}>
                <MaterialCommunityIcons name="shield" size={16} color="#0066CC" />
                <Text style={styles.badgeText}>Insured</Text>
              </View>
            )}
          </View>
        </View>

        {/* Service Description */}
        {service.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.descriptionText}>{service.description}</Text>
          </View>
        )}

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.detailsList}>
            {service.duration && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailText}>Duration: {service.duration}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#8E8E93" />
              <Text style={styles.detailText}>
                Service Area: {business.serviceArea.replace('-', ' ')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar" size={20} color="#8E8E93" />
              <Text style={styles.detailText}>
                Availability: {business.availability.replace('-', ' ')}
              </Text>
            </View>
            {business.yearsOfExperience > 0 && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="briefcase" size={20} color="#8E8E93" />
                <Text style={styles.detailText}>
                  {business.yearsOfExperience} years of experience
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Information */}
        {(business.phoneNumber || business.whatsappNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactButtons}>
              {business.phoneNumber && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Alert.alert('Call', `Call ${business.phoneNumber}?`)}
                >
                  <MaterialCommunityIcons name="phone" size={20} color="#00A651" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              {business.whatsappNumber && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Alert.alert('WhatsApp', `Open WhatsApp?`)}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                  <Text style={styles.contactButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleMessageProvider}
              >
                <MaterialCommunityIcons name="message" size={20} color="#0066CC" />
                <Text style={styles.contactButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookService}
          disabled={loading}
        >
          <Text style={styles.bookButtonText}>Book Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00A651',
    marginLeft: 8,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  providerImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  jobsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#00A651',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#3A3A3C',
    lineHeight: 24,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#3A3A3C',
    marginLeft: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookButton: {
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

