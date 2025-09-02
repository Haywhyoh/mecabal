import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants';

interface ListingDetailScreenProps {
  route?: {
    params?: {
      listingId: string;
    };
  };
  navigation?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ListingDetailScreen({ route, navigation }: ListingDetailScreenProps) {
  const listingId = route?.params?.listingId || '1';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Sample detailed listing data (in real app, this would come from API)
  const listing = {
    id: '1',
    title: 'iPhone 12 Pro Max 256GB - Excellent Condition',
    price: '₦450,000',
    originalPrice: '₦520,000',
    category: 'Electronics',
    seller: {
      name: 'TechHub NG',
      isVerified: true,
      rating: 4.8,
      reviewCount: 127,
      joinedDate: 'March 2022',
      responseTime: 'Usually responds within 2 hours',
      avatar: 'https://via.placeholder.com/60x60/00A651/FFFFFF?text=TH'
    },
    location: 'Ikeja, Lagos',
    distance: '2.3 km away',
    condition: 'Used - Like New',
    description: `🔥 URGENT SALE! 🔥

iPhone 12 Pro Max 256GB in excellent condition. Perfect for photography and professional use.

✅ What's included:
• Original box and all accessories
• Lightning cable and adapter
• Screen protector already applied
• Leather case (worth ₦15,000)

📱 Specifications:
• Storage: 256GB
• Color: Pacific Blue
• Battery Health: 94%
• No cracks, scratches minimal
• Face ID working perfectly
• All cameras in excellent condition

🛡️ Why buy from us:
• 7-day return guarantee
• Verified seller with 127+ reviews
• Same day delivery in Lagos
• Payment on delivery available

💰 Original price: ₦520,000
💸 Our price: ₦450,000 (Save ₦70,000!)

📞 Serious buyers only. Available for inspection.`,
    images: [
      'https://via.placeholder.com/400x300/00A651/FFFFFF?text=iPhone+Front',
      'https://via.placeholder.com/400x300/0066CC/FFFFFF?text=iPhone+Back',
      'https://via.placeholder.com/400x300/228B22/FFFFFF?text=iPhone+Box',
      'https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Accessories'
    ],
    features: [
      '256GB Storage',
      'Face ID',
      'Dual Camera',
      '5G Ready',
      'Wireless Charging',
      'Water Resistant'
    ],
    postedDate: '2 hours ago',
    viewCount: 45,
    isFeatured: true,
    isAvailable: true,
    deliveryOptions: ['Pickup', 'Same-day delivery (₦2,000)', 'Next-day delivery (₦1,500)'],
    paymentOptions: ['Cash on delivery', 'Bank transfer', 'Mobile money']
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${listing.title} for ${listing.price} on MeCabal Estate Marketplace!\n\nSeller: ${listing.seller.name}\nLocation: ${listing.location}`,
        title: listing.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Seller',
      'Choose how you want to contact the seller:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '💬 Message', onPress: () => console.log('Open chat') },
        { text: '📞 Call', onPress: () => console.log('Make call') },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report Listing',
      'What would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => console.log('Report spam') },
        { text: 'Inappropriate content', onPress: () => console.log('Report inappropriate') },
        { text: 'Fraudulent', onPress: () => console.log('Report fraud') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Text style={styles.headerButtonText}>↗️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleReport}>
            <Text style={styles.headerButtonText}>⚠️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(newIndex);
            }}
          >
            {listing.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.image} />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {listing.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>

          {listing.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>✨ FEATURED</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{listing.price}</Text>
              {listing.originalPrice && (
                <Text style={styles.originalPrice}>{listing.originalPrice}</Text>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{listing.category}</Text>
              <Text style={styles.condition}>{listing.condition}</Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                {listing.seller.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sellerRating}>⭐ {listing.seller.rating} ({listing.seller.reviewCount} reviews)</Text>
              <Text style={styles.sellerMeta}>Joined {listing.seller.joinedDate}</Text>
              <Text style={styles.responseTime}>{listing.seller.responseTime}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <Text style={styles.location}>{listing.location}</Text>
            <Text style={styles.distance}>{listing.distance}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>✨ Key Features</Text>
            <View style={styles.featuresGrid}>
              {listing.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureText}>• {feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Delivery Options */}
          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>🚚 Delivery Options</Text>
            {listing.deliveryOptions.map((option, index) => (
              <Text key={index} style={styles.deliveryOption}>• {option}</Text>
            ))}
          </View>

          {/* Payment Options */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>💳 Payment Options</Text>
            {listing.paymentOptions.map((option, index) => (
              <Text key={index} style={styles.paymentOption}>• {option}</Text>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.stat}>👁️ {listing.viewCount} views</Text>
            <Text style={styles.stat}>🕒 Posted {listing.postedDate}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>♡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  headerButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
  },
  headerButtonText: {
    fontSize: typography.sizes.lg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: 300,
    backgroundColor: colors.neutral.lightGray,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
  activeIndicator: {
    opacity: 1,
    backgroundColor: colors.primary,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent.warmGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  featuredText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  content: {
    padding: spacing.md,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.accent.marketGreen,
    marginRight: spacing.sm,
  },
  originalPrice: {
    fontSize: typography.sizes.lg,
    color: colors.text.light,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  category: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  condition: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.accent.trustBlue,
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  sellerSection: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  sellerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginRight: spacing.xs,
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
  sellerRating: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.xs / 2,
  },
  sellerMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.xs / 2,
  },
  responseTime: {
    fontSize: typography.sizes.sm,
    color: colors.accent.trustBlue,
    fontWeight: typography.weights.medium,
  },
  locationSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.xs / 2,
  },
  distance: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  featuresSection: {
    marginBottom: spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  featureItem: {
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    lineHeight: 24,
  },
  deliverySection: {
    marginBottom: spacing.lg,
  },
  deliveryOption: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  paymentSection: {
    marginBottom: spacing.lg,
  },
  paymentOption: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  stat: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    gap: spacing.sm,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    fontSize: typography.sizes.xl,
    color: colors.text.dark,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  contactButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});