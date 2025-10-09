import { useState, useEffect, useCallback, useRef } from 'react';
import { PostsService, Post, PostFilter } from '../services/postsService';
import { EventsApi, Event, EventFilterDto } from '../services/EventsApi';
import { OfflineService } from '../services/offlineService';

export interface FeedItem {
  id: string;
  type: 'post' | 'event';
  data: Post | Event;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedFeedState {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface UnifiedFeedOptions {
  initialFilter?: PostFilter & { postType?: string };
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useUnifiedFeed = (options: UnifiedFeedOptions = {}) => {
  const {
    initialFilter = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [state, setState] = useState<UnifiedFeedState>({
    items: [],
    loading: false,
    refreshing: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  const [filter, setFilter] = useState<PostFilter & { postType?: string }>(initialFilter);
  const postsService = PostsService.getInstance();
  const offlineService = OfflineService.getInstance();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const startAutoRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            refreshFeed();
            startAutoRefresh(); // Schedule next refresh
          }
        }, refreshInterval);
      };

      startAutoRefresh();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Load initial content
  useEffect(() => {
    loadContent(true);
  }, [filter]);

  // Helper function to deduplicate items by ID
  const deduplicateItems = useCallback((items: FeedItem[]): FeedItem[] => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, []);

  // Helper function to convert posts and events to unified feed items
  const convertToFeedItems = useCallback((posts: Post[], events: Event[]): FeedItem[] => {
    const postItems: FeedItem[] = posts.map(post => ({
      id: `post-${post.id}`,
      type: 'post' as const,
      data: post,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: post.updatedAt || new Date().toISOString(),
    }));

    const eventItems: FeedItem[] = events.map(event => ({
      id: `event-${event.id}`,
      type: 'event' as const,
      data: event,
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: event.updatedAt || new Date().toISOString(),
    }));

    // Combine and sort by creation date (newest first)
    return [...postItems, ...eventItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const loadContent = useCallback(async (reset = false) => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      loading: !reset,
      refreshing: reset,
      error: null,
    }));

    try {
      const currentPage = reset ? 1 : state.page;
      const limit = 20;

      let posts: Post[] = [];
      let events: Event[] = [];

      // Determine what to fetch based on filter
      const shouldFetchPosts = !filter.postType || filter.postType === 'all' || filter.postType !== 'event';
      const shouldFetchEvents = !filter.postType || filter.postType === 'all' || filter.postType === 'event';

      // Fetch posts if needed
      if (shouldFetchPosts) {
        const postsFilter = {
          ...filter,
          page: currentPage,
          limit: filter.postType === 'event' ? 0 : limit, // Don't fetch posts if only events are requested
        };

        if (filter.postType !== 'event') {
          try {
            const result = await postsService.getPosts(postsFilter);
            posts = result.data || [];
          } catch (error) {
            console.error('Error loading posts:', error);
            // Continue with events even if posts fail
          }
        }
      }

      // Fetch events if needed
      if (shouldFetchEvents) {
        try {
          const eventFilter: EventFilterDto = {
            page: currentPage,
            limit: filter.postType === 'event' ? limit : Math.max(0, limit - posts.length),
            search: filter.search,
          };

          const result = await EventsApi.getEvents(eventFilter);
          events = result.data || [];
        } catch (error) {
          console.error('Error loading events:', error);
          // Continue with posts even if events fail
        }
      }

      if (!isMountedRef.current) return;

      // Convert to unified feed items
      const newItems = convertToFeedItems(posts, events);
      const combinedItems = reset ? newItems : [...state.items, ...newItems];
      const deduplicatedItems = deduplicateItems(combinedItems);

      setState(prev => ({
        ...prev,
        items: deduplicatedItems,
        loading: false,
        refreshing: false,
        hasMore: newItems.length === limit, // Assume there's more if we got a full page
        page: reset ? 1 : prev.page + 1,
        error: null,
      }));

    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error loading content:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load content',
      }));
    }
  }, [filter, state.page, postsService, convertToFeedItems, deduplicateItems]);

  const refreshFeed = useCallback(() => {
    loadContent(true);
  }, [loadContent]);

  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadContent(false);
    }
  }, [state.loading, state.hasMore, loadContent]);

  const updateFilter = useCallback((newFilter: Partial<PostFilter & { postType?: string }>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const searchContent = useCallback(async (query: string) => {
    if (!query.trim()) {
      updateFilter({ search: undefined });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [posts, eventsResult] = await Promise.all([
        postsService.searchPosts(query, filter),
        EventsApi.getEvents({ search: query, limit: 10 })
      ]);
      
      if (!isMountedRef.current) return;

      const events = eventsResult.data || [];
      const searchItems = convertToFeedItems(posts, events);

      setState(prev => ({
        ...prev,
        items: searchItems,
        loading: false,
        hasMore: false, // Search results don't have pagination
        page: 1,
        error: null,
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error searching content:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  }, [filter, postsService, convertToFeedItems, updateFilter]);

  // Post actions
  const likePost = useCallback(async (postId: string) => {
    try {
      await postsService.likePost(postId);
      
      if (!isMountedRef.current) return;

      // Update the post in the state
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.type === 'post' && item.id === `post-${postId}` 
            ? {
                ...item,
                data: {
                  ...item.data as Post,
                  engagement: {
                    ...(item.data as Post).engagement,
                    reactionsCount: (item.data as Post).engagement.reactionsCount + 1,
                    userReaction: 'like'
                  }
                }
              }
            : item
        )
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to like post',
      }));
    }
  }, [postsService]);

  const commentOnPost = useCallback(async (postId: string, content: string) => {
    try {
      await postsService.createComment(postId, { content });
      
      if (!isMountedRef.current) return;

      // Update the post's comment count
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.type === 'post' && item.id === `post-${postId}` 
            ? {
                ...item,
                data: {
                  ...item.data as Post,
                  engagement: {
                    ...(item.data as Post).engagement,
                    commentsCount: (item.data as Post).engagement.commentsCount + 1
                  }
                }
              }
            : item
        )
      }));
    } catch (error) {
      console.error('Error commenting on post:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to comment on post',
      }));
    }
  }, [postsService]);

  const sharePost = useCallback(async (post: Post) => {
    try {
      // Update the post's share count
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.type === 'post' && item.data.id === post.id 
            ? {
                ...item,
                data: {
                  ...item.data as Post,
                  engagement: {
                    ...(item.data as Post).engagement,
                    sharesCount: (item.data as Post).engagement.sharesCount + 1
                  }
                }
              }
            : item
        )
      }));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, []);

  const reportPost = useCallback(async (postId: string, reason: string) => {
    try {
      // TODO: Implement report API call when backend is ready
      console.log('Reporting post:', postId, reason);
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  }, []);

  const editPost = useCallback(async (post: Post) => {
    try {
      // TODO: Implement edit functionality
      console.log('Editing post:', post.id);
    } catch (error) {
      console.error('Error editing post:', error);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      await postsService.deletePost(postId);
      
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== `post-${postId}`),
      }));
    } catch (error) {
      console.error('Error deleting post:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      }));
    }
  }, [postsService]);

  const getPostById = useCallback(async (postId: string): Promise<Post> => {
    try {
      return await postsService.getPostById(postId);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  }, [postsService]);

  const bookmarkPost = useCallback(async (postId: string): Promise<void> => {
    try {
      await postsService.bookmarkPost(postId);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      throw error;
    }
  }, [postsService]);

  const unbookmarkPost = useCallback(async (postId: string): Promise<void> => {
    try {
      await postsService.unbookmarkPost(postId);
    } catch (error) {
      console.error('Error unbookmarking post:', error);
      throw error;
    }
  }, [postsService]);

  return {
    // State
    items: state.items,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    hasMore: state.hasMore,
    filter,

    // Actions
    loadMore,
    refreshFeed,
    updateFilter,
    clearFilter,
    searchContent,
    likePost,
    commentOnPost,
    sharePost,
    reportPost,
    editPost,
    deletePost,
    getPostById,
    bookmarkPost,
    unbookmarkPost,
  };
};

export default useUnifiedFeed;
