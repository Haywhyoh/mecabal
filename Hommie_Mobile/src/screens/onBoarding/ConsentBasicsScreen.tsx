import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

export default function ConsentBasicsScreen({ navigation, route }: any) {
  const [firstName, setFirstName] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [communications, setCommunications] = useState({
    push: true,
    sms: false,
    whatsapp: false,
  });

  const language = route.params?.language || 'en';
  const phoneNumber = route.params?.phoneNumber || '';

  const handleContinue = () => {
    if (!hasConsented || !firstName.trim()) {
      return; // Don't proceed without consent and name
    }

    navigation.navigate('LocationSetup', { 
      language,
      phoneNumber,
      firstName: firstName.trim(),
      communications 
    });
  };

  const handleSkipPhoto = () => {
    // Skip photo for now, just continue to location
    handleContinue();
  };

  const toggleCommunication = (type: keyof typeof communications) => {
    setCommunications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Let's get you set up</Text>
            </View>

            {/* Consent Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data & Privacy</Text>
              
              <View style={styles.consentBox}>
                <TouchableOpacity 
                  style={styles.consentSummary}
                  onPress={() => setShowFullPolicy(!showFullPolicy)}
                >
                  <Text style={styles.consentText}>
                    We'll use your data to connect you with neighbors and keep your community safe.
                  </Text>
                  <Text style={styles.expandText}>
                    {showFullPolicy ? 'Show less' : 'Tap to read full policy'}
                  </Text>
                </TouchableOpacity>

                {showFullPolicy && (
                  <View style={styles.fullPolicy}>
                    <Text style={styles.policyText}>
                      By using MeCabal, you agree to our collection and use of your information to:
                      {'\n\n'}• Connect you with verified neighbors in your area
                      {'\n'}• Send important safety and community updates
                      {'\n'}• Improve our services and community features
                      {'\n'}• Comply with legal requirements
                      {'\n\n'}We never sell your personal data and you can control your privacy settings anytime.
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.consentCheckbox}
                  onPress={() => setHasConsented(!hasConsented)}
                >
                  <View style={[styles.checkbox, hasConsented && styles.checkboxChecked]}>
                    {hasConsented && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.consentCheckboxText}>
                    I agree to MeCabal's data use and privacy policy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Basic Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.photoSection}>
                <Text style={styles.inputLabel}>Profile photo (optional)</Text>
                <TouchableOpacity style={styles.photoPlaceholder} onPress={handleSkipPhoto}>
                  <Text style={styles.photoIcon}>📷</Text>
                  <Text style={styles.photoText}>Add photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkipPhoto}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Communication Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How should we reach you?</Text>
              <Text style={styles.sectionSubtitle}>You can change these anytime</Text>
              
              <View style={styles.communicationOptions}>
                <View style={styles.communicationOption}>
                  <View style={styles.communicationInfo}>
                    <View style={styles.communicationTitleRow}>
                      <Icon name="bell" size={20} color={COLORS.primary} style={styles.communicationIcon} />
                      <Text style={styles.communicationTitle}>Push notifications</Text>
                    </View>
                    <Text style={styles.communicationSubtext}>Community updates and safety alerts</Text>
                  </View>
                  <Switch
                    value={communications.push}
                    onValueChange={() => toggleCommunication('push')}
                    trackColor={{ false: COLORS.lightGray, true: COLORS.lightGreen }}
                    thumbColor={communications.push ? COLORS.primary : COLORS.white}
                  />
                </View>

                <View style={styles.communicationOption}>
                  <View style={styles.communicationInfo}>
                    <View style={styles.communicationTitleRow}>
                      <Icon name="message-text" size={20} color={COLORS.primary} style={styles.communicationIcon} />
                      <Text style={styles.communicationTitle}>SMS messages</Text>
                    </View>
                    <Text style={styles.communicationSubtext}>Important alerts only</Text>
                  </View>
                  <Switch
                    value={communications.sms}
                    onValueChange={() => toggleCommunication('sms')}
                    trackColor={{ false: COLORS.lightGray, true: COLORS.lightGreen }}
                    thumbColor={communications.sms ? COLORS.primary : COLORS.white}
                  />
                </View>

                <View style={styles.communicationOption}>
                  <View style={styles.communicationInfo}>
                    <View style={styles.communicationTitleRow}>
                      <Icon name="whatsapp" size={20} color={COLORS.primary} style={styles.communicationIcon} />
                      <Text style={styles.communicationTitle}>WhatsApp</Text>
                    </View>
                    <Text style={styles.communicationSubtext}>Community news and events</Text>
                  </View>
                  <Switch
                    value={communications.whatsapp}
                    onValueChange={() => toggleCommunication('whatsapp')}
                    trackColor={{ false: COLORS.lightGray, true: COLORS.lightGreen }}
                    thumbColor={communications.whatsapp ? COLORS.primary : COLORS.white}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!hasConsented || !firstName.trim()) && styles.continueButtonDisabled
            ]} 
            onPress={handleContinue}
            disabled={!hasConsented || !firstName.trim()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  consentBox: {
    backgroundColor: COLORS.offWhite,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  consentSummary: {
    marginBottom: SPACING.md,
  },
  consentText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
    marginBottom: SPACING.sm,
  },
  expandText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  fullPolicy: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  policyText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  consentCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: '600',
  },
  consentCheckboxText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.offWhite,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  communicationOptions: {
    gap: SPACING.md,
  },
  communicationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.offWhite,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  communicationInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  communicationTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  communicationSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  communicationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communicationIcon: {
    marginRight: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
});