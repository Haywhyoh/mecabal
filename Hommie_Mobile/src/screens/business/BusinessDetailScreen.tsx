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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { BusinessService, BusinessProfile, BusinessInquiry } from '../../services/businessService';
import { BusinessInquiryForm } from '../../components/business';

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
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<BusinessInquiry[]>([]);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  const businessService = BusinessService.getInstance();
  const { businessId } = route.params;

  useEffect(() => {
    fetchBusinessDetails();
  }, [businessId]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const businessData = await businessService.getBusiness(businessId);
      setBusiness(businessData);
    } catch (error) {
      console.error('Error fetching business details:', error);
      Alert.alert('Error', 'Failed to load business details');
    } finally {
      setLoading(false);
    }
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

  const handleInquiry = () => {
    setShowInquiryForm(true);
  };

  const handleInquirySuccess = () => {
    setShowInquiryForm(false);
    // Optionally refresh business data or show success message
  };

  const renderHeader = () => {
    if (!business) return null;

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Details</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            // TODO: Implement share functionality
          }}
        >
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
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
              {business.rating.toFixed(1)} ({business.reviewCount} reviews)
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statText}>{business.completedJobs} jobs completed</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color={colors.text.light} />
            <Text style={styles.statText}>Responds within {business.responseTime}h</Text>
          </View>
        </View>

        <View style={styles.verificationBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.verificationText}>
            {business.verificationLevel.toUpperCase()} VERIFIED
          </Text>
        </View>
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
          <Text style={styles.contactText}>{business.serviceArea}</Text>
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
    if (!business?.servicesOffered || business.servicesOffered.length === 0) return null;

    return (
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Services Offered</Text>
        {business.servicesOffered.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <Text style={styles.serviceName}>{service.category}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.servicePricing}>
              <Text style={styles.pricingText}>
                {service.pricing.model} - ₦{service.pricing.rate?.toLocaleString() || 'Negotiable'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderBusinessHours = () => {
    if (!business?.businessHours) return null;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return (
      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>Business Hours</Text>
        {days.map((day) => {
          const hours = business.businessHours?.[day.toLowerCase()];
          if (!hours) return null;
          
          return (
            <View key={day} style={styles.hoursItem}>
              <Text style={styles.dayText}>{day}</Text>
              <Text style={styles.hoursText}>
                {hours.open} - {hours.close}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.inquiryButton} onPress={handleInquiry}>
          <Ionicons name="chatbubble" size={20} color={colors.white} />
          <Text style={styles.inquiryButtonText}>Send Inquiry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
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
        {renderHeader()}
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
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderBusinessInfo()}
        {renderContactInfo()}
        {renderServices()}
        {renderBusinessHours()}
      </ScrollView>

      {renderActionButtons()}

      {/* Business Inquiry Form Modal */}
      {business && (
        <BusinessInquiryForm
          visible={showInquiryForm}
          onClose={() => setShowInquiryForm(false)}
          businessId={business.id}
          businessName={business.businessName}
          onSuccess={handleInquirySuccess}
        />
      )}
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
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  serviceName: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.text.dark,
    marginBottom: spacing.xs / 2,
  },
  serviceDescription: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  servicePricing: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  pricingText: {
    fontSize: typography.sizes.caption1,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.caption1,
    color: colors.primary,
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
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    gap: spacing.sm,
  },
  inquiryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  inquiryButtonText: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.white,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  saveButtonText: {
    fontSize: typography.sizes.subhead,
    fontWeight: '600' as const,
    lineHeight: typography.lineHeights.subhead,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    fontWeight: '400' as const,
    lineHeight: typography.lineHeights.body,
    color: colors.text.light,
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