// Offline Indicator Component
// Shows network status and offline queue information

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import { networkStatus } from '../utils/networkStatus';

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface OfflineIndicatorProps {
  onSyncPress?: () => void;
  showDetails?: boolean;
}

export default function OfflineIndicator({ onSyncPress, showDetails = false }: OfflineIndicatorProps) {
  const { syncOfflineData, getOfflineStatus } = useLocation();
  const [isOnline, setIsOnline] = useState(true);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    // Initial status check
    checkStatus();

    // Listen for network changes
    const unsubscribe = networkStatus.addListener((status) => {
      setIsOnline(status.isConnected && status.isInternetReachable);
      setIsVisible(!status.isConnected || !status.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  const checkStatus = async () => {
    try {
      const status = await getOfflineStatus();
      setIsOnline(status.isOnline);
      setHasOfflineData(status.hasOfflineData);
      setQueueLength(status.queueLength);
      setLastSyncTime(status.lastSyncTime);
      setIsVisible(!status.isOnline);
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const handleSyncPress = async () => {
    try {
      await syncOfflineData();
      await checkStatus();
      if (onSyncPress) {
        onSyncPress();
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ translateY: slideAnim }],
        backgroundColor: isOnline ? MECABAL_GREEN_LIGHT : '#FFF5F5',
        borderBottomColor: isOnline ? MECABAL_GREEN : '#FFE5E5',
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.statusInfo}>
          <Ionicons
            name={isOnline ? 'wifi' : 'wifi-off'}
            size={16}
            color={isOnline ? MECABAL_GREEN : '#FF3B30'}
          />
          <Text style={[styles.statusText, { color: isOnline ? MECABAL_GREEN : '#FF3B30' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {queueLength > 0 && (
            <View style={styles.queueIndicator}>
              <Text style={styles.queueText}>{queueLength} pending</Text>
            </View>
          )}
        </View>

        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>
              Last sync: {formatLastSync(lastSyncTime)}
            </Text>
            {hasOfflineData && (
              <Text style={styles.detailsText}>
                • Cached data available
              </Text>
            )}
          </View>
        )}

        {queueLength > 0 && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncPress}
            accessibilityLabel="Sync offline data"
            accessibilityRole="button"
          >
            <Ionicons name="sync" size={16} color="white" />
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  queueIndicator: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  queueText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  detailsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MECABAL_GREEN,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
});

