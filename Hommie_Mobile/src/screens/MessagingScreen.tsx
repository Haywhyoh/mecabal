import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../constants';
import MessagingService, { Conversation, TypingStatus } from '../services/MessagingService';

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
              color={colors.neutral.pureWhite} 
            />
          </View>
        )}
        
        {/* Online indicator for direct chats */}
        {conversation.type === 'direct' && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: conversation.participants.find(p => p.id !== 'current_user')?.isOnline 
              ? colors.accent.marketGreen : colors.neutral.friendlyGray }
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const navigation = useNavigation();
  const messagingService = MessagingService.getInstance();

  useEffect(() => {
    // Load initial conversations
    setConversations(messagingService.getConversations());

    // Subscribe to updates
    const handleConversationUpdated = (conversation: Conversation) => {
      setConversations(prev => 
        prev.map(c => c.id === conversation.id ? conversation : c)
      );
    };

    const handleConversationCreated = (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
    };

    messagingService.on('conversationUpdated', handleConversationUpdated);
    messagingService.on('conversationCreated', handleConversationCreated);

    return () => {
      messagingService.off('conversationUpdated', handleConversationUpdated);
      messagingService.off('conversationCreated', handleConversationCreated);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setConversations(messagingService.getConversations());
      setRefreshing(false);
    }, 1000);
  };

  const handleConversationPress = (conversation: Conversation) => {
    console.log('Navigate to chat:', conversation.id);
    // This would navigate to the ChatScreen with the conversation ID
  };

  const handleArchiveConversation = async (conversationId: string) => {
    await messagingService.archiveConversation(conversationId);
    setConversations(messagingService.getConversations());
  };

  const handlePinConversation = async (conversationId: string) => {
    await messagingService.pinConversation(conversationId);
    setConversations(messagingService.getConversations());
  };

  const handleNewChat = () => {
    Alert.alert(
      'New Chat',
      'Choose chat type',
      [
        {
          text: 'Direct Message',
          onPress: () => console.log('Create direct message'),
        },
        {
          text: 'Group Chat',
          onPress: () => console.log('Create group chat'),
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
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="message-text-outline" 
        size={64} 
        color={colors.neutral.friendlyGray} 
      />
      <Text style={styles.emptyTitle}>No Conversations</Text>
      <Text style={styles.emptyMessage}>
        Start connecting with your neighbors! Tap the + button to begin a new conversation.
      </Text>
      <TouchableOpacity style={styles.startChatButton} onPress={handleNewChat}>
        <Text style={styles.startChatButtonText}>Start Your First Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={colors.primary} 
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
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsSearching(!isSearching)}
          >
            <MaterialCommunityIcons 
              name={isSearching ? 'close' : 'magnify'} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleNewChat}>
            <MaterialCommunityIcons 
              name="plus" 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {isSearching && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={colors.neutral.friendlyGray} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              placeholderTextColor={colors.neutral.friendlyGray}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons 
                  name="close-circle" 
                  size={20} 
                  color={colors.neutral.friendlyGray} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Connection Status */}
      {!messagingService.getConnectionStatus() && (
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons 
            name="wifi-off" 
            size={16} 
            color={colors.neutral.pureWhite} 
          />
          <Text style={styles.connectionStatusText}>
            Reconnecting...
          </Text>
        </View>
      )}

      {/* Conversations List */}
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
        ListEmptyComponent={EmptyState}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.warmOffWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    color: colors.neutral.richCharcoal,
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
    color: colors.neutral.pureWhite,
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
    backgroundColor: colors.neutral.pureWhite,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.softGray,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.neutral.richCharcoal,
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
    color: colors.neutral.pureWhite,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.pureWhite,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.deepBlack,
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
    backgroundColor: colors.neutral.friendlyGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.neutral.pureWhite,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.pureWhite,
  },
  pinnedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.neutral.pureWhite,
    borderRadius: 8,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.deepBlack,
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
    color: colors.neutral.richCharcoal,
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
    color: colors.neutral.pureWhite,
    fontWeight: '500',
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
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
    color: colors.neutral.pureWhite,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.sizes.base,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  startChatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
  },
  startChatButtonText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.pureWhite,
    fontWeight: '600',
  },
});

export default MessagingScreen;