import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Linking,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, shadows } from '../../constants';
import { BusinessProfile, BusinessService } from '../../services/types/business.types';
import { businessApi, businessServiceApi } from '../../services/api';
import { formatNairaCurrency } from '../../constants/businessData';
import { ScreenHeader } from '../../components/ui';

interface BusinessDetailScreenProps {
  navigation: any;
  route: {
    params: {
      businessId: string;
    };
  };
}

const { width } = Dimensions.get('window');

export default function BusinessDetailScreen({ navigation, route }: BusinessDetailScreenProps) {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const { businessId } = route.params;

  useEffect(() => {
    fetchBusinessDetails();
    fetchBusinessServices();
  }, [businessId]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const businessData = await businessApi.getBusinessById(businessId);
      setBusiness(businessData);
    } catch (error: any) {
      console.error('Error fetching business details:', error);
      Alert.alert('Error', error.message || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessServices = async () => {
    try {
      setLoadingServices(true);
      const servicesData = await businessServiceApi.getBusinessServices(businessId);
      // Only show active services
      setServices(servicesData.filter(service => service.isActive));
    } catch (error: any) {
      console.error('Error fetching business services:', error);
      // Don't show alert for services, just log the error
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServicePress = (service: BusinessService) => {
    if (!business) return;
    navigation?.navigate('BookService', {
      service,
      business,
    });
  };

  const handleCall = () => {
    if (business?.phoneNumber) {
      Linking.openURL(`tel:${business.phoneNumber}`);
    }
  };

  const handleWhatsApp = () => {
    if (business?.whatsappNumber) {
      Linking.openURL(`whatsapp://send?phone=${business.whatsappNumber}`);
    }
  };


  const renderBusinessInfo = () => {
    if (!business) return null;

    return (
      <View style={styles.businessInfoSection}>
        <View style={styles.businessHeader}>
          <View style={styles.businessNameRow}>
            <Text style={styles.businessName}>{business.businessName}</Text>
            {business.isVerified && (
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            )}
          </View>
          <Text style={styles.businessCategory}>{business.category}</Text>
        </View>

        <Text style={styles.businessDescription}>{business.description}</Text>

        <View style={styles.businessStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={colors.accent.warmGold} />
            <Text style={styles.statText}>
              {(typeof business.rating === 'number' ? business.rating : 0).toFixed(1)} ({business.reviewCount || 0} reviews)
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statText}>{business.completedJobs || 0} jobs completed</Text>
          </View>
          {business.yearsOfExperience > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={20} color={colors.text.light} />
              <Text style={styles.statText}>{business.yearsOfExperience} years experience</Text>
            </View>
          )}
        </View>

        {business.isVerified && (
          <View style={styles.verificationBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.verificationText}>VERIFIED</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContactInfo = () => {
    if (!business) return null;

    return (
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.contactItem}>
          <Ionicons name="location" size={20} color={colors.text.light} />
          <Text style={styles.contactText}>{business.businessAddress}</Text>
        </View>

        <View style={styles.contactItem}>
          <Ionicons name="business" size={20} color={colors.text.light} />
          <Text style={styles.contactText}>
            {business.serviceArea?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
          </Text>
        </View>

        {business.phoneNumber && (
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color={colors.text.light} />
            <Text style={styles.contactText}>{business.phoneNumber}</Text>
          </View>
        )}

        {business.whatsappNumber && (
          <View style={styles.contactItem}>
            <Ionicons name="logo-whatsapp" size={20} color={colors.success} />
            <Text style={styles.contactText}>{business.whatsappNumber}</Text>
          </View>
        )}

        <View style={styles.contactButtons}>
          {business.phoneNumber && (
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color={colors.white} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          {business.whatsappNumber && (
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderServices = () => {
    if (loadingServices) {
      return (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        </View>
      );
    }

    if (!services || services.length === 0) {
      return (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="wrench" size={48} color={colors.text.light} />
            <Text style={styles.emptyText}>No services available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Services ({services.length})</Text>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItem}
            onPress={() => handleServicePress(service)}
            activeOpacity={0.7}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                {service.priceMin && (
                  <Text style={styles.servicePrice}>
                    {formatNairaCurrency(service.priceMin)}
                    {service.priceMax && ` - ${formatNairaCurrency(service.priceMax)}`}
                  </Text>
                )}
              </View>
              {service.description && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              )}
              {service.duration && (
                <View style={styles.serviceMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.text.light} />
                  <Text style={styles.serviceMetaText}>{service.duration}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.light} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBusinessHours = () => {
    if (!business?.availability) return null;

    const availabilityMap: Record<string, string> = {
      'business-hours': 'Business Hours',
      'extended-hours': 'Extended Hours',
      'weekend-available': 'Weekend Available',
      'twenty-four-seven': '24/7 Available',
      'flexible': 'Flexible Schedule',
      'weekdays': 'Weekdays Only',
      'weekends': 'Weekends Only',
      'custom': 'Custom Schedule',
    };

    return (
      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <View style={styles.hoursItem}>
          <Text style={styles.dayText}>Schedule</Text>
          <Text style={styles.hoursText}>
            {availabilityMap[business.availability] || business.availability}
          </Text>
        </View>
      </View>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Details" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Details" navigation={navigation} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.text.light} />
          <Text style={styles.errorTitle}>Business not found</Text>
          <Text style={styles.errorSubtitle}>
            The business you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Business Details" navigation={navigation} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderBusinessInfo()}
        {renderContactInfo()}
        {renderServices()}
        {renderBusinessHours()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  businessInfoSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  businessHeader: {
    marginBottom: spacing.sm,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  businessName: {
    fontSize: typography.sizes.largeTitle,
    fontWeight: '700' as const,
    lineHeight: typography.lineHeights.largeTitle,
    color: colors.text.dark,
  },
  businessCategory: {
    fontSize: typography.sizes.subhead,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.text.light,
  },
  businessDescription: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  businessStats: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: spacing.xs / 2,
  },
  verificationText: {
    fontSize: typography.sizes.caption2,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.caption2,
    color: colors.primary,
  },
  contactSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
    flex: 1,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  contactButtonText: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.white,
  },
  servicesSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.text.dark,
    flex: 1,
    marginRight: spacing.sm,
  },
  servicePrice: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  serviceDescription: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  serviceMetaText: {
    fontSize: typography.sizes.caption1,
    color: colors.text.light,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.light,
    marginTop: spacing.sm,
  },
  hoursSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayText: {
    fontSize: typography.sizes.body,
    fontWeight: '500' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
  },
  hoursText: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.light,
    textAlign: 'center',
  },
});