import { useState, useEffect, useCallback, useRef } from 'react';
import { PostsService, Post, PostFilter } from '../services/postsService';
import { OfflineService } from '../services/offlineService';
import { AuthContext } from '../contexts/AuthContext';

export interface FeedState {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface FeedOptions {
  initialFilter?: PostFilter;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useFeed = (options: FeedOptions = {}) => {
  const {
    initialFilter = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [state, setState] = useState<FeedState>({
    posts: [],
    loading: false,
    refreshing: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  const [filter, setFilter] = useState<PostFilter>(initialFilter);
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

  // Load initial posts
  useEffect(() => {
    loadPosts(true);
  }, [filter]);

  // Helper function to deduplicate posts by ID
  const deduplicatePosts = useCallback((posts: Post[]): Post[] => {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.id)) {
        return false;
      }
      seen.add(post.id);
      return true;
    });
  }, []);

  const loadPosts = useCallback(async (reset = false) => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      loading: !reset,
      refreshing: reset,
      error: null,
    }));

    try {
      const currentPage = reset ? 1 : state.page;
      const postsFilter = {
        ...filter,
        page: currentPage,
        limit: 20,
      };

      // Check if we should use cached data
      if (offlineService.shouldUseCache()) {
        const cachedPosts = await offlineService.getCachedPostsWithFilter({
          postType: filter.postType,
          search: filter.search,
          limit: 20,
        });

        if (!isMountedRef.current) return;

        const combinedPosts = reset ? cachedPosts : [...state.posts, ...cachedPosts];
        const deduplicatedPosts = deduplicatePosts(combinedPosts);

        setState(prev => ({
          ...prev,
          posts: deduplicatedPosts,
          loading: false,
          refreshing: false,
          hasMore: false, // Cached data doesn't have pagination
          page: reset ? 1 : prev.page + 1,
          error: null,
        }));

        return;
      }

      // Load from API
      const result = await postsService.getPosts(postsFilter);

      if (!isMountedRef.current) return;

      // Cache the posts for offline use
      if (reset) {
        await offlineService.cachePosts(result.data);
      }

      const combinedPosts = reset ? result.data : [...state.posts, ...result.data];
      const deduplicatedPosts = deduplicatePosts(combinedPosts);

      setState(prev => ({
        ...prev,
        posts: deduplicatedPosts,
        loading: false,
        refreshing: false,
        hasMore: result.hasNext,
        page: reset ? 1 : prev.page + 1,
        error: null,
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error loading posts:', error);
      
      // If online and error, try to load from cache
      if (!offlineService.shouldUseCache()) {
        try {
          const cachedPosts = await offlineService.getCachedPostsWithFilter({
            postType: filter.postType,
            search: filter.search,
            limit: 20,
          });

          if (!isMountedRef.current) return;

          const combinedPosts = reset ? cachedPosts : [...state.posts, ...cachedPosts];
          const deduplicatedPosts = deduplicatePosts(combinedPosts);

          setState(prev => ({
            ...prev,
            posts: deduplicatedPosts,
            loading: false,
            refreshing: false,
            hasMore: false,
            page: reset ? 1 : prev.page + 1,
            error: 'Using cached data due to network error',
          }));

          return;
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      }));
    }
  }, [filter, state.page, postsService, offlineService, deduplicatePosts]);

  const refreshFeed = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadPosts(false);
    }
  }, [state.loading, state.hasMore, loadPosts]);

  const updateFilter = useCallback((newFilter: Partial<PostFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      updateFilter({ search: undefined });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await postsService.searchPosts(query, filter);
      
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        posts: results,
        loading: false,
        hasMore: false, // Search results don't have pagination
        page: 1,
        error: null,
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error searching posts:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  }, [filter, postsService, updateFilter]);

  const likePost = useCallback(async (postId: string) => {
    try {
      await postsService.likePost(postId);
      
      if (!isMountedRef.current) return;

      // Update the post in the state
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId 
            ? {
                ...post,
                engagement: {
                  ...post.engagement,
                  reactionsCount: post.engagement.reactionsCount + 1,
                  userReaction: 'like'
                }
              }
            : post
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
        posts: prev.posts.map(post => 
          post.id === postId 
            ? {
                ...post,
                engagement: {
                  ...post.engagement,
                  commentsCount: post.engagement.commentsCount + 1
                }
              }
            : post
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
        posts: prev.posts.map(p => 
          p.id === post.id 
            ? {
                ...p,
                engagement: {
                  ...p.engagement,
                  sharesCount: p.engagement.sharesCount + 1
                }
              }
            : p
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
      // For now, just log the report
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
        posts: prev.posts.filter(post => post.id !== postId),
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
    posts: state.posts,
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
    searchPosts,
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

export default useFeed;
