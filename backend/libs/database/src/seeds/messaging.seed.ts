import { DataSource } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message } from '../entities/message.entity';
import { MessageReceipt } from '../entities/message-receipt.entity';
import { TypingIndicator } from '../entities/typing-indicator.entity';
import { User } from '../entities/user.entity';

export class MessagingSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    console.log('🌱 Seeding messaging data...');

    try {
      // Get some sample users
      const userRepository = this.dataSource.getRepository(User);
      const users = await userRepository.find({ take: 5 });
      
      if (users.length < 2) {
        console.log('⚠️  Not enough users found. Please seed users first.');
        return;
      }

      const [user1, user2, user3, user4, user5] = users;

      // Create sample conversations
      const conversationRepository = this.dataSource.getRepository(Conversation);
      const participantRepository = this.dataSource.getRepository(ConversationParticipant);
      const messageRepository = this.dataSource.getRepository(Message);
      const receiptRepository = this.dataSource.getRepository(MessageReceipt);

      // 1. Direct conversation between user1 and user2
      const directConversation = await conversationRepository.save({
        type: 'direct',
        title: null,
        description: null,
        contextType: 'general',
        contextId: null,
        isArchived: false,
        isPinned: false,
        createdBy: user1.id,
      });

      // Add participants
      await participantRepository.save([
        {
          conversationId: directConversation.id,
          userId: user1.id,
          role: 'admin',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: directConversation.id,
          userId: user2.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 2,
        },
      ]);

      // Add sample messages
      const message1 = await messageRepository.save({
        conversationId: directConversation.id,
        senderId: user1.id,
        content: 'Hey! How are you doing?',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      const message2 = await messageRepository.save({
        conversationId: directConversation.id,
        senderId: user2.id,
        content: 'Hi! I\'m doing great, thanks for asking. How about you?',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      const message3 = await messageRepository.save({
        conversationId: directConversation.id,
        senderId: user1.id,
        content: 'I\'m doing well too! Just working on some new features for the app.',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      // Add message receipts
      await receiptRepository.save([
        {
          messageId: message1.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: message1.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: message2.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: message2.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: message3.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: message3.id,
          userId: user2.id,
          status: 'delivered',
        },
      ]);

      // Update conversation with last message
      await conversationRepository.update(directConversation.id, {
        lastMessageAt: message3.createdAt,
      });

      // 2. Group conversation
      const groupConversation = await conversationRepository.save({
        type: 'group',
        title: 'Estate Security Group',
        description: 'For estate security matters and updates',
        contextType: 'general',
        contextId: null,
        isArchived: false,
        isPinned: true,
        createdBy: user1.id,
      });

      // Add participants
      await participantRepository.save([
        {
          conversationId: groupConversation.id,
          userId: user1.id,
          role: 'admin',
          isMuted: false,
          isPinned: true,
          unreadCount: 0,
        },
        {
          conversationId: groupConversation.id,
          userId: user2.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 1,
        },
        {
          conversationId: groupConversation.id,
          userId: user3.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 1,
        },
      ]);

      // Add group messages
      const groupMessage1 = await messageRepository.save({
        conversationId: groupConversation.id,
        senderId: user1.id,
        content: 'Good evening everyone. Just to inform you that we will be conducting security patrols tonight from 10 PM to 6 AM.',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      const groupMessage2 = await messageRepository.save({
        conversationId: groupConversation.id,
        senderId: user2.id,
        content: 'Thank you for the update. Any specific areas you\'ll be focusing on?',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      // Add group message receipts
      await receiptRepository.save([
        {
          messageId: groupMessage1.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: groupMessage1.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: groupMessage1.id,
          userId: user3.id,
          status: 'delivered',
        },
        {
          messageId: groupMessage2.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: groupMessage2.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: groupMessage2.id,
          userId: user3.id,
          status: 'delivered',
        },
      ]);

      // Update group conversation with last message
      await conversationRepository.update(groupConversation.id, {
        lastMessageAt: groupMessage2.createdAt,
      });

      // 3. Community conversation
      const communityConversation = await conversationRepository.save({
        type: 'community',
        title: 'Ikeja GRA Community',
        description: 'Official Ikeja GRA community discussions',
        contextType: 'general',
        contextId: null,
        isArchived: false,
        isPinned: false,
        createdBy: user1.id,
      });

      // Add participants
      await participantRepository.save([
        {
          conversationId: communityConversation.id,
          userId: user1.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: communityConversation.id,
          userId: user2.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: communityConversation.id,
          userId: user3.id,
          role: 'admin',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: communityConversation.id,
          userId: user4.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: communityConversation.id,
          userId: user5.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
      ]);

      // Add community messages
      const communityMessage1 = await messageRepository.save({
        conversationId: communityConversation.id,
        senderId: user3.id,
        content: 'Reminder: Community meeting tomorrow at 4 PM in the community center. We\'ll be discussing the new waste management system.',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      const communityMessage2 = await messageRepository.save({
        conversationId: communityConversation.id,
        senderId: user1.id,
        content: 'Looking forward to the meeting! I have some suggestions about the waste collection schedule.',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      // Add community message receipts
      await receiptRepository.save([
        {
          messageId: communityMessage1.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: communityMessage1.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: communityMessage1.id,
          userId: user3.id,
          status: 'read',
        },
        {
          messageId: communityMessage1.id,
          userId: user4.id,
          status: 'read',
        },
        {
          messageId: communityMessage1.id,
          userId: user5.id,
          status: 'read',
        },
        {
          messageId: communityMessage2.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: communityMessage2.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: communityMessage2.id,
          userId: user3.id,
          status: 'read',
        },
        {
          messageId: communityMessage2.id,
          userId: user4.id,
          status: 'read',
        },
        {
          messageId: communityMessage2.id,
          userId: user5.id,
          status: 'read',
        },
      ]);

      // Update community conversation with last message
      await conversationRepository.update(communityConversation.id, {
        lastMessageAt: communityMessage2.createdAt,
      });

      // 4. Event conversation
      const eventConversation = await conversationRepository.save({
        type: 'group',
        title: 'Lagos Tech Meetup 2024',
        description: 'Chat for Lagos Tech Meetup 2024 event participants',
        contextType: 'event',
        contextId: 'event-123', // This would be a real event ID
        isArchived: false,
        isPinned: false,
        createdBy: user1.id,
      });

      // Add event participants
      await participantRepository.save([
        {
          conversationId: eventConversation.id,
          userId: user1.id,
          role: 'admin',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: eventConversation.id,
          userId: user2.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: eventConversation.id,
          userId: user3.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
      ]);

      // Add event messages
      const eventMessage1 = await messageRepository.save({
        conversationId: eventConversation.id,
        senderId: user1.id,
        content: 'Welcome to the Lagos Tech Meetup 2024 chat! Looking forward to seeing everyone tomorrow.',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      // Add event message receipts
      await receiptRepository.save([
        {
          messageId: eventMessage1.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: eventMessage1.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: eventMessage1.id,
          userId: user3.id,
          status: 'read',
        },
      ]);

      // Update event conversation with last message
      await conversationRepository.update(eventConversation.id, {
        lastMessageAt: eventMessage1.createdAt,
      });

      // 5. Business conversation
      const businessConversation = await conversationRepository.save({
        type: 'direct',
        title: 'Business Inquiry - ABC Plumbing Services',
        description: 'Inquiry for ABC Plumbing Services',
        contextType: 'business',
        contextId: 'business-456', // This would be a real business ID
        isArchived: false,
        isPinned: false,
        createdBy: user1.id,
      });

      // Add business participants
      await participantRepository.save([
        {
          conversationId: businessConversation.id,
          userId: user1.id,
          role: 'member',
          isMuted: false,
          isPinned: false,
          unreadCount: 0,
        },
        {
          conversationId: businessConversation.id,
          userId: user2.id,
          role: 'admin', // Business owner
          isMuted: false,
          isPinned: false,
          unreadCount: 1,
        },
      ]);

      // Add business messages
      const businessMessage1 = await messageRepository.save({
        conversationId: businessConversation.id,
        senderId: user1.id,
        content: 'Hi! I need help with a leaking pipe in my kitchen. Are you available this weekend?',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      const businessMessage2 = await messageRepository.save({
        conversationId: businessConversation.id,
        senderId: user2.id,
        content: 'Hello! Yes, I\'m available this weekend. Can you send me a photo of the leak so I can assess the issue?',
        type: 'text',
        metadata: null,
        isEdited: false,
        isDeleted: false,
      });

      // Add business message receipts
      await receiptRepository.save([
        {
          messageId: businessMessage1.id,
          userId: user1.id,
          status: 'read',
        },
        {
          messageId: businessMessage1.id,
          userId: user2.id,
          status: 'read',
        },
        {
          messageId: businessMessage2.id,
          userId: user1.id,
          status: 'delivered',
        },
        {
          messageId: businessMessage2.id,
          userId: user2.id,
          status: 'read',
        },
      ]);

      // Update business conversation with last message
      await conversationRepository.update(businessConversation.id, {
        lastMessageAt: businessMessage2.createdAt,
      });

      console.log('✅ Messaging data seeded successfully!');
      console.log(`   - Created ${await conversationRepository.count()} conversations`);
      console.log(`   - Created ${await participantRepository.count()} participants`);
      console.log(`   - Created ${await messageRepository.count()} messages`);
      console.log(`   - Created ${await receiptRepository.count()} message receipts`);

    } catch (error) {
      console.error('❌ Error seeding messaging data:', error);
      throw error;
    }
  }
}
