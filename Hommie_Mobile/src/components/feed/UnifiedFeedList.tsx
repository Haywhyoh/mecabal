import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Post } from '../../services/postsService';
import { Event } from '../../services/EventsApi';
import { FeedItem } from '../../hooks/useUnifiedFeed';
import { PostCard } from '../posts';
import { EventCard } from '../events';
import { colors, spacing, typography } from '../../constants';

interface UnifiedFeedListProps {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPostPress: (post: Post) => void;
  onEventPress: (event: Event) => void;
  onReaction: (postId: string, reactionType: string) => void;
  onComment: (postId: string) => void;
  onShare: (post: Post) => void;
  onReport: (postId: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
  renderCustomCard?: (item: FeedItem) => React.ReactNode;
}

const UnifiedFeedList: React.FC<UnifiedFeedListProps> = ({
  items,
  loading,
  refreshing,
  hasMore,
  error,
  onRefresh,
  onLoadMore,
  onPostPress,
  onEventPress,
  onReaction,
  onComment,
  onShare,
  onReport,
  onEdit,
  onDelete,
  currentUserId,
  renderCustomCard,
}) => {
  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    // Check if there's a custom renderer for this item
    if (renderCustomCard) {
      const customCard = renderCustomCard(item);
      if (customCard) {
        return customCard;
      }
    }

    if (item.type === 'post') {
      const post = item.data as Post;
      return (
        <PostCard
          post={post}
          onPress={() => onPostPress(post)}
          onReaction={(postId, reactionType) => onReaction(postId, reactionType)}
          onComment={() => onComment(post.id)}
          onShare={() => onShare(post)}
          onReport={() => onReport(post.id)}
          onEdit={() => onEdit(post)}
          onDelete={() => onDelete(post.id)}
          isOwner={currentUserId ? post.author.id === currentUserId : false}
        />
      );
    } else if (item.type === 'event') {
      const event = item.data as Event;
      return (
        <EventCard
          event={event}
          onPress={() => onEventPress(event)}
        />
      );
    }

    return null;
  }, [onPostPress, onEventPress, onReaction, onComment, onShare, onReport, onEdit, onDelete, currentUserId, renderCustomCard]);

  const renderFooter = useCallback(() => {
    if (!hasMore && !loading) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>You've reached the end</Text>
        </View>
      );
    }

    if (loading && items.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, loading, items.length]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Loading content...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorState}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={colors.neutral.lightGray} />
        <Text style={styles.emptyTitle}>No content found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your filters or check back later for new posts and events.
        </Text>
      </View>
    );
  }, [loading, error, onRefresh]);

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  const onEndReached = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});

export default UnifiedFeedList;
