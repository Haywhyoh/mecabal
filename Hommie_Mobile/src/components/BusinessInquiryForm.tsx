import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { BusinessService } from '../services/businessService';

interface BusinessInquiryFormProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onSuccess?: () => void;
}

export default function BusinessInquiryForm({
  visible,
  onClose,
  businessId,
  businessName,
  onSuccess,
}: BusinessInquiryFormProps) {
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [preferredContact, setPreferredContact] = useState<'call' | 'message' | 'whatsapp'>('message');
  const [submitting, setSubmitting] = useState(false);

  const businessService = BusinessService.getInstance();

  const handleSubmit = async () => {
    // Validation
    if (!serviceType.trim()) {
      Alert.alert('Missing Information', 'Please specify the type of service you need.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of your needs.');
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert('Insufficient Details', 'Please provide more details about your service needs (at least 20 characters).');
      return;
    }

    if (budgetMin && budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) {
      Alert.alert('Invalid Budget', 'Minimum budget cannot be higher than maximum budget.');
      return;
    }

    try {
      setSubmitting(true);

      const inquiryData = {
        businessId,
        serviceType: serviceType.trim(),
        description: description.trim(),
        urgency,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        preferredContact,
      };

      await businessService.createInquiry(inquiryData);

      Alert.alert(
        'Inquiry Sent!',
        `Your inquiry has been sent to ${businessName}. They will respond within their usual response time.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onSuccess?.();
            },
          },
        ]
      );

      // Reset form
      setServiceType('');
      setDescription('');
      setUrgency('normal');
      setBudgetMin('');
      setBudgetMax('');
      setPreferredContact('message');

    } catch (error: any) {
      console.error('Error creating inquiry:', error);
      Alert.alert('Error', error.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUrgencySelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>Urgency Level</Text>
      <View style={styles.urgencyOptions}>
        {[
          { key: 'low', label: 'Low', color: colors.success },
          { key: 'normal', label: 'Normal', color: colors.accent.warmGold },
          { key: 'high', label: 'High', color: colors.accent.orange },
          { key: 'urgent', label: 'Urgent', color: colors.error },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.urgencyOption,
              urgency === option.key && styles.urgencyOptionActive,
              { borderColor: option.color },
            ]}
            onPress={() => setUrgency(option.key as any)}
          >
            <View style={[styles.urgencyIndicator, { backgroundColor: option.color }]} />
            <Text
              style={[
                styles.urgencyText,
                urgency === option.key && styles.urgencyTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderContactSelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>Preferred Contact Method</Text>
      <View style={styles.contactOptions}>
        {[
          { key: 'call', label: 'Phone Call', icon: 'call' },
          { key: 'message', label: 'Message', icon: 'chatbubble' },
          { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.contactOption,
              preferredContact === option.key && styles.contactOptionActive,
            ]}
            onPress={() => setPreferredContact(option.key as any)}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={preferredContact === option.key ? colors.primary : colors.text.light}
            />
            <Text
              style={[
                styles.contactText,
                preferredContact === option.key && styles.contactTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Inquiry</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[styles.submitText, submitting && styles.submitTextDisabled]}>
              {submitting ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.subtitle}>
            Tell them about your service needs and they'll get back to you.
          </Text>

          {/* Service Type */}
          <View style={styles.section}>
            <Text style={styles.label}>What service do you need? *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Home cleaning, Plumbing repair, Event planning"
              value={serviceType}
              onChangeText={setServiceType}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Describe your needs *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide details about what you need, when you need it, and any specific requirements..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Urgency */}
          {renderUrgencySelector()}

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.label}>Budget Range (Optional)</Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Min (₦)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Max (₦)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Contact Method */}
          {renderContactSelector()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your inquiry will be sent to the business owner. They typically respond within their stated response time.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    ...typography.styles.subhead,
    color: colors.text.light,
  },
  headerTitle: {
    ...typography.styles.title3,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
  },
  submitButton: {
    paddingVertical: spacing.xs,
  },
  submitText: {
    ...typography.styles.subhead,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  submitTextDisabled: {
    color: colors.text.light,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  businessName: {
    ...typography.styles.title2,
    color: colors.text.dark,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.styles.subhead,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.styles.body,
    color: colors.text.dark,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.styles.caption1,
    color: colors.text.light,
    textAlign: 'right',
    marginTop: spacing.xs / 2,
  },
  urgencyOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.xs,
  },
  urgencyOptionActive: {
    backgroundColor: colors.lightGreen,
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  urgencyText: {
    ...typography.styles.caption1,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  urgencyTextActive: {
    color: colors.primary,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  budgetInput: {
    flex: 1,
  },
  budgetLabel: {
    ...typography.styles.caption1,
    color: colors.text.light,
    marginBottom: spacing.xs / 2,
  },
  contactOptions: {
    gap: spacing.sm,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    borderRadius: 8,
    gap: spacing.sm,
  },
  contactOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  contactText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  contactTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  footer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  footerText: {
    ...typography.styles.caption1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
