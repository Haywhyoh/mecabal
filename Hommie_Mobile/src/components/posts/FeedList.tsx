import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../services/postsService';
import { PostCard } from './PostCard';
import { EmptyState } from './EmptyState';

interface FeedListProps {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPostPress?: (post: Post) => void;
  onReaction?: (postId: string, reactionType: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (post: Post) => void;
  onReport?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  loading,
  refreshing,
  hasMore,
  error,
  onRefresh,
  onLoadMore,
  onPostPress,
  onReaction,
  onComment,
  onShare,
  onReport,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  // Memoize the render item function
  const renderPost = useCallback(({ item }: { item: Post }) => {
    const isOwner = currentUserId ? item.author.id === currentUserId : false;

    return (
      <PostCard
        post={item}
        onPress={onPostPress}
        onReaction={onReaction}
        onComment={onComment}
        onShare={onShare}
        onReport={onReport}
        onEdit={onEdit}
        onDelete={onDelete}
        isOwner={isOwner}
        showActions={true}
      />
    );
  }, [currentUserId, onPostPress, onReaction, onComment, onShare, onReport, onEdit, onDelete]);

  // Memoize the key extractor
  const keyExtractor = useCallback((item: Post) => item.id, []);

  // Memoize the footer component
  const renderFooter = useCallback(() => {
    if (!loading || posts.length === 0) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.footerText}>Loading more posts...</Text>
      </View>
    );
  }, [loading, posts.length]);

  // Memoize the empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <EmptyState
        icon="chatbubble-outline"
        title="No Posts Yet"
        description="Be the first to share something in your neighborhood!"
        actionText="Create Post"
        onAction={() => {
          // This will be handled by the parent component
          console.log('Create post action');
        }}
      />
    );
  }, [loading]);

  // Memoize the error component
  const renderError = useCallback(() => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }, [error, onRefresh]);

  // Memoize the refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#00A651']}
        tintColor="#00A651"
        title="Pull to refresh"
        titleColor="#8E8E8E"
      />
    ),
    [refreshing, onRefresh]
  );

  // Memoize the onEndReached function
  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  // Memoize the onEndReachedThreshold
  const onEndReachedThreshold = useMemo(() => 0.5, []);

  // Show error state
  if (error && posts.length === 0) {
    return renderError();
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={keyExtractor}
      refreshControl={refreshControl}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={100}
      initialNumToRender={10}
      windowSize={10}
      getItemLayout={(data, index) => ({
        length: 200, // Approximate item height
        offset: 200 * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E8E',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#00A651',
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FeedList;
