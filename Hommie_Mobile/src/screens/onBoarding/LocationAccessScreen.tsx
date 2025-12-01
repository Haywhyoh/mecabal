import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { BackButton } from '../../components/ui';

export default function LocationAccessScreen({ navigation }: any) {
  const handleContinue = () => {
    // TODO: Request location permission
    console.log('Location permission requested');
    // Navigate to next step
    navigation.navigate('AddressConfirmation');
  };

  const handleVerifyAnotherWay = () => {
    // TODO: Navigate to alternative verification
    console.log('Alternative verification selected');
    navigation.navigate('PhoneVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <BackButton 
            context="onboarding"
            fallbackRoute="LocationSelection"
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            Allow location access to confirm your address
          </Text>
          
          <Text style={styles.description}>
            If you're near your home, tap continue to confirm your neighborhood. This ensures MeCabal neighbors are real people with real addresses.
          </Text>

          {/* Creative Illustration */}
          <View style={styles.illustration}>
            {/* People Icons */}
            <View style={styles.peopleContainer}>
              <View style={styles.personLarge}>
                <Text style={styles.personIcon}>😊</Text>
              </View>
              <View style={styles.personSmall}>
                <Text style={styles.personIcon}>👤</Text>
              </View>
            </View>
            
            {/* Location Pin */}
            <View style={styles.locationPinContainer}>
              <View style={styles.locationPin}>
                <View style={styles.pinGradient} />
              </View>
              <View style={styles.locationRadius} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.alternativeButton} onPress={handleVerifyAnotherWay}>
            <Text style={styles.alternativeButtonText}>Verify another way</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 36,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
  },
  personLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.medium,
  },
  personSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  personIcon: {
    fontSize: 40,
  },
  locationPinContainer: {
    alignItems: 'center',
  },
  locationPin: {
    width: 60,
    height: 80,
    marginBottom: SPACING.md,
  },
  pinGradient: {
    flex: 1,
    backgroundColor: COLORS.blue,
    borderRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  locationRadius: {
    width: 120,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 60,
    borderTopWidth: 0,
  },
  actions: {
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    minWidth: 200,
    ...SHADOWS.medium,
  },
  continueButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
  alternativeButton: {
    paddingVertical: SPACING.sm,
  },
  alternativeButtonText: {
    color: COLORS.deepGreen,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
  },
});
