import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface SearchResults {
  posts: any[];
  events: any[];
  listings: any[];
}

interface SearchResultsScreenProps {
  route: {
    params: {
      query: string;
      results: SearchResults;
    };
  };
}

export default function SearchResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute<SearchResultsScreenProps['route']>();
  const { query, results } = route.params;
  
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'events' | 'listings'>('all');
  const [filteredResults, setFilteredResults] = useState<SearchResults>(results);

  useEffect(() => {
    // Filter results based on active tab
    switch (activeTab) {
      case 'posts':
        setFilteredResults({ posts: results.posts, events: [], listings: [] });
        break;
      case 'events':
        setFilteredResults({ posts: [], events: results.events, listings: [] });
        break;
      case 'listings':
        setFilteredResults({ posts: [], events: [], listings: results.listings });
        break;
      default:
        setFilteredResults(results);
    }
  }, [activeTab, results]);

  const getTotalResults = () => {
    return results.posts.length + results.events.length + results.listings.length;
  };

  const renderPostItem = (post: any) => (
    <TouchableOpacity
      key={post.id}
      style={styles.resultItem}
      onPress={() => navigation.navigate('PostDetail' as never, { postId: post.id })}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>
            {post.author?.firstName?.charAt(0)}{post.author?.lastName?.charAt(0)}
          </Text>
        </View>
        <View style={styles.postInfo}>
          <Text style={styles.postAuthor}>
            {post.author?.firstName} {post.author?.lastName}
          </Text>
          <Text style={styles.postMeta}>
            {new Date(post.createdAt).toLocaleDateString()} • {post.postType}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
      </View>
      <Text style={styles.postContent} numberOfLines={2}>
        {post.content}
      </Text>
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaIndicator}>
          <MaterialCommunityIcons name="image" size={16} color="#8E8E8E" />
          <Text style={styles.mediaText}>{post.media.length} photo(s)</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEventItem = (event: any) => (
    <TouchableOpacity
      key={event.id}
      style={styles.resultItem}
      onPress={() => navigation.navigate('EventDetails' as never, { eventId: event.id })}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventIcon}>
          <MaterialCommunityIcons name="calendar" size={20} color="#00A651" />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>
            {new Date(event.start_datetime).toLocaleDateString()} • {event.location}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
      </View>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {event.description}
      </Text>
    </TouchableOpacity>
  );

  const renderListingItem = (listing: any) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.resultItem}
      onPress={() => navigation.navigate('ListingDetail' as never, { listingId: listing.id })}
    >
      <View style={styles.listingHeader}>
        <View style={styles.listingIcon}>
          <MaterialCommunityIcons name="store" size={20} color="#FF6B35" />
        </View>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingPrice}>
            {listing.currency} {listing.price.toLocaleString()}
            {listing.priceType !== 'fixed' && ` ${listing.priceType.replace('_', ' ')}`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
      </View>
      <Text style={styles.listingDescription} numberOfLines={2}>
        {listing.description}
      </Text>
      <View style={styles.listingMeta}>
        <Text style={styles.listingCategory}>{listing.category?.name}</Text>
        <Text style={styles.listingLocation}>{listing.location?.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="magnify" size={64} color="#8E8E8E" />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching with different keywords or check your spelling
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8E8E8E" />
          <Text style={styles.searchQuery}>"{query}"</Text>
        </View>
        
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>{getTotalResults()} results</Text>
        </View>
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All ({getTotalResults()})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Posts ({results.posts.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'events' && styles.activeTab]}
              onPress={() => setActiveTab('events')}
            >
              <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
                Events ({results.events.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
              onPress={() => setActiveTab('listings')}
            >
              <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
                Listings ({results.listings.length})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <SafeAreaView style={styles.content}>
        <ScrollView style={styles.resultsList}>
          {getTotalResults() === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {filteredResults.posts.map(renderPostItem)}
              {filteredResults.events.map(renderEventItem)}
              {filteredResults.listings.map(renderListingItem)}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchQuery: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
    flex: 1,
  },
  resultsCount: {
    padding: 8,
  },
  resultsCountText: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#00A651',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
    padding: 16,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  postMeta: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  eventMeta: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  listingPrice: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600',
    marginTop: 2,
  },
  listingDescription: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listingCategory: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  listingLocation: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
