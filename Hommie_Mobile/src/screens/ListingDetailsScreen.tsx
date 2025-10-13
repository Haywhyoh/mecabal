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
      const data = await listingsService.getListing(listingId);
      setListing(data);
      setIsSaved(data.isSaved);

      // Increment view count
      await listingsService.incrementView(listingId);
    } catch (error) {
      console.error('Error fetching listing:', error);
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
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.light} />
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
              color={isSaved ? colors.primary : colors.text.light}
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
              <Ionicons name="image-outline" size={80} color={colors.text.light} />
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

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Category */}
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color={colors.text.light} />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{listing.category.name}</Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.text.light} />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {listing.location.address}
            </Text>
          </View>

          {/* Property Details */}
          {listing.listingType === 'property' && (
            <>
              {listing.propertyType && (
                <View style={styles.infoRow}>
                  <Ionicons name="home-outline" size={20} color={colors.text.light} />
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{listing.propertyType}</Text>
                </View>
              )}
              {listing.bedrooms && (
                <View style={styles.infoRow}>
                  <Ionicons name="bed-outline" size={20} color={colors.text.light} />
                  <Text style={styles.infoLabel}>Bedrooms</Text>
                  <Text style={styles.infoValue}>{listing.bedrooms}</Text>
                </View>
              )}
              {listing.bathrooms && (
                <View style={styles.infoRow}>
                  <Ionicons name="water-outline" size={20} color={colors.text.light} />
                  <Text style={styles.infoLabel}>Bathrooms</Text>
                  <Text style={styles.infoValue}>{listing.bathrooms}</Text>
                </View>
              )}
            </>
          )}

          {/* Item Details */}
          {listing.listingType === 'item' && (
            <>
              {listing.condition && (
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.light} />
                  <Text style={styles.infoLabel}>Condition</Text>
                  <Text style={styles.infoValue}>
                    {listing.condition.replace('_', ' ')}
                  </Text>
                </View>
              )}
              {listing.brand && (
                <View style={styles.infoRow}>
                  <Ionicons name="star-outline" size={20} color={colors.text.light} />
                  <Text style={styles.infoLabel}>Brand</Text>
                  <Text style={styles.infoValue}>{listing.brand}</Text>
                </View>
              )}
            </>
          )}

          {/* Views */}
          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={20} color={colors.text.light} />
            <Text style={styles.infoLabel}>Views</Text>
            <Text style={styles.infoValue}>{listing.viewsCount}</Text>
          </View>

          {/* Posted Date */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.text.light} />
            <Text style={styles.infoLabel}>Posted</Text>
            <Text style={styles.infoValue}>{formatDate(listing.createdAt)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              {listing.author.profilePicture ? (
                <Image
                  source={{ uri: listing.author.profilePicture }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color={colors.text.light} />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>
                  {listing.author.firstName} {listing.author.lastName}
                </Text>
                {listing.author.isVerified && (
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                )}
              </View>
              {listing.author.isVerified && (
                <Text style={styles.verifiedText}>Verified Seller</Text>
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
    ...typography.styles.body,
    color: colors.text.light,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.styles.headline,
    color: colors.text.light,
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
    ...typography.styles.headline,
    color: colors.white,
    fontSize: typography.sizes.subhead,
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
    ...typography.styles.largeTitle,
    color: colors.primary,
  },
  priceTypeBadge: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceTypeText: {
    ...typography.styles.caption1,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  title: {
    ...typography.styles.title3,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
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
    ...typography.styles.body,
    color: colors.text.light,
    flex: 1,
  },
  infoValue: {
    ...typography.styles.body,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
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
    ...typography.styles.headline,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.body * 1.2,
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
    ...typography.styles.headline,
    color: colors.text.dark,
  },
  verifiedText: {
    ...typography.styles.subhead,
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
    ...typography.styles.headline,
    color: colors.white,
  },
});
