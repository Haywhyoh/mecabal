import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../constants';
import { ScreenHeader } from '../components/ScreenHeader';
import { StarRating } from '../components/StarRating';
import { businessReviewApi } from '../services/api/businessReviewApi';
import { CreateReviewDto } from '../services/types/review.types';

interface Props {
  route: {
    params: {
      businessId: string;
      businessName: string;
    };
  };
  navigation: any;
}

const MAX_REVIEW_TEXT_LENGTH = 500;

export default function WriteReviewScreen({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Character count for review text
  const characterCount = reviewText.length;
  const isOverLimit = characterCount > MAX_REVIEW_TEXT_LENGTH;

  // Form validation
  const isFormValid = overallRating > 0 && !isOverLimit;

  // Clear errors when user starts typing
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [overallRating, reviewText]);

  const handleOverallRatingChange = async (rating: number) => {
    setOverallRating(rating);
    
    // Auto-fill other ratings with overall rating for convenience
    if (rating > 0) {
      setServiceQuality(rating);
      setProfessionalism(rating);
      setValueForMoney(rating);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Review', 'Please provide an overall rating and keep your review within the character limit.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare review data
      const reviewData: CreateReviewDto = {
        rating: overallRating,
        reviewText: reviewText.trim() || undefined,
        serviceQuality: serviceQuality > 0 ? serviceQuality : undefined,
        professionalism: professionalism > 0 ? professionalism : undefined,
        valueForMoney: valueForMoney > 0 ? valueForMoney : undefined,
      };

      // Submit review
      await businessReviewApi.createReview(businessId, reviewData);

      // Success feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }

      // Show success message
      Alert.alert(
        'Review Submitted!',
        'Thank you for your feedback. Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      // Error feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (hapticError) {
        // Haptics not available
      }

      // Handle specific error cases
      if (error.response?.status === 409) {
        Alert.alert(
          'Review Already Exists',
          'You have already submitted a review for this business. You can edit your existing review instead.',
          [
            { text: 'OK' },
            {
              text: 'Edit Review',
              onPress: () => {
                // TODO: Navigate to edit review screen
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Submission Failed',
          error.message || 'Failed to submit review. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (overallRating > 0 || reviewText.trim().length > 0) {
      Alert.alert(
        'Discard Review?',
        'You have unsaved changes. Are you sure you want to discard your review?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderRatingSection = () => {
    return (
      <View style={styles.ratingSection}>
        <Text style={styles.sectionTitle}>Overall Rating *</Text>
        <StarRating
          rating={overallRating}
          interactive={true}
          size="large"
          onRatingChange={handleOverallRatingChange}
          showLabel={true}
          label="Overall Experience"
        />
        
        {overallRating > 0 && (
          <View style={styles.detailedRatings}>
            <Text style={styles.subsectionTitle}>Detailed Ratings</Text>
            <Text style={styles.subsectionDescription}>
              Rate specific aspects of your experience (optional)
            </Text>
            
            <View style={styles.ratingRow}>
              <StarRating
                rating={serviceQuality}
                interactive={true}
                size="medium"
                onRatingChange={setServiceQuality}
                showLabel={true}
                label="Service Quality"
              />
            </View>
            
            <View style={styles.ratingRow}>
              <StarRating
                rating={professionalism}
                interactive={true}
                size="medium"
                onRatingChange={setProfessionalism}
                showLabel={true}
                label="Professionalism"
              />
            </View>
            
            <View style={styles.ratingRow}>
              <StarRating
                rating={valueForMoney}
                interactive={true}
                size="medium"
                onRatingChange={setValueForMoney}
                showLabel={true}
                label="Value for Money"
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderReviewTextSection = () => {
    return (
      <View style={styles.reviewTextSection}>
        <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Share details about your experience with {businessName}
        </Text>
        
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              isOverLimit && styles.textInputError,
            ]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Tell others about your experience..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={MAX_REVIEW_TEXT_LENGTH + 50} // Allow slight overflow for better UX
            textAlignVertical="top"
          />
          
          <View style={styles.characterCountContainer}>
            <Text style={[
              styles.characterCount,
              isOverLimit && styles.characterCountError,
            ]}>
              {characterCount}/{MAX_REVIEW_TEXT_LENGTH}
            </Text>
          </View>
        </View>
        
        {isOverLimit && (
          <Text style={styles.errorText}>
            Review text exceeds the maximum length
          </Text>
        )}
      </View>
    );
  };

  const renderSubmitButton = () => {
    return (
      <View style={styles.submitSection}>
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
                name="star"
                size={20}
                color={colors.white}
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.submitNote}>
          Your review will be visible to other users and help them make informed decisions.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={`Review ${businessName}`}
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Rating Section */}
          {renderRatingSection()}

          {/* Review Text Section */}
          {renderReviewTextSection()}

          {/* Submit Button */}
          {renderSubmitButton()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  ratingSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.sizes.callout,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  detailedRatings: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  subsectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  subsectionDescription: {
    fontSize: typography.sizes.caption1,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  ratingRow: {
    marginBottom: spacing.md,
  },
  reviewTextSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    ...shadows.small,
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
  submitSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    ...shadows.small,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.tertiary,
    ...shadows.small,
  },
  submitIcon: {
    marginRight: spacing.xs,
  },
  submitButtonText: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  submitNote: {
    fontSize: typography.sizes.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.caption1,
  },
});
