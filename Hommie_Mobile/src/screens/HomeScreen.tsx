import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Alert, TextInput, StatusBar, Platform, Modal, Animated } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import NotificationService from '../services/NotificationService';
import MessagingService from '../services/MessagingService';
import FloatingActionButton from '../components/FloatingActionButton';
import { useAuth } from '../contexts/AuthContext';
import { FeedScreen } from '../screens/FeedScreen';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigation = useNavigation();
  const { user } = useAuth();

  const notificationService = NotificationService.getInstance();
  const messagingService = MessagingService.getInstance();

  // Subscribe to notification and message updates
  useEffect(() => {
    // Load initial counts
    setUnreadNotifications(notificationService.getUnreadCount());
    
    const conversations = messagingService.getConversations();
    const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    setUnreadMessages(totalUnreadMessages);

    // Subscribe to notification updates
    const unsubscribeNotifications = notificationService.subscribe((notifications) => {
      const unreadCount = notifications.filter(n => !n.read).length;
      setUnreadNotifications(unreadCount);
    });

    // Subscribe to conversation updates
    const handleConversationUpdated = () => {
      const conversations = messagingService.getConversations();
      const totalUnread = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      setUnreadMessages(totalUnread);
    };

    messagingService.on('conversationUpdated', handleConversationUpdated);
    messagingService.on('conversationCreated', handleConversationUpdated);

    return () => {
      unsubscribeNotifications();
      messagingService.off('conversationUpdated', handleConversationUpdated);
      messagingService.off('conversationCreated', handleConversationUpdated);
    };
  }, []);

  // Get user data from authentication context
  const currentUser = {
    firstName: user?.firstName || 'User',
    lastName: user?.lastName || '',
    profileImage: user?.profilePictureUrl || null,
    hasBusinessProfile: true, // TODO: Get from user profile
    pendingConnectionRequests: 3, // TODO: Get from API
  };

  const handleProfilePress = () => {
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

  const handleSearch = () => {
    if (searchText.trim()) {
      Alert.alert('Search', `Searching for: "${searchText}"`);
    }
  };

  const handleAddNeighbor = () => {
    // Navigate to social features screen
    Alert.alert(
      'Connect with Neighbors',
      'Build your community network',
      [
        {
          text: 'Find Neighbors',
          onPress: () => navigation.navigate('NeighborConnections' as never, { initialTab: 'discover' })
        },
        {
          text: 'My Connections',
          onPress: () => navigation.navigate('NeighborConnections' as never, { initialTab: 'connections' })
        },
        {
          text: 'Connection Requests',
          onPress: () => navigation.navigate('NeighborConnections' as never, { initialTab: 'requests' })
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleMessages = () => {
    navigation.navigate('Messaging' as never);
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Search Bar - Outside SafeAreaView for better touch handling */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={handleProfilePress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.profileInitial}>
                {getInitials(currentUser.firstName, currentUser.lastName)}
              </Text>
              {currentUser.hasBusinessProfile && (
                <View style={styles.businessIndicator}>
                  <MaterialCommunityIcons name="store" size={10} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search MeCabal"
              placeholderTextColor="#8E8E8E"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#8E8E8E" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerAction} 
              onPress={handleAddNeighbor}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color="#2C2C2C" />
              {currentUser.pendingConnectionRequests > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {currentUser.pendingConnectionRequests > 9 ? '9+' : currentUser.pendingConnectionRequests}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerAction} 
              onPress={handleNotifications}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="bell" size={24} color="#2C2C2C" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerAction} 
              onPress={handleMessages}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="chat" size={24} color="#2C2C2C" />
              {unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content with SafeAreaView */}
      <SafeAreaView style={styles.contentContainer}>
        <FeedScreen navigation={navigation} />
      </SafeAreaView>

      {/* Profile Sidebar */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
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
                  <View style={styles.sidebarAvatar}>
                    <Text style={styles.sidebarAvatarText}>
                      {getInitials(currentUser.firstName, currentUser.lastName)}
                    </Text>
                  </View>
                  <View style={styles.sidebarUserInfo}>
                    <Text style={styles.sidebarUserName}>
                      {currentUser.firstName} {currentUser.lastName}
                    </Text>
                    <Text style={styles.sidebarUserStatus}>Active Neighbor</Text>
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
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(() => navigation.navigate('Profile' as never))}
                >
                  <MaterialCommunityIcons name="account" size={24} color="#00A651" />
                  <Text style={styles.menuItemText}>Personal Profile</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
                </TouchableOpacity>

                {currentUser.hasBusinessProfile && (
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => handleMenuItemPress(() => navigation.navigate('BusinessProfile' as never))}
                  >
                    <MaterialCommunityIcons name="store" size={24} color="#FF6B35" />
                    <Text style={styles.menuItemText}>Business Profile</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(() => navigation.navigate('CommunityActivity' as never))}
                >
                  <MaterialCommunityIcons name="chart-line" size={24} color="#0066CC" />
                  <Text style={styles.menuItemText}>Community Activity</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(() => navigation.navigate('NeighborConnections' as never))}
                >
                  <MaterialCommunityIcons name="account-group" size={24} color="#7B68EE" />
                  <Text style={styles.menuItemText}>Neighbor Network</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(() => navigation.navigate('LocalBusinessDirectory' as never))}
                >
                  <MaterialCommunityIcons name="office-building" size={24} color="#228B22" />
                  <Text style={styles.menuItemText}>Local Businesses</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity style={styles.footerButton}>
                  <MaterialCommunityIcons name="cog" size={20} color="#8E8E8E" />
                  <Text style={styles.footerButtonText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton}>
                  <MaterialCommunityIcons name="help-circle" size={20} color="#8E8E8E" />
                  <Text style={styles.footerButtonText}>Help</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <FloatingActionButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Account for status bar height
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    zIndex: 1000, // Ensure header is above other content
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44, // Ensure minimum touch target size
  },
  profileSection: {
    marginRight: 12,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  businessIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#228B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontSize: 16,
    color: '#2C2C2C',
    flex: 1,
  },
  clearButton: {
    padding: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  businessAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocation: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  homeIcon: {
    marginLeft: 4,
  },
  sponsoredLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  moreButton: {
    padding: 4,
  },
  postText: {
    fontSize: 16,
    color: '#2C2C2C',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  adImage: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 8,
  },
  adButton: {
    backgroundColor: '#B8E6B8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  adButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  eventText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    marginLeft: 6,
  },
  marketplaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  marketplaceText: {
    fontSize: 14,
    color: '#228B22',
    fontWeight: '600',
    marginLeft: 6,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 6,
  },
  actionCount: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  joinEventButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 'auto',
  },
  joinEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 'auto',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Sidebar Styles
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: width * 0.85, // 85% of screen width
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
  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sidebarUserInfo: {
    flex: 1,
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
