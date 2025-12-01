import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, shadows } from '../../constants';

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
  title?: string;
  showRetry?: boolean;
}

const ErrorView: React.FC<ErrorViewProps> = ({ 
  error, 
  onRetry, 
  title = "Oops!", 
  showRetry = true 
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle" size={64} color={colors.danger} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.errorText}>{error}</Text>
      {showRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <MaterialCommunityIcons name="refresh" size={20} color={colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: spacing.lg,
    lineHeight: 22,
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
});

export default ErrorView;
