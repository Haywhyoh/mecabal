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
import { Listing } from '../services/listingsService';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onSave?: () => void;
  viewMode?: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
const gridImageSize = (width - 48) / 2; // Account for margins and padding
const listImageSize = 100;

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onSave,
  viewMode = 'grid',
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
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Ionicons
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={listing.isSaved ? "#00A651" : "#FFFFFF"}
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
          <Ionicons name="location-outline" size={12} color="#8E8E8E" />
          <Text style={styles.location} numberOfLines={1}>
            {listing.location.address}
          </Text>
        </View>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.propertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bedrooms}</Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bathrooms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Verification Badge */}
        {listing.author.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#00A651" />
            <Text style={styles.verifiedText}>Verified Seller</Text>
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
          <TouchableOpacity style={styles.listSaveButton} onPress={onSave}>
            <Ionicons
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={listing.isSaved ? "#00A651" : "#FFFFFF"}
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
            <Ionicons name="shield-checkmark" size={16} color="#00A651" />
          )}
        </View>

        <Text style={styles.listTitle} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.listMeta}>
          <Ionicons name="location-outline" size={14} color="#8E8E8E" />
          <Text style={styles.listLocation} numberOfLines={1}>
            {listing.location.address}
          </Text>
        </View>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.listPropertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bedrooms} bed</Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bathrooms} bath</Text>
              </View>
            )}
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
  // Grid styles
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: gridImageSize,
  },
  placeholderImage: {
    width: '100%',
    height: gridImageSize,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  details: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  priceType: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E8E',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
    flex: 1,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyDetailText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#00A651',
    marginLeft: 4,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: '#8E8E8E',
  },

  // List styles
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  listImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  listImage: {
    width: listImageSize,
    height: listImageSize,
    borderRadius: 8,
  },
  listPlaceholderImage: {
    width: listImageSize,
    height: listImageSize,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSaveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSoldBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#E74C3C',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#00A651',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
    lineHeight: 18,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listLocation: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
    flex: 1,
  },
  listPropertyDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listTimestamp: {
    fontSize: 10,
    color: '#8E8E8E',
    alignSelf: 'flex-end',
  },
});

export default ListingCard;
