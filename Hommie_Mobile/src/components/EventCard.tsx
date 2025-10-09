import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Event, EVENT_CATEGORIES } from '../services/EventsApi';
import { colors, spacing, typography, shadows } from '../constants';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  variant?: 'default' | 'featured' | 'compact';
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.md * 2;

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress, 
  variant = 'default' 
}) => {
  const category = EVENT_CATEGORIES.find(cat => cat.id === event.category.id);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getVerificationIcon = () => {
    if (event.organizer.isVerified) {
      return <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />;
    } else if (event.organizer.trustScore >= 50) {
      return <MaterialCommunityIcons name="check-circle" size={16} color={colors.warning} />;
    }
    return null;
  };

  const getPriceDisplay = () => {
    if (event.isFree) {
      return (
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>Free</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.priceTag, styles.paidPriceTag]}>
          <Text style={[styles.priceText, styles.paidPriceText]}>
            {event.formattedPrice}
          </Text>
        </View>
      );
    }
  };

  const getRSVPStatusColor = () => {
    switch (event.userRsvpStatus) {
      case 'going':
        return colors.success;
      case 'maybe':
        return colors.warning;
      case 'not_going':
        return colors.danger;
      default:
        return colors.neutral.gray;
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View style={[styles.categoryIndicator, { backgroundColor: category?.colorCode }]} />
            <Text style={styles.compactTitle} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
          <Text style={styles.compactDate}>
            {formatDate(event.eventDate)} • {formatTime(event.startTime)}
          </Text>
          <Text style={styles.compactLocation} numberOfLines={1}>
            {event.location.name}
          </Text>
        </View>
        {event.userRsvpStatus && (
          <View style={[styles.rsvpIndicator, { backgroundColor: getRSVPStatusColor() }]} />
        )}
      </TouchableOpacity>
    );
  }

  const isFeatured = variant === 'featured';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isFeatured && styles.featuredCard,
        { width: isFeatured ? CARD_WIDTH * 0.85 : CARD_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Event Image */}
      <View style={styles.imageContainer}>
        {event.coverImageUrl ? (
          <Image 
            source={{ uri: event.coverImageUrl }} 
            style={styles.eventImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: category?.colorCode || colors.neutral.lightGray }]}>
            <MaterialCommunityIcons 
              name={category?.icon as any || 'calendar'} 
              size={40} 
              color={colors.white} 
            />
          </View>
        )}
        
        {/* Price Tag */}
        <View style={styles.priceContainer}>
          {getPriceDisplay()}
        </View>

        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: category?.colorCode }]}>
          <MaterialCommunityIcons 
            name={category?.icon as any} 
            size={12} 
            color={colors.white} 
          />
          <Text style={styles.categoryText}>{category?.name}</Text>
        </View>

        {/* RSVP Status */}
        {event.userRsvpStatus && (
          <View style={[styles.rsvpBadge, { backgroundColor: getRSVPStatusColor() }]}>
            <Text style={styles.rsvpText}>
              {event.userRsvpStatus === 'going' ? 'Going' : 
               event.userRsvpStatus === 'maybe' ? 'Maybe' : 'Not Going'}
            </Text>
          </View>
        )}
      </View>

      {/* Event Content */}
      <View style={styles.content}>
        {/* Header with date and time */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formatDate(event.eventDate)}</Text>
          <View style={styles.timeContainer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.neutral.gray} />
            <Text style={styles.timeText}>{formatTime(event.startTime)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.neutral.gray} />
          <Text style={styles.locationText} numberOfLines={1}>
            {event.location.name}, {event.location.address}
          </Text>
        </View>

        {/* Organizer */}
        <View style={styles.organizerContainer}>
          <View style={styles.organizerInfo}>
            {event.organizer.profilePictureUrl ? (
              <Image source={{ uri: event.organizer.profilePictureUrl }} style={styles.organizerAvatar} />
            ) : (
              <View style={styles.organizerAvatarPlaceholder}>
                <Text style={styles.organizerInitials}>
                  {event.organizer.fullName ? event.organizer.fullName.split(' ').map(n => n[0]).join('') : '??'}
                </Text>
              </View>
            )}
            <View style={styles.organizerDetails}>
              <View style={styles.organizerNameContainer}>
                <Text style={styles.organizerName} numberOfLines={1}>
                  {event.organizer.fullName}
                </Text>
                {getVerificationIcon()}
              </View>
            </View>
          </View>

        </View>

        {/* Attendees */}
        <View style={styles.attendeesContainer}>
          <View style={styles.attendeeAvatars}>
            {/* Since we don't have attendee avatars in the basic event data, 
                we'll show a placeholder or just the count */}
            <View style={[styles.attendeeAvatar, styles.attendeePlaceholder]}>
              <MaterialCommunityIcons name="account-group" size={16} color={colors.neutral.gray} />
            </View>
          </View>
          <Text style={styles.attendeeCount}>
            {event.attendeesCount} going
            {event.maxAttendees && ` • ${event.maxAttendees} max`}
          </Text>
        </View>

        {/* Languages */}
        {event.languages && event.languages.length > 0 && (
          <View style={styles.languagesContainer}>
            <MaterialCommunityIcons name="translate" size={14} color={colors.neutral.gray} />
            <Text style={styles.languagesText}>
              {event.languages.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.medium,
    overflow: 'hidden',
  },
  featuredCard: {
    marginRight: spacing.md,
    ...shadows.large,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  priceTag: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidPriceTag: {
    backgroundColor: colors.warning,
  },
  priceText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  paidPriceText: {
    color: colors.text,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
  rsvpBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rsvpText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  content: {
    padding: spacing.md,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: 4,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: 4,
    flex: 1,
  },
  organizerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  organizerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  organizerInitials: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  organizerDetails: {
    flex: 1,
  },
  organizerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.text,
    marginRight: 4,
    flex: 1,
  },
  verificationBadge: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: 2,
    fontWeight: '500',
  },
  attendeesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  attendeeAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  attendeePlaceholder: {
    backgroundColor: colors.neutral.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttendeesIndicator: {
    backgroundColor: colors.neutral.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreAttendeesText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  attendeeCount: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    fontWeight: '500',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languagesText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.gray,
    marginLeft: 4,
  },
  // Compact variant styles
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.small,
  },
  compactContent: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  compactDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactLocation: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  rsvpIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
});

export default EventCard;