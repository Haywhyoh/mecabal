import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../constants';
import { ScreenHeader } from '../components/ScreenHeader';

interface Message {
  id: string;
  senderName: string;
  senderAvatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  type: 'message' | 'notification';
}

interface InboxScreenProps {
  navigation?: any;
}

const InboxScreen: React.FC<InboxScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with real data
  const [messages] = useState<Message[]>([
    {
      id: '1',
      senderName: 'Adebayo Ogundimu',
      lastMessage: 'Thanks for the plumber recommendation!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 0,
      isGroup: false,
      type: 'message',
    },
    {
      id: '2',
      senderName: 'Victoria Island Estate Group',
      lastMessage: 'Security meeting tomorrow at 6pm',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 3,
      isGroup: true,
      groupName: 'Estate Security',
      type: 'message',
    },
    {
      id: '3',
      senderName: 'MeCabal',
      lastMessage: 'New safety alert in your area',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      unreadCount: 1,
      isGroup: false,
      type: 'notification',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const filteredMessages = messages.filter(message => 
    activeTab === 'messages' ? message.type === 'message' : message.type === 'notification'
  );

  const MessageItem: React.FC<{ message: Message }> = ({ message }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => {
        if (message.type === 'message') {
          navigation?.navigate('Chat', { 
            contactId: message.id,
            contactName: message.senderName,
            isGroup: message.isGroup,
          });
        } else {
          navigation?.navigate('Notifications');
        }
      }}
    >
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          { backgroundColor: message.isGroup ? colors.accent.neighborPurple : colors.primary }
        ]}>
          <MaterialCommunityIcons
            name={message.isGroup ? 'account-group' : 'account'}
            size={24}
            color={colors.neutral.pureWhite}
          />
        </View>
        {message.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{message.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[
            styles.senderName,
            message.unreadCount > 0 && styles.unreadSenderName
          ]}>
            {message.isGroup ? message.groupName : message.senderName}
          </Text>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </View>
        
        <Text style={[
          styles.lastMessage,
          message.unreadCount > 0 && styles.unreadLastMessage
        ]} numberOfLines={2}>
          {message.lastMessage}
        </Text>
      </View>
      
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.neutral.friendlyGray}
      />
    </TouchableOpacity>
  );

  const TabButton: React.FC<{ 
    tab: 'messages' | 'notifications', 
    label: string, 
    icon: string,
    count?: number 
  }> = ({ tab, label, icon, count }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={activeTab === tab ? colors.primary : colors.neutral.friendlyGray}
      />
      <Text style={[
        styles.tabLabel,
        activeTab === tab && styles.activeTabLabel
      ]}>
        {label}
        {count && count > 0 && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name={activeTab === 'messages' ? 'message-outline' : 'bell-outline'}
        size={64}
        color={colors.neutral.friendlyGray}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'messages' ? 'No Messages Yet' : 'No Notifications'}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTab === 'messages' 
          ? "Start connecting with your neighbors! Your conversations will appear here."
          : "You're all caught up! Important updates will appear here."
        }
      </Text>
    </View>
  );

  const unreadMessages = messages.filter(m => m.unreadCount > 0 && m.type === 'message').length;
  const unreadNotifications = messages.filter(m => m.unreadCount > 0 && m.type === 'notification').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Inbox" />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton 
          tab="messages" 
          label="Messages" 
          icon="message-text"
          count={unreadMessages}
        />
        <TabButton 
          tab="notifications" 
          label="Alerts" 
          icon="bell"
          count={unreadNotifications}
        />
      </View>
      
      {/* Messages List */}
      <FlatList
        data={filteredMessages}
        renderItem={({ item }) => <MessageItem message={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredMessages.length === 0 && styles.emptyListContent
        ]}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    shadowColor: colors.neutral.deepBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accent.safetyRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: colors.neutral.pureWhite,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  senderName: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.neutral.richCharcoal,
    flex: 1,
  },
  unreadSenderName: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    marginLeft: spacing.sm,
  },
  lastMessage: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    lineHeight: 18,
  },
  unreadLastMessage: {
    fontWeight: '500',
    color: colors.neutral.richCharcoal,
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
  },
});

export default InboxScreen;