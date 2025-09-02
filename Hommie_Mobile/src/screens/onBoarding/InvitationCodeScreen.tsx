import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { DEMO_INVITATION_CODES, DEMO_ZIP_CODES } from '../../constants/demoData';

export default function InvitationCodeScreen({ navigation }: any) {
  const [country, setCountry] = useState('Nigeria');
  const [zipCode, setZipCode] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  
  const handleContinue = () => {
    if (zipCode && invitationCode) {
      // TODO: Implement invitation code verification logic
      console.log('Verifying invitation code:', { country, zipCode, invitationCode });
      // Navigate to next step or complete verification
      navigation.navigate('AddressConfirmation');
    }
  };

  const handleSignIn = () => {
    // TODO: Navigate to sign in flow
    console.log('Navigate to sign in');
  };

  const handleDemoData = () => {
    // Fill with demo data for testing
    setZipCode(DEMO_ZIP_CODES[0]);
    setInvitationCode(DEMO_INVITATION_CODES[0]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>If you have received an invitation code from a neighbor, enter it here</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Country Selection */}
            <TouchableOpacity style={styles.countrySelector}>
              <View style={styles.countryInfo}>
                <Text style={styles.countryFlag}>🇳🇬</Text>
                <Text style={styles.countryText}>{country}</Text>
              </View>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            {/* Zip Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Zip code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter zip code"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Invitation Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Invitation code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter invitation code"
                value={invitationCode}
                onChangeText={setInvitationCode}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Demo Data Button */}
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoData}>
            <Text style={styles.demoButtonText}>Fill with Demo Data</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, (!zipCode || !invitationCode) && styles.continueButtonDisabled]} 
            onPress={handleContinue}
            disabled={!zipCode || !invitationCode}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity style={styles.signInLink} onPress={handleSignIn}>
            <Text style={styles.signInText}>
              Have a verification postcard? <Text style={styles.signInHighlight}>Sign in</Text> to enter your verification code.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xxxl,
  },
  backButton: {
    marginBottom: SPACING.lg,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    fontStyle: 'italic',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  countryText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  demoButton: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  demoButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  continueButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
  signInLink: {
    alignItems: 'center',
  },
  signInText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInHighlight: {
    color: COLORS.blue,
    fontWeight: '500',
  },
});
