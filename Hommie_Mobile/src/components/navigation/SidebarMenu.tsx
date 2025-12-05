import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserAvatar } from '../profile';

interface SidebarMenuProps {
  navigation: any;
  user: any;
  unreadMessagesCount?: number;
  onClose: () => void;
  onMenuItemPress?: (action: () => void) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  screen: string;
  showBadge?: boolean;
  badgeCount?: number;
  navigateToTab?: boolean;
  tabName?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    color: '#00A651',
    screen: 'HomeMain',
  },
  {
    id: 'neighborhoods',
    label: 'Neighborhoods',
    icon: 'map-marker',
    color: '#0066CC',
    screen: 'LocationTest', // Using LocationTest as placeholder - can be updated when NeighborhoodDiscovery is registered
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'wrench',
    color: '#00A651',
    screen: 'Services',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: 'calendar-check',
    color: '#2196F3',
    screen: 'MyBookings',
  },
  {
    id: 'business',
    label: 'Business',
    icon: 'briefcase',
    color: '#00A651',
    screen: 'BusinessProfile',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'shopping',
    color: '#9C27B0',
    screen: 'Market',
    navigateToTab: true,
    tabName: 'Market',
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'calendar',
    color: '#7B68EE',
    screen: 'Events',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'message',
    color: '#FF9800',
    screen: 'Messaging',
    showBadge: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'account',
    color: '#00A651',
    screen: 'Profile',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'cog',
    color: '#8E8E93',
    screen: 'More',
  },
];

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  navigation,
  user,
  unreadMessagesCount = 0,
  onClose,
  onMenuItemPress,
}) => {
  const currentUser = {
    firstName: user?.firstName || 'User',
    lastName: user?.lastName || '',
    profileImage: user?.profilePictureUrl || null,
  };

  const handleMenuItemPress = (item: MenuItem) => {
    const action = () => {
      if (item.navigateToTab && item.tabName) {
        // Navigate to tab
        try {
          navigation?.navigate('MainTabs' as never, { screen: item.tabName });
        } catch (error) {
          console.error('Navigation error:', error);
        }
      } else if (item.screen === 'HomeMain') {
        // For Home, navigate to MainTabs with Home tab
        try {
          navigation?.navigate('MainTabs' as never, { screen: 'Home' });
        } catch (error) {
          console.error('Navigation error:', error);
        }
      } else {
        // Navigate to screen
        try {
          navigation?.navigate(item.screen as never);
        } catch (error) {
          console.error(`Navigation error for ${item.screen}:`, error);
          // Fallback: navigate to More screen if screen doesn't exist
          if (item.screen !== 'More') {
            navigation?.navigate('More' as never);
          }
        }
      }
    };

    if (onMenuItemPress) {
      onMenuItemPress(action);
    } else {
      onClose();
      setTimeout(action, 200);
    }
  };

  const getBadgeCount = (item: MenuItem): number | undefined => {
    if (item.id === 'messages' && item.showBadge) {
      return unreadMessagesCount;
    }
    return item.badgeCount;
  };

  return (
    <SafeAreaView style={styles.sidebarContent}>
      {/* Header */}
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarProfileSection}>
          <UserAvatar
            user={user}
            size="medium"
            showBadge={true}
          />
          <View style={styles.sidebarUserInfo}>
            <Text style={styles.sidebarUserName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text style={styles.sidebarUserStatus}>
              {user?.isVerified ? 'Verified Neighbor' : 'Active Neighbor'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeSidebarButton}
          onPress={onClose}
        >
          <MaterialCommunityIcons name="close" size={24} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.sidebarMenu}>
        {menuItems.map((item) => {
          const badgeCount = getBadgeCount(item);
          const hasBadge = badgeCount !== undefined && badgeCount > 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              {item.showBadge && hasBadge ? (
                <View style={styles.menuIconContainer}>
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  {hasBadge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>
                        {badgeCount! > 99 ? '99+' : badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              )}
              <Text style={styles.menuItemText}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleMenuItemPress({ id: 'profile-settings', label: 'Profile & Settings', icon: 'account-circle', color: '#8E8E93', screen: 'Profile' })}
        >
          <MaterialCommunityIcons name="account-circle" size={20} color="#8E8E93" />
          <Text style={styles.footerButtonText}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sidebarContent: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  sidebarProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  sidebarUserStatus: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '500',
  },
  closeSidebarButton: {
    padding: 8,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 16,
    flex: 1,
  },
  menuIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerButtonText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 12,
  },
});

export default SidebarMenu;

