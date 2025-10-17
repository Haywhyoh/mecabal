import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image,
  ImageBackground,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

const COMMUNITY_STATS = [
  { number: '50K+', label: 'Neighbors Connected' },
  { number: '500+', label: 'Communities Served' },
  { number: '99%', label: 'Feel Safer' },
];

export default function WelcomeHeroScreen({ navigation }: any) {
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create breathing animation: 0.95 → 1.0 → 0.95 over 2 seconds
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.95,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Sequential fade-in animation with staggered timing
    const fadeInSequence = Animated.stagger(100, [
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
    
    // Start both animations
    breathingAnimation.start();
    fadeInSequence.start();
    
    return () => {
      breathingAnimation.stop();
      fadeInSequence.stop();
    };
  }, [logoScale, logoOpacity, titleOpacity, subtitleOpacity, buttonsOpacity]);

  const handleGetStarted = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to WelcomeScreen in signup mode
    navigation.navigate('Welcome', { mode: 'signup' });
  };

  const handleSignIn = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to WelcomeScreen in login mode  
    navigation.navigate('Welcome', { mode: 'login' });
  };

  return (
    <ImageBackground
      source={require('../../../assets/background.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.overlay}
        />

        <View style={styles.contentWrapper}>
          <View style={styles.scrollView}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Animated.View style={[styles.logoContainer, { 
                transform: [{ scale: logoScale }],
                opacity: logoOpacity 
              }]}>
                {/* <Image source={require('../../../assets/mecabal.png')} style={styles.logo} /> */}
              </Animated.View>
              <Animated.Text style={[styles.heroTitle, { opacity: titleOpacity }]}>
                Welcome to your neighborhood
              </Animated.Text>
              <Animated.Text style={[styles.heroSubtitle, { opacity: subtitleOpacity }]}>
                Connect with neighbors, stay safe, and build stronger communities across Nigeria
              </Animated.Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Animated.View style={[styles.actionSection, { opacity: buttonsOpacity }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Join A Community</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Free to join • Nigerian-owned • Community-first
            </Text>
          </Animated.View>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: -100,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '400',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 50,
  },
  heroSubtitle: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    color: COLORS.white,
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
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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