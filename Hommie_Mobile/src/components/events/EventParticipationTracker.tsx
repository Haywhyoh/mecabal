import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EventParticipation {
  id: string;
  eventId: string;
  eventName: string;
  eventType: 'security' | 'social' | 'maintenance' | 'cultural' | 'emergency';
  participationType: 'attended' | 'organized' | 'helped' | 'sponsored';
  date: string;
  pointsEarned: number;
  impact: 'low' | 'medium' | 'high';
  feedback?: {
    rating: number;
    comment: string;
  };
}

interface EventParticipationTrackerProps {
  userId?: string;
  compactMode?: boolean;
  maxDisplay?: number;
}

const EVENT_TYPES = {
  security: { name: 'Security', icon: 'shield-account', color: '#E74C3C' },
  social: { name: 'Social', icon: 'account-group', color: '#FF69B4' },
  maintenance: { name: 'Maintenance', icon: 'hammer-wrench', color: '#FF6B35' },
  cultural: { name: 'Cultural', icon: 'music', color: '#7B68EE' },
  emergency: { name: 'Emergency', icon: 'alert-circle', color: '#E74C3C' }
};

export default function EventParticipationTracker({ 
  userId = 'default',
  compactMode = false,
  maxDisplay = 5 
}: EventParticipationTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const [eventHistory] = useState<EventParticipation[]>([
    {
      id: '1',
      eventId: 'event_001',
      eventName: 'Estate Security Meeting',
      eventType: 'security',
      participationType: 'attended',
      date: '2 days ago',
      pointsEarned: 15,
      impact: 'high',
      feedback: { rating: 5, comment: 'Very informative session' }
    },
    {
      id: '2',
      eventId: 'event_002',
      eventName: 'Community Cleanup Day',
      eventType: 'maintenance',
      participationType: 'organized',
      date: '1 week ago',
      pointsEarned: 50,
      impact: 'high'
    },
    {
      id: '3',
      eventId: 'event_003',
      eventName: 'New Year Celebration',
      eventType: 'cultural',
      participationType: 'helped',
      date: '3 weeks ago',
      pointsEarned: 25,
      impact: 'medium'
    }
  ]);

  const getStats = () => ({
    totalEvents: eventHistory.length,
    totalPoints: eventHistory.reduce((sum, event) => sum + event.pointsEarned, 0),
    eventsOrganized: eventHistory.filter(e => e.participationType === 'organized').length,
    highImpactEvents: eventHistory.filter(e => e.impact === 'high').length
  });

  const renderEventItem = (event: EventParticipation) => {
    const eventType = EVENT_TYPES[event.eventType];
    
    return (
      <View key={event.id} style={styles.eventItem}>
        <View style={[styles.eventIcon, { backgroundColor: eventType.color + '20' }]}>
          <MaterialCommunityIcons name={eventType.icon as any} size={20} color={eventType.color} />
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventName}>{event.eventName}</Text>
          <View style={styles.eventMeta}>
            <Text style={styles.eventType}>{eventType.name}</Text>
            <Text style={styles.eventDate}>{event.date}</Text>
          </View>
          <View style={styles.eventStats}>
            <View style={styles.participationBadge}>
              <Text style={styles.participationText}>{event.participationType}</Text>
            </View>
            <Text style={styles.pointsEarned}>+{event.pointsEarned} pts</Text>
          </View>
        </View>
      </View>
    );
  };

  if (compactMode) {
    const stats = getStats();
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTitle}>Event Participation</Text>
        <View style={styles.compactStats}>
          <View style={styles.compactStat}>
            <Text style={styles.compactNumber}>{stats.totalEvents}</Text>
            <Text style={styles.compactLabel}>Events</Text>
          </View>
          <View style={styles.compactStat}>
            <Text style={styles.compactNumber}>{stats.totalPoints}</Text>
            <Text style={styles.compactLabel}>Points</Text>
          </View>
        </View>
      </View>
    );
  }

  const stats = getStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Participation</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="calendar-plus" size={20} color="#00A651" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Events Joined</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.eventsOrganized}</Text>
          <Text style={styles.statLabel}>Organized</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {eventHistory.slice(0, maxDisplay).map(renderEventItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactStat: {
    alignItems: 'center',
  },
  compactNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00A651',
  },
  compactLabel: {
    fontSize: 11,
    color: '#8E8E8E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  eventDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participationBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  participationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00A651',
  },
  pointsEarned: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
});