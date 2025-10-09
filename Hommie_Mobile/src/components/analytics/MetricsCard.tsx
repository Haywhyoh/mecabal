import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../../constants';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  iconColor = colors.primary,
  backgroundColor = colors.white,
  onPress,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'trending-neutral';
  };

  const getTrendColor = () => {
    if (trend === 'up') return colors.success;
    if (trend === 'down') return colors.danger;
    return colors.text.secondary;
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toString();
    }
    return val;
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        { backgroundColor },
        onPress && styles.pressableCard,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={iconColor}
              style={styles.icon}
            />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons
              name={getTrendIcon() as any}
              size={16}
              color={getTrendColor()}
              style={styles.trendIcon}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{formatValue(value)}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.small,
  },
  pressableCard: {
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    marginRight: 2,
  },
  trendText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
  },
  valueContainer: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: typography.sizes.title1,
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.sizes.caption1,
    color: colors.text.secondary,
  },
});
