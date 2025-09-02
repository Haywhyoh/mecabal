import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import BackButton from '../../components/BackButton';

export default function OnboardingScreen({ navigation, route }: any) {
  const handleGetStarted = () => {
    navigation.navigate('LocationSelection');
  };

  const handleSignIn = () => {
    const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
    const onLoginSuccess = route.params?.onLoginSuccess;
    navigation.navigate('Login', { onLoginSuccess, onSocialLoginSuccess });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <BackButton 
            context="onboarding"
            hideIfCantGoBack={true}
            fallbackRoute="Welcome"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MeCabal</Text>
          <Text style={styles.subtitle}>Your Nigerian Neighborhood Community</Text>
        </View>

        {/* Features */}
        {/* <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏠</Text>
            <Text style={styles.featureTitle}>Connect with Neighbors</Text>
            <Text style={styles.featureDescription}>
              Build meaningful relationships with people in your neighborhood
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📢</Text>
            <Text style={styles.featureTitle}>Stay Informed</Text>
            <Text style={styles.featureDescription}>
              Get updates about local events, safety alerts, and community news
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🤝</Text>
            <Text style={styles.featureTitle}>Help Each Other</Text>
            <Text style={styles.featureDescription}>
              Share recommendations, offer help, and support your community
            </Text>
          </View>
        </View> */}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
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
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.display,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  feature: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  actions: {
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
});
