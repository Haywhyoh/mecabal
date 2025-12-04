import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Image,
  TextInput,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AttendeeCardSkeleton } from '../../components/events';
import { ErrorView } from '../../components/ui';
import { EventsApi, handleApiError } from '../../services/EventsApi';
import type { EventAttendee, AttendeeFilterDto, PaginatedResponse } from '../../services/EventsApi';
import { colors, spacing, typography, shadows } from '../constants';

// Using EventAttendee from EventsApi instead of local interface

interface EventAttendeesScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

// Demo data removed - now using API data

const EventAttendeesScreen: React.FC<EventAttendeesScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<EventAttendee[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'going' | 'maybe' | 'organizers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<EventAttendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true,
  });

  // Fetch event details and attendees
  const fetchEventAndAttendees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch event details
      const eventData = await EventsApi.getEvent(eventId);
      setEvent(eventData);
      
      // Fetch attendees
      const filters: AttendeeFilterDto = {
        page: 1,
        limit: pagination.limit,
        rsvpStatus: selectedFilter === 'all' ? undefined : selectedFilter,
        search: searchQuery || undefined,
      };
      
      const response = await EventsApi.getAttendees(eventId, filters);
      setAttendees(response.data);
      setFilteredAttendees(response.data);
      setPagination(prev => ({
        ...prev,
        hasMore: response.meta.hasNextPage,
      }));
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching event and attendees:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedFilter, searchQuery, pagination.limit]);

  useEffect(() => {
    fetchEventAndAttendees();
  }, [fetchEventAndAttendees]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEventAndAttendees();
    setRefreshing(false);
  }, [fetchEventAndAttendees]);

  // Load more attendees
  const loadMoreAttendees = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    
    try {
      const nextPage = pagination.page + 1;
      const filters: AttendeeFilterDto = {
        page: nextPage,
        limit: pagination.limit,
        rsvpStatus: selectedFilter === 'all' ? undefined : selectedFilter,
        search: searchQuery || undefined,
      };
      
      const response = await EventsApi.getAttendees(eventId, filters);
      setAttendees(prev => [...prev, ...response.data]);
      setFilteredAttendees(prev => [...prev, ...response.data]);
      setPagination(prev => ({
        ...prev,
        page: nextPage,
        hasMore: response.meta.hasNextPage,
      }));
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error loading more attendees:', err);
    }
  }, [eventId, selectedFilter, searchQuery, pagination, loading]);

  useEffect(() => {
    filterAttendees();
  }, [selectedFilter, searchQuery, attendees]);

  const filterAttendees = () => {
    let filtered = attendees;

    // Filter by RSVP status
    switch (selectedFilter) {
      case 'going':
        filtered = filtered.filter(a => a.rsvpStatus === 'going');
        break;
      case 'maybe':
        filtered = filtered.filter(a => a.rsvpStatus === 'maybe');
        break;
      case 'organizers':
        // For organizers, we'll need to check if the user is the event organizer
        // This would require additional API data or checking against event.organizerId
        filtered = filtered.filter(a => a.user.isVerified && a.user.trustScore > 80);
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(attendee =>
        attendee.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAttendees(filtered);
  };

  const getVerificationIcon = (isVerified: boolean, trustScore: number) => {
    if (isVerified && trustScore >= 90) {
      return <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />;
    } else if (isVerified && trustScore >= 70) {
      return <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />;
    } else if (isVerified) {
      return <MaterialCommunityIcons name="check" size={16} color={colors.secondary} />;
    } else {
      return <MaterialCommunityIcons name="account-outline" size={16} color={colors.neutral.gray} />;
    }
  };

  const getVerificationText = (isVerified: boolean, trustScore: number) => {
    if (isVerified && trustScore >= 90) {
      return 'Verified Resident';
    } else if (isVerified && trustScore >= 70) {
      return 'Identity Verified';
    } else if (isVerified) {
      return 'Phone Verified';
    } else {
      return 'Unverified';
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
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

  const getRSVPStatusText = (status: string) => {
    switch (status) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not_going':
        return 'Not Going';
      default:
        return 'Unknown';
    }
  };

  const handleContactAttendee = (attendee: Attendee) => {
    Alert.alert(
      'Contact ' + attendee.name,
      'How would you like to connect?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => console.log('Message:', attendee.id) },
        { text: 'View Profile', onPress: () => console.log('Profile:', attendee.id) },
      ]
    );
  };

  const handleInviteNeighbors = () => {
    setShowInviteModal(true);
  };

  const handleShareEvent = async () => {
    try {
      await Share.share({
        message: `Join me at ${event?.title}! \n\nDate: ${event?.date}\nLocation: ${event?.location.name}, ${event?.location.estate}\n\nRSVP through MeCabal app!`,
        title: event?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All', count: attendees.length },
        { key: 'going', label: 'Going', count: attendees.filter(a => a.rsvpStatus === 'going').length },
        { key: 'maybe', label: 'Maybe', count: attendees.filter(a => a.rsvpStatus === 'maybe').length },
        { key: 'organizers', label: 'Organizers', count: attendees.filter(a => a.isOrganizer || a.verificationBadge?.includes('Manager')).length },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            selectedFilter === filter.key && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter(filter.key as any)}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === filter.key && styles.activeFilterButtonText
          ]}>
            {filter.label}
          </Text>
          <View style={[
            styles.filterBadge,
            selectedFilter === filter.key && styles.activeFilterBadge
          ]}>
            <Text style={[
              styles.filterBadgeText,
              selectedFilter === filter.key && styles.activeFilterBadgeText
            ]}>
              {filter.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAttendeeCard = ({ item }: { item: EventAttendee }) => {
    const totalGuests = item.guestsCount + 1; // Include the attendee themselves

    return (
      <TouchableOpacity
        style={styles.attendeeCard}
        onPress={() => setSelectedAttendee(item)}
        activeOpacity={0.7}
      >
        <View style={styles.attendeeHeader}>
          <View style={styles.attendeeInfo}>
            {item.user.profilePictureUrl ? (
              <Image source={{ uri: item.user.profilePictureUrl }} style={styles.attendeeAvatar} />
            ) : (
              <View style={styles.attendeeAvatarPlaceholder}>
                <Text style={styles.attendeeInitials}>
                  {item.user.fullName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            
            <View style={styles.attendeeDetails}>
              <View style={styles.attendeeNameRow}>
                <Text style={styles.attendeeName}>{item.user.fullName}</Text>
                {getVerificationIcon(item.user.isVerified, item.user.trustScore)}
                {/* Check if this user is the event organizer */}
                {event && event.organizer && event.organizer.id === item.user.id && (
                  <View style={styles.organizerBadge}>
                    <Text style={styles.organizerText}>ORGANIZER</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.verificationText}>
                {getVerificationText(item.user.isVerified, item.user.trustScore)}
              </Text>
              
              <View style={styles.attendeeMetrics}>
                <Text style={styles.metricText}>
                  Trust Score: {item.user.trustScore} • RSVP: {new Date(item.rsvpAt).toLocaleDateString()}
                </Text>
                {item.checkedIn && (
                  <View style={styles.checkedInContainer}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.checkedInText}>Checked In</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactAttendee(item)}
          >
            <MaterialCommunityIcons name="message-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.attendeeFooter}>
          <View style={styles.rsvpInfo}>
            <View style={[styles.rsvpStatus, { backgroundColor: getRSVPStatusColor(item.rsvpStatus) }]}>
              <Text style={styles.rsvpStatusText}>{getRSVPStatusText(item.rsvpStatus)}</Text>
            </View>
            
            {item.guestsCount > 0 && (
              <Text style={styles.guestInfo}>+{item.guestsCount} guest{item.guestsCount > 1 ? 's' : ''}</Text>
            )}
          </View>

          {item.languages.length > 0 && (
            <View style={styles.languageInfo}>
              <MaterialCommunityIcons name="translate" size={14} color={colors.neutral.gray} />
              <Text style={styles.languageText}>{item.languages.slice(0, 2).join(', ')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAttendeeModal = () => (
    <Modal
      visible={!!selectedAttendee}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedAttendee(null)}
    >
      {selectedAttendee && (
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedAttendee(null)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Attendee Profile</Text>
            <TouchableOpacity onPress={() => handleContactAttendee(selectedAttendee)}>
              <MaterialCommunityIcons name="message" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.profileSection}>
              {selectedAttendee.avatar ? (
                <Image source={{ uri: selectedAttendee.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileInitials}>
                    {selectedAttendee.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
              
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName}>{selectedAttendee.name}</Text>
                  {getVerificationIcon(selectedAttendee.verificationLevel)}
                </View>
                <Text style={styles.profileVerification}>
                  {getVerificationText(selectedAttendee.verificationLevel, selectedAttendee.verificationBadge)}
                </Text>
                {selectedAttendee.rating && (
                  <View style={styles.profileRating}>
                    <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
                    <Text style={styles.profileRatingText}>{selectedAttendee.rating} community rating</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedAttendee.attendedEvents}</Text>
                <Text style={styles.statLabel}>Events Attended</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedAttendee.guestsCount + 1}</Text>
                <Text style={styles.statLabel}>Total Attending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{selectedAttendee.languages.length}</Text>
                <Text style={styles.statLabel}>Languages</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                <Text style={styles.detailText}>{selectedAttendee.neighborhood}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                <Text style={styles.detailText}>{selectedAttendee.languages.join(', ')}</Text>
              </View>
              {selectedAttendee.culturalBackground && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
                  <Text style={styles.detailText}>{selectedAttendee.culturalBackground} background</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primary} />
                <Text style={styles.detailText}>
                  Joined {new Date(selectedAttendee.joinedDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => {
                  setSelectedAttendee(null);
                  handleContactAttendee(selectedAttendee);
                }}
              >
                <MaterialCommunityIcons name="message" size={20} color={colors.white} />
                <Text style={styles.messageButtonText}>Send Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => console.log('View full profile:', selectedAttendee.id)}
              >
                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                <Text style={styles.profileButtonText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Event Attendees</Text>
          <Text style={styles.headerSubtitle}>
            {attendees.filter(a => a.rsvpStatus === 'going').length + 
             attendees.filter(a => a.rsvpStatus === 'maybe').length} people interested
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareEvent}
        >
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.neutral.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search attendees..."
          placeholderTextColor={colors.neutral.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      {renderFilterButtons()}

      {/* Attendees List */}
      {loading ? (
        <View style={styles.attendeesList}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <AttendeeCardSkeleton key={index} />
          ))}
        </View>
      ) : error ? (
        <ErrorView 
          error={error} 
          onRetry={fetchEventAndAttendees} 
        />
      ) : (
        <FlatList
          data={filteredAttendees}
          renderItem={renderAttendeeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.attendeesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreAttendees}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color={colors.neutral.lightGray} />
              <Text style={styles.emptyStateTitle}>No attendees found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search' : 'Be the first to RSVP!'}
              </Text>
            </View>
          }
          ListFooterComponent={
            pagination.hasMore && !loading ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Invite Button */}
      <TouchableOpacity
        style={styles.inviteButton}
        onPress={handleInviteNeighbors}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="account-plus" size={24} color={colors.white} />
        <Text style={styles.inviteButtonText}>Invite Neighbors</Text>
      </TouchableOpacity>

      {/* Attendee Detail Modal */}
      {renderAttendeeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  shareButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginLeft: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.neutral.gray,
    marginRight: spacing.xs,
  },
  activeFilterButtonText: {
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: colors.white,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: colors.neutral.offWhite,
  },
  filterBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  activeFilterBadgeText: {
    color: colors.primary,
  },
  attendeesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  attendeeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  attendeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  attendeeInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  attendeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  attendeeAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  attendeeInitials: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  attendeeDetails: {
    flex: 1,
  },
  attendeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  attendeeName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.dark,
    marginRight: spacing.sm,
  },
  organizerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  organizerText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '600',
  },
  verificationText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  attendeeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: 2,
    fontWeight: '500',
  },
  contactButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.neutral.offWhite,
  },
  attendeeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rsvpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rsvpStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  rsvpStatusText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '600',
  },
  guestInfo: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
  },
  inviteButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    ...shadows.medium,
  },
  inviteButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral.gray,
    textAlign: 'center',
    margin: spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  modalClose: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.md,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileInitials: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.dark,
    marginRight: spacing.sm,
  },
  profileVerification: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileRatingText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: 4,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral.offWhite,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginTop: 4,
  },
  detailsSection: {
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailText: {
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginLeft: spacing.md,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.offWhite,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  profileButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  // New styles for API integration
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    marginTop: spacing.md,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingMoreText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: spacing.sm,
  },
  checkedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  checkedInText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    marginLeft: spacing.xs,
  },
});

export default EventAttendeesScreen;