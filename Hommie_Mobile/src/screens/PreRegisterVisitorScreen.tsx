import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { visitorApi, PreRegisterVisitorDto } from '../services/api/visitorApi';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

export const PreRegisterVisitorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { primaryLocation } = useLocation();
  const estateId = primaryLocation?.neighborhoodId || user?.primaryLocationId;

  const [formData, setFormData] = useState<PreRegisterVisitorDto>({
    fullName: '',
    phoneNumber: '',
    email: '',
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleColor: '',
    purpose: '',
    notes: '',
  });

  const [expectedArrival, setExpectedArrival] = useState(new Date());
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [generateAccessCode, setGenerateAccessCode] = useState(false);
  const [sendMethod, setSendMethod] = useState<'EMAIL' | 'SMS' | 'QR'>('SMS');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!estateId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No estate selected',
      });
      return;
    }

    if (!formData.fullName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter visitor name',
      });
      return;
    }

    if (!formData.phoneNumber && !formData.email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter phone number or email',
      });
      return;
    }

    if (generateAccessCode && !formData.phoneNumber && sendMethod === 'SMS') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number required for SMS',
      });
      return;
    }

    if (generateAccessCode && !formData.email && sendMethod === 'EMAIL') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email required for email delivery',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await visitorApi.preRegisterVisitorWithPass(estateId, formData, {
        expectedArrival: expectedArrival.toISOString(),
        expiresAt: expiresAt.toISOString(),
        generateAccessCode,
        sendMethod: generateAccessCode ? sendMethod : undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Visitor pre-registered and pass generated',
      });

      navigation.navigate('VisitorPass', { passId: result.pass.id } as never);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to pre-register visitor',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PreRegisterVisitorDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Visitor Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            placeholder="Enter visitor's full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) => updateField('phoneNumber', text)}
            placeholder="+2348123456789"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="visitor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.sectionTitle}>Vehicle Information (Optional)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Registration</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleRegistration}
            onChangeText={(text) => updateField('vehicleRegistration', text)}
            placeholder="ABC 123 XY"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Make</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleMake}
            onChangeText={(text) => updateField('vehicleMake', text)}
            placeholder="Toyota, Honda, etc."
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Color</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleColor}
            onChangeText={(text) => updateField('vehicleColor', text)}
            placeholder="Red, Blue, etc."
          />
        </View>

        <Text style={styles.sectionTitle}>Visit Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose of Visit</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.purpose}
            onChangeText={(text) => updateField('purpose', text)}
            placeholder="Meeting, Delivery, etc."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Arrival</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowArrivalPicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#00A651" />
            <Text style={styles.dateText}>
              {format(expectedArrival, 'MMM dd, yyyy HH:mm')}
            </Text>
          </TouchableOpacity>
          {showArrivalPicker && (
            <DateTimePicker
              value={expectedArrival}
              mode="datetime"
              is24Hour={true}
              display="default"
              onChange={(event, date) => {
                setShowArrivalPicker(false);
                if (date) {
                  setExpectedArrival(date);
                  // Auto-set expiry to 24 hours after arrival
                  setExpiresAt(new Date(date.getTime() + 24 * 60 * 60 * 1000));
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pass Expires At</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowExpiryPicker(true)}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#00A651" />
            <Text style={styles.dateText}>
              {format(expiresAt, 'MMM dd, yyyy HH:mm')}
            </Text>
          </TouchableOpacity>
          {showExpiryPicker && (
            <DateTimePicker
              value={expiresAt}
              mode="datetime"
              is24Hour={true}
              display="default"
              onChange={(event, date) => {
                setShowExpiryPicker(false);
                if (date) {
                  setExpiresAt(date);
                }
              }}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Access Code</Text>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setGenerateAccessCode(!generateAccessCode)}
        >
          <MaterialCommunityIcons
            name={generateAccessCode ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={generateAccessCode ? '#00A651' : '#666'}
          />
          <Text style={styles.checkboxLabel}>Generate 4-digit access code</Text>
        </TouchableOpacity>

        {generateAccessCode && (
          <View style={styles.sendMethodContainer}>
            <Text style={styles.label}>Send via:</Text>
            <View style={styles.sendMethodButtons}>
              <TouchableOpacity
                style={[
                  styles.sendMethodButton,
                  sendMethod === 'SMS' && styles.sendMethodButtonActive,
                ]}
                onPress={() => setSendMethod('SMS')}
              >
                <MaterialCommunityIcons
                  name="message-text"
                  size={20}
                  color={sendMethod === 'SMS' ? '#FFFFFF' : '#666'}
                />
                <Text
                  style={[
                    styles.sendMethodText,
                    sendMethod === 'SMS' && styles.sendMethodTextActive,
                  ]}
                >
                  SMS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendMethodButton,
                  sendMethod === 'EMAIL' && styles.sendMethodButtonActive,
                ]}
                onPress={() => setSendMethod('EMAIL')}
              >
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={sendMethod === 'EMAIL' ? '#FFFFFF' : '#666'}
                />
                <Text
                  style={[
                    styles.sendMethodText,
                    sendMethod === 'EMAIL' && styles.sendMethodTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendMethodButton,
                  sendMethod === 'QR' && styles.sendMethodButtonActive,
                ]}
                onPress={() => setSendMethod('QR')}
              >
                <MaterialCommunityIcons
                  name="qrcode"
                  size={20}
                  color={sendMethod === 'QR' ? '#FFFFFF' : '#666'}
                />
                <Text
                  style={[
                    styles.sendMethodText,
                    sendMethod === 'QR' && styles.sendMethodTextActive,
                  ]}
                >
                  QR Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Processing...' : 'Pre-register Visitor'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 24,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
  },
  sendMethodContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sendMethodButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  sendMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  sendMethodButtonActive: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  sendMethodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sendMethodTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

