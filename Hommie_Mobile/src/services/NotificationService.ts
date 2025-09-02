import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export interface NotificationData {
  id: string;
  type: 'event' | 'message' | 'community' | 'safety' | 'marketplace' | 'system';
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionRequired?: boolean;
  imageUrl?: string;
  userId?: string;
  communityId?: string;
}

export interface MessageNotification extends NotificationData {
  type: 'message';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  conversationId: string;
  messagePreview: string;
}

export interface EventNotification extends NotificationData {
  type: 'event';
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  action: 'invitation' | 'reminder' | 'update' | 'cancellation';
}

export interface CommunityNotification extends NotificationData {
  type: 'community';
  action: 'newPost' | 'endorsement' | 'mention' | 'neighborJoined';
  fromUserId?: string;
  fromUserName?: string;
  postId?: string;
}

export interface SafetyNotification extends NotificationData {
  type: 'safety';
  alertLevel: 'info' | 'warning' | 'emergency';
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  reportId?: string;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;
    const priority = data?.priority || 'normal';
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: priority === 'urgent' || priority === 'high',
      shouldSetBadge: true,
    };
  },
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notifications: NotificationData[] = [];
  private listeners: Set<(notifications: NotificationData[]) => void> = new Set();

  private constructor() {
    this.initializeNotifications();
    this.loadDemoNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeNotifications() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      console.log('Expo Push Token:', this.expoPushToken);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00A651',
        });

        // Create specific channels for different notification types
        await this.createNotificationChannels();
      }

      // Listen for notifications
      this.setupNotificationListeners();

    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async createNotificationChannels() {
    const channels = [
      {
        id: 'messages',
        name: 'Messages',
        description: 'New messages from neighbors',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00A651',
        sound: true,
      },
      {
        id: 'events',
        name: 'Events',
        description: 'Event invitations and reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF6B35',
      },
      {
        id: 'safety',
        name: 'Safety Alerts',
        description: 'Emergency and safety notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#E74C3C',
        sound: true,
      },
      {
        id: 'community',
        name: 'Community Updates',
        description: 'Community posts and neighbor activity',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#7B68EE',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }
  }

  private setupNotificationListeners() {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationTapped(response);
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification) {
    const { title, body, data } = notification.request.content;
    
    const notificationData: NotificationData = {
      id: notification.request.identifier,
      type: data?.type || 'system',
      title: title || 'New Notification',
      body: body || '',
      data: data || {},
      timestamp: new Date(),
      read: false,
      priority: data?.priority || 'normal',
      actionRequired: data?.actionRequired || false,
      imageUrl: data?.imageUrl,
      userId: data?.userId,
      communityId: data?.communityId,
    };

    this.addNotification(notificationData);
  }

  private handleNotificationTapped(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // Handle navigation based on notification type
    switch (data?.type) {
      case 'message':
        // Navigate to conversation
        console.log('Navigate to conversation:', data.conversationId);
        break;
      case 'event':
        // Navigate to event details
        console.log('Navigate to event:', data.eventId);
        break;
      case 'safety':
        // Navigate to safety center
        console.log('Navigate to safety alert:', data.reportId);
        break;
      default:
        // Navigate to notifications screen
        console.log('Navigate to notifications');
        break;
    }

    // Mark notification as read
    this.markAsRead(response.notification.request.identifier);
  }

  public addNotification(notification: NotificationData) {
    this.notifications.unshift(notification);
    this.notifyListeners();

    // Update badge count
    this.updateBadgeCount();
  }

  public getNotifications(): NotificationData[] {
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
      this.updateBadgeCount();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
    this.updateBadgeCount();
  }

  public clearNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
    this.updateBadgeCount();
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.notifyListeners();
    this.updateBadgeCount();
  }

  private async updateBadgeCount() {
    const unreadCount = this.getUnreadCount();
    await Notifications.setBadgeCountAsync(unreadCount);
  }

  public subscribe(listener: (notifications: NotificationData[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }

  // Send local notification (for testing or offline scenarios)
  public async sendLocalNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    const notificationId = `local_${Date.now()}`;
    
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
        },
        sound: notification.priority === 'urgent' || notification.priority === 'high',
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  }

  // Schedule notification for later
  public async scheduleNotification(
    notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>,
    trigger: Date | number
  ) {
    const notificationId = `scheduled_${Date.now()}`;

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
        },
        sound: notification.priority === 'urgent' || notification.priority === 'high',
      },
      trigger: trigger instanceof Date ? trigger : { seconds: trigger },
    });

    return notificationId;
  }

  public async cancelScheduledNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  public getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Demo data for testing
  private loadDemoNotifications() {
    const demoNotifications: NotificationData[] = [
      {
        id: 'demo_1',
        type: 'message',
        title: 'New message from Kemi Adebayo',
        body: 'Thanks for helping with the community garden! 🌱',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        priority: 'normal',
        data: {
          senderId: 'user_kemi',
          conversationId: 'conv_123',
        },
      },
      {
        id: 'demo_2',
        type: 'event',
        title: 'Event Reminder: Community Meeting',
        body: 'Starting in 30 minutes at the Estate Community Center',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        priority: 'high',
        actionRequired: true,
        data: {
          eventId: 'event_123',
          action: 'reminder',
        },
      },
      {
        id: 'demo_3',
        type: 'safety',
        title: 'Safety Alert: Power Outage',
        body: 'Planned power outage in Ikeja GRA from 9 AM - 2 PM today',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 'high',
        data: {
          alertLevel: 'warning',
          location: 'Ikeja GRA',
        },
      },
      {
        id: 'demo_4',
        type: 'community',
        title: 'New neighbor joined!',
        body: 'Dr. Olumide Adeyemi just joined your compound community',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        priority: 'low',
        data: {
          action: 'neighborJoined',
          fromUserId: 'user_olumide',
        },
      },
      {
        id: 'demo_5',
        type: 'marketplace',
        title: 'Item sold successfully! 🎉',
        body: 'Your "Office Chair" has been sold to Funmi Okafor',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: true,
        priority: 'normal',
        data: {
          itemId: 'item_123',
          buyerId: 'user_funmi',
        },
      },
    ];

    this.notifications = demoNotifications;
  }

  // Utility methods for different notification types
  public async sendEventReminder(eventId: string, eventTitle: string, minutesUntil: number) {
    return this.sendLocalNotification({
      type: 'event',
      title: `Event Reminder: ${eventTitle}`,
      body: `Starting in ${minutesUntil} minutes`,
      priority: 'high',
      actionRequired: true,
      data: { eventId, action: 'reminder' },
    });
  }

  public async sendMessageNotification(senderId: string, senderName: string, messagePreview: string) {
    return this.sendLocalNotification({
      type: 'message',
      title: `New message from ${senderName}`,
      body: messagePreview,
      priority: 'normal',
      data: { senderId, messagePreview },
    });
  }

  public async sendSafetyAlert(title: string, body: string, alertLevel: 'info' | 'warning' | 'emergency') {
    return this.sendLocalNotification({
      type: 'safety',
      title,
      body,
      priority: alertLevel === 'emergency' ? 'urgent' : 'high',
      data: { alertLevel },
    });
  }

  public async sendCommunityUpdate(title: string, body: string, action: string) {
    return this.sendLocalNotification({
      type: 'community',
      title,
      body,
      priority: 'normal',
      data: { action },
    });
  }
}

export default NotificationService;