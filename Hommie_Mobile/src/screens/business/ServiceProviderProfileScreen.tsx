import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants';

interface ServiceProviderProfileScreenProps {
  route?: {
    params?: {
      providerId: string;
    };
  };
  navigation?: any;
}

export default function ServiceProviderProfileScreen({ route, navigation }: ServiceProviderProfileScreenProps) {
  const providerId = route?.params?.providerId || '1';
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  
  // Sample service provider data
  const provider = {
    id: '1',
    name: 'PowerTech Engineering Solutions',
    ownerName: 'Engr. Adebayo Ogundimu',
    avatar: 'https://via.placeholder.com/100x100/00A651/FFFFFF?text=PT',
    coverImage: 'https://via.placeholder.com/400x200/228B22/FFFFFF?text=PowerTech+Cover',
    isVerified: true,
    isPremium: true,
    rating: 4.9,
    reviewCount: 156,
    completedJobs: 340,
    responseTime: 'Within 30 minutes',
    memberSince: 'January 2021',
    location: 'Ikeja, Lagos',
    serviceRadius: '15 km',
    
    services: [
      'Generator Repair & Maintenance',
      'Electrical Installation',
      'Solar Panel Installation', 
      'Air Conditioning Repair',
      'Home Automation Setup',
      'Electrical Safety Inspection'
    ],
    
    pricing: {
      'Generator Repair': '₦8,000 - ₦25,000',
      'Electrical Installation': '₦5,000 - ₦50,000', 
      'Solar Installation': '₦200,000 - ₦800,000',
      'AC Repair': '₦7,000 - ₦20,000'
    },
    
    about: {
      description: `🔧 Professional electrical and power solutions in Lagos!

✅ 8+ years experience in electrical engineering
✅ Licensed electrical contractor (Lagos State)
✅ 24/7 emergency service available
✅ Free consultation and quotation
✅ 1-year warranty on all installations
✅ Insurance covered for all work

🏆 Why choose PowerTech?
• Certified engineers with COREN registration
• Latest equipment and safety standards
• Transparent pricing with no hidden costs
• Same-day service for emergency repairs
• Payment plans available for large projects

🌟 Our specialties:
• Generator installation & maintenance
• Complete house rewiring 
• Solar power systems
• Industrial electrical work
• Smart home automation`,
      
      workingHours: {
        'Monday - Friday': '8:00 AM - 6:00 PM',
        'Saturday': '9:00 AM - 4:00 PM',
        'Sunday': 'Emergency calls only',
      },
      
      certifications: [
        'COREN Licensed Engineer',
        'Lagos State Electrical Contractor',
        'Solar Installation Certified',
        'Safety Training Certified'
      ]
    },
    
    portfolio: [
      {
        id: '1',
        title: 'Complete House Rewiring - Lekki',
        image: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=House+Rewiring',
        description: 'Full electrical rewiring for 4-bedroom duplex',
        completedDate: '2 weeks ago',
        cost: '₦180,000'
      },
      {
        id: '2',
        title: '20KVA Generator Installation',
        image: 'https://via.placeholder.com/300x200/228B22/FFFFFF?text=Generator+Install',
        description: 'Industrial generator with auto-start system',
        completedDate: '1 month ago',
        cost: '₦450,000'
      },
      {
        id: '3',
        title: 'Solar Power System - Victoria Island Office',
        image: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Solar+System',
        description: '5KW solar system with battery backup',
        completedDate: '2 months ago',
        cost: '₦680,000'
      }
    ],
    
    reviews: [
      {
        id: '1',
        reviewer: 'Mrs. Adunni Bakare',
        rating: 5,
        date: '3 days ago',
        comment: 'Excellent work! Fixed our generator issue quickly and professionally. Very knowledgeable and fair pricing. Highly recommended! 👍',
        service: 'Generator Repair',
        verified: true
      },
      {
        id: '2', 
        reviewer: 'Mr. Chike Okafor',
        rating: 5,
        date: '1 week ago',
        comment: 'PowerTech installed our solar system perfectly. Great communication, arrived on time, and completed work as promised. Clean installation!',
        service: 'Solar Installation',
        verified: true
      },
      {
        id: '3',
        reviewer: 'Funmi Lagos',
        rating: 4,
        date: '2 weeks ago', 
        comment: 'Good electrical work for our office. Professional team, though they arrived slightly late. Overall satisfied with the quality.',
        service: 'Electrical Installation',
        verified: false
      }
    ],

    availability: {
      isAvailable: true,
      nextAvailable: 'Today',
      busyDates: ['2024-01-15', '2024-01-20']
    }
  };

  const renderStarRating = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Text key={`full-${i}`} style={[styles.star, { fontSize: size }]}>⭐</Text>);
    }
    
    if (hasHalfStar) {
      stars.push(<Text key="half" style={[styles.star, { fontSize: size }]}>⭐</Text>);
    }
    
    return <View style={styles.starContainer}>{stars}</View>;
  };

  const renderHeader = () => (
    <View>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image source={{ uri: provider.coverImage }} style={styles.coverImage} />
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>↗️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>♡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: provider.avatar }} style={styles.avatar} />
          {provider.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>👑</Text>
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{provider.name}</Text>
            {provider.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.ownerName}>by {provider.ownerName}</Text>
          
          <View style={styles.ratingRow}>
            {renderStarRating(provider.rating, 16)}
            <Text style={styles.ratingText}>
              {provider.rating} ({provider.reviewCount} reviews)
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={styles.stat}>📍 {provider.location}</Text>
            <Text style={styles.stat}>⚡ {provider.completedJobs} jobs done</Text>
          </View>
          
          <View style={styles.availabilityRow}>
            <View style={[styles.availabilityDot, { backgroundColor: provider.availability.isAvailable ? colors.success : colors.danger }]} />
            <Text style={styles.availabilityText}>
              {provider.availability.isAvailable ? `Available ${provider.availability.nextAvailable}` : 'Busy - Next available in 3 days'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => Alert.alert('Book Service', 'Feature coming soon!')}
        >
          <Text style={styles.primaryActionText}>📅 Book Service</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={() => Alert.alert('Contact', 'Opening chat...')}
        >
          <Text style={styles.secondaryActionText}>💬 Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={() => Alert.alert('Call', 'Making call...')}
        >
          <Text style={styles.secondaryActionText}>📞 Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'about', label: 'About', icon: '📋' },
        { key: 'portfolio', label: 'Portfolio', icon: '🖼️' },
        { key: 'reviews', label: 'Reviews', icon: '⭐' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Services Offered</Text>
        <View style={styles.servicesGrid}>
          {provider.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <Text style={styles.serviceText}>{service}</Text>
              {provider.pricing[service] && (
                <Text style={styles.servicePrice}>{provider.pricing[service]}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 About</Text>
        <Text style={styles.description}>{provider.about.description}</Text>
      </View>

      {/* Working Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕒 Working Hours</Text>
        {Object.entries(provider.about.workingHours).map(([day, hours]) => (
          <View key={day} style={styles.hourRow}>
            <Text style={styles.dayText}>{day}</Text>
            <Text style={styles.hoursText}>{hours}</Text>
          </View>
        ))}
      </View>

      {/* Certifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Certifications</Text>
        <View style={styles.certGrid}>
          {provider.about.certifications.map((cert, index) => (
            <View key={index} style={styles.certItem}>
              <Text style={styles.certText}>✓ {cert}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPortfolioTab = () => (
    <View style={styles.tabContent}>
      {provider.portfolio.map((project) => (
        <View key={project.id} style={styles.portfolioItem}>
          <Image source={{ uri: project.image }} style={styles.portfolioImage} />
          <View style={styles.portfolioInfo}>
            <Text style={styles.portfolioTitle}>{project.title}</Text>
            <Text style={styles.portfolioDesc}>{project.description}</Text>
            <View style={styles.portfolioMeta}>
              <Text style={styles.portfolioCost}>{project.cost}</Text>
              <Text style={styles.portfolioDate}>{project.completedDate}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {/* Review Summary */}
      <View style={styles.reviewSummary}>
        <View style={styles.ratingOverview}>
          <Text style={styles.bigRating}>{provider.rating}</Text>
          <View>
            {renderStarRating(provider.rating, 20)}
            <Text style={styles.reviewCount}>{provider.reviewCount} reviews</Text>
          </View>
        </View>
      </View>

      {/* Individual Reviews */}
      {provider.reviews.map((review) => (
        <View key={review.id} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>{review.reviewer}</Text>
            <View style={styles.reviewMeta}>
              {renderStarRating(review.rating, 14)}
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          </View>
          <Text style={styles.reviewService}>Service: {review.service}</Text>
          <Text style={styles.reviewComment}>{review.comment}</Text>
          {review.verified && (
            <View style={styles.verifiedReview}>
              <Text style={styles.verifiedReviewText}>✓ Verified purchase</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return renderAboutTab();
      case 'portfolio':
        return renderPortfolioTab();
      case 'reviews':
        return renderReviewsTab();
      default:
        return renderAboutTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderTabBar()}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral.lightGray,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  backButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.sizes.lg,
    color: colors.text.dark,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: typography.sizes.base,
  },
  profileSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.white,
    marginTop: -40,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.accent.warmGold,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
    marginTop: -20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  businessName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
    marginRight: spacing.xs,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  ownerName: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: spacing.xs,
  },
  star: {
    color: colors.accent.warmGold,
  },
  ratingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  statsRow: {
    marginBottom: spacing.sm,
  },
  stat: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.xs / 2,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  availabilityText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 25,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabIcon: {
    fontSize: typography.sizes.base,
    marginBottom: spacing.xs / 2,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  tabContent: {
    backgroundColor: colors.white,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  servicesGrid: {
    gap: spacing.sm,
  },
  serviceItem: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    flex: 1,
  },
  servicePrice: {
    fontSize: typography.sizes.sm,
    color: colors.accent.marketGreen,
    fontWeight: typography.weights.semibold,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    lineHeight: 24,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  dayText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  hoursText: {
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
  certGrid: {
    gap: spacing.xs,
  },
  certItem: {
    backgroundColor: colors.lightGreen,
    padding: spacing.sm,
    borderRadius: 8,
  },
  certText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  portfolioItem: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...shadows.medium,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral.lightGray,
  },
  portfolioInfo: {
    padding: spacing.md,
  },
  portfolioTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  portfolioDesc: {
    fontSize: typography.sizes.base,
    color: colors.text.light,
    marginBottom: spacing.sm,
  },
  portfolioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioCost: {
    fontSize: typography.sizes.base,
    color: colors.accent.marketGreen,
    fontWeight: typography.weights.bold,
  },
  portfolioDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  reviewSummary: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bigRating: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
  },
  reviewCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginTop: spacing.xs / 2,
  },
  reviewItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    flex: 1,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginTop: spacing.xs / 2,
  },
  reviewService: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  reviewComment: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  verifiedReview: {
    alignSelf: 'flex-start',
  },
  verifiedReviewText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
});