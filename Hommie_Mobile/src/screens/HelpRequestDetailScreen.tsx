import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HelpStackParamList } from '../navigation/HelpNavigation';
import { postsService } from '../services/postsService';
import { useAuth } from '../contexts/AuthContext';

type HelpRequestDetailScreenProps = {
  navigation: StackNavigationProp<HelpStackParamList, 'HelpRequestDetail'>;
  route: RouteProp<HelpStackParamList, 'HelpRequestDetail'>;
};

export const HelpRequestDetailScreen: React.FC<HelpRequestDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { requestId, focusComment } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postsService.getPostById(requestId);
      
      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        Alert.alert('Error', 'Help request not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading help request:', error);
      Alert.alert('Error', 'Failed to load help request details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [requestId, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequestDetails();
    setRefreshing(false);
  }, [loadRequestDetails]);

  useEffect(() => {
    loadRequestDetails();
  }, [loadRequestDetails]);

  const handleOfferHelp = () => {
    navigation.navigate('OfferHelp', { requestId });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Help Request: ${request?.content}\n\nView on Mecabal: mecabal://help/${requestId}`,
        title: 'Community Help Request',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  const renderHeader = () => {
    if (!request) return null;

    const categoryInfo = getCategoryInfo(request.helpCategory);
    const isOwner = user?.id === request.authorId;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Request</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryBadge}>
          <Ionicons
            name={categoryInfo.icon as any}
            size={16}
            color={categoryInfo.color}
          />
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {categoryInfo.label.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{request.content}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>
                {request.author?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>
                {request.author?.firstName} {request.author?.lastName}
              </Text>
              <Text style={styles.postTime}>
                {formatDate(request.createdAt)}
              </Text>
            </View>
          </View>

          {request.urgency && (
            <View style={[styles.urgencyBadge, { backgroundColor: request.urgency === 'urgent' ? '#FF3B30' : '#FF9500' }]}>
              <Text style={styles.urgencyText}>
                {request.urgency.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRequestDetails = () => {
    if (!request) return null;

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Request Details</Text>

        {request.budget && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Budget:</Text>
            <Text style={styles.detailValue}>{request.budget}</Text>
          </View>
        )}

        {request.deadline && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Deadline:</Text>
            <Text style={styles.detailValue}>
              {new Date(request.deadline).toLocaleDateString()}
            </Text>
          </View>
        )}

        {request.borrowItem && (
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Item:</Text>
            <Text style={styles.detailValue}>{request.borrowItem}</Text>
          </View>
        )}

        {request.borrowDuration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {request.borrowDuration.replace('_', ' ')}
            </Text>
          </View>
        )}

        {request.taskType && (
          <View style={styles.detailRow}>
            <Ionicons name="construct-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Task Type:</Text>
            <Text style={styles.detailValue}>
              {request.taskType.charAt(0).toUpperCase() + request.taskType.slice(1)}
            </Text>
          </View>
        )}

        {request.estimatedDuration && (
          <View style={styles.detailRow}>
            <Ionicons name="timer-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{request.estimatedDuration}</Text>
          </View>
        )}

        {request.itemCondition && (
          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={20} color="#666666" />
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={styles.detailValue}>{request.itemCondition}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => {
    if (!request) return null;

    const isOwner = user?.id === request.authorId;

    if (isOwner) {
      return (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Your Request</Text>
          <Text style={styles.ownerMessage}>
            This is your help request. You can share it with your community or edit it.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.offerHelpButton} onPress={handleOfferHelp}>
          <Ionicons name="hand" size={20} color="#FFFFFF" />
          <Text style={styles.offerHelpText}>Offer Help</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading help request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Request Not Found</Text>
          <Text style={styles.errorMessage}>
            This help request may have been deleted or is no longer available.
          </Text>
          <TouchableOpacity
            style={styles.backToHelpButton}
            onPress={() => navigation.navigate('HelpRequests')}
          >
            <Text style={styles.backToHelpText}>Back to Help Requests</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00A651']}
            tintColor="#00A651"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderRequestDetails()}
        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToHelpButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHelpText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  shareButton: {
    padding: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 26,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  postTime: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ownerMessage: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  offerHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 12,
  },
  offerHelpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HelpRequestDetailScreen;
