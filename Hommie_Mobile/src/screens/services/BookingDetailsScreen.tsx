import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { ServiceBooking } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';
import { bookingApi } from '../../services/api';
import { paymentApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface BookingDetailsScreenProps {
  route: {
    params: {
      bookingId: string;
    };
  };
  navigation?: any;
}

export default function BookingDetailsScreen({ route, navigation }: BookingDetailsScreenProps) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingData = await bookingApi.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (error: any) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', error.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingApi.cancelBooking(bookingId);
              Alert.alert('Success', 'Booking cancelled successfully', [
                { text: 'OK', onPress: () => navigation?.goBack() },
              ]);
            } catch (error: any) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReview = () => {
    if (!booking?.businessId) {
      Alert.alert('Error', 'Business information is missing');
      return;
    }
    navigation?.navigate('WriteReview', {
      businessId: booking.businessId,
      businessName: booking.businessName || 'Business',
    });
  };

  const handleProcessPayment = async () => {
    if (!booking || !user?.email) {
      Alert.alert('Error', 'Booking or user information is missing');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Initialize payment
      const paymentData = {
        amount: booking.price,
        email: user.email,
        currency: 'NGN',
        type: 'service-booking',
        description: `Payment for ${booking.serviceName}`,
        bookingId: booking.id,
        metadata: {
          bookingId: booking.id,
          serviceName: booking.serviceName,
          businessId: booking.businessId,
        },
      };

      const paymentResponse = await paymentApi.initializePayment(paymentData);
      
      // For React Native, we'll need to open the payment URL in a WebView
      // For now, show the authorization URL - in production, use react-native-paystack or WebView
      Alert.alert(
        'Payment',
        `Payment initialized. Reference: ${paymentResponse.reference}\n\nIn production, this would open Paystack payment interface.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // TODO: Open Paystack payment interface
              // For now, reload booking to check payment status
              loadBooking();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Booking Details" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Booking Details" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'confirmed':
        return '#2196F3';
      case 'in-progress':
        return '#9C27B0';
      case 'completed':
        return '#00A651';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Booking Details" navigation={navigation} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
            <MaterialCommunityIcons
              name={booking.status === 'completed' ? 'check-circle' : 'clock'}
              size={20}
              color={getStatusColor(booking.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service:</Text>
            <Text style={styles.infoValue}>{booking.serviceName}</Text>
          </View>
          {booking.businessName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Provider:</Text>
              <Text style={styles.infoValue}>{booking.businessName}</Text>
            </View>
          )}
          {booking.serviceDescription && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.infoValue}>{booking.serviceDescription}</Text>
            </View>
          )}
        </View>

        {/* Schedule */}
        {(booking.scheduledDate || booking.scheduledTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {booking.scheduledDate && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#8E8E93" />
                <Text style={styles.detailText}>
                  {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
            {booking.scheduledTime && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailText}>{booking.scheduledTime}</Text>
              </View>
            )}
          </View>
        )}

        {/* Location */}
        {booking.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#8E8E93" />
              <Text style={styles.detailText}>{booking.address}</Text>
            </View>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount:</Text>
            <Text style={[styles.infoValue, styles.priceValue]}>
              {formatNairaCurrency(booking.price)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(booking.paymentStatus) }]}>
              {booking.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {booking.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelBooking}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'completed' && booking.canReview && !booking.hasReviewed && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleSubmitReview}
            >
              <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
              <Text style={styles.reviewButtonText}>Submit Review</Text>
            </TouchableOpacity>
          )}

          {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.paymentButton, processingPayment && styles.paymentButtonDisabled]}
              onPress={handleProcessPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.paymentButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
                  <Text style={styles.paymentButtonText}>Process Payment</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    color: '#00A651',
    fontSize: 18,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#3A3A3C',
    marginLeft: 12,
    flex: 1,
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FFF9E6',
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFC107',
    marginLeft: 8,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#00A651',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
});

