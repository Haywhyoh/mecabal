import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useFeed from '../hooks/useFeed';
import { Post } from '../services/postsService';
import FeedList from '../components/FeedList';
import PostFilter from '../components/PostFilter';
import PostCreator from '../components/PostCreator';
import { useAuth } from '../contexts/AuthContext';

interface FeedScreenProps {
  navigation: any;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user: currentUser } = useAuth();

  // Initialize feed with auto-refresh
  const {
    posts,
    loading,
    refreshing,
    hasMore,
    error,
    filter,
    loadMore,
    refreshFeed,
    updateFilter,
    clearFilter,
    searchPosts,
    likePost,
    commentOnPost,
    sharePost,
    reportPost,
    editPost,
    deletePost,
  } = useFeed({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });


  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    try {
      if (query.trim()) {
        await searchPosts(query);
      } else {
        // Clear search and refresh feed
        clearFilter();
        refreshFeed();
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchPosts, clearFilter, refreshFeed]);

  // Handle post actions
  const handlePostPress = useCallback((post: Post) => {
    // Navigate to post detail screen
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  const handleReaction = useCallback(async (postId: string, reactionType: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      Alert.alert('Error', 'Failed to react to post');
    }
  }, [likePost]);

  const handleComment = useCallback((postId: string) => {
    // Navigate to post detail screen with comment focus
    navigation.navigate('PostDetail', { postId, focusComment: true });
  }, [navigation]);

  const handleShare = useCallback(async (post: Post) => {
    try {
      await sharePost(post);
    } catch (error) {
      Alert.alert('Error', 'Failed to share post');
    }
  }, [sharePost]);

  const handleReport = useCallback(async (postId: string) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => reportPost(postId, 'spam') },
        { text: 'Inappropriate', onPress: () => reportPost(postId, 'inappropriate') },
        { text: 'Harassment', onPress: () => reportPost(postId, 'harassment') },
        { text: 'Other', onPress: () => reportPost(postId, 'other') },
      ]
    );
  }, [reportPost]);

  const handleEdit = useCallback((post: Post) => {
    // Navigate to edit post screen
    navigation.navigate('EditPost', { post });
  }, [navigation]);

  const handleDelete = useCallback(async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  }, [deletePost]);

  const handlePostCreated = useCallback((newPost: Post) => {
    // Refresh feed to show new post
    refreshFeed();
  }, [refreshFeed]);

  const handleFilterApply = useCallback((newFilter: any) => {
    updateFilter(newFilter);
  }, [updateFilter]);

  // Memoize the header component
  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E8E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search posts..."
          placeholderTextColor="#8E8E8E"
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilter(true)}
      >
        <Ionicons name="options-outline" size={20} color="#00A651" />
      </TouchableOpacity>
    </View>
  ), [searchQuery, handleSearch]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      {renderHeader}

      {/* Feed List */}
      <FeedList
        posts={posts}
        loading={loading}
        refreshing={refreshing}
        hasMore={hasMore}
        error={error}
        onRefresh={refreshFeed}
        onLoadMore={loadMore}
        onPostPress={handlePostPress}
        onReaction={handleReaction}
        onComment={handleComment}
        onShare={handleShare}
        onReport={handleReport}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUser?.id}
      />


      {/* Post Filter Modal */}
      <PostFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
        currentFilter={filter}
      />

      {/* Post Creator Modal */}
      <PostCreator
        visible={showPostCreator}
        onClose={() => setShowPostCreator(false)}
        onPostCreated={handlePostCreated}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#FAFAFA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
  },
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export { FeedScreen };
export default FeedScreen;