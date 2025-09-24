import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CreateCommentRequest } from '../services/postsService';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';

interface CommentsListProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  postId,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();

  // Mock comments for now - replace with actual API call
  const loadComments = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock data - replace with actual API call
      const mockComments: Comment[] = [
        {
          id: '1',
          postId,
          content: 'This is a great post! Thanks for sharing.',
          author: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: undefined,
            isVerified: true,
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isEdited: false,
          likesCount: 5,
          userLiked: false,
        },
        {
          id: '2',
          postId,
          content: 'I completely agree with this. Very insightful!',
          author: {
            id: 'user2',
            firstName: 'Jane',
            lastName: 'Smith',
            profilePicture: undefined,
            isVerified: false,
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          isEdited: false,
          likesCount: 2,
          userLiked: true,
        },
      ];

      if (refresh || pageNum === 1) {
        setComments(mockComments);
        setPage(1);
      } else {
        setComments(prev => [...prev, ...mockComments]);
        setPage(pageNum);
      }

      setHasMore(mockComments.length === 20); // Assuming 20 is the page size
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  // Load comments on mount
  useEffect(() => {
    loadComments(1, true);
  }, [loadComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);

      // Mock comment creation - replace with actual API call
      const mockNewComment: Comment = {
        id: Date.now().toString(),
        postId,
        content: newComment.trim(),
        author: {
          id: currentUser?.id || 'current-user',
          firstName: currentUser?.firstName || 'You',
          lastName: currentUser?.lastName || '',
          profilePicture: currentUser?.profilePictureUrl,
          isVerified: currentUser?.isVerified || false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        likesCount: 0,
        userLiked: false,
      };

      setComments(prev => [mockNewComment, ...prev]);
      setNewComment('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <UserAvatar
        user={{
          id: item.author.id,
          phoneNumber: '',
          firstName: item.author.firstName,
          lastName: item.author.lastName,
          profilePictureUrl: item.author.profilePicture,
          isVerified: item.author.isVerified,
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

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.footerText}>Loading comments...</Text>
      </View>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Comments List */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.submitButton, (!newComment.trim() || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: '#2C2C2C',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E8E',
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
