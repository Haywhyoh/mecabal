import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, shadows } from '../../constants';

interface NetworkErrorViewProps {
  onRetry: () => void;
  onGoOffline?: () => void;
}

const NetworkErrorView: React.FC<NetworkErrorViewProps> = ({ onRetry, onGoOffline }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={64} color={colors.warning} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.errorText}>
        Please check your internet connection and try again.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <MaterialCommunityIcons name="refresh" size={20} color={colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        
        {onGoOffline && (
          <TouchableOpacity style={styles.offlineButton} onPress={onGoOffline}>
            <MaterialCommunityIcons name="wifi-off" size={20} color={colors.primary} />
            <Text style={styles.offlineText}>Continue Offline</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
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
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    ...shadows.small,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  offlineText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default NetworkErrorView;
