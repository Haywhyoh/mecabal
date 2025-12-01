import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { Listing } from '../services/listingsService';
import { BusinessProfile } from '../services/businessService';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onSave?: () => void;
  viewMode?: 'grid' | 'list';
  businessProfile?: BusinessProfile;
}

const { width } = Dimensions.get('window');
const gridImageSize = (width - 48) / 2; // Account for margins and padding
const listImageSize = 100;

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onSave,
  viewMode = 'grid',
  businessProfile,
}) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price.toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === 'list') {
    return <ListingCardList {...{ listing, onPress, onSave }} />;
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {listing.media.length > 0 ? (
          <Image 
            source={{ uri: listing.media[0].url }} 
            style={styles.gridImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#8E8E8E" />
          </View>
        )}

        {/* Save Button */}
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.7}>
            <Ionicons
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={listing.isSaved ? colors.primary : colors.text.light}
            />
          </TouchableOpacity>
        )}

        {/* Status Badge */}
        {listing.status === 'sold' && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.price}>
          ₦{formatPrice(listing.price)}
          {listing.priceType !== 'fixed' && (
            <Text style={styles.priceType}> ({listing.priceType.replace('_', ' ')})</Text>
          )}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={12} color={colors.text.light} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.location.address}
          </Text>
        </View>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.propertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={14} color={colors.text.light} />
                <Text style={styles.propertyDetailText}>{listing.bedrooms}</Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={14} color={colors.text.light} />
                <Text style={styles.propertyDetailText}>{listing.bathrooms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Business Profile Info for Services */}
        {listing.listingType === 'service' && businessProfile && (
          <View style={styles.businessInfo}>
            <View style={styles.businessHeader}>
              <Text style={styles.businessName}>{businessProfile.businessName}</Text>
              {businessProfile.isVerified && (
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              )}
            </View>
            <View style={styles.businessStats}>
              <View style={styles.businessStat}>
                <Ionicons name="star" size={12} color={colors.accent.warmGold} />
                <Text style={styles.businessStatText}>
                  {businessProfile.rating.toFixed(1)} ({businessProfile.reviewCount})
                </Text>
              </View>
              <View style={styles.businessStat}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.businessStatText}>{businessProfile.completedJobs} jobs</Text>
              </View>
            </View>
          </View>
        )}

        {/* Verification Badge */}
        {listing.author.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        <Text style={styles.timestamp}>
          {formatTimeAgo(listing.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// List view component
const ListingCardList: React.FC<Omit<ListingCardProps, 'viewMode'>> = ({
  listing,
  onPress,
  onSave,
  businessProfile,
}) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price.toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress}>
      {/* Image */}
      <View style={styles.listImageContainer}>
        {listing.media.length > 0 ? (
          <Image 
            source={{ uri: listing.media[0].url }} 
            style={styles.listImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.listPlaceholderImage}>
            <Ionicons name="image-outline" size={30} color="#8E8E8E" />
          </View>
        )}

        {/* Save Button */}
        {onSave && (
          <TouchableOpacity style={styles.listSaveButton} onPress={onSave} activeOpacity={0.7}>
            <Ionicons
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={16}
              color={listing.isSaved ? colors.primary : colors.text.light}
            />
          </TouchableOpacity>
        )}

        {/* Status Badge */}
        {listing.status === 'sold' && (
          <View style={styles.listSoldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.listDetails}>
        <View style={styles.listHeader}>
          <Text style={styles.listPrice}>
            ₦{formatPrice(listing.price)}
            {listing.priceType !== 'fixed' && (
              <Text style={styles.priceType}> ({listing.priceType.replace('_', ' ')})</Text>
            )}
          </Text>
          {listing.author.isVerified && (
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          )}
        </View>

        <Text style={styles.listTitle} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.listMeta}>
          <Ionicons name="location-outline" size={14} color={colors.text.light} />
          <Text style={styles.listLocation} numberOfLines={1}>
            {listing.location.address}
          </Text>
        </View>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.listPropertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={14} color={colors.text.light} />
                <Text style={styles.propertyDetailText}>{listing.bedrooms} bed</Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={14} color={colors.text.light} />
                <Text style={styles.propertyDetailText}>{listing.bathrooms} bath</Text>
              </View>
            )}
          </View>
        )}

        {/* Business Profile Info for Services */}
        {listing.listingType === 'service' && businessProfile && (
          <View style={styles.listBusinessInfo}>
            <View style={styles.listBusinessHeader}>
              <Text style={styles.listBusinessName}>{businessProfile.businessName}</Text>
              {businessProfile.isVerified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              )}
            </View>
            <View style={styles.listBusinessStats}>
              <View style={styles.businessStat}>
                <Ionicons name="star" size={12} color={colors.accent.warmGold} />
                <Text style={styles.businessStatText}>
                  {businessProfile.rating.toFixed(1)} ({businessProfile.reviewCount})
                </Text>
              </View>
              <View style={styles.businessStat}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.businessStatText}>{businessProfile.completedJobs} jobs</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.listTimestamp}>
          {formatTimeAgo(listing.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid styles - iOS Design
  gridCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: gridImageSize,
    backgroundColor: colors.neutral.lightGray,
  },
  placeholderImage: {
    width: '100%',
    height: gridImageSize,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  soldBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldText: {
    ...typography.styles.caption1,
    color: colors.white,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  details: {
    padding: spacing.sm,
  },
  price: {
    ...typography.styles.headline,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  priceType: {
    ...typography.styles.caption2,
    color: colors.text.light,
  },
  title: {
    ...typography.styles.subhead,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeights.subhead,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.styles.caption1,
    color: colors.text.light,
    marginLeft: 4,
    flex: 1,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  propertyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyDetailText: {
    ...typography.styles.caption1,
    color: colors.text.light,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  verifiedText: {
    ...typography.styles.caption2,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: typography.weights.medium,
  },
  timestamp: {
    ...typography.styles.caption2,
    color: colors.text.tertiary,
  },
  businessInfo: {
    marginBottom: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
    gap: spacing.xs / 2,
  },
  businessName: {
    ...typography.styles.caption1,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  businessStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  businessStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  businessStatText: {
    ...typography.styles.caption2,
    color: colors.text.secondary,
  },

  // List styles - iOS Design
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    flexDirection: 'row',
    ...shadows.small,
  },
  listImageContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  listImage: {
    width: listImageSize,
    height: listImageSize,
    borderRadius: 8,
    backgroundColor: colors.neutral.lightGray,
  },
  listPlaceholderImage: {
    width: listImageSize,
    height: listImageSize,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSaveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  listSoldBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listPrice: {
    ...typography.styles.headline,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  listTitle: {
    ...typography.styles.subhead,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeights.subhead,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  listLocation: {
    ...typography.styles.caption1,
    color: colors.text.light,
    marginLeft: 4,
    flex: 1,
  },
  listPropertyDetails: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: spacing.sm,
  },
  listTimestamp: {
    ...typography.styles.caption2,
    color: colors.text.tertiary,
    alignSelf: 'flex-end',
  },
  listBusinessInfo: {
    marginBottom: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  listBusinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
    gap: spacing.xs / 2,
  },
  listBusinessName: {
    ...typography.styles.caption1,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  listBusinessStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default ListingCard;
