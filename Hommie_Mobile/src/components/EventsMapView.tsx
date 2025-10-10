import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventCard from './EventCard';
import { colors, spacing, typography } from '../constants';
import type { Event } from '../services/EventsApi';

const { width } = Dimensions.get('window');

interface EventsMapViewProps {
  events: Event[];
  userLocation?: { latitude: number; longitude: number };
  onEventPress: (event: Event) => void;
}

export default function EventsMapView({ 
  events, 
  userLocation, 
  onEventPress 
}: EventsMapViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Group events by location for map display
  const eventsByLocation = useMemo(() => {
    const grouped: { [key: string]: Event[] } = {};
    
    events.forEach((event) => {
      const locationKey = `${event.location?.latitude || 0},${event.location?.longitude || 0}`;
      if (!grouped[locationKey]) {
        grouped[locationKey] = [];
      }
      grouped[locationKey].push(event);
    });
    
    return grouped;
  }, [events]);

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
  };

  // Handle event press
  const handleEventPress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEventPress(event);
  };

  // Render map placeholder (since we don't have actual map integration)
  const renderMapPlaceholder = () => (
    <View style={styles.mapPlaceholder}>
      <MaterialCommunityIcons 
        name="map" 
        size={64} 
        color={colors.neutral.lightGray} 
      />
      <Text style={styles.mapPlaceholderTitle}>Map View</Text>
      <Text style={styles.mapPlaceholderText}>
        Map integration coming soon! For now, browse events by location below.
      </Text>
      <TouchableOpacity
        style={styles.enableLocationButton}
        onPress={() => {
          Alert.alert(
            'Location Services',
            'Location services would be enabled here to show your current location on the map.',
            [{ text: 'OK' }]
          );
        }}
      >
        <MaterialCommunityIcons name="map-marker" size={20} color={colors.white} />
        <Text style={styles.enableLocationText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  );

  // Render location groups
  const renderLocationGroups = () => {
    const locationEntries = Object.entries(eventsByLocation);
    
    if (locationEntries.length === 0) {
      return (
        <View style={styles.noEventsContainer}>
          <MaterialCommunityIcons 
            name="map-marker-off" 
            size={48} 
            color={colors.neutral.lightGray} 
          />
          <Text style={styles.noEventsText}>No events with locations</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
        {locationEntries.map(([locationKey, locationEvents], index) => {
          const firstEvent = locationEvents[0];
          const locationName = firstEvent.location?.name || 'Unknown Location';
          const eventCount = locationEvents.length;
          
          return (
            <View key={locationKey} style={styles.locationGroup}>
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <MaterialCommunityIcons 
                    name="map-marker" 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.locationName}>{locationName}</Text>
                </View>
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountText}>{eventCount}</Text>
                </View>
              </View>
              
              <View style={styles.locationEvents}>
                {locationEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventItem,
                      selectedEvent?.id === event.id && styles.selectedEventItem
                    ]}
                    onPress={() => handleEventSelect(event)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventItemContent}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventTime} numberOfLines={1}>
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={16} 
                      color={colors.text.tertiary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      {renderMapPlaceholder()}
      
      {/* Location-based Events List */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>Events by Location</Text>
        {renderLocationGroups()}
      </View>

      {/* Selected Event Details */}
      {selectedEvent && (
        <View style={styles.selectedEventContainer}>
          <View style={styles.selectedEventHeader}>
            <Text style={styles.selectedEventTitle}>Selected Event</Text>
            <TouchableOpacity
              onPress={() => setSelectedEvent(null)}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <EventCard
            event={selectedEvent}
            onPress={() => handleEventPress(selectedEvent)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapPlaceholderTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  mapPlaceholderText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: typography.lineHeights.body,
  },
  enableLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  enableLocationText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  eventsSectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  locationsList: {
    flex: 1,
  },
  locationGroup: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginLeft: spacing.sm,
    flex: 1,
  },
  eventCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  eventCountText: {
    color: colors.white,
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
  },
  locationEvents: {
    padding: spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  selectedEventItem: {
    backgroundColor: '#E8F5E8',
  },
  eventItemContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  eventTime: {
    fontSize: typography.sizes.caption1,
    color: colors.text.secondary,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  noEventsText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  selectedEventContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  selectedEventTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  closeButton: {
    padding: spacing.xs,
  },
});

