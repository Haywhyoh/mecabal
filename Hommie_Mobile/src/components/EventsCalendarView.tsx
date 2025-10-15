import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventCard from './EventCard';
import { colors, spacing, typography } from '../constants';
import type { Event } from '../services/EventsApi';

const { width } = Dimensions.get('window');

/**
 * Safely parse event date and return valid Date object or null
 */
const parseEventDate = (dateString: string): Date | null => {
  try {
    if (!dateString || typeof dateString !== 'string') {
      console.warn('Invalid date string:', dateString);
      return null;
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateString);
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

interface EventsCalendarViewProps {
  events: Event[];
  onDateSelect?: (date: Date) => void;
  onEventPress: (event: Event) => void;
}

export default function EventsCalendarView({ 
  events, 
  onDateSelect, 
  onEventPress 
}: EventsCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Convert events to marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};
    
    events.forEach((event) => {
      const eventDate = parseEventDate(event.eventDate); // CHANGED: Use safe parser and correct property
      
      // Skip invalid dates
      if (!eventDate) {
        console.warn('Skipping event with invalid date:', event.id, event.eventDate);
        return;
      }
      
      const dateString = eventDate.toISOString().split('T')[0];
      
      if (!marked[dateString]) {
        marked[dateString] = {
          marked: true,
          dotColor: '#00A651',
          events: [],
        };
      }
      
      marked[dateString].events.push(event);
    });

    // Mark selected date
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    if (marked[selectedDateString]) {
      marked[selectedDateString].selected = true;
      marked[selectedDateString].selectedColor = '#00A651';
    } else {
      marked[selectedDateString] = {
        selected: true,
        selectedColor: '#00A651',
      };
    }

    return marked;
  }, [events, selectedDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = parseEventDate(event.eventDate); // CHANGED: Use safe parser and correct property
      
      // Filter out invalid dates
      if (!eventDate) {
        return false;
      }
      
      const eventDateString = eventDate.toISOString().split('T')[0];
      return eventDateString === selectedDateString;
    });
  }, [events, selectedDate]);

  // Handle date selection
  const handleDatePress = (day: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(day.dateString);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      // Validate year and month are valid numbers
      if (isNaN(year) || isNaN(month)) {
        console.error('Invalid year or month:', year, month);
        return [];
      }

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ day: '', isCurrentMonth: false, date: null });
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const hasEvents = markedDates[dateString]?.events?.length > 0;
        const isSelected = dateString === selectedDate.toISOString().split('T')[0];
        const isToday = dateString === new Date().toISOString().split('T')[0];
        
        days.push({
          day: day.toString(),
          isCurrentMonth: true,
          date,
          hasEvents,
          isSelected,
          isToday,
        });
      }
      
      return days;
    } catch (error) {
      console.error('Error generating calendar days:', error);
      return [];
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Text style={styles.monthYear}>
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Day names header */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((dayName) => (
            <Text key={dayName} style={styles.dayName}>
              {dayName}
            </Text>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day.isSelected && styles.selectedDay,
                day.isToday && !day.isSelected && styles.todayDay,
              ]}
              onPress={() => day.date && handleDatePress({ dateString: day.date.toISOString().split('T')[0] })}
              disabled={!day.isCurrentMonth}
            >
              <Text
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.inactiveDayText,
                  day.isSelected && styles.selectedDayText,
                  day.isToday && !day.isSelected && styles.todayDayText,
                ]}
              >
                {day.day}
              </Text>
              {day.hasEvents && (
                <View style={styles.eventDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Date Events */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>
          Events on {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        {selectedDateEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <MaterialCommunityIcons 
              name="calendar-remove" 
              size={48} 
              color={colors.neutral.lightGray} 
            />
            <Text style={styles.noEventsText}>No events on this date</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.eventsList}
            showsVerticalScrollIndicator={false}
          >
            {selectedDateEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => onEventPress(event)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  calendarHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    paddingVertical: spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - spacing.md * 2 - spacing.sm * 2) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#00A651',
    borderRadius: 22,
  },
  todayDay: {
    backgroundColor: '#E8F5E8',
    borderRadius: 22,
  },
  dayText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  inactiveDayText: {
    color: colors.text.tertiary,
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  todayDayText: {
    color: '#00A651',
    fontWeight: typography.weights.semibold,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A651',
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  eventsSectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  eventsList: {
    flex: 1,
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
});




