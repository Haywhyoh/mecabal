import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserDashboardService, BookmarkItem } from '../services/userDashboard';

type BookmarkType = 'post' | 'listing' | 'event';

export default function BookmarksScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const bookmarkType: BookmarkType = (route.params as any)?.type || 'post';

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [bookmarkType]);

  const loadBookmarks = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }

      const response = await UserDashboardService.getBookmarksByType(
        bookmarkType,
        pageNum,
        20
      );

      if (response.success && response.data) {
        const newBookmarks = response.data.bookmarks;

        if (append) {
          setBookmarks(prev => [...prev, ...newBookmarks]);
        } else {
          setBookmarks(newBookmarks);
        }

        setHasMore(response.data.page < response.data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookmarks(1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadBookmarks(page + 1, true);
    }
  };

  const handleRemoveBookmark = async (item: BookmarkItem) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await UserDashboardService.removeBookmark(
              item.itemType,
              item.itemId
            );

            if (result.success) {
              setBookmarks(prev => prev.filter(b => b.id !== item.id));
              Alert.alert('Success', 'Bookmark removed');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const renderBookmarkItem = ({ item }: { item: BookmarkItem }) => (
    <TouchableOpacity
      style={styles.bookmarkCard}
      onPress={() => {
        // Navigate to the actual item (post/listing/event)
        if (item.itemType === 'post') {
          navigation.navigate('PostDetail' as never, { postId: item.itemId } as never);
        } else if (item.itemType === 'listing') {
          navigation.navigate('ListingDetail' as never, { listingId: item.itemId } as never);
        } else if (item.itemType === 'event') {
          navigation.navigate('EventDetail' as never, { eventId: item.itemId } as never);
        }
      }}
    >
      <View style={styles.bookmarkContent}>
        <MaterialCommunityIcons
          name={
            item.itemType === 'post'
              ? 'post'
              : item.itemType === 'listing'
              ? 'tag'
              : 'calendar'
          }
          size={24}
          color="#00A651"
        />
        <View style={styles.bookmarkInfo}>
          <Text style={styles.bookmarkType}>
            {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
          </Text>
          <Text style={styles.bookmarkDate}>
            Saved {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveBookmark(item)}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons name="close" size={20} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {bookmarkType === 'post'
            ? 'Bookmarked Posts'
            : bookmarkType === 'listing'
            ? 'Saved Deals'
            : 'Saved Events'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bookmark-off" size={64} color="#8E8E8E" />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>
            Bookmark posts, deals, and events to find them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00A651"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && page > 1 ? (
              <ActivityIndicator size="small" color="#00A651" style={styles.footer} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  bookmarkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookmarkInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bookmarkType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    paddingVertical: 20,
  },
});

