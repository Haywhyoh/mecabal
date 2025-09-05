// MeCabal Real-time Services
// WebSocket-based real-time features for community engagement

import { supabase, SUPABASE_CONFIG } from './supabase';
import { Alert } from 'react-native';
import type { 
  Post, 
  Message, 
  SafetyAlert, 
  Event, 
  EventRSVP,
  RealtimeSubscription,
  RealtimePayload 
} from '../types';

export class MeCabalRealtime {
  // Subscribe to neighborhood posts feed
  static subscribeToNeighborhoodPosts(
    neighborhoodId: string,
    callbacks: {
      onNewPost: (post: Post) => void;
      onPostUpdate: (post: Post) => void;
      onPostDelete: (postId: string) => void;
      onError?: (error: any) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(SUPABASE_CONFIG.realtime.channels.neighborhoodPosts(neighborhoodId))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `neighborhood_id=eq.${neighborhoodId}`
      }, (payload: RealtimePayload<Post>) => {
        if (payload.new) {
          callbacks.onNewPost(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
        filter: `neighborhood_id=eq.${neighborhoodId}`
      }, (payload: RealtimePayload<Post>) => {
        if (payload.new) {
          callbacks.onPostUpdate(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'posts',
        filter: `neighborhood_id=eq.${neighborhoodId}`
      }, (payload: RealtimePayload<Post>) => {
        if (payload.old) {
          callbacks.onPostDelete(payload.old.id);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to neighborhood posts: ${neighborhoodId}`);
        } else if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.('Failed to subscribe to neighborhood posts');
        }
      });

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  // Subscribe to direct messages for a user
  static subscribeToMessages(
    userId: string,
    callbacks: {
      onNewMessage: (message: Message) => void;
      onMessageUpdate: (message: Message) => void;
      onError?: (error: any) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(SUPABASE_CONFIG.realtime.channels.userMessages(userId))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload: RealtimePayload<Message>) => {
        if (payload.new) {
          callbacks.onNewMessage(payload.new);
          
          // Show notification for new message
          this.showMessageNotification(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload: RealtimePayload<Message>) => {
        if (payload.new) {
          callbacks.onMessageUpdate(payload.new);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to messages for user: ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.('Failed to subscribe to messages');
        }
      });

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  // Subscribe to safety alerts for a neighborhood
  static subscribeToSafetyAlerts(
    neighborhoodId: string,
    callbacks: {
      onNewAlert: (alert: SafetyAlert) => void;
      onAlertUpdate: (alert: SafetyAlert) => void;
      onError?: (error: any) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(SUPABASE_CONFIG.realtime.channels.safetyAlerts(neighborhoodId))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'safety_alerts',
        filter: `neighborhood_id=eq.${neighborhoodId}`
      }, (payload: RealtimePayload<SafetyAlert>) => {
        if (payload.new) {
          callbacks.onNewAlert(payload.new);
          
          // Show immediate alert notification
          this.showSafetyAlertNotification(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'safety_alerts',
        filter: `neighborhood_id=eq.${neighborhoodId}`
      }, (payload: RealtimePayload<SafetyAlert>) => {
        if (payload.new) {
          callbacks.onAlertUpdate(payload.new);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to safety alerts: ${neighborhoodId}`);
        } else if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.('Failed to subscribe to safety alerts');
        }
      });

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  // Subscribe to event updates
  static subscribeToEventUpdates(
    eventId: string,
    callbacks: {
      onEventUpdate: (event: Event) => void;
      onNewRSVP: (rsvp: EventRSVP) => void;
      onRSVPUpdate: (rsvp: EventRSVP) => void;
      onError?: (error: any) => void;
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(SUPABASE_CONFIG.realtime.channels.eventUpdates(eventId))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`
      }, (payload: RealtimePayload<Event>) => {
        if (payload.new) {
          callbacks.onEventUpdate(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_rsvps',
        filter: `event_id=eq.${eventId}`
      }, (payload: RealtimePayload<EventRSVP>) => {
        if (payload.new) {
          callbacks.onNewRSVP(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_rsvps',
        filter: `event_id=eq.${eventId}`
      }, (payload: RealtimePayload<EventRSVP>) => {
        if (payload.new) {
          callbacks.onRSVPUpdate(payload.new);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to event updates: ${eventId}`);
        } else if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.('Failed to subscribe to event updates');
        }
      });

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  // Subscribe to multiple neighborhoods (for users in multiple estates)
  static subscribeToMultipleNeighborhoods(
    neighborhoodIds: string[],
    callbacks: {
      onNewPost: (post: Post, neighborhoodId: string) => void;
      onNewAlert: (alert: SafetyAlert, neighborhoodId: string) => void;
      onError?: (error: any) => void;
    }
  ): RealtimeSubscription {
    const channels = neighborhoodIds.map(neighborhoodId => {
      return supabase
        .channel(`multi-neighborhood-${neighborhoodId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `neighborhood_id=eq.${neighborhoodId}`
        }, (payload: RealtimePayload<Post>) => {
          if (payload.new) {
            callbacks.onNewPost(payload.new, neighborhoodId);
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'safety_alerts',
          filter: `neighborhood_id=eq.${neighborhoodId}`
        }, (payload: RealtimePayload<SafetyAlert>) => {
          if (payload.new) {
            callbacks.onNewAlert(payload.new, neighborhoodId);
            this.showSafetyAlertNotification(payload.new);
          }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            callbacks.onError?.(`Failed to subscribe to neighborhood: ${neighborhoodId}`);
          }
        });
    });

    return {
      unsubscribe: () => {
        channels.forEach(channel => channel.unsubscribe());
      }
    };
  }

  // Broadcast presence (user online status)
  static broadcastPresence(
    channelName: string,
    userInfo: {
      user_id: string;
      username: string;
      status: 'online' | 'away' | 'busy';
    }
  ): RealtimeSubscription {
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Presence sync:', newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send initial presence
          await channel.track(userInfo);
        }
      });

    return {
      unsubscribe: () => {
        channel.untrack();
        channel.unsubscribe();
      }
    };
  }

  // Send real-time broadcast message
  static async sendBroadcast(
    channelName: string,
    eventName: string,
    payload: any
  ): Promise<void> {
    try {
      const channel = supabase.channel(channelName);
      await channel.send({
        type: 'broadcast',
        event: eventName,
        payload
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
    }
  }

  // Monitor connection status
  static monitorConnectionStatus(
    onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            onStatusChange('connected');
            break;
          case 'CLOSED':
            onStatusChange('disconnected');
            break;
          case 'CHANNEL_ERROR':
            onStatusChange('disconnected');
            break;
          default:
            onStatusChange('reconnecting');
        }
      });

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  // Private: Show safety alert notification
  private static showSafetyAlertNotification(alert: SafetyAlert): void {
    const severityEmoji = {
      low: '⚠️',
      medium: '🚨',
      high: '🔥',
      critical: '💥'
    };

    Alert.alert(
      `${severityEmoji[alert.severity_level]} Safety Alert`,
      `${alert.title}\n\n${alert.description.slice(0, 100)}${alert.description.length > 100 ? '...' : ''}`,
      [
        {
          text: 'View Details',
          style: 'default',
          onPress: () => {
            // Navigate to alert details
            console.log('Navigate to alert:', alert.id);
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  }

  // Private: Show message notification
  private static showMessageNotification(message: Message): void {
    // Only show notification if app is in background
    // This would typically integrate with push notifications
    console.log('New message received:', message);
  }

  // Get all active subscriptions count
  static getActiveSubscriptionsCount(): number {
    return supabase.getChannels().length;
  }

  // Cleanup all subscriptions
  static cleanupAllSubscriptions(): void {
    supabase.removeAllChannels();
  }

  // Helper: Create typed channel for specific use cases
  static createTypedChannel<T>(
    channelName: string,
    table: string,
    filter?: string
  ): {
    subscribe: (callbacks: {
      onInsert?: (payload: T) => void;
      onUpdate?: (payload: T) => void;
      onDelete?: (payload: { id: string }) => void;
    }) => RealtimeSubscription;
  } {
    return {
      subscribe: (callbacks) => {
        let channel = supabase.channel(channelName);

        if (callbacks.onInsert) {
          channel = channel.on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table,
            filter
          }, (payload: RealtimePayload<T>) => {
            if (payload.new) {
              callbacks.onInsert?.(payload.new);
            }
          });
        }

        if (callbacks.onUpdate) {
          channel = channel.on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter
          }, (payload: RealtimePayload<T>) => {
            if (payload.new) {
              callbacks.onUpdate?.(payload.new);
            }
          });
        }

        if (callbacks.onDelete) {
          channel = channel.on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table,
            filter
          }, (payload: RealtimePayload<T>) => {
            if (payload.old) {
              callbacks.onDelete?.({ id: (payload.old as any).id });
            }
          });
        }

        channel.subscribe();

        return {
          unsubscribe: () => {
            channel.unsubscribe();
          }
        };
      }
    };
  }
}