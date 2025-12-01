import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Comment } from '../services/postsService';
import PostsService from '../services/postsService';
import { UserAvatar } from '../profile';
import { useAuth } from '../contexts/AuthContext';
import CommentCreator from './CommentCreator';

interface CommentsListProps {
  postId: string;
  onCommentAdded?: () => void;
}

const { width } = Dimensions.get('window');
const commentMediaWidth = width - 96; // Account for avatar (40) + margin (16) + padding (32) + spacing (8)

export const CommentsList: React.FC<CommentsListProps> = ({
  postId,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCommentCreator, setShowCommentCreator] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();

  const postsService = PostsService.getInstance();

  const loadComments = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load comments from API
      const limit = 20;
      const response = await postsService.getComments(postId, pageNum, limit);

      if (refresh || pageNum === 1) {
        setComments(response.data);
        setPage(1);
      } else {
        setComments(prev => [...prev, ...response.data]);
        setPage(pageNum);
      }

      setHasMore(response.hasNext);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, postsService]);

  // Load comments on mount
  useEffect(() => {
    loadComments(1, true);
  }, [postId]); // Only depend on postId, not the functions

  const handleCommentCreated = (newComment: Comment) => {
    // Add new comment to the beginning of the list
    setComments(prev => [newComment, ...prev]);
    onCommentAdded?.();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, false);
    }
  };

  const handleRefresh = () => {
    loadComments(1, true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderCommentsHeader = () => {
    return (
      <View style={styles.commentsHeaderContainer}>
        <Text style={styles.commentsHeaderText}>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Text>
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => {
    // Null check for item and author
    if (!item || !item.author) {
      console.warn('Invalid comment item:', item);
      return null;
    }

    return (
      <View style={styles.commentItem}>
        <UserAvatar
          user={{
            id: item.author.id,
            phoneNumber: '',
            firstName: item.author.firstName || '',
            lastName: item.author.lastName || '',
            profilePictureUrl: item.author.profilePicture,
            isVerified: item.author.isVerified || false,
            phoneVerified: false,
            identityVerified: false,
            addressVerified: false,
            preferredLanguage: 'en',
            verificationLevel: 0,
            createdAt: '',
            updatedAt: '',
          }}
          size="small"
          showBadge={item.author.isVerified}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>
              {item.author.firstName} {item.author.lastName}
            </Text>
            <Text style={styles.commentTime}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>

        {/* Media attachments */}
        {item.media && item.media.length > 0 && (
          <View style={styles.commentMediaContainer}>
            {item.media.map((media, index) => (
              <View key={index} style={styles.commentMediaItem}>
                {media.type === 'image' ? (
                  <Image
                    source={{ uri: media.url }}
                    style={styles.commentMediaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <VideoView
                    player={useVideoPlayer(media.url)}
                    style={styles.commentMediaVideo}
                    allowsFullscreen
                    allowsPictureInPicture
                  />
                )}
                {media.caption && (
                  <Text style={styles.commentMediaCaption}>{media.caption}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons
              name={item.userLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.userLiked ? '#00A651' : '#8E8E8E'}
            />
            {item.likesCount > 0 && (
              <Text style={[styles.commentActionText, item.userLiked && styles.commentActionTextActive]}>
                {item.likesCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="chatbubble-outline" size={16} color="#8E8E8E" />
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#00A651" />
        <Text style={styles.footerText}>Loading comments...</Text>
      </View>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A651" />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Comments Header */}
      {renderCommentsHeader()}

      {/* Comments List */}
      {comments.map((comment) => (
        <View key={comment.id}>
          {renderComment({ item: comment })}
        </View>
      ))}

      {/* Loading Footer */}
      {renderFooter()}

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TouchableOpacity
          style={styles.commentInputButton}
          onPress={() => setShowCommentCreator(true)}
          accessibilityLabel="Write a comment"
          accessibilityHint="Opens comment composer to write and attach media to your comment"
        >
          {currentUser?.profilePictureUrl ? (
            <UserAvatar
              user={{
                id: currentUser.id,
                phoneNumber: currentUser.phoneNumber,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                profilePictureUrl: currentUser.profilePictureUrl,
                isVerified: currentUser.isVerified,
                phoneVerified: currentUser.phoneVerified,
                identityVerified: currentUser.identityVerified,
                addressVerified: currentUser.addressVerified,
                preferredLanguage: currentUser.preferredLanguage,
                verificationLevel: currentUser.verificationLevel,
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt,
              }}
              size="small"
              showBadge={false}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={20} color="#8E8E8E" />
            </View>
          )}
          <Text style={styles.commentInputPlaceholder}>Write a comment...</Text>
          <Ionicons name="image-outline" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      {/* Comment Creator Modal */}
      <CommentCreator
        visible={showCommentCreator}
        onClose={() => setShowCommentCreator(false)}
        onCommentCreated={handleCommentCreated}
        postId={postId}
        placeholder="What's your thought on this post?"
        autoFocus={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E8E',
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  commentText: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E8E',
  },
  commentActionTextActive: {
    color: '#00A651',
  },
  commentInputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  commentInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentInputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E8E',
  },
  commentMediaContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  commentMediaItem: {
    marginBottom: 8,
  },
  commentMediaImage: {
    width: commentMediaWidth,
    height: commentMediaWidth * 0.75,
    borderRadius: 8,
  },
  commentMediaVideo: {
    width: commentMediaWidth,
    height: commentMediaWidth * 0.75,
    borderRadius: 8,
  },
  commentMediaCaption: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  commentsHeaderContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  commentsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E8E',
  },
});

export default CommentsList;

