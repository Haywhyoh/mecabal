import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Segment {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedSegment: string;
  onSegmentChange: (segmentId: string) => void;
  style?: any;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedSegment,
  onSegmentChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {segments.map((segment) => (
          <TouchableOpacity
            key={segment.id}
            style={[
              styles.segment,
              selectedSegment === segment.id && styles.selectedSegment,
            ]}
            onPress={() => onSegmentChange(segment.id)}
            activeOpacity={0.7}
          >
            {segment.icon && (
              <Ionicons
                name={segment.icon as any}
                size={16}
                color={selectedSegment === segment.id ? '#FFFFFF' : '#2C2C2C'}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.label,
                selectedSegment === segment.id && styles.selectedLabel,
              ]}
            >
              {segment.label}
            </Text>
            {segment.count !== undefined && segment.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{segment.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedSegment: {
    backgroundColor: '#00A651',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SegmentedControl;
