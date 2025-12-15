import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { formatNairaCurrency } from '../../constants/businessData';

interface BookingConfirmationScreenProps {
  route: {
    params: {
      booking: {
        id: string;
        serviceName: string;
        businessName: string;
        scheduledDate?: string;
        scheduledTime?: string;
        address?: string;
        price: number;
      };
    };
  };
  navigation?: any;
}

export default function BookingConfirmationScreen({
  route,
  navigation,
}: BookingConfirmationScreenProps) {
  const { booking } = route.params;

  const handleViewBookings = () => {
    navigation?.navigate('MyBookings');
  };

  const handleGoHome = () => {
    navigation?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Booking Confirmed"
        navigation={navigation}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#00A651" />
            </View>
          </View>

          {/* Confirmation Message */}
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your service booking has been confirmed. You'll receive a notification with details.
          </Text>

          {/* Booking Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Booking Details</Text>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="wrench" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{booking.serviceName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="store" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>{booking.businessName}</Text>
              </View>
            </View>

            {booking.scheduledDate && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}

            {booking.scheduledTime && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{booking.scheduledTime}</Text>
                </View>
              </View>
            )}

            {booking.address && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{booking.address}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-ngn" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={[styles.detailValue, styles.priceValue]}>
                  {formatNairaCurrency(booking.price)}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Message */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information" size={20} color="#0066CC" />
            <Text style={styles.infoText}>
              The service provider will contact you to confirm the booking details.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewBookings}
        >
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Go to Home</Text>
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
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  priceValue: {
    color: '#00A651',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  primaryButton: {
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
});










