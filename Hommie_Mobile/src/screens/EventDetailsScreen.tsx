import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Share,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventDetailsSkeleton from '../components/EventDetailsSkeleton';
import ErrorView from '../components/ErrorView';
import { EventsApi, handleApiError, EVENT_CATEGORIES } from '../services/EventsApi';
import type { Event } from '../services/EventsApi';
import { colors, spacing, typography, shadows } from '../constants';

const { width, height } = Dimensions.get('window');

interface EventDetailsScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

// Animated RSVP Button Component
const AnimatedRSVPButton: React.FC<{
  button: { status: string; label: string; icon: string; color: string };
  isSelected: boolean;
  isRSVPing: boolean;
  onPress: () => void;
}> = ({ button, isSelected, isRSVPing, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.rsvpButton,
        { borderColor: button.color },
        isSelected && { backgroundColor: button.color }
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isRSVPing}
      accessible={true}
      accessibilityLabel={`${button.label}${isSelected ? ', currently selected' : ''}`}
      accessibilityHint={`Mark yourself as ${button.label.toLowerCase()} for this event`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isRSVPing }}
    >
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons 
          name={button.icon as any} 
          size={20} 
          color={isSelected ? colors.white : button.color} 
        />
        <Text style={[
          styles.rsvpButtonText,
          { color: isSelected ? colors.white : button.color }
        ]}>
          {button.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRSVPing, setIsRSVPing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventsApi.getEvent(eventId);
        setEvent(data);

        // Increment views (fire and forget)
        EventsApi.incrementViews(eventId).catch(() => {});
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      setError(null);
      const data = await EventsApi.getEvent(eventId);
      setEvent(data);
      // Increment views (fire and forget)
      EventsApi.incrementViews(eventId).catch(() => {});
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }, [eventId]);

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorView 
          error={error || 'Event not found'} 
          onRetry={() => {
            // Refetch the event
            const fetchEvent = async () => {
              try {
                setLoading(true);
                setError(null);
                const data = await EventsApi.getEvent(eventId);
                setEvent(data);
                EventsApi.incrementViews(eventId).catch(() => {});
              } catch (err) {
                const errorMessage = handleApiError(err);
                setError(errorMessage);
              } finally {
                setLoading(false);
              }
            };
            fetchEvent();
          }}
          title={error ? "Oops!" : "Event Not Found"}
        />
      </SafeAreaView>
    );
  }

  const category = EVENT_CATEGORIES.find(cat => cat.id === event.category.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };


  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!event) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRSVPing(true);
    
    // Optimistic update
    const prevStatus = event.userRsvpStatus;
    const prevCount = event.attendeesCount;
    
    setEvent({
      ...event,
      userRsvpStatus: status,
      attendeesCount: prevStatus ? prevCount : prevCount + 1,
    });

    try {
      await EventsApi.rsvpEvent(eventId, { rsvpStatus: status });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'RSVP Updated',
        `You have marked yourself as ${status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going'} to this event.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      // Rollback on error
      setEvent({ 
        ...event, 
        userRsvpStatus: prevStatus, 
        attendeesCount: prevCount 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = handleApiError(err);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsRSVPing(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const eventUrl = `https://mecabal.com/events/${event.id}`;
      const shareMessage = `Check out this event: ${event.title}\n\n${event.description}\n\n📅 Date: ${formatDate(event.eventDate)} at ${formatTime(event.startTime)}\n📍 Location: ${event.location.name}, ${event.location.address}\n\nJoin me at: ${eventUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: eventUrl,
        title: event.title,
      }, {
        subject: event.title,
        dialogTitle: 'Share Event',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareToFeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to CreatePost screen with event pre-filled
    navigation.navigate('CreatePost', {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventLocation: event.location.name,
      preFillContent: `Check out this amazing event! 🎉\n\n${event.title}\n📅 ${formatDate(event.eventDate)} at ${formatTime(event.startTime)}\n📍 ${event.location.name}`,
    });
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { latitude, longitude } = event.location;
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      const query = `${event.location.name}, ${event.location.address}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      Linking.openURL(url);
    }
  };

  const addToCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your calendar to add events.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get available calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found on your device.');
        return;
      }

      // Create event date/time
      const eventDate = new Date(`${event.eventDate} ${event.startTime}`);
      const endDate = event.endTime ? new Date(`${event.eventDate} ${event.endTime}`) : 
        new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours if no end time

      // Create calendar event
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate: eventDate,
        endDate: endDate,
        location: `${event.location.name}, ${event.location.address}`,
        notes: `${event.description}\n\nOrganized by: ${event.organizer.fullName}\n\nEvent URL: https://mecabal.com/events/${event.id}`,
        timeZone: 'UTC',
      });

      Alert.alert(
        'Success',
        'Event added to your calendar!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(
        'Error',
        'Failed to add event to calendar. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Contact Organizer',
      'How would you like to contact the organizer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Message', onPress: () => console.log('Open message') },
        { text: 'Call', onPress: () => console.log('Open phone') },
      ]
    );
  };

  const renderImageGallery = () => {
    const images = event.media?.map(m => m.url) || (event.coverImageUrl ? [event.coverImageUrl] : []);
    
    if (images.length === 0) {
      return (
        <View style={[styles.heroImage, { backgroundColor: category?.colorCode || colors.primary }]}>
          <MaterialCommunityIcons 
            name={category?.icon as any || 'calendar'} 
            size={80} 
            color={colors.white} 
          />
        </View>
      );
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <Image 
          source={{ uri: images[currentImageIndex] }} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.imageIndicator,
                  index === currentImageIndex && styles.activeImageIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRSVPButtons = () => {
    const buttons = [
      { status: 'going', label: 'Going', icon: 'check-circle', color: colors.success },
      { status: 'maybe', label: 'Maybe', icon: 'help-circle', color: colors.warning },
      { status: 'not_going', label: 'Can\'t Go', icon: 'close-circle', color: colors.danger },
    ];

    return (
      <View style={styles.rsvpContainer}>
        <Text style={styles.rsvpTitle}>Will you be attending?</Text>
        <View style={styles.rsvpButtons}>
          {buttons.map((button) => {
            const isSelected = event.rsvpStatus === button.status;
            return (
              <AnimatedRSVPButton
                key={button.status}
                button={button}
                isSelected={isSelected}
                isRSVPing={isRSVPing}
                onPress={() => handleRSVP(button.status as any)}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
            accessible={true}
            accessibilityLabel="Share event"
            accessibilityHint="Share this event with others"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="share-variant" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => console.log('Toggle favorite')}
            accessible={true}
            accessibilityLabel="Add to favorites"
            accessibilityHint="Save this event to your favorites"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons 
              name={event.userRsvpStatus === 'going' ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={event.userRsvpStatus === 'going' ? colors.primary : colors.text.dark} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Image */}
        {renderImageGallery()}

        {/* Event Info */}
        <View style={styles.eventInfo}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: category?.colorCode }]}>
            <MaterialCommunityIcons 
              name={category?.icon as any} 
              size={16} 
              color={colors.white} 
            />
            <Text style={styles.categoryText}>{category?.name}</Text>
          </View>

          {/* Title and Price */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.priceContainer}>
              {event.isFree ? (
                <Text style={styles.freePrice}>Free</Text>
              ) : (
                <Text style={styles.paidPrice}>₦{event.price?.toLocaleString()}</Text>
              )}
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.dateTimeSection}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatDate(event.eventDate)}</Text>
                <Text style={styles.infoSubValue}>
                  {formatTime(event.startTime)}{event.endTime && ` - ${formatTime(event.endTime)}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location.name}</Text>
                <Text style={styles.infoSubValue}>
                  {event.location.address}
                </Text>
                {event.location.landmark && (
                  <Text style={styles.landmarkText}>Near {event.location.landmark}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.directionsButton}
                onPress={handleDirections}
                accessible={true}
                accessibilityLabel="Get directions"
                accessibilityHint="Open directions to event location in maps app"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="directions" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.organizerSection}>
            <Text style={styles.sectionTitle}>Organized by</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerInfo}>
                {event.organizer.profilePictureUrl ? (
                  <Image source={{ uri: event.organizer.profilePictureUrl }} style={styles.organizerAvatar} />
                ) : (
                  <View style={styles.organizerAvatarPlaceholder}>
                    <Text style={styles.organizerInitials}>
                      {event.organizer.fullName.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                )}
                <View style={styles.organizerDetails}>
                  <View style={styles.organizerNameContainer}>
                    <Text style={styles.organizerName}>{event.organizer.fullName}</Text>
                    {event.organizer.isVerified && (
                      <MaterialCommunityIcons name="check-decagram" size={20} color={colors.success} />
                    )}
                  </View>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
                    <Text style={styles.ratingText}>{event.organizer.trustScore} trust score</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.contactButton} 
                onPress={handleContact}
                accessible={true}
                accessibilityLabel="Contact organizer"
                accessibilityHint="Send a message or call the event organizer"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="message-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Action */}
          <View style={styles.calendarSection}>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={addToCalendar}
              accessible={true}
              accessibilityLabel="Add to calendar"
              accessibilityHint="Add this event to your device calendar"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primary} />
              <Text style={styles.calendarButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Requirements */}
          {(event.requireVerification || event.ageRestriction || event.languages.length > 0) && (
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsList}>
                {event.requireVerification && (
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
                    <Text style={styles.requirementText}>Verification required</Text>
                  </View>
                )}
                {event.ageRestriction && (
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
                    <Text style={styles.requirementText}>{event.ageRestriction}</Text>
                  </View>
                )}
                {event.languages.length > 0 && (
                  <View style={styles.requirementItem}>
                    <MaterialCommunityIcons name="translate" size={16} color={colors.primary} />
                    <Text style={styles.requirementText}>Languages: {event.languages.join(', ')}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Attendees */}
          <View style={styles.attendeesSection}>
            <Text style={styles.sectionTitle}>
              Who's going ({event.attendeesCount})
              {event.maxAttendees && ` • ${event.maxAttendees} max`}
            </Text>
            <View style={styles.attendeesList}>
              {/* For now, we'll show a placeholder since we don't have attendee avatars in the API response */}
              <View style={[styles.attendeeAvatar, styles.moreAttendeesIndicator]}>
                <Text style={styles.moreAttendeesText}>{event.attendeesCount}</Text>
              </View>
            </View>
          </View>

          {/* RSVP Section */}
          {renderRSVPButtons()}

          {/* Share to Feed Section */}
          <View style={styles.shareToFeedContainer}>
            <TouchableOpacity
              style={styles.shareToFeedButton}
              onPress={handleShareToFeed}
              accessible={true}
              accessibilityLabel="Share to Feed"
              accessibilityHint="Share this event to the community feed"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
              <Text style={styles.shareToFeedText}>Share to Feed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral.gray,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...shadows.small,
    zIndex: 1,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.neutral.offWhite,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  imageGalleryContainer: {
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: height * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  activeImageIndicator: {
    backgroundColor: colors.white,
  },
  eventInfo: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  categoryText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title2,
    color: colors.text.dark,
    marginRight: spacing.md,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  freePrice: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.success,
  },
  paidPrice: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.warning,
  },
  dateTimeSection: {
    marginBottom: spacing.lg,
  },
  locationSection: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.subhead,
    color: colors.neutral.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
  },
  landmarkText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.subhead,
    color: colors.neutral.gray,
    fontStyle: 'italic',
    marginTop: 2,
  },
  directionsButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.neutral.offWhite,
  },
  organizerSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  organizerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral.offWhite,
    borderRadius: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  organizerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  organizerInitials: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  organizerDetails: {
    flex: 1,
  },
  organizerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  organizerName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
    marginRight: spacing.sm,
  },
  verificationBadge: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.subhead,
    color: colors.neutral.gray,
    marginLeft: 4,
  },
  contactButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.white,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarSection: {
    marginBottom: spacing.lg,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 44,
  },
  calendarButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
  },
  requirementsSection: {
    marginBottom: spacing.lg,
  },
  requirementsList: {
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requirementText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
    marginLeft: spacing.sm,
    flex: 1,
  },
  attendeesSection: {
    marginBottom: spacing.lg,
  },
  attendeesList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.white,
  },
  moreAttendeesIndicator: {
    backgroundColor: colors.neutral.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreAttendeesText: {
    color: colors.white,
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subhead,
  },
  rsvpContainer: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  rsvpTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  rsvpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: colors.white,
    minWidth: 100,
    minHeight: 44,
    justifyContent: 'center',
  },
  rsvpButtonText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.subhead,
    marginLeft: spacing.xs,
  },
  shareToFeedContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  shareToFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareToFeedText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});

export default EventDetailsScreen;