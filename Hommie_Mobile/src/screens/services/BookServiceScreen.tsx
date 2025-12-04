import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { BusinessService, BusinessProfile, CreateBookingDto } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';
import { bookingApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface BookServiceScreenProps {
  route: {
    params: {
      service: BusinessService;
      business: BusinessProfile;
    };
  };
  navigation?: any;
}

export default function BookServiceScreen({ route, navigation }: BookServiceScreenProps) {
  const { service, business } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [address, setAddress] = useState(business.businessAddress || '');
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const price = service.priceMin || 0;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setScheduledTime(selectedTime);
    }
  };

  const handleBookService = async () => {
    if (!scheduledDate) {
      Alert.alert('Required', 'Please select a date for the service');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Required', 'Please provide the service address');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'User email is required for booking');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData: CreateBookingDto = {
        businessId: business.id,
        serviceId: service.id,
        serviceName: service.serviceName,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledTime ? scheduledTime.toTimeString().split(' ')[0].substring(0, 5) : undefined,
        address: address.trim(),
        description: description.trim() || undefined,
        price,
      };

      const booking = await bookingApi.createBooking(bookingData);

      navigation?.navigate('BookingConfirmation', {
        booking: {
          id: booking.id,
          serviceName: booking.serviceName,
          businessName: business.businessName,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          address: booking.address,
          price: booking.price,
          paymentStatus: booking.paymentStatus,
        },
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to book service. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Book Service"
        navigation={navigation}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Service Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.serviceName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Provider:</Text>
            <Text style={styles.summaryValue}>{business.businessName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price:</Text>
            <Text style={[styles.summaryValue, styles.priceValue]}>
              {formatNairaCurrency(price)}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#8E8E93" />
            <Text style={[styles.inputText, !scheduledDate && styles.placeholder]}>
              {scheduledDate
                ? scheduledDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select date'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Time (Optional)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowTimePicker(true)}
          >
            <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
            <Text style={[styles.inputText, !scheduledTime && styles.placeholder]}>
              {scheduledTime
                ? scheduledTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Select time'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={scheduledTime || new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter the address where service will be provided"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Any special instructions or requirements..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBookService}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  priceValue: {
    color: '#00A651',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  placeholder: {
    color: '#8E8E93',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookButton: {
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

