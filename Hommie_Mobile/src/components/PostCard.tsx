import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../services/postsService';
import UserAvatar from './UserAvatar';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onReaction?: (postId: string, reactionType: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (post: Post) => void;
  onReport?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
}

const { width } = Dimensions.get('window');
const imageWidth = width - 32; // Account for padding

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onReaction,
  onComment,
  onShare,
  onReport,
  onEdit,
  onDelete,
  showActions = true,
  isOwner = false,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

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

  const getPrivacyIcon = (level: string) => {
    const icons = {
      neighborhood: 'people-outline',
      group: 'people-circle-outline',
      public: 'globe-outline',
    };
    return icons[level as keyof typeof icons] || 'people-outline';
  };

  const handleReaction = (reactionType: string) => {
    setIsLiked(!isLiked);
    onReaction?.(post.id, reactionType);
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `${post.title ? `${post.title}\n\n` : ''}${post.content}`,
        url: `https://mecabal.com/posts/${post.id}`,
      };
      
      await Share.share(shareContent);
      onShare?.(post);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => onReport?.(post.id) },
      ]
    );
  };

  const handleEdit = () => {
    onEdit?.(post);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(post.id) },
      ]
    );
  };

  const shouldTruncateContent = post.content.length > 200;
  const displayContent = shouldTruncateContent && !showFullContent
    ? post.content.substring(0, 200) + '...'
    : post.content;

  return (
    <TouchableOpacity
      style={[styles.container, post.isPinned && styles.pinnedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <UserAvatar
            user={{
              id: post.author.id,
              firstName: post.author.firstName,
              lastName: post.author.lastName,
              profilePicture: post.author.profilePicture,
              isVerified: post.author.isVerified,
            }}
            size={40}
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

        {/* Post Actions Menu */}
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#7f8c8d" />
        </TouchableOpacity>
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
        <Text style={styles.content}>{displayContent}</Text>
        {shouldTruncateContent && (
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => setShowFullContent(!showFullContent)}
          >
            <Text style={styles.readMoreText}>
              {showFullContent ? 'Show less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        )}
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
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                  <Text style={styles.videoText}>Video</Text>
                </View>
              )}
              {media.caption && (
                <Text style={styles.mediaCaption}>{media.caption}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Engagement Stats */}
      <View style={styles.engagementContainer}>
        <Text style={styles.engagementText}>
          {post.engagement.reactionsCount} reactions • {post.engagement.commentsCount} comments
        </Text>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction('like')}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#e74c3c' : '#7f8c8d'}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment?.(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#7f8c8d" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#7f8c8d" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={20} color="#7f8c8d" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Pinned Indicator */}
      {post.isPinned && (
        <View style={styles.pinnedIndicator}>
          <Ionicons name="pin" size={16} color="#f39c12" />
          <Text style={styles.pinnedText}>Pinned Post</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinnedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    flex: 1,
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
    color: '#2c3e50',
    marginRight: 4,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#7f8c8d',
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
  menuButton: {
    padding: 4,
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
    fontSize: 18,
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
    color: '#2c3e50',
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
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
  videoPlaceholder: {
    width: imageWidth,
    height: imageWidth * 0.75,
    borderRadius: 8,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  mediaCaption: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  engagementContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  engagementText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#e74c3c',
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
});

export default PostCard;
