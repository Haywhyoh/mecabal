import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../constants';
import MessagingService, { Conversation, TypingStatus } from '../services/MessagingService';
import { webSocketService } from '../services/WebSocketService';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onArchive: () => void;
  onPin: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onArchive,
  onPin,
}) => {
  const getConversationTitle = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== 'current_user');
      return otherParticipant?.name || 'Unknown User';
    }
    return conversation.title || 'Group Chat';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== 'current_user');
      return otherParticipant?.avatar;
    }
    return conversation.metadata?.avatar;
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const message = conversation.lastMessage;
    const prefix = message.senderId === 'current_user' ? 'You: ' : 
                   message.senderId === 'system' ? '' : '';
    
    switch (message.type) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'location':
        return `${prefix}📍 Location`;
      case 'audio':
        return `${prefix}🎵 Audio`;
      case 'system':
        return message.content;
      default:
        return `${prefix}${message.content}`;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getOnlineParticipants = () => {
    return conversation.participants.filter(p => p.isOnline && p.id !== 'current_user').length;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.conversationItem,
        conversation.isPinned && styles.pinnedConversation
      ]}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(
          'Conversation Options',
          undefined,
          [
            {
              text: conversation.isPinned ? 'Unpin' : 'Pin',
              onPress: onPin,
            },
            {
              text: conversation.isArchived ? 'Unarchive' : 'Archive',
              onPress: onArchive,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {getConversationAvatar() ? (
          <View style={styles.avatarImage}>
            <Text style={styles.avatarPlaceholder}>
              {getConversationTitle().charAt(0)}
            </Text>
          </View>
        ) : (
          <View style={[
            styles.avatarImage,
            { backgroundColor: conversation.type === 'direct' ? colors.primary : colors.accent.neighborPurple }
          ]}>
            <MaterialCommunityIcons 
              name={conversation.type === 'direct' ? 'account' : 'account-group'}
              size={24} 
              color={colors.white} 
            />
          </View>
        )}
        
        {/* Online indicator for direct chats */}
        {conversation.type === 'direct' && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: conversation.participants.find(p => p.id !== 'current_user')?.isOnline 
              ? colors.accent.marketGreen : colors.neutral.gray }
          ]} />
        )}
        
        {/* Pinned indicator */}
        {conversation.isPinned && (
          <View style={styles.pinnedIndicator}>
            <MaterialCommunityIcons 
              name="pin" 
              size={12} 
              color={colors.accent.warmGold} 
            />
          </View>
        )}
      </View>

      {/* Conversation Info */}
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[
            styles.conversationTitle,
            conversation.unreadCount > 0 && styles.unreadTitle
          ]} numberOfLines={1}>
            {getConversationTitle()}
          </Text>
          
          <View style={styles.conversationMeta}>
            {conversation.type === 'group' && getOnlineParticipants() > 0 && (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>
                  {getOnlineParticipants()} online
                </Text>
              </View>
            )}
            
            {conversation.lastMessage && (
              <Text style={styles.timeText}>
                {formatTime(conversation.lastMessage.timestamp)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.conversationFooter}>
          <Text 
            style={[
              styles.lastMessageText,
              conversation.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>
          
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MessagingScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const messagingService = MessagingService.getInstance();

  // Load conversations from backend
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const conversationsData = await messagingService.getConversations({
        page: 1,
        limit: 50,
        isArchived: false,
      });
      setConversations(conversationsData);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations. Please try again.');
      // Fallback to cached conversations
      const cachedConversations = messagingService.getConversations();
      setConversations(Array.isArray(cachedConversations) ? cachedConversations : []);
    } finally {
      setLoading(false);
    }
  }, [messagingService]);

  useEffect(() => {
    // Load initial conversations
    loadConversations();

    // Subscribe to real-time updates
    const handleConversationUpdated = (conversation: Conversation) => {
      setConversations(prev => 
        prev.map(c => c.id === conversation.id ? conversation : c)
      );
    };

    const handleConversationCreated = (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
    };

    const handleConnectionStatus = (isConnected: boolean) => {
      setConnectionStatus(isConnected);
    };

    // WebSocket connection status
    const handleWebSocketConnect = () => {
      setConnectionStatus(true);
    };

    const handleWebSocketDisconnect = () => {
      setConnectionStatus(false);
    };

    // Subscribe to messaging service events
    messagingService.on('conversationUpdated', handleConversationUpdated);
    messagingService.on('conversationCreated', handleConversationCreated);
    messagingService.on('connected', handleConnectionStatus);
    messagingService.on('disconnected', handleConnectionStatus);

    // Subscribe to WebSocket events
    webSocketService.on('connect', handleWebSocketConnect);
    webSocketService.on('disconnect', handleWebSocketDisconnect);

    // Set initial connection status
    setConnectionStatus(messagingService.getConnectionStatus());

    return () => {
      messagingService.off('conversationUpdated', handleConversationUpdated);
      messagingService.off('conversationCreated', handleConversationCreated);
      messagingService.off('connected', handleConnectionStatus);
      messagingService.off('disconnected', handleConnectionStatus);
      webSocketService.off('connect', handleWebSocketConnect);
      webSocketService.off('disconnect', handleWebSocketDisconnect);
    };
  }, [loadConversations, messagingService]);

  // Refresh conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadConversations();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    console.log('Navigate to chat:', conversation.id);
    (navigation as any).navigate('Chat', {
      conversationId: conversation.id,
      conversationType: conversation.type,
      conversationTitle: conversation.type === 'direct'
        ? conversation.participants.find(p => p.id !== 'current_user')?.name
        : conversation.title,
    });
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await messagingService.archiveConversation(conversationId);
      // Update local state
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c)
      );
    } catch (err) {
      console.error('Failed to archive conversation:', err);
      Alert.alert('Error', 'Failed to archive conversation. Please try again.');
    }
  };

  const handlePinConversation = async (conversationId: string) => {
    try {
      await messagingService.pinConversation(conversationId);
      // Update local state
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c)
      );
    } catch (err) {
      console.error('Failed to pin conversation:', err);
      Alert.alert('Error', 'Failed to pin conversation. Please try again.');
    }
  };

  const handleNewChat = () => {
    Alert.alert(
      'New Chat',
      'Choose chat type',
      [
        {
          text: 'Direct Message',
          onPress: () => {
            // Navigate to neighbor selection screen
            (navigation as any).navigate('NeighborConnections', {
              mode: 'select',
              onSelect: async (userId: string) => {
                try {
                  // Create new conversation with selected user
                  const newConversation = await messagingService.createDirectConversation(userId, 'Neighbor');
                  (navigation as any).navigate('Chat', {
                    conversationId: newConversation.id,
                    conversationType: 'direct',
                    conversationTitle: 'Neighbor',
                  });
                } catch (err) {
                  console.error('Failed to create conversation:', err);
                  Alert.alert('Error', 'Failed to create conversation. Please try again.');
                }
              },
            });
          },
        },
        {
          text: 'Group Chat',
          onPress: () => {
            // Navigate to group creation screen (to be implemented)
            (navigation as any).navigate('CreateGroupChat');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getFilteredConversations = () => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conversation => {
      const title = conversation.type === 'direct' 
        ? conversation.participants.find(p => p.id !== 'current_user')?.name || ''
        : conversation.title || '';
      
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const filteredConversations = getFilteredConversations();
  const totalUnreadCount = conversations?.reduce((total, conv) => total + (conv.unreadCount || 0), 0) || 0;

  const EmptyState = () => (
    <View style={styles.emptyState}>
      {/* Large icon with subtle background */}
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons
          name="message-text-outline"
          size={80}
          color="#8E8E93"
        />
      </View>

      <Text style={styles.emptyTitle}>No Conversations Yet</Text>

      <Text style={styles.emptyMessage}>
        Connect with your neighbors and start building your community. Your conversations will appear here.
      </Text>

      <TouchableOpacity
        style={styles.startChatButton}
        onPress={handleNewChat}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="plus-circle"
          size={20}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.startChatButtonText}>Start a Conversation</Text>
      </TouchableOpacity>

      {/* Helper tips */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipItem}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#00A651" />
          <Text style={styles.tipText}>Connect with neighbors first</Text>
        </View>
        <View style={styles.tipItem}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#00A651" />
          <Text style={styles.tipText}>Verified users only</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color="#00A651" 
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Messages</Text>

          {totalUnreadCount > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNewChat}
          >
            <MaterialCommunityIcons
              name="square-edit-outline"
              size={24}
              color="#00A651"
            />
          </TouchableOpacity>
        </View>

        {/* Always-visible search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color="#8E8E93"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
            clearButtonMode="while-editing" // iOS only
          />
          {searchQuery.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#8E8E93"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Connection Status */}
      {!connectionStatus && (
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons 
            name="wifi-off" 
            size={16} 
            color={colors.white} 
          />
          <Text style={styles.connectionStatusText}>
            Reconnecting...
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={16} 
            color={colors.accent.safetyRed} 
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadConversations}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        /* Conversations List */
        <FlatList
          data={filteredConversations}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
              onArchive={() => handleArchiveConversation(item.id)}
              onPin={() => handlePinConversation(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={!loading ? EmptyState : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    color: colors.text.dark,
  },
  totalUnreadBadge: {
    backgroundColor: colors.accent.safetyRed,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  totalUnreadText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 0, // Remove default padding
  },
  connectionStatus: {
    backgroundColor: colors.accent.safetyRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  connectionStatusText: {
    fontSize: typography.sizes.sm,
    color: colors.white,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.safetyRed,
    fontWeight: '500',
    flex: 1,
  },
  retryText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    marginTop: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pinnedConversation: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.warmGold,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  pinnedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.dark,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  onlineBadge: {
    backgroundColor: colors.accent.marketGreen,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 8,
  },
  onlineText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '500',
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.gray,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text.dark,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  startChatButton: {
    flexDirection: 'row',
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startChatButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 40,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default MessagingScreen;