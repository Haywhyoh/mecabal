import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../../constants';
import MessagingService, { Message, Conversation, TypingStatus } from '../../services/MessagingService';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showSender: boolean;
  onLongPress: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showSender,
  onLongPress,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMessageStatusIcon = () => {
    if (!isCurrentUser) return null;
    
    switch (message.status) {
      case 'sending':
        return <MaterialCommunityIcons name="clock-outline" size={12} color={colors.neutral.friendlyGray} />;
      case 'sent':
        return <MaterialCommunityIcons name="check" size={12} color={colors.neutral.friendlyGray} />;
      case 'delivered':
        return <MaterialCommunityIcons name="check-all" size={12} color={colors.neutral.friendlyGray} />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={12} color={colors.primary.main} />;
      case 'failed':
        return <MaterialCommunityIcons name="alert-circle" size={12} color={colors.accent.safetyRed} />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <View style={styles.mediaMessage}>
            <MaterialCommunityIcons name="image" size={24} color={colors.neutral.friendlyGray} />
            <Text style={[styles.mediaText, { color: isCurrentUser ? colors.neutral.pureWhite : colors.neutral.richCharcoal }]}>
              Photo
            </Text>
          </View>
        );
      case 'location':
        return (
          <View style={styles.mediaMessage}>
            <MaterialCommunityIcons name="map-marker" size={24} color={colors.neutral.friendlyGray} />
            <Text style={[styles.mediaText, { color: isCurrentUser ? colors.neutral.pureWhite : colors.neutral.richCharcoal }]}>
              Location
            </Text>
          </View>
        );
      case 'audio':
        return (
          <View style={styles.mediaMessage}>
            <MaterialCommunityIcons name="play-circle" size={24} color={colors.neutral.friendlyGray} />
            <Text style={[styles.mediaText, { color: isCurrentUser ? colors.neutral.pureWhite : colors.neutral.richCharcoal }]}>
              {message.metadata?.audioDuration ? `Voice message (${Math.ceil(message.metadata.audioDuration)}s)` : 'Voice message'}
            </Text>
          </View>
        );
      case 'system':
        return (
          <Text style={styles.systemMessageText}>
            {message.content}
          </Text>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            { color: isCurrentUser ? colors.neutral.pureWhite : colors.neutral.richCharcoal }
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageBubble}>
          {renderMessageContent()}
          <Text style={styles.systemMessageTime}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {/* Sender name for group chats */}
      {showSender && !isCurrentUser && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}
        onLongPress={onLongPress}
      >
        {/* Reply indicator */}
        {message.replyTo && (
          <View style={styles.replyIndicator}>
            <MaterialCommunityIcons name="reply" size={12} color={colors.neutral.friendlyGray} />
            <Text style={styles.replyText}>Replying to message</Text>
          </View>
        )}
        
        {renderMessageContent()}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            { color: isCurrentUser ? colors.neutral.pureWhite : colors.neutral.friendlyGray }
          ]}>
            {formatTime(message.timestamp)}
            {message.edited && ' • edited'}
          </Text>
          
          {getMessageStatusIcon()}
        </View>
      </TouchableOpacity>
    </View>
  );
};

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>{getTypingText()}</Text>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
    </View>
  );
};

interface ChatScreenProps {
  route: {
    params: {
      conversationId: string;
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const messagingService = MessagingService.getInstance();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load conversation and messages
    const conv = messagingService.getConversation(conversationId);
    if (conv) {
      setConversation(conv);
      setMessages(messagingService.getMessages(conversationId));
      
      // Mark as read
      messagingService.markAsRead(conversationId);
      
      // Set navigation title
      const title = conv.type === 'direct' 
        ? conv.participants.find(p => p.id !== 'current_user')?.name || 'Chat'
        : conv.title || 'Group Chat';
      navigation.setOptions({ title });
    }

    // Subscribe to message updates
    const handleMessageAdded = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleMessageEdited = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
      }
    };

    const handleMessageDeleted = (messageId: string, convId: string) => {
      if (convId === conversationId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    };

    const handleTypingChanged = (convId: string, users: TypingStatus[]) => {
      if (convId === conversationId) {
        setTypingUsers(users.filter(u => u.userId !== 'current_user'));
      }
    };

    messagingService.on('messageAdded', handleMessageAdded);
    messagingService.on('messageEdited', handleMessageEdited);
    messagingService.on('messageDeleted', handleMessageDeleted);
    messagingService.on('typingStatusChanged', handleTypingChanged);

    return () => {
      messagingService.off('messageAdded', handleMessageAdded);
      messagingService.off('messageEdited', handleMessageEdited);
      messagingService.off('messageDeleted', handleMessageDeleted);
      messagingService.off('typingStatusChanged', handleTypingChanged);
      
      // Stop typing on unmount
      if (isTyping) {
        messagingService.stopTyping(conversationId);
      }
    };
  }, [conversationId, navigation, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageContent = inputText.trim();
    setInputText('');
    setReplyingTo(null);
    
    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      messagingService.stopTyping(conversationId);
    }

