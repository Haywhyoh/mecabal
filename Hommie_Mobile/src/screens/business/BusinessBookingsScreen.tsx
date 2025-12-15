import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { ServiceBooking, BookingFilter, UpdateBookingStatusDto } from '../../services/types/business.types';
import { formatNairaCurrency } from '../../constants/businessData';
import { bookingApi, businessApi } from '../../services/api';

interface BusinessBookingsScreenProps {
  navigation?: any;
}

export default function BusinessBookingsScreen({ navigation }: BusinessBookingsScreenProps) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessAndBookings();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadBookings();
    }
  }, [filter, businessId]);

  const loadBusinessAndBookings = async () => {
    try {
      setLoading(true);
      const business = await businessApi.getMyBusiness();
      if (business) {
        setBusinessId(business.id);
      } else {
        Alert.alert(
          'No Business Profile',
          'You need to create a business profile first.',
          [
            {
              text: 'OK',
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error loading business:', error);
      Alert.alert('Error', error.message || 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const filterParams: BookingFilter = {
        page: 1,
        limit: 50,
        status: filter !== 'all' ? filter : undefined,
      };
      
      const response = await bookingApi.getBusinessBookings(businessId, filterParams);
      setBookings(response.data || []);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleBookingPress = (booking: ServiceBooking) => {
    navigation?.navigate('BookingDetails', { bookingId: booking.id });
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'in-progress' | 'completed' | 'cancelled') => {
    const statusLabels: Record<string, string> = {
      'confirmed': 'Confirm',
      'in-progress': 'Start Service',
      'completed': 'Mark Complete',
      'cancelled': 'Cancel',
    };

    Alert.alert(
      statusLabels[newStatus] || 'Update Status',
      `Are you sure you want to ${statusLabels[newStatus]?.toLowerCase()} this booking?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setUpdatingStatus(bookingId);
              const updateData: UpdateBookingStatusDto = {
                status: newStatus,
              };
              const updated = await bookingApi.updateBookingStatus(bookingId, updateData);
              setBookings(bookings.map(b => b.id === bookingId ? updated : b));
              Alert.alert('Success', 'Booking status updated successfully');
            } catch (error: any) {
              console.error('Error updating booking status:', error);
              Alert.alert('Error', error.message || 'Failed to update booking status');
            } finally {
              setUpdatingStatus(null);
            }
          },
        },
      ]
    );
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      case 'pending':
        return 'clock-outline';
      default:
        return 'clock';
    }
  };

  const renderBookingItem = ({ item }: { item: ServiceBooking }) => {
    const canConfirm = item.status === 'pending';
    const canStart = item.status === 'confirmed';
    const canComplete = item.status === 'in-progress';
    const canCancel = item.status !== 'completed' && item.status !== 'cancelled';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleBookingPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.customerInfo}>
              Customer Booking
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <MaterialCommunityIcons
              name={getStatusIcon(item.status) as any}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('-', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          {item.scheduledDate && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#8E8E93" />
              <Text style={styles.detailText}>
                {new Date(item.scheduledDate).toLocaleDateString()}
                {item.scheduledTime && ` at ${item.scheduledTime}`}
              </Text>
            </View>
          )}
          {item.address && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E93" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-ngn" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              {formatNairaCurrency(item.price)} ({item.paymentStatus})
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canConfirm && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleUpdateStatus(item.id, 'confirmed')}
              disabled={updatingStatus === item.id}
            >
              {updatingStatus === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canStart && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleUpdateStatus(item.id, 'in-progress')}
              disabled={updatingStatus === item.id}
            >
              {updatingStatus === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Start Service</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canComplete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleUpdateStatus(item.id, 'completed')}
              disabled={updatingStatus === item.id}
            >
              {updatingStatus === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleUpdateStatus(item.id, 'cancelled')}
              disabled={updatingStatus === item.id}
            >
              {updatingStatus === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading && !refreshing && !businessId) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Orders & Bookings" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Orders & Bookings"
        navigation={navigation}
      />
      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled']}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filter === item && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(item as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item && styles.filterTextActive,
                  ]}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Bookings List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A651" />
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'You haven\'t received any bookings yet'
                : `No ${filter} bookings`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#00A651"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#00A651',
  },
  filterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  startButton: {
    backgroundColor: '#9C27B0',
  },
  completeButton: {
    backgroundColor: '#00A651',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
});





