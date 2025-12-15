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
import { HelpStackParamList } from '../../navigation/HelpNavigation';
import { PostsService } from '../../services/postsService';
import { helpOfferService, type HelpOffer } from '../../services/helpOfferService';
import { useAuth } from '../../contexts/AuthContext';

type HelpRequestDetailScreenProps = {
  navigation: StackNavigationProp<HelpStackParamList, 'HelpRequestDetail'>;
  route: RouteProp<HelpStackParamList, 'HelpRequestDetail'>;
};

export const HelpRequestDetailScreen: React.FC<HelpRequestDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const postsService = PostsService.getInstance();
  const { requestId, focusComment } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpOffers, setHelpOffers] = useState<HelpOffer[]>([]);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);
  const [myOffer, setMyOffer] = useState<HelpOffer | null>(null);

  const loadRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      const post = await postsService.getPostById(requestId);
      
      if (post) {
        setRequest(post);
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
    // Reload my offer if user is not the owner
    if (user?.id) {
      try {
        const offer = await helpOfferService.getMyOfferForPost(requestId);
        setMyOffer(offer);
      } catch (error) {
        console.error('Error loading my offer on refresh:', error);
        setMyOffer(null);
      }
    }
    setRefreshing(false);
  }, [loadRequestDetails, user?.id, requestId]);

  useEffect(() => {
    loadRequestDetails();
  }, [loadRequestDetails]);

  // Fetch help offers (only for the requester)
  useEffect(() => {
    const loadHelpOffers = async () => {
      if (!request || user?.id !== request.author?.id) return;
      
      try {
        const offers = await helpOfferService.getOffersByPost(requestId);
        setHelpOffers(offers);
      } catch (error) {
        console.error('Error loading help offers:', error);
      }
    };
    
    if (request) {
      loadHelpOffers();
    }
  }, [request, requestId, user?.id]);

  // Fetch user's own offer (only if user is NOT the owner)
  useEffect(() => {
    const loadMyOffer = async () => {
      if (!request || !user?.id || user?.id === request.author?.id) return;
      
      try {
        const offer = await helpOfferService.getMyOfferForPost(requestId);
        setMyOffer(offer);
      } catch (error) {
        console.error('Error loading my offer:', error);
        setMyOffer(null);
      }
    };
    
    if (request) {
      loadMyOffer();
    }
  }, [request, requestId, user?.id]);

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
    const isOwner = user?.id === request.author?.id;

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

  const renderMyApplication = () => {
    if (!myOffer || !user?.id) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#FFC107';
        case 'accepted': return '#00A651';
        case 'rejected': return '#DC3545';
        case 'completed': return '#6C757D';
        case 'cancelled': return '#6C757D';
        default: return '#6C757D';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'pending': return 'Pending';
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    };

    const handleCancelOffer = async () => {
      Alert.alert(
        'Cancel Application',
        'Are you sure you want to cancel your help offer?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                await helpOfferService.cancelOffer(myOffer.id);
                setMyOffer(null);
                Alert.alert('Success', 'Your application has been cancelled.');
              } catch (error) {
                console.error('Error cancelling offer:', error);
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel application');
              }
            },
          },
        ]
      );
    };

    return (
      <View style={styles.myApplicationSection}>
        <View style={styles.myApplicationHeader}>
          <Text style={styles.sectionTitle}>My Application</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(myOffer.status)}20` }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(myOffer.status) }]}>
              {getStatusLabel(myOffer.status)}
            </Text>
          </View>
        </View>

        <View style={styles.myApplicationCard}>
          <Text style={styles.myApplicationMessage}>{myOffer.message}</Text>

          <View style={styles.myApplicationMeta}>
            <View style={styles.myApplicationMetaItem}>
              <Ionicons
                name={
                  myOffer.contactMethod === 'phone'
                    ? 'call-outline'
                    : myOffer.contactMethod === 'meet'
                    ? 'location-outline'
                    : 'chatbubble-outline'
                }
                size={16}
                color="#666666"
              />
              <Text style={styles.myApplicationMetaText}>
                {myOffer.contactMethod === 'phone'
                  ? 'Phone'
                  : myOffer.contactMethod === 'meet'
                  ? 'Meet in Person'
                  : 'Message'}
              </Text>
            </View>

            {myOffer.availability && (
              <View style={styles.myApplicationMetaItem}>
                <Ionicons name="time-outline" size={16} color="#666666" />
                <Text style={styles.myApplicationMetaText}>{myOffer.availability}</Text>
              </View>
            )}

            {myOffer.estimatedTime && (
              <View style={styles.myApplicationMetaItem}>
                <Ionicons name="hourglass-outline" size={16} color="#666666" />
                <Text style={styles.myApplicationMetaText}>{myOffer.estimatedTime}</Text>
              </View>
            )}
          </View>

          {myOffer.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOffer}
            >
              <Ionicons name="close-circle-outline" size={16} color="#DC3545" />
              <Text style={styles.cancelButtonText}>Cancel Application</Text>
            </TouchableOpacity>
          )}

          {myOffer.status === 'accepted' && (
            <View style={styles.acceptedInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#00A651" />
              <Text style={styles.acceptedText}>
                Your offer was accepted! The requester will contact you soon.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setProcessingOffer(offerId);
      await helpOfferService.acceptOffer(offerId);
      // Reload offers
      const offers = await helpOfferService.getOffersByPost(requestId);
      setHelpOffers(offers);
      Alert.alert('Success', 'Help offer accepted!');
    } catch (error) {
      console.error('Error accepting offer:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      setProcessingOffer(offerId);
      await helpOfferService.rejectOffer(offerId);
      // Reload offers
      const offers = await helpOfferService.getOffersByPost(requestId);
      setHelpOffers(offers);
      Alert.alert('Success', 'Help offer rejected');
    } catch (error) {
      console.error('Error rejecting offer:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const renderHelpOffers = () => {
    if (!request || user?.id !== request.author?.id || helpOffers.length === 0) {
      return null;
    }

    return (
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>
          People Who Want to Help ({helpOffers.length})
        </Text>
        {helpOffers.map((offer) => {
          const isProcessing = processingOffer === offer.id;
          const isPending = offer.status === 'pending';
          const isAccepted = offer.status === 'accepted';
          const isRejected = offer.status === 'rejected';

          return (
            <View key={offer.id} style={styles.helpOfferCard}>
              <View style={styles.helpOfferHeader}>
                <View style={styles.helpOfferAvatar}>
                  <Text style={styles.helpOfferInitial}>
                    {offer.user?.firstName?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={styles.helpOfferInfo}>
                  <Text style={styles.helpOfferName}>
                    {offer.user?.firstName} {offer.user?.lastName}
                  </Text>
                  <Text style={styles.helpOfferTime}>
                    {formatDate(offer.createdAt)}
                  </Text>
                </View>
                {offer.contactMethod && (
                  <View style={styles.contactMethodBadge}>
                    <Ionicons
                      name={
                        offer.contactMethod === 'phone'
                          ? 'call-outline'
                          : offer.contactMethod === 'meet'
                          ? 'location-outline'
                          : 'chatbubble-outline'
                      }
                      size={14}
                      color="#00A651"
                    />
                  </View>
                )}
                {isAccepted && (
                  <View style={[styles.statusBadge, { backgroundColor: '#00A65120' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#00A651' }]}>Accepted</Text>
                  </View>
                )}
                {isRejected && (
                  <View style={[styles.statusBadge, { backgroundColor: '#FF3B3020' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#FF3B30' }]}>Rejected</Text>
                  </View>
                )}
              </View>
              <Text style={styles.helpOfferMessage} numberOfLines={3}>
                {offer.message}
              </Text>
              {(offer.availability || offer.estimatedTime) && (
                <View style={styles.helpOfferMeta}>
                  {offer.availability && (
                    <View style={styles.helpOfferMetaItem}>
                      <Ionicons name="time-outline" size={14} color="#666666" />
                      <Text style={styles.helpOfferMetaText}>
                        {offer.availability}
                      </Text>
                    </View>
                  )}
                  {offer.estimatedTime && (
                    <View style={styles.helpOfferMetaItem}>
                      <Ionicons name="hourglass-outline" size={14} color="#666666" />
                      <Text style={styles.helpOfferMetaText}>
                        {offer.estimatedTime}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {isPending && (
                <View style={styles.helpOfferActions}>
                  <TouchableOpacity
                    style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
                    onPress={() => handleAcceptOffer(offer.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                    onPress={() => handleRejectOffer(offer.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={16} color="#FF3B30" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderActions = () => {
    if (!request) return null;

    const isOwner = user?.id === request.author?.id;

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

    // If user has already applied, show different message
    if (myOffer) {
      return (
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.offerHelpButton, styles.offerHelpButtonApplied]} 
            onPress={() => {
              // Scroll to my application section (it will be rendered above)
              // For now, just show a message
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.offerHelpText}>View My Application</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.offerHelpButton} onPress={handleOfferHelp}>
          <Ionicons name="help-circle" size={20} color="#FFFFFF" />
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
        {renderMyApplication()}
        {renderHelpOffers()}
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
  offerHelpButtonApplied: {
    backgroundColor: '#6C757D',
  },
  offerHelpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  myApplicationSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  myApplicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myApplicationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  myApplicationMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 12,
  },
  myApplicationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  myApplicationMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myApplicationMetaText: {
    fontSize: 12,
    color: '#666666',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DC3545',
    borderRadius: 8,
    gap: 6,
  },
  cancelButtonText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#00A65120',
    borderRadius: 8,
    gap: 8,
  },
  acceptedText: {
    flex: 1,
    fontSize: 14,
    color: '#00A651',
    lineHeight: 20,
  },
  helpOfferCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  helpOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpOfferAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpOfferInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpOfferInfo: {
    flex: 1,
  },
  helpOfferName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  helpOfferTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  contactMethodBadge: {
    padding: 4,
  },
  helpOfferMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 8,
  },
  helpOfferMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  helpOfferMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpOfferMetaText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  helpOfferActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A651',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default HelpRequestDetailScreen;
