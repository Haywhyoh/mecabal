import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';
import NotificationService, { NotificationData } from '../../services/NotificationService';
import { ScreenHeader } from '../../components/ui';

interface NotificationItemProps {
  notification: NotificationData;
  onPress: () => void;
  onMarkAsRead: () => void;
  onClear: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onClear,
}) => {
  const getIconName = () => {
    switch (notification.type) {
      case 'message':
        return 'message-text';
      case 'event':
        return 'calendar';
      case 'community':
        return 'account-group';
      case 'safety':
        return 'shield-alert';
      case 'marketplace':
        return 'shopping';
      default:
        return 'bell';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'message':
        return colors.primary;
      case 'event':
        return colors.accent.lagosOrange;
      case 'community':
        return colors.accent.neighborPurple;
      case 'safety':
        return colors.accent.safetyRed;
      case 'marketplace':
        return colors.accent.marketGreen;
      default:
        return colors.neutral.friendlyGray;
    }
  };

  const getPriorityIndicator = () => {
    if (notification.priority === 'urgent') {
      return <View style={styles.urgentIndicator} />;
    }
    if (notification.priority === 'high') {
      return <View style={styles.highPriorityIndicator} />;
    }
    return null;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(
          'Notification Options',
          undefined,
          [
            {
              text: notification.read ? 'Mark as Unread' : 'Mark as Read',
              onPress: onMarkAsRead,
            },
            {
              text: 'Clear',
              onPress: onClear,
              style: 'destructive',
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={getIconName()} 
              size={24} 
              color={getIconColor()} 
            />
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.notificationInfo}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {notification.body}
            </Text>
            
            <View style={styles.notificationFooter}>
              <Text style={styles.timeText}>
                {formatTime(notification.timestamp)}
              </Text>
              {notification.actionRequired && (
                <View style={styles.actionRequiredBadge}>
                  <Text style={styles.actionRequiredText}>Action Required</Text>
                </View>
              )}
            </View>
          </View>
          
          {getPriorityIndicator()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface NotificationsScreenProps {
  navigation?: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'events' | 'community' | 'safety'>('all');
  
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setNotifications(notificationService.getNotifications());
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Mark as read when pressed
    notificationService.markAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'message':
        console.log('Navigate to message:', notification.data?.conversationId);
        break;
      case 'event':
        console.log('Navigate to event:', notification.data?.eventId);
        break;
      case 'safety':
        console.log('Navigate to safety alert:', notification.data?.reportId);
        break;
      default:
        console.log('Default notification action');
        break;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      if (notification.read) {
        // Mark as unread - not implemented in service yet
        console.log('Mark as unread functionality not implemented');
      } else {
        notificationService.markAsRead(notificationId);
      }
    }
  };

  const handleClearNotification = (notificationId: string) => {
    Alert.alert(
      'Clear Notification',
      'Are you sure you want to remove this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: () => notificationService.clearNotification(notificationId),
          style: 'destructive',
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount === 0) return;

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark All',
          onPress: () => notificationService.markAllAsRead(),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently remove all notifications. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          onPress: () => notificationService.clearAllNotifications(),
          style: 'destructive',
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'messages':
        return notifications.filter(n => n.type === 'message');
      case 'events':
        return notifications.filter(n => n.type === 'event');
      case 'community':
        return notifications.filter(n => n.type === 'community');
      case 'safety':
        return notifications.filter(n => n.type === 'safety');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const FilterButton: React.FC<{ 
    type: typeof filter, 
    label: string, 
    icon: string,
    count?: number 
  }> = ({ type, label, icon, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === type && styles.activeFilterButton
      ]}
      onPress={() => setFilter(type)}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={16} 
        color={filter === type ? colors.primary : colors.neutral.friendlyGray} 
      />
      <Text style={[
        styles.filterText,
        filter === type && styles.activeFilterText
      ]}>
        {label}
        {count !== undefined && count > 0 && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="bell-outline" 
        size={64} 
        color={colors.neutral.friendlyGray} 
      />
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No Notifications' : `No ${filter} notifications`}
      </Text>
      <Text style={styles.emptyMessage}>
        {filter === 'all' 
          ? "You're all caught up! New notifications will appear here."
          : `You don't have any ${filter} notifications right now.`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Notifications"
        navigation={navigation}
        rightComponent={notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.headerButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <MaterialCommunityIcons 
                name="trash-can-outline" 
                size={20} 
                color={colors.accent.safetyRed} 
              />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { type: 'all', label: 'All', icon: 'bell' },
            { type: 'unread', label: 'Unread', icon: 'bell-ring', count: unreadCount },
            { type: 'messages', label: 'Messages', icon: 'message-text' },
            { type: 'events', label: 'Events', icon: 'calendar' },
            { type: 'community', label: 'Community', icon: 'account-group' },
            { type: 'safety', label: 'Safety', icon: 'shield-alert' },
          ]}
          renderItem={({ item }) => (
            <FilterButton 
              type={item.type as typeof filter}
              label={item.label}
              icon={item.icon}
              count={item.count}
            />
          )}
          keyExtractor={item => item.type}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onMarkAsRead={() => handleMarkAsRead(item.id)}
            onClear={() => handleClearNotification(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.warmOffWhite,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: colors.neutral.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
  },
  filtersContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral.warmOffWhite,
    gap: spacing.xs,
  },
  activeFilterButton: {
    backgroundColor: colors.primary.communityMint,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  notificationItem: {
    backgroundColor: colors.neutral.pureWhite,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.deepBlack,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  notificationContent: {
    padding: spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.xs,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
  },
  actionRequiredBadge: {
    backgroundColor: colors.accent.lagosOrange,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionRequiredText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.pureWhite,
    fontWeight: '600',
  },
  urgentIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: colors.accent.safetyRed,
    borderRadius: 2,
  },
  highPriorityIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: colors.accent.lagosOrange,
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.sizes.base,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;