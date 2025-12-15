import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../services/postsService';
import { UserAvatar } from '../profile';
import { helpOfferService, type HelpOffer } from '../../services/helpOfferService';
import { useAuth } from '../../contexts/AuthContext';

interface HelpPostCardProps {
  post: Post;
  onPress: () => void;
  onReact: (reactionType: string) => void;
  onComment: () => void;
  onShare: () => void;
  onRespond?: () => void;
  showActions?: boolean;
}

const { width } = Dimensions.get('window');
const imageWidth = width - 64; // Account for marginHorizontal (16*2) + padding (16*2)

export const HelpPostCard: React.FC<HelpPostCardProps> = ({
  post,
  onPress,
  onReact,
  onComment,
  onShare,
  onRespond,
  showActions = true,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.engagement.userReaction === 'like');
  const [myOffer, setMyOffer] = useState<HelpOffer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);

  // Fetch user's offer for this post if it's a help post
  useEffect(() => {
    const fetchMyOffer = async () => {
      if (post.postType !== 'help' || !user?.id) return;
      
      try {
        setLoadingOffer(true);
        const offer = await helpOfferService.getMyOfferForPost(post.id);
        setMyOffer(offer);
      } catch (error) {
        console.error('Error fetching my offer:', error);
        setMyOffer(null);
      } finally {
        setLoadingOffer(false);
      }
    };

    fetchMyOffer();
  }, [post.id, post.postType, user?.id]);

  const getHelpIcon = () => {
    switch (post.helpCategory) {
      case 'errand': return 'bicycle';
      case 'task': return 'construct';
      case 'borrow': return 'sync';
      case 'recommendation': return 'star';
      case 'advice': return 'bulb';
      default: return 'help-circle';
    }
  };

  const getActionButtonText = () => {
    // If user has already applied, show status
    if (myOffer) {
      switch (myOffer.status) {
        case 'pending': return 'Applied';
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return 'Applied';
      }
    }
    
    // Default text based on category
    switch (post.helpCategory) {
      case 'errand': return 'I Can Help';
      case 'task': return 'I Can Do This';
      case 'borrow': return 'I Can Lend';
      case 'recommendation': return 'I Recommend';
      case 'advice': return 'Share Advice';
      default: return 'Respond';
    }
  };

  const getCategoryLabel = () => {
    switch (post.helpCategory) {
      case 'errand': return 'Quick Errand';
      case 'task': return 'Task';
      case 'borrow': return 'Borrow/Lend';
      case 'recommendation': return 'Recommendation';
      case 'advice': return 'Advice';
      default: return 'Help Request';
    }
  };

  const getCategoryColor = () => {
    switch (post.helpCategory) {
      case 'errand': return '#FF6B35';  // Orange
      case 'task': return '#9C27B0';    // Purple
      case 'borrow': return '#2196F3';  // Blue
      case 'recommendation': return '#FFC107';  // Yellow
      case 'advice': return '#00BCD4';  // Cyan
      default: return '#8E8E93';
    }
  };

  const getUrgencyColor = () => {
    switch (post.urgency) {
      case 'high': return '#E74C3C';
      case 'medium': return '#FFC107';
      case 'low': return '#00A651';
      default: return '#8E8E8E';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Overdue';
    if (diffInHours < 24) return `${diffInHours}h left`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d left`;
    return date.toLocaleDateString();
  };

  const handleReaction = () => {
    const newReaction = isLiked ? null : 'like';
    setIsLiked(!isLiked);
    onReact(newReaction || 'like');
  };

  const handleRespond = () => {
    // If user has already applied, navigate to detail screen to view their application
    if (myOffer) {
      onPress(); // Navigate to detail screen
    } else if (onRespond) {
      onRespond(); // Navigate to OfferHelpScreen
    } else {
      // Default action - navigate to comments or contact
      onComment();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Author Info */}
      <View style={styles.header}>
        <UserAvatar 
          user={post.author as any} 
          size="medium" 
          showBadge={post.author.isVerified}
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3498db" />
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimeAgo(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Help Details */}
      <View style={styles.detailsRow}>
        {post.budget && (
          <View style={styles.detail}>
            <Ionicons name="cash-outline" size={16} color="#00A651" />
            <Text style={styles.detailText}>{post.budget}</Text>
          </View>
        )}
        {post.deadline && (
          <View style={styles.detail}>
            <Ionicons name="time-outline" size={16} color="#FF6B35" />
            <Text style={styles.detailText}>
              {formatDeadline(post.deadline)}
            </Text>
          </View>
        )}
        {post.urgency && (
          <View style={styles.detail}>
            <Ionicons name="alert-circle-outline" size={16} color={getUrgencyColor()} />
            <Text style={[styles.detailText, { color: getUrgencyColor() }]}>
              {post.urgency.toUpperCase()}
            </Text>
          </View>
        )}
        {/* Help Type Badge */}
        <View style={[styles.helpBadge, { backgroundColor: getCategoryColor() + '20' }]}>
          <Ionicons
            name={getHelpIcon() as any}
            size={14}
            color={getCategoryColor()}
          />
          <Text style={[styles.helpType, { color: getCategoryColor() }]}>
            {getCategoryLabel().toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media.map((media, index) => (
            <View key={media.id} style={styles.mediaItem}>
              {media.type === 'image' ? (
                <Image
                  source={{ uri: media.url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={40} color="#8E8E8E" />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Engagement Actions */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleReaction}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#E74C3C" : "#8E8E8E"}
            />
            <Text style={styles.actionCount}>{post.engagement.reactionsCount}</Text>
          </TouchableOpacity>

          {/* Hide comment button for help posts - help offers replace comments */}
          {post.postType !== 'help' && (
            <TouchableOpacity style={styles.actionButton} onPress={onComment}>
              <Ionicons name="chatbubble-outline" size={20} color="#8E8E8E" />
              <Text style={styles.actionCount}>{post.engagement.commentsCount}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={20} color="#8E8E8E" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.respondButton,
              myOffer && styles.respondButtonApplied,
              myOffer?.status === 'accepted' && styles.respondButtonAccepted,
              myOffer?.status === 'rejected' && styles.respondButtonRejected,
            ]} 
            onPress={handleRespond}
          >
            <Ionicons 
              name={myOffer ? (myOffer.status === 'accepted' ? "checkmark-circle" : "checkmark-outline") : "hand-right-outline"} 
              size={16} 
              color={myOffer ? (myOffer.status === 'accepted' ? "#FFFFFF" : "#FFFFFF") : "#FFFFFF"} 
            />
            <Text style={styles.respondText}>{getActionButtonText()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  helpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  helpType: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: '#2C2C2C',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#2C2C2C',
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mediaItem: {
    marginRight: 8,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A651',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  respondButtonApplied: {
    backgroundColor: '#6C757D',
  },
  respondButtonAccepted: {
    backgroundColor: '#00A651',
  },
  respondButtonRejected: {
    backgroundColor: '#DC3545',
  },
  respondText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default HelpPostCard;
