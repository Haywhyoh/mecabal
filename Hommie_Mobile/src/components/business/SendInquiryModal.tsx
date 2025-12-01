import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { businessInquiryApi } from '../services/api';

interface SendInquiryModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

type InquiryType = 'general' | 'booking' | 'quote';

export default function SendInquiryModal({ visible, onClose, businessId, businessName }: SendInquiryModalProps) {
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inquiryTypes = [
    { id: 'general' as InquiryType, label: 'General Question', icon: 'help-circle', color: '#0066CC' },
    { id: 'booking' as InquiryType, label: 'Book Service', icon: 'calendar-check', color: '#00A651' },
    { id: 'quote' as InquiryType, label: 'Request Quote', icon: 'currency-ngn', color: '#FF6B35' },
  ];

  const handleClose = () => {
    if (message.trim() || subject.trim()) {
      Alert.alert(
        'Discard Inquiry?',
        'Your message will be lost if you close this form.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setInquiryType('general');
    setSubject('');
    setMessage('');
    setPhone('');
    setEmail('');
  };

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please enter a subject for your inquiry');
      return false;
    }

    if (!message.trim()) {
      Alert.alert('Required Field', 'Please enter a message');
      return false;
    }

    if (message.trim().length < 10) {
      Alert.alert('Message Too Short', 'Please provide more details (at least 10 characters)');
      return false;
    }

    if (phone && !phone.match(/^[\d\s\-\+\(\)]+$/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      await businessInquiryApi.createInquiry(businessId, {
        subject: subject.trim(),
        message: message.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        metadata: {
          inquiryType,
        },
      });

      Alert.alert(
        'Inquiry Sent!',
        `Your inquiry has been sent to ${businessName}. They will respond to you soon.`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error sending inquiry:', err);
      Alert.alert(
        'Failed to Send',
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceholderSubject = () => {
    switch (inquiryType) {
      case 'booking':
        return 'e.g., Book service for next week';
      case 'quote':
        return 'e.g., Quote for electrical work';
      default:
        return 'e.g., Question about your services';
    }
  };

  const getPlaceholderMessage = () => {
    switch (inquiryType) {
      case 'booking':
        return 'Please provide details about the service you need and your preferred date/time...';
      case 'quote':
        return 'Please describe the work you need done so we can provide an accurate quote...';
      default:
        return 'Please describe your question or request...';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Send Inquiry</Text>
              <Text style={styles.modalSubtitle}>to {businessName}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Inquiry Type Selection */}
            <Text style={styles.sectionLabel}>Inquiry Type</Text>
            <View style={styles.typeSelection}>
              {inquiryTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    inquiryType === type.id && styles.typeOptionActive,
                    { borderColor: inquiryType === type.id ? type.color : '#E0E0E0' },
                  ]}
                  onPress={() => setInquiryType(type.id)}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={24}
                    color={inquiryType === type.id ? type.color : '#8E8E8E'}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      inquiryType === type.id && { color: type.color, fontWeight: '600' },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject */}
            <Text style={styles.sectionLabel}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={getPlaceholderSubject()}
              placeholderTextColor="#8E8E8E"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{subject.length}/100</Text>

            {/* Message */}
            <Text style={styles.sectionLabel}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={getPlaceholderMessage()}
              placeholderTextColor="#8E8E8E"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{message.length}/500</Text>

            {/* Contact Information */}
            <Text style={styles.sectionLabel}>Contact Information (Optional)</Text>
            <Text style={styles.sectionHelp}>
              Provide your contact details for faster response
            </Text>

            <View style={styles.contactInputContainer}>
              <MaterialCommunityIcons name="phone" size={20} color="#8E8E8E" />
              <TextInput
                style={styles.contactInput}
                placeholder="Phone number"
                placeholderTextColor="#8E8E8E"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.contactInputContainer}>
              <MaterialCommunityIcons name="email" size={20} color="#8E8E8E" />
              <TextInput
                style={styles.contactInput}
                placeholder="Email address"
                placeholderTextColor="#8E8E8E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={16} color="#0066CC" />
              <Text style={styles.infoText}>
                The business will receive your inquiry and respond directly to you
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.submitButton,
                (!subject.trim() || !message.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!subject.trim() || !message.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Send Inquiry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Account for home indicator
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#FF3B30',
  },
  sectionHelp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  typeSelection: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  typeOptionActive: {
    backgroundColor: '#F9FFF9',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 4,
  },
  contactInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  contactInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0066CC',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  submitButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
