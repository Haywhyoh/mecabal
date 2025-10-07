import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Post } from '../services/postsService';
import { UserAvatar } from '../components/UserAvatar';
import { PostActionMenu } from '../components/PostActionMenu';
import { CommentsList } from '../components/CommentsList';
import { useAuth } from '../contexts/AuthContext';
import useFeed from '../hooks/useFeed';

interface PostDetailRouteParams {
  postId: string;
  focusComment?: boolean;
}

const { width } = Dimensions.get('window');
const imageWidth = width - 32; // Account for marginHorizontal (16*2)

export const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, focusComment = false } = (route.params as PostDetailRouteParams) || {};
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(true);

  const {
    likePost,
    commentOnPost,
    sharePost,
    reportPost,
    editPost,
    deletePost,
    getPostById,
    bookmarkPost,
    unbookmarkPost,
  } = useFeed();

  // Load post data
  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      const postData = await getPostById(postId);
      setPost(postData);
      setIsLiked(postData?.engagement.userReaction === 'like');
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, getPostById]);

  // Refresh post data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
  }, [loadPost]);

  // Load post only on mount, not on every focus
  useEffect(() => {
    loadPost();
  }, [postId]); // Only reload if postId changes

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

  const getPostTypeIcon = (type: string) => {
    const icons = {
      general: 'chatbubble-outline',
      event: 'calendar-outline',
      alert: 'warning-outline',
      marketplace: 'storefront-outline',
      lost_found: 'search-outline',
    };
    return icons[type as keyof typeof icons] || 'chatbubble-outline';
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      general: '#3498db',
      event: '#e74c3c',
      alert: '#f39c12',
      marketplace: '#2ecc71',
      lost_found: '#9b59b6',
    };
    return colors[type as keyof typeof colors] || '#3498db';
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const getPrivacyIcon = (level: string) => {
    const icons = {
      neighborhood: 'people-outline',
      group: 'people-circle-outline',
      public: 'globe-outline',
    };
    return icons[level as keyof typeof icons] || 'people-outline';
  };

  const handleReaction = async (reactionType: string) => {
    if (!post) return;
    
    try {
      const wasLiked = isLiked;
      setIsLiked(!isLiked);
      
      if (wasLiked) {
        // Unlike the post
        await likePost(post.id); // This will handle the unlike logic
      } else {
        // Like the post
        await likePost(post.id);
      }
      
      // Refresh post data to get updated counts
      loadPost();
    } catch (error) {
      // Revert the like state if the API call fails
      setIsLiked(!isLiked);
      console.error('Error reacting to post:', error);
      Alert.alert('Error', 'Failed to react to post');
    }
  };

  const handleComment = () => {
    // Focus on comment input (could be implemented later)
    console.log('Focus on comment input');
  };

  const handleShare = async () => {
    if (!post) return;
    
    try {
      const shareContent = {
        message: `${post.title ? `${post.title}\n\n` : ''}${post.content}`,
        url: `https://mecabal.com/posts/${post.id}`,
      };
      
      await Share.share(shareContent);
      await sharePost(post);
      
      // Refresh post data to get updated share count
      loadPost();
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleReport = () => {
    if (!post) return;
    
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => reportPost(post.id, 'Inappropriate content') },
      ]
    );
  };

  const handleEdit = () => {
    if (!post) return;
    // TODO: Navigate to edit post screen
    console.log('Edit post:', post.id);
  };

  const handleDelete = () => {
    if (!post) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePost(post.id) },
      ]
    );
  };

  const handleBookmark = async () => {
    if (!post) return;
    
    try {
      const wasBookmarked = isBookmarked;
      setIsBookmarked(!isBookmarked);
      
      if (wasBookmarked) {
        await unbookmarkPost(post.id);
      } else {
        await bookmarkPost(post.id);
      }
    } catch (error) {
      // Revert the bookmark state if the API call fails
      setIsBookmarked(!isBookmarked);
      console.error('Error bookmarking post:', error);
      Alert.alert('Error', 'Failed to bookmark post');
    }
  };

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setShowActionMenu(true);
  };

  const formatCount = (count: number): string => {
    if (count === 0) return '';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const isOwner = post?.author.id === currentUser?.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#2C2C2C" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* Author Info */}
          <View style={styles.authorInfo}>
            <UserAvatar
              user={{
                id: post.author.id,
                phoneNumber: '', // Not available in post data
                firstName: post.author.firstName,
                lastName: post.author.lastName,
                profilePictureUrl: post.author.profilePicture,
                isVerified: post.author.isVerified,
                phoneVerified: false,
                identityVerified: false,
                addressVerified: false,
                preferredLanguage: 'en',
                verificationLevel: 0,
                createdAt: '',
                updatedAt: '',
              }}
              size="medium"
              showBadge={post.author.isVerified}
            />
            <View style={styles.authorDetails}>
              <View style={styles.authorNameContainer}>
                <Text style={styles.authorName}>
                  {post.author.firstName} {post.author.lastName}
                </Text>
                {post.author.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#3498db" />
                )}
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.timestamp}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
                <View style={styles.postTypeContainer}>
                  <Ionicons
                    name={getPostTypeIcon(post.postType) as any}
                    size={12}
                    color={getPostTypeColor(post.postType)}
                  />
                  <Text style={[styles.postType, { color: getPostTypeColor(post.postType) }]}>
                    {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                  </Text>
                </View>
                <Ionicons
                  name={getPrivacyIcon(post.privacyLevel) as any}
                  size={12}
                  color="#7f8c8d"
                />
              </View>
            </View>
          </View>

          {/* Category Badge */}
          {post.category && (
            <View style={styles.categoryContainer}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: post.category.colorCode || '#3498db' },
                ]}
              >
                <Text style={styles.categoryText}>{post.category.name}</Text>
              </View>
            </View>
          )}

          {/* Title */}
          {post.title && (
            <Text style={styles.title}>{post.title}</Text>
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.content}>{post.content}</Text>
          </View>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {post.media.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  {media.type === 'image' ? (
                    <Image
                      source={{ uri: media.url }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <VideoView
                      player={useVideoPlayer(media.url)}
                      style={styles.mediaVideo}
                      allowsFullscreen
                      allowsPictureInPicture
                    />
                  )}
                  {media.caption && (
                    <Text style={styles.mediaCaption}>{media.caption}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReaction('like')}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#00A651' : '#8E8E8E'}
              />
              {post.engagement.reactionsCount > 0 && (
                <Text style={[styles.actionCount, isLiked && styles.actionCountActive]}>
                  {formatCount(post.engagement.reactionsCount)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleComment}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#8E8E8E" />
              {post.engagement.commentsCount > 0 && (
                <Text style={styles.actionCount}>
                  {formatCount(post.engagement.commentsCount)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="repeat-outline" size={20} color="#8E8E8E" />
              {post.engagement.sharesCount > 0 && (
                <Text style={styles.actionCount}>
                  {formatCount(post.engagement.sharesCount)}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionSpacer} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isBookmarked ? "#00A651" : "#8E8E8E"} 
              />
            </TouchableOpacity>
          </View>

          {/* Pinned Indicator */}
          {post.isPinned && (
            <View style={styles.pinnedIndicator}>
              <Ionicons name="pin" size={16} color="#f39c12" />
              <Text style={styles.pinnedText}>Pinned Post</Text>
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsContainer}>
          <CommentsList
            postId={post.id}
            onCommentAdded={() => {
              // Refresh post data to update comment count
              loadPost();
            }}
          />
        </View>
      </ScrollView>

      {/* Action Menu */}
      <PostActionMenu
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        post={post}
        isOwner={isOwner}
        onReport={handleReport}
        onEdit={handleEdit}
        onDelete={handleDelete}
        position={menuPosition}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authorInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 4,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  postTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  postType: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  contentContainer: {
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C2C2C',
  },
  mediaContainer: {
    marginBottom: 12,
  },
  mediaItem: {
    marginBottom: 8,
  },
  mediaImage: {
    width: imageWidth,
    height: imageWidth * 0.75,
    borderRadius: 8,
  },
  mediaVideo: {
    width: imageWidth,
    height: imageWidth * 0.75,
    borderRadius: 8,
  },
  mediaCaption: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 20,
    minWidth: 60,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '400',
  },
  actionCountActive: {
    color: '#00A651',
  },
  actionSpacer: {
    flex: 1,
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  pinnedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '500',
  },
  commentsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailScreen;
