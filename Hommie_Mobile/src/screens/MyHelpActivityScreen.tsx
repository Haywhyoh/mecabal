import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HelpStackParamList } from '../navigation/HelpNavigation';
import { PostsService } from '../services/postsService';
import { useAuth } from '../contexts/AuthContext';

type MyHelpActivityScreenProps = {
  navigation: StackNavigationProp<HelpStackParamList, 'MyHelpActivity'>;
};

interface HelpActivity {
  id: string;
  type: 'requested' | 'offered' | 'completed';
  post: any;
  createdAt: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
}

export const MyHelpActivityScreen: React.FC<MyHelpActivityScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const postsService = PostsService.getInstance();
  const [activities, setActivities] = useState<HelpActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'requested' | 'offered' | 'completed'>('all');
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalOffers: 0,
    completedHelps: 0,
    pendingRequests: 0,
  });

  const loadHelpActivity = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load user's help requests
      const requestsResponse = await postsService.getPosts({
        postType: 'help',
        authorId: user.id,
        limit: 50,
        offset: 0,
      });

      // Load user's help offers (comments on help posts)
      const offersResponse = await postsService.getComments({
        authorId: user.id,
        limit: 50,
        offset: 0,
      });

      const activities: HelpActivity[] = [];

      // Process help requests
      if (requestsResponse.success && requestsResponse.data?.posts) {
        requestsResponse.data.posts.forEach((post: any) => {
          activities.push({
            id: `request-${post.id}`,
            type: 'requested',
            post,
            createdAt: post.createdAt,
            status: post.status || 'pending',
          });
        });
      }

      // Process help offers
      if (offersResponse.success && offersResponse.data?.comments) {
        offersResponse.data.comments.forEach((comment: any) => {
          if (comment.metadata?.helpOffer) {
            activities.push({
              id: `offer-${comment.id}`,
              type: 'offered',
              post: comment.post,
              createdAt: comment.createdAt,
              status: comment.metadata.status || 'pending',
            });
          }
        });
      }

      // Sort by creation date (newest first)
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActivities(activities);

      // Calculate stats
      const totalRequests = activities.filter(a => a.type === 'requested').length;
      const totalOffers = activities.filter(a => a.type === 'offered').length;
      const completedHelps = activities.filter(a => a.status === 'completed').length;
      const pendingRequests = activities.filter(a => a.type === 'requested' && a.status === 'pending').length;

      setStats({
        totalRequests,
        totalOffers,
        completedHelps,
        pendingRequests,
      });

    } catch (error) {
      console.error('Error loading help activity:', error);
      Alert.alert('Error', 'Failed to load your help activity');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHelpActivity();
    setRefreshing(false);
  }, [loadHelpActivity]);

  useEffect(() => {
    loadHelpActivity();
  }, [loadHelpActivity]);

  const getFilteredActivities = () => {
    if (selectedTab === 'all') return activities;
    return activities.filter(activity => activity.type === selectedTab);
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { label: string; icon: string; color: string } } = {
      errand: { label: 'Quick Errand', icon: 'bicycle', color: '#FF6B35' },
      task: { label: 'Task', icon: 'construct', color: '#9C27B0' },
      borrow: { label: 'Borrow/Lend', icon: 'sync', color: '#2196F3' },
      recommendation: { label: 'Recommendation', icon: 'star', color: '#FFC107' },
      advice: { label: 'Advice', icon: 'bulb', color: '#00BCD4' },
    };
    return categoryMap[category] || { label: 'Help Request', icon: 'help-circle', color: '#8E8E93' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalRequests}</Text>
          <Text style={styles.statLabel}>Requests</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalOffers}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedHelps}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'requested' && styles.tabActive]}
          onPress={() => setSelectedTab('requested')}
        >
          <Text style={[styles.tabText, selectedTab === 'requested' && styles.tabTextActive]}>
            My Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'offered' && styles.tabActive]}
          onPress={() => setSelectedTab('offered')}
        >
          <Text style={[styles.tabText, selectedTab === 'offered' && styles.tabTextActive]}>
            My Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderActivityItem = ({ item }: { item: HelpActivity }) => {
    const categoryInfo = getCategoryInfo(item.post.helpCategory);
    const isRequest = item.type === 'requested';

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => {
          if (isRequest) {
            navigation.navigate('HelpRequestDetail', { requestId: item.post.id });
          } else {
            navigation.navigate('HelpRequestDetail', { requestId: item.post.id });
          }
        }}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityTypeContainer}>
            <Ionicons
              name={isRequest ? 'help-circle-outline' : 'help-circle-outline'}
              size={20}
              color={isRequest ? '#FF9500' : '#00A651'}
            />
            <Text style={styles.activityType}>
              {isRequest ? 'Requested Help' : 'Offered Help'}
            </Text>
          </View>
          <Text style={styles.activityTime}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.categoryBadge}>
          <Ionicons
            name={categoryInfo.icon as any}
            size={14}
            color={categoryInfo.color}
          />
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>

        <Text style={styles.activityContent} numberOfLines={2}>
          {item.post.content}
        </Text>

        <View style={styles.activityFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return '#00A651';
      case 'accepted': return '#007AFF';
      case 'cancelled': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      all: 'No help activity yet',
      requested: 'No help requests yet',
      offered: 'No help offers yet',
      completed: 'No completed helps yet',
    };

    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyTitle}>{emptyMessages[selectedTab]}</Text>
        <Text style={styles.emptySubtitle}>
          {selectedTab === 'all' || selectedTab === 'requested'
            ? 'Start by requesting help from your community'
            : 'Start by offering help to your neighbors'}
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateHelpRequest')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>
            {selectedTab === 'offered' ? 'Browse Requests' : 'Request Help'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.title}>My Help Activity</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading your activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>My Help Activity</Text>
        <View style={styles.placeholder} />
      </View>

      {renderStats()}
      {renderTabs()}

      <FlatList
        data={filteredActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00A651']}
            tintColor="#00A651"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00A651',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#00A651',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 6,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activityContent: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MyHelpActivityScreen;
