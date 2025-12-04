import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useUnifiedFeed from '../../hooks/useUnifiedFeed';
import { Post } from '../../services/postsService';
import { Event } from '../../services/EventsApi';
import { UnifiedFeedList } from '../../components/feed';
import { PostCreator } from '../../components/posts';
import { SegmentedControl } from '../../components/ui';
import { HelpPostCard } from '../../components/posts';
import { useAuth } from '../../contexts/AuthContext';

interface FeedScreenProps {
  navigation: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showPostCreator, setShowPostCreator] = useState(false);
  const { user: currentUser } = useAuth();

  // Initialize unified feed with auto-refresh
  const {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    filter,
    loadMore,
    refreshFeed,
    updateFilter,
    clearFilter,
    likePost,
    commentOnPost,
    sharePost,
    reportPost,
    editPost,
    deletePost,
  } = useUnifiedFeed({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });


  // Handle post actions
  const handlePostPress = useCallback((post: Post) => {
    // Navigate to post detail screen
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  // Handle event actions
  const handleEventPress = useCallback((event: Event) => {
    // Navigate to event detail screen
    navigation.navigate('EventDetails', { eventId: event.id });
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


  // Handle segment change
  const handleSegmentChange = useCallback((segmentId: string) => {
    setSelectedSegment(segmentId);

    if (segmentId === 'all') {
      clearFilter();
    } else {
      updateFilter({ postType: segmentId as any });
    }

    refreshFeed();
  }, [clearFilter, updateFilter, refreshFeed]);

  // Define segments for the segmented control
  const segments = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'help', label: 'Help', icon: 'help-circle-outline' },
    { id: 'event', label: 'Events', icon: 'calendar-outline' },
    { id: 'alert', label: 'Alerts', icon: 'warning-outline' },
  ];

  // Render custom card based on item type
  const renderCustomCard = useCallback((item: any) => {
    if (item.type === 'post') {
      const post = item.data as Post;
      if (post.postType === 'help') {
        return (
          <HelpPostCard
            post={post}
            onPress={() => handlePostPress(post)}
            onReact={(reactionType: string) => handleReaction(post.id, reactionType)}
            onComment={() => handleComment(post.id)}
            onShare={() => handleShare(post)}
          />
        );
      }
    }
    // Return null here - UnifiedFeedList will render the default cards
    return null;
  }, [handlePostPress, handleReaction, handleComment, handleShare]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Segmented Control */}
      <View style={styles.filterBar}>
        <SegmentedControl
          segments={segments}
          selectedSegment={selectedSegment}
          onSegmentChange={handleSegmentChange}
          style={styles.segmentedControl}
        />
      </View>

      {/* Unified Feed List */}
      <UnifiedFeedList
        items={items}
        loading={loading}
        refreshing={refreshing}
        hasMore={hasMore}
        error={error}
        onRefresh={refreshFeed}
        onLoadMore={loadMore}
        onPostPress={handlePostPress}
        onEventPress={handleEventPress}
        onReaction={handleReaction}
        onComment={handleComment}
        onShare={handleShare}
        onReport={handleReport}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUser?.id}
        renderCustomCard={renderCustomCard}
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,  // Add horizontal padding since filter button is removed
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  segmentedControl: {
    flex: 1,
    marginLeft: 0,
  },
});

export { FeedScreen };
export default FeedScreen;