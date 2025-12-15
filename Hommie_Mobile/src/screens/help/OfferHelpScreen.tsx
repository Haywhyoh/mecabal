import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HelpStackParamList } from '../../navigation/HelpNavigation';
import { PostsService } from '../../services/postsService';
import { helpOfferService } from '../../services/helpOfferService';
import { useAuth } from '../../contexts/AuthContext';

type OfferHelpScreenProps = {
  navigation: StackNavigationProp<HelpStackParamList, 'OfferHelp'>;
  route: RouteProp<HelpStackParamList, 'OfferHelp'>;
};

export const OfferHelpScreen: React.FC<OfferHelpScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const postsService = PostsService.getInstance();
  const { requestId } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'phone' | 'message' | 'meet'>('message');
  const [availability, setAvailability] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    loadRequestDetails();
  }, []);

  const loadRequestDetails = async () => {
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
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please provide a message explaining how you can help');
      return;
    }

    if (message.length < 10) {
      Alert.alert('Message Too Short', 'Please provide more details about how you can help (min 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create a help offer
      await helpOfferService.createOffer({
        postId: requestId,
        message: message.trim(),
        contactMethod,
        availability: availability.trim() || undefined,
        estimatedTime: estimatedTime.trim() || undefined,
      });

      Alert.alert(
        'Help Offered!',
        'Your offer to help has been sent. The requester will be notified and can contact you.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error offering help:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send your help offer. Please try again.');
    } finally {
      setSubmitting(false);
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

  const renderHeader = () => {
    if (!request) return null;

    const categoryInfo = getCategoryInfo(request.helpCategory);

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offer Help</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.requestSummary}>
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

          <Text style={styles.requestTitle} numberOfLines={3}>
            {request.content}
          </Text>

          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>
                {request.author?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
            <Text style={styles.authorName}>
              {request.author?.firstName} {request.author?.lastName}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContactMethodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How would you like to be contacted?</Text>
      <View style={styles.contactMethodContainer}>
        <TouchableOpacity
          style={[
            styles.contactMethodOption,
            contactMethod === 'message' && styles.contactMethodOptionActive,
          ]}
          onPress={() => setContactMethod('message')}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={contactMethod === 'message' ? '#00A651' : '#666666'}
          />
          <Text
            style={[
              styles.contactMethodText,
              contactMethod === 'message' && styles.contactMethodTextActive,
            ]}
          >
            In-app Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.contactMethodOption,
            contactMethod === 'phone' && styles.contactMethodOptionActive,
          ]}
          onPress={() => setContactMethod('phone')}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={contactMethod === 'phone' ? '#00A651' : '#666666'}
          />
          <Text
            style={[
              styles.contactMethodText,
              contactMethod === 'phone' && styles.contactMethodTextActive,
            ]}
          >
            Phone Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.contactMethodOption,
            contactMethod === 'meet' && styles.contactMethodOptionActive,
          ]}
          onPress={() => setContactMethod('meet')}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={contactMethod === 'meet' ? '#00A651' : '#666666'}
          />
          <Text
            style={[
              styles.contactMethodText,
              contactMethod === 'meet' && styles.contactMethodTextActive,
            ]}
          >
            Meet in Person
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAvailabilityInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>When are you available? (Optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., Weekends, After 6 PM, This Saturday..."
        value={availability}
        onChangeText={setAvailability}
        placeholderTextColor="#999999"
        multiline
      />
    </View>
  );

  const renderEstimatedTimeInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How long will this take? (Optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., 30 minutes, 2 hours, Half day..."
        value={estimatedTime}
        onChangeText={setEstimatedTime}
        placeholderTextColor="#999999"
      />
    </View>
  );

  const renderMessageInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        How can you help? <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={[styles.textInput, styles.messageInput]}
        placeholder="Explain how you can help with this request..."
        value={message}
        onChangeText={setMessage}
        placeholderTextColor="#999999"
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.characterCount}>
        {message.length}/500 characters
      </Text>
    </View>
  );

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
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContactMethodSelector()}
          {renderAvailabilityInput()}
          {renderEstimatedTimeInput()}
          {renderMessageInput()}

          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!message.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!message.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="help-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Send Help Offer</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.submitNote}>
              Your help offer will be sent to the requester. They can contact you using your preferred method.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  backButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 32,
  },
  requestSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  required: {
    color: '#FF3B30',
  },
  contactMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactMethodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  contactMethodOptionActive: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#00A651',
  },
  contactMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  contactMethodTextActive: {
    color: '#00A651',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OfferHelpScreen;
