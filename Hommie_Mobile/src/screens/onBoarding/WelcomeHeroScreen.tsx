import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image,
  ImageBackground
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

const COMMUNITY_STATS = [
  { number: '50K+', label: 'Neighbors Connected' },
  { number: '500+', label: 'Communities Served' },
  { number: '99%', label: 'Feel Safer' },
];

export default function WelcomeHeroScreen({ navigation }: any) {
  const handleGetStarted = () => {
    // Navigate to WelcomeScreen for registration/SSO options
    navigation.navigate('Welcome');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../../../assets/background.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Dark overlay */}
        <View style={styles.overlay} />

        <View style={styles.contentWrapper}>
          <View style={styles.scrollView}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Image source={require('../../../assets/mecabal.png')} style={styles.logo} />
              <Text style={styles.heroTitle}>
                Welcome to your neighborhood
              </Text>
              <Text style={styles.heroSubtitle}>
                Connect with neighbors, stay safe, and build stronger communities across Nigeria
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Join A Community</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Free to join • Nigerian-owned • Community-first
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1,
  },
  contentWrapper: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'space-between',
  },
  scrollView: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.lg,
    width: '100%',
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: -100,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  heroTitle: {
    fontSize:  48,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    lineHeight: 50,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg || 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 24,
  },
  actionSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    // backgroundColor: 'rgba(0,0,0,0.)',
    width: '100%',
    zIndex: 3,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
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
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.8,
  },
});