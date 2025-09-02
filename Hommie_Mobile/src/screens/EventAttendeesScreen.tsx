import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { EventData, demoEvents } from '../data/eventsData';
import { colors, spacing, typography, shadows } from '../constants';

interface Attendee {
  id: string;
  name: string;
  avatar?: string;
  verificationLevel: 'unverified' | 'phone' | 'identity' | 'full';
  verificationBadge?: string;
  rsvpStatus: 'going' | 'maybe' | 'not_going';
  rsvpDate: string;
  guestsCount: number;
  culturalBackground?: string;
  languages: string[];
  isOrganizer: boolean;
  neighborhood: string;
  joinedDate: string;
  attendedEvents: number;
  rating?: number;
}

interface EventAttendeesScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

const demoAttendees: Attendee[] = [
  {
    id: '1',
    name: 'Adebayo Williams',
    avatar: 'https://via.placeholder.com/100/00A651/FFFFFF?text=AW',
    verificationLevel: 'full',
    verificationBadge: 'Estate Manager',
    rsvpStatus: 'going',
    rsvpDate: '2024-02-10T10:00:00Z',
    guestsCount: 0,
    culturalBackground: 'Yoruba',
    languages: ['English', 'Yoruba'],
    isOrganizer: true,
    neighborhood: 'Victoria Island Estate',
    joinedDate: '2023-01-15T00:00:00Z',
    attendedEvents: 25,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Fatima Ibrahim',
    avatar: 'https://via.placeholder.com/100/7B68EE/FFFFFF?text=FI',
    verificationLevel: 'identity',
    verificationBadge: 'Community Leader',
    rsvpStatus: 'going',
    rsvpDate: '2024-02-11T14:30:00Z',
    guestsCount: 2,
    culturalBackground: 'Hausa',
    languages: ['English', 'Hausa'],
    isOrganizer: false,
    neighborhood: 'Victoria Island Estate',
    joinedDate: '2023-03-20T00:00:00Z',
    attendedEvents: 18,
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Chioma Okafor',
    avatar: 'https://via.placeholder.com/100/FF69B4/FFFFFF?text=CO',
    verificationLevel: 'phone',
    rsvpStatus: 'maybe',
    rsvpDate: '2024-02-12T09:15:00Z',
    guestsCount: 1,
    culturalBackground: 'Igbo',
    languages: ['English', 'Igbo'],
    isOrganizer: false,
    neighborhood: 'Victoria Island Estate',
    joinedDate: '2023-07-10T00:00:00Z',
    attendedEvents: 8,
  },
  {
    id: '4',
    name: 'Emmanuel Johnson',
    avatar: 'https://via.placeholder.com/100/228B22/FFFFFF?text=EJ',
    verificationLevel: 'full',
    verificationBadge: 'Sports Coordinator',
    rsvpStatus: 'going',
    rsvpDate: '2024-02-08T16:45:00Z',
    guestsCount: 0,
    languages: ['English', 'Pidgin'],
    isOrganizer: false,
    neighborhood: 'Victoria Island Estate',
    joinedDate: '2022-11-30T00:00:00Z',
    attendedEvents: 32,
    rating: 4.9,
  },
  {
    id: '5',
    name: 'Aisha Mohammed',
    verificationLevel: 'phone',
    rsvpStatus: 'going',
    rsvpDate: '2024-02-13T11:20:00Z',
    guestsCount: 3,
    culturalBackground: 'Fulani',
    languages: ['English', 'Hausa', 'Fulani'],
    isOrganizer: false,
    neighborhood: 'Victoria Island Estate',
    joinedDate: '2024-01-05T00:00:00Z',
    attendedEvents: 2,
  },
];

const EventAttendeesScreen: React.FC<EventAttendeesScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<EventData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>(demoAttendees);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>(demoAttendees);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'going' | 'maybe' | 'organizers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  useEffect(() => {
    const foundEvent = demoEvents.find(e => e.id === eventId);
    setEvent(foundEvent || null);
  }, [eventId]);

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
        filtered = filtered.filter(a => a.isOrganizer || a.verificationBadge?.includes('Manager') || a.verificationBadge?.includes('Leader'));
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(attendee =>
        attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.culturalBackground?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAttendees(filtered);
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'full':
        return <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />;
      case 'identity':
        return <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />;
      case 'phone':
        return <MaterialCommunityIcons name="check" size={16} color={colors.secondary} />;
      default:
        return <MaterialCommunityIcons name="account-outline" size={16} color={colors.neutral.gray} />;
    }
  };

  const getVerificationText = (level: string, badge?: string) => {
    if (badge) return badge;
    switch (level) {
      case 'full':
        return 'Verified Resident';
      case 'identity':
        return 'Identity Verified';
      case 'phone':
        return 'Phone Verified';
      default:
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

  const renderAttendeeCard = ({ item }: { item: Attendee }) => {
    const totalGuests = item.guestsCount + 1; // Include the attendee themselves

    return (
      <TouchableOpacity
        style={styles.attendeeCard}
        onPress={() => setSelectedAttendee(item)}
        activeOpacity={0.7}
      >
        <View style={styles.attendeeHeader}>
          <View style={styles.attendeeInfo}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.attendeeAvatar} />
            ) : (
              <View style={styles.attendeeAvatarPlaceholder}>
                <Text style={styles.attendeeInitials}>
                  {item.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            
            <View style={styles.attendeeDetails}>
              <View style={styles.attendeeNameRow}>
                <Text style={styles.attendeeName}>{item.name}</Text>
                {getVerificationIcon(item.verificationLevel)}
                {item.isOrganizer && (
                  <View style={styles.organizerBadge}>
                    <Text style={styles.organizerText}>ORGANIZER</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.verificationText}>
                {getVerificationText(item.verificationLevel, item.verificationBadge)}
              </Text>
              
              <View style={styles.attendeeMetrics}>
                <Text style={styles.metricText}>
                  {item.neighborhood} • {item.attendedEvents} events attended
                </Text>
                {item.rating && (
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
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
      <FlatList
        data={filteredAttendees}
        renderItem={renderAttendeeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.attendeesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color={colors.neutral.lightGray} />
            <Text style={styles.emptyStateTitle}>No attendees found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try adjusting your search' : 'Be the first to RSVP!'}
            </Text>
          </View>
        }
      />

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
});

export default EventAttendeesScreen;