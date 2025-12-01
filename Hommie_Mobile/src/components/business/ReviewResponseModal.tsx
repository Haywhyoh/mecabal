import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../constants';
import { businessReviewApi } from '../services/api/businessReviewApi';

interface ReviewResponseModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  reviewId: string;
  businessName: string;
  onResponseSubmitted: () => void;
}

const MAX_RESPONSE_LENGTH = 500;

export const ReviewResponseModal: React.FC<ReviewResponseModalProps> = ({
  visible,
  onClose,
  businessId,
  reviewId,
  businessName,
  onResponseSubmitted,
}) => {
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setResponseText('');
      setError(null);
    }
  }, [visible]);

  const characterCount = responseText.length;
  const isOverLimit = characterCount > MAX_RESPONSE_LENGTH;
  const isFormValid = responseText.trim().length > 0 && !isOverLimit;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert(
        'Invalid Response',
        'Please enter a response and keep it within the character limit.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Submit response
      await businessReviewApi.respondToReview(
        businessId,
        reviewId,
        responseText.trim()
      );

      // Success feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }

      // Show success message
      Alert.alert(
        'Response Submitted!',
        'Your response has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onResponseSubmitted();
              onClose();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Error submitting response:', error);
      
      // Error feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (hapticError) {
        // Haptics not available
      }

      setError(error.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (responseText.trim().length > 0) {
      Alert.alert(
        'Discard Response?',
        'You have unsaved changes. Are you sure you want to discard your response?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    handleCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons
                  name="store"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.headerTitle}>Respond to Review</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Business Name */}
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.businessSubtext}>
                Your response will be visible to all users
              </Text>
            </View>

            {/* Response Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Response</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    isOverLimit && styles.textInputError,
                  ]}
                  value={responseText}
                  onChangeText={setResponseText}
                  placeholder="Write your response to this review..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  maxLength={MAX_RESPONSE_LENGTH + 50} // Allow slight overflow for better UX
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                
                <View style={styles.characterCountContainer}>
                  <Text style={[
                    styles.characterCount,
                    isOverLimit && styles.characterCountError,
                  ]}>
                    {characterCount}/{MAX_RESPONSE_LENGTH}
                  </Text>
                </View>
              </View>
              
              {isOverLimit && (
                <Text style={styles.errorText}>
                  Response exceeds the maximum length
                </Text>
              )}
              
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isFormValid && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="send"
                      size={16}
                      color={colors.white}
                      style={styles.submitIcon}
                    />
                    <Text style={styles.submitButtonText}>Submit Response</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingBottom: 34, // Safe area for devices with home indicator
    maxHeight: '90%',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginLeft: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  businessInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.lightGreen,
  },
  businessName: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: 2,
  },
  businessSubtext: {
    fontSize: typography.sizes.caption1,
    color: colors.text.secondary,
  },
  inputSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  textInputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.text.dark,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: colors.danger,
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xs,
  },
  characterCount: {
    fontSize: typography.sizes.caption2,
    color: colors.text.tertiary,
  },
  characterCountError: {
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    fontSize: typography.sizes.caption1,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  submitIcon: {
    marginRight: spacing.xs,
  },
  submitButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