    try {
      await messagingService.sendMessage(
        conversationId,
        messageContent,
        'text',
        replyingTo ? { replyTo: replyingTo.id } : undefined
      );
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      messagingService.startTyping(conversationId);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      messagingService.stopTyping(conversationId);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        messagingService.stopTyping(conversationId);
      }
    }, 2000);
  };

  const handleMessageLongPress = (message: Message) => {
    const isCurrentUser = message.senderId === 'current_user';
    
    const options = [
      'Reply',
      ...(isCurrentUser ? ['Edit', 'Delete'] : []),
      'Cancel',
    ];
    
    const destructiveButtonIndex = isCurrentUser ? 2 : undefined;
    const cancelButtonIndex = options.length - 1;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          handleMessageAction(buttonIndex, message);
        }
      );
    } else {
      // Android Alert implementation
      const buttons = options.slice(0, -1).map((option, index) => ({
        text: option,
        onPress: () => handleMessageAction(index, message),
        style: index === destructiveButtonIndex ? 'destructive' : 'default',
      }));
      
      buttons.push({
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {},
      });
      
      Alert.alert('Message Options', undefined, buttons);
    }
  };

  const handleMessageAction = (actionIndex: number, message: Message) => {
    switch (actionIndex) {
      case 0: // Reply
        setReplyingTo(message);
        break;
      case 1: // Edit (for current user messages)
        if (message.senderId === 'current_user') {
          Alert.prompt(
            'Edit Message',
            'Enter new message:',
            (text) => {
              if (text && text.trim()) {
                messagingService.editMessage(message.id, text.trim());
              }
            },
            'plain-text',
            message.content
          );
        }
        break;
      case 2: // Delete (for current user messages)
        if (message.senderId === 'current_user') {
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => messagingService.deleteMessage(message.id),
              },
            ]
          );
        }
        break;
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      'Attachment',
      'Choose attachment type',
      [
        {
          text: 'Photo',
          onPress: () => {
            // Simulate sending a photo
            messagingService.sendMessage(conversationId, 'Photo', 'image', {
              imageUrl: 'https://example.com/photo.jpg',
              imageWidth: 800,
              imageHeight: 600,
            });
          },
        },
        {
          text: 'Location',
          onPress: () => {
            // Simulate sending location
            messagingService.sendMessage(conversationId, 'Current location', 'location', {
              location: {
                latitude: 6.5244,
                longitude: 3.3792,
                address: 'Lagos, Nigeria',
              },
            });
          },
        },
        {
          text: 'Voice Message',
          onPress: () => {
            // Simulate sending voice message
            messagingService.sendMessage(conversationId, 'Voice message', 'audio', {
              audioUrl: 'https://example.com/audio.m4a',
              audioDuration: 15,
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const shouldShowSender = (message: Message, previousMessage?: Message) => {
    if (!conversation || conversation.type === 'direct') return false;
    if (message.type === 'system') return false;
    if (!previousMessage) return true;
    return previousMessage.senderId !== message.senderId;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const showSender = shouldShowSender(item, previousMessage);
    
    return (
      <MessageBubble
        message={item}
        isCurrentUser={item.senderId === 'current_user'}
        showSender={showSender}
        onLongPress={() => handleMessageLongPress(item)}
      />
    );
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        
        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyingTo.senderName}</Text>
              <Text style={styles.replyMessage} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.neutral.friendlyGray} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachmentButton} onPress={handleAttachmentPress}>
            <MaterialCommunityIcons name="plus" size={24} color={colors.primary.main} />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Type a message..."
              placeholderTextColor={colors.neutral.friendlyGray}
              multiline
              maxLength={1000}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={20} 
              color={inputText.trim() ? colors.neutral.pureWhite : colors.neutral.friendlyGray} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.warmOffWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: colors.neutral.pureWhite,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.deepBlack,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemMessageBubble: {
    backgroundColor: colors.neutral.softGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  systemMessageText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    opacity: 0.7,
    gap: spacing.xs,
  },
  replyText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
  },
  messageText: {
    fontSize: typography.sizes.base,
    lineHeight: 20,
  },
  mediaMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mediaText: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  messageTime: {
    fontSize: typography.sizes.xs,
    opacity: 0.7,
  },
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral.deepBlack,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  typingText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.friendlyGray,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.softGray,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary.main,
    fontWeight: '600',
  },
  replyMessage: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.neutral.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.softGray,
    gap: spacing.sm,
  },
  attachmentButton: {
    padding: spacing.sm,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: colors.neutral.softGray,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },
  textInput: {
    fontSize: typography.sizes.base,
    color: colors.neutral.richCharcoal,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary.main,
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral.softGray,
  },
});

export default ChatScreen;