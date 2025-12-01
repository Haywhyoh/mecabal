import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants';
import { NigerianPrice, NigerianLocation } from './NigerianComponents';

interface MarketplaceListingCardProps {
  item: {
    id: string;
    title: string;
    price: string;
    category: string;
    categoryName: string;
    seller: string;
    location: string;
    imageUrl?: string;
    condition?: string;
    isVerified?: boolean;
    isFeatured?: boolean;
    postedDate?: string;
  };
  onPress?: () => void;
}

export const MarketplaceListingCard: React.FC<MarketplaceListingCardProps> = ({
  item,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.itemCard,
        item.isFeatured && styles.featuredCard
      ]} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      {item.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>FEATURED</Text>
        </View>
      )}
      
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      )}
      
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.priceContainer}>
          <NigerianPrice 
            amount={item.price} 
            size="large"
          />
        </View>
        
        <View style={styles.categoryLocationRow}>
          <Text style={styles.itemCategory}>{item.categoryName}</Text>
          {item.condition && (
            <Text style={styles.itemCondition}>{item.condition}</Text>
          )}
        </View>
        
        <NigerianLocation location={item.location} />
        
        <View style={styles.sellerRow}>
          <Text style={styles.itemSeller}>by {item.seller}</Text>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        
        {item.postedDate && (
          <Text style={styles.postedDate}>{item.postedDate}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    borderRadius: 12,
    ...shadows.medium,
    overflow: 'hidden',
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: colors.accent.warmGold,
    ...shadows.large,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent.warmGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    zIndex: 1,
  },
  featuredText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral.lightGray,
  },
  itemContent: {
    padding: spacing.md,
  },
  itemTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
    numberOfLines: 2,
  },
  priceContainer: {
    marginBottom: spacing.sm,
  },
  categoryLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  itemCondition: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.accent.trustBlue,
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  itemLocation: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemSeller: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    fontStyle: 'italic',
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
  postedDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.light,
    textAlign: 'right',
  },
});