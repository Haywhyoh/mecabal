import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    country: 'Nigeria',
    streetAddress: '',
    apartment: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (formData.streetAddress) {
      // TODO: Implement address confirmation logic
      console.log('Address confirmed:', formData);
      // Navigate to next step or complete registration
      navigation.navigate('Home');
    }
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
            <Text style={styles.title}>Confirm your address</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Country Selection */}
            <TouchableOpacity style={styles.countrySelector}>
              <View style={styles.countryInfo}>
                <Text style={styles.countryFlag}>🇳🇬</Text>
                <Text style={styles.countryText}>{formData.country}</Text>
              </View>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your street address"
                value={formData.streetAddress}
                onChangeText={(value) => handleInputChange('streetAddress', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Apartment */}
            <View style={styles.inputGroup}>
              <View style={styles.apartmentContainer}>
                <View style={styles.apartmentIcon}>
                  <View style={styles.apartmentInnerCircle} />
                </View>
                <Text style={styles.apartmentLabel}>Apt</Text>
                <TextInput
                  style={styles.apartmentInput}
                  placeholder="Optional"
                  value={formData.apartment}
                  onChangeText={(value) => handleInputChange('apartment', value)}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Your address won't be seen by others. You can change this setting anytime.
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, !formData.streetAddress && styles.continueButtonDisabled]} 
            onPress={handleContinue}
            disabled={!formData.streetAddress}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Member Agreement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: SPACING.xxxl,
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
  apartmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  apartmentIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  apartmentInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
  apartmentLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    marginRight: SPACING.md,
    minWidth: 30,
  },
  apartmentInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.sm,
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerLink: {
    paddingVertical: SPACING.sm,
  },
  footerLinkText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
