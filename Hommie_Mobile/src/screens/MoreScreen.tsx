import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../components/profile';
import { HapticFeedback } from '../utils/haptics';
import { contextAwareGoBack } from '../utils/navigationUtils';
import MessagingService from '../services/MessagingService';

interface MoreScreenProps {
  navigation?: any;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  onPress: () => void;
  badge?: number;
  isNew?: boolean;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Get user data for sidebar
  const currentUser = {
    firstName: user?.firstName || 'User',
    lastName: user?.lastName || '',
    profileImage: user?.profilePictureUrl || null,
  };

  // Subscribe to messaging service updates for unread count
  useEffect(() => {
    const messagingService = MessagingService.getInstance();

    const updateUnreadCount = async () => {
      try {
        const conversations = await messagingService.getConversations();
        const total = Array.isArray(conversations)
          ? conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
          : 0;
        setUnreadMessagesCount(total);
      } catch (error) {
        console.error('Failed to get conversations for unread count:', error);
        setUnreadMessagesCount(0);
      }
    };

    updateUnreadCount();
    messagingService.on('conversationUpdated', updateUnreadCount);

    return () => {
      messagingService.off('conversationUpdated', updateUnreadCount);
    };
  }, []);

  const openSidebar = () => {
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const handleMenuItemPress = (action: () => void) => {
    closeSidebar();
    // Small delay to let sidebar close before navigation
    setTimeout(action, 200);
  };

  const handleNavigation = (screenName: string, params?: any) => {
    navigation?.navigate(screenName, params);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuSections: MenuSection[] = [
    // SECTION 1: Account Management
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: 'View and edit your profile',
          icon: 'account-circle',
          iconColor: '#00A651',
          onPress: () => handleNavigation('Profile'),
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          subtitle: 'Saved items and activity',
          icon: 'view-dashboard',
          iconColor: '#0066CC',
          onPress: () => handleNavigation('Dashboard'),
        },
        {
          id: 'verification',
          title: 'Verification',
          subtitle: 'Verify your identity',
          icon: 'shield-check',
          iconColor: '#2196F3',
          onPress: () => handleNavigation('NINVerification'),
        },
      ],
    },

    // SECTION 2: Community Features
    {
      title: 'Community',
      items: [
        {
          id: 'events',
          title: 'Events',
          subtitle: 'Community events and gatherings',
          icon: 'calendar-multiple',
          iconColor: '#7B68EE',
          onPress: () => handleNavigation('Events'),
        },
        {
          id: 'neighbors',
          title: 'Neighbors',
          subtitle: 'Connect with your community',
          icon: 'account-group',
          iconColor: '#9C27B0',
          onPress: () => handleNavigation('NeighborConnections'),
        },
        {
          id: 'businesses',
          title: 'Local Businesses',
          subtitle: 'Find trusted services nearby',
          icon: 'store',
          iconColor: '#FF9800',
          onPress: () => handleNavigation('LocalBusinessDirectory'),
        },
      ],
    },

    // SECTION 3: Business
    {
      title: 'Business',
      items: [
        {
          id: 'business-profile',
          title: 'Business Profile',
          subtitle: 'Manage your business presence',
          icon: 'briefcase',
          iconColor: '#00A651',
          onPress: () => handleNavigation('BusinessProfile'),
        },
        {
          id: 'business-register',
          title: 'Register Business',
          subtitle: 'Add your business to MeCabal',
          icon: 'store-plus',
          iconColor: '#00A651',
          onPress: () => handleNavigation('BusinessRegistration'),
        },
      ],
    },

