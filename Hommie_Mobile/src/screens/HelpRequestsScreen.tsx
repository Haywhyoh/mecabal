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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HelpStackParamList } from '../navigation/HelpNavigation';
import { COMMUNITY_HELP_CATEGORIES } from '../constants';
import { PostsService } from '../services/postsService';
import { useAuth } from '../contexts/AuthContext';
import { HelpPostCard } from '../components/HelpPostCard';

type HelpRequestsScreenProps = {
  navigation: StackNavigationProp<HelpStackParamList, 'HelpRequests'>;
};

export const HelpRequestsScreen: React.FC<HelpRequestsScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const postsService = PostsService.getInstance();
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);

  const loadHelpRequests = useCallback(async () => {
    try {
      setLoading(true);

      // Call API with proper parameters
      const response = await postsService.getPosts({
        postType: 'help',
        limit: 50,
        page: 1,  // Use 'page' instead of 'offset' (consistent with API)
      });

      console.log('🔍 Help posts API response:', response);
      console.log('🔍 Response data type:', typeof response.data);
      console.log('🔍 Is array?:', Array.isArray(response.data));

      // Handle different response structures
      let helpPosts = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          // Response is directly an array
          helpPosts = response.data;
          console.log('✅ Response is array, found', helpPosts.length, 'posts');
        } else if (response.data.posts && Array.isArray(response.data.posts)) {
          // Response has posts property
          helpPosts = response.data.posts;
          console.log('✅ Response has posts property, found', helpPosts.length, 'posts');
        } else {
          console.warn('⚠️ Unexpected response structure:', response.data);
        }

        setHelpRequests(helpPosts);
        console.log(`✅ Loaded ${helpPosts.length} help requests`);
      } else {
        console.warn('⚠️ Response has no data property');
        setHelpRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading help requests:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load help requests. Please try again.');
      setHelpRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHelpRequests();
    setRefreshing(false);
  }, [loadHelpRequests]);

  useEffect(() => {
    loadHelpRequests();
  }, [loadHelpRequests]);

  // Filter help requests based on search and category
  useEffect(() => {
    let filtered = helpRequests;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(request =>
        request.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.helpCategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(request => request.helpCategory === selectedCategory);
    }

    setFilteredRequests(filtered);
  }, [helpRequests, searchQuery, selectedCategory]);

  const handleCreateRequest = () => {
    navigation.navigate('CreateHelpRequest');
  };

  const handleRequestPress = (request: any) => {
    navigation.navigate('HelpRequestDetail', {
      requestId: request.id,
    });
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === null && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.categoryChipText,
            selectedCategory === null && styles.categoryChipTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {COMMUNITY_HELP_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Ionicons
            name={category.icon as any}
            size={16}
            color={selectedCategory === category.id ? '#FFFFFF' : '#666666'}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Help Requests Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to ask for help in your community
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateRequest}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Request Help</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpRequest = ({ item }: { item: any }) => (
    <HelpPostCard
      post={item}
      onPress={() => handleRequestPress(item)}
      onRespond={() => navigation.navigate('OfferHelp', { requestId: item.id })}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Community Help</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading help requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Help</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRequest}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help requests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredRequests}
        renderItem={renderHelpRequest}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A651',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    marginLeft: 8,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#00A651',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
});

export default HelpRequestsScreen;
