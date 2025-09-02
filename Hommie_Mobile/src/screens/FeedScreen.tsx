import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function FeedScreen() {
  const [searchText, setSearchText] = useState('');

  // Mock user data - would come from authentication context
  const currentUser = {
    firstName: 'Adebayo',
    lastName: 'Ogundimu',
    profileImage: null, // null means we'll show initials
    hasBusinessProfile: true,
  };

  const dummyPosts = [
    { id: '1', text: 'Community meeting this Saturday at 3 PM!', author: 'John D.', time: '2 hours ago' },
    { id: '2', text: 'Lost dog found near the park. Please contact if it\'s yours.', author: 'Sarah M.', time: '4 hours ago' },
    { id: '3', text: 'Great plumber recommendation: Mike from ABC Plumbing', author: 'David K.', time: '1 day ago' },
  ];

  const handleProfilePress = () => {
    // This will navigate to the ProfileScreen
    Alert.alert(
      'Profile Menu',
      'Choose profile to view',
      [
        {
          text: 'Personal Profile',
          onPress: () => Alert.alert('Navigate to ProfileScreen')
        },
        ...(currentUser.hasBusinessProfile ? [{
          text: 'Business Profile',
          onPress: () => Alert.alert('Navigate to BusinessProfileScreen')
        }] : []),
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleSearch = () => {
    Alert.alert('Search', `Searching for: "${searchText}"`);
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Navigate to notifications screen');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.postText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search and Profile */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your community..."
              placeholderTextColor="#8E8E8E"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#8E8E8E" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Notifications */}
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#2C2C2C" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Profile Entry Point */}
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            {currentUser.profileImage ? (
              <View style={styles.profileImage}>
                {/* Would show actual image here */}
              </View>
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.initialsText}>
                  {getInitials(currentUser.firstName, currentUser.lastName)}
                </Text>
              </View>
            )}
            {currentUser.hasBusinessProfile && (
              <View style={styles.businessIndicator}>
                <MaterialCommunityIcons name="store" size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Content */}
      <FlatList
        data={dummyPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.feedList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 12,
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  profileInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  businessIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#228B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  feedList: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  time: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  postText: {
    fontSize: 16,
    color: '#2C2C2C',
    lineHeight: 22,
  },
});