    // SECTION 4: Settings
    {
      title: 'Settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage your alerts',
          icon: 'bell-cog',
          iconColor: '#FF6B35',
          onPress: () => {
            console.log('Navigate to Notification Settings');
          },
        },
        {
          id: 'privacy',
          title: 'Privacy & Safety',
          subtitle: 'Control your visibility',
          icon: 'shield-account',
          iconColor: '#2196F3',
          onPress: () => {
            console.log('Navigate to Privacy Settings');
          },
        },
        {
          id: 'account-settings',
          title: 'Account Settings',
          subtitle: 'Manage your account',
          icon: 'cog',
          iconColor: '#8E8E93',
          onPress: () => {
            console.log('Navigate to Account Settings');
          },
        },
      ],
    },

    // SECTION 5: Support
    {
      title: 'Support & Info',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'Get help with MeCabal',
          icon: 'help-circle',
          iconColor: '#8E8E93',
          onPress: () => {
            console.log('Navigate to Help Center');
          },
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'Version 1.0.0',
          icon: 'information',
          iconColor: '#8E8E93',
          onPress: () => {
            console.log('Navigate to About');
          },
        },
      ],
    },

    // SECTION 6: Sign Out (separate, destructive)
    {
      title: '',  // No title
      items: [
        {
          id: 'signout',
          title: 'Sign Out',
          subtitle: '',
          icon: 'logout',
          iconColor: '#FF3B30',
          onPress: handleSignOut,
        },
      ],
    },
  ];

  const ProfileHeader = () => {
    const getUserName = () => {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      } else if (user?.firstName) {
        return user.firstName;
      } else if (user?.email) {
        return user.email.split('@')[0];
      }
      return 'User';
    };

    return (
      <TouchableOpacity
        style={styles.profileHeader}
        onPress={() => handleNavigation('Profile')}
      >
        <UserAvatar user={user} size="small" showBadge={false} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{getUserName()}</Text>
          <Text style={styles.viewProfileText}>View Profile</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
      </TouchableOpacity>
    );
  };

  const MenuItem: React.FC<{ item: MenuItem }> = ({ item }) => {
    const isDestructive = item.id === 'signout';
    
    return (
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => {
          if (isDestructive) {
            HapticFeedback.warning();
          } else {
            HapticFeedback.light();
          }
          item.onPress();
        }}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIcon, { backgroundColor: isDestructive ? '#FF3B3015' : `${item.iconColor}15` }]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.iconColor || '#8E8E93'}
            />
          </View>
          <View style={styles.menuItemText}>
            <View style={styles.menuItemTitleRow}>
              <Text style={[styles.menuItemTitle, isDestructive && styles.destructiveText]}>
                {item.title}
              </Text>
              {item.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        
        {!isDestructive && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#8E8E93"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with Back and Menu buttons */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => contextAwareGoBack(navigation, 'main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={openSidebar}
        >
          <MaterialCommunityIcons name="menu" size={24} color="#2C2C2C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title || `section-${sectionIndex}`} style={styles.section}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  <MenuItem item={item} />
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Nigerian Communities
          </Text>
          <Text style={styles.footerVersion}>MeCabal v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Sidebar Menu */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSidebar}
        statusBarTranslucent
      >
        <View style={styles.sidebarOverlay}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={closeSidebar}
          />
          
          {/* Sidebar Content */}
          <View style={styles.sidebar}>
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
                  onPress={closeSidebar}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#8E8E8E" />
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <View style={styles.sidebarMenu}>
                {/* Profile - Links to More Screen */}
                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('More' as never))}
                >
                  <MaterialCommunityIcons name="account" size={24} color="#00A651" />
                  <Text style={styles.sidebarMenuItemText}>Profile</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
                </TouchableOpacity>

                {/* Dashboard */}
                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('Dashboard' as never))}
                >
                  <MaterialCommunityIcons name="view-dashboard" size={24} color="#0066CC" />
                  <Text style={styles.sidebarMenuItemText}>Dashboard</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
                </TouchableOpacity>

                {/* Events */}
                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('Events' as never))}
                >
                  <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
                  <Text style={styles.sidebarMenuItemText}>Events</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
                </TouchableOpacity>

                {/* Messages */}
                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('Messaging' as never))}
                >
                  <View style={styles.sidebarMenuIconContainer}>
                    <MaterialCommunityIcons name="message" size={24} color="#FF9800" />
                    {unreadMessagesCount > 0 && (
                      <View style={styles.sidebarMenuBadge}>
                        <Text style={styles.sidebarMenuBadgeText}>
                          {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sidebarMenuItemText}>Messages</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.sidebarMenuDivider} />

                {/* More/Settings (links to MoreScreen) */}
                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('More' as never))}
                >
                  <MaterialCommunityIcons name="menu" size={24} color="#8E8E93" />
                  <Text style={styles.sidebarMenuItemText}>More</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity
                  style={styles.sidebarFooterButton}
                  onPress={() => handleMenuItemPress(() => navigation?.navigate('Profile' as never))}
                >
                  <MaterialCommunityIcons name="account-circle" size={20} color="#8E8E93" />
                  <Text style={styles.sidebarFooterButtonText}>Profile & Settings</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',  // Apple's background
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 24,  // More space before sections
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  viewProfileText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,  // Increased spacing
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',  // Apple's secondary label
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',  // For separator lines
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,  // Ensure good touch target
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  newBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#00A651',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  separator: {
    height: 0.5,  // Hairline
    backgroundColor: '#E5E5EA',
    marginLeft: 60,  // Indent to align with text
  },
  // Destructive item (Sign Out)
  destructiveItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  destructiveText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Sidebar Styles
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 10,
  },
  backdrop: {
    flex: 1,
  },
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
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  sidebarMenuItemText: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 16,
    flex: 1,
  },
  sidebarMenuIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  sidebarMenuBadge: {
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
  sidebarMenuBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarMenuDivider: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sidebarFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarFooterButtonText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 12,
  },
});

export default MoreScreen;