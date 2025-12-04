import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';

// Types
export interface Post {
  id: string;
  title?: string;
  content: string;
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
  privacyLevel: 'neighborhood' | 'group' | 'public';
  isPinned: boolean;
  isApproved: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    trustScore: number;
    phoneNumber?: string;
    phoneVerified?: boolean;
    identityVerified?: boolean;
    addressVerified?: boolean;
    email?: string;
    emailVerified?: boolean;
    dateOfBirth?: string;
    gender?: string;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
    iconUrl?: string;
    colorCode?: string;
  };
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  engagement: {
    reactionsCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    userReaction?: string;
  };
  isVisible: boolean;
  isExpired: boolean;
  // Help-specific fields - Updated with new categories
  helpCategory?: 'errand' | 'task' | 'recommendation' | 'advice' | 'borrow';
  urgency?: 'low' | 'medium' | 'high';
  budget?: string;
  deadline?: string;
}

export interface CreatePostRequest {
  title?: string;
  content: string;
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
  privacyLevel: 'neighborhood' | 'group' | 'public';
  categoryId?: number;
  expiresAt?: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  isPinned?: boolean;
  // Help-specific fields
  helpCategory?: string;
  urgency?: string;
  budget?: string;
  deadline?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  postType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
  privacyLevel?: 'neighborhood' | 'group' | 'public';
  categoryId?: number;
  expiresAt?: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  isPinned?: boolean;
  // Help-specific fields
  helpCategory?: string;
  urgency?: string;
  budget?: string;
  deadline?: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    trustScore?: number;
  };
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  parentCommentId?: string;
  replies?: Comment[];
  likesCount: number;
  userLiked: boolean;
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  isApproved: boolean;
  isReply: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
  createdAt: string;
}

export interface PostFilter {
  page?: number;
  limit?: number;
  postType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
  privacyLevel?: 'neighborhood' | 'group' | 'public';
  categoryId?: number;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  isPinned?: boolean;
  isApproved?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  colorCode?: string;
  isActive: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export class PostsService {
  private static instance: PostsService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): PostsService {
    if (!PostsService.instance) {
      PostsService.instance = new PostsService();
    }
    return PostsService.instance;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    console.log('🔧 PostsService: Getting auth headers...');
    console.log('🔧 MeCabalAuth object:', MeCabalAuth);
    const token = await MeCabalAuth.getAuthToken();
    console.log('🔧 Retrieved token:', token ? 'Token exists' : 'No token');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostRequest): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.POSTS.CREATE}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(filter: PostFilter = {}): Promise<PaginatedPosts> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}${API_ENDPOINTS.POSTS.GET_ALL}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 504) {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Try to parse error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch posts (${response.status})`);
        } catch (parseError) {
          throw new Error(`Failed to fetch posts (${response.status} ${response.statusText})`);
        }
      }

      return await response.json();
    } catch (error) {
      // Preserve original error message if it's already user-friendly
      if (error instanceof Error && error.message) {
        console.error('Error fetching posts:', error.message);
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error fetching posts:', error);
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts. Please try again.');
    }
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.POSTS.GET_BY_ID}/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new Error('Failed to fetch post');
    }
  }

  /**
   * Update a post
   */
  async updatePost(id: string, updates: UpdatePostRequest): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.POSTS.UPDATE}/${id}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update post');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.POSTS.DELETE}/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  /**
   * Pin or unpin a post
   */
  async pinPost(id: string, isPinned: boolean): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.POSTS.PIN}/${id}/pin?isPinned=${isPinned}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to pin post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error pinning post:', error);
      throw new Error('Failed to pin post');
    }
  }

  /**
   * Get post categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CATEGORIES.GET_ALL}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, filter: Omit<PostFilter, 'search'> = {}): Promise<Post[]> {
    try {
      const searchFilter: PostFilter = {
        ...filter,
        search: query,
      };

      const result = await this.getPosts(searchFilter);
      return result.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw new Error('Failed to search posts');
    }
  }

  /**
   * Get user's own posts
   */
  async getMyPosts(filter: Omit<PostFilter, 'userId'> = {}): Promise<PaginatedPosts> {
    try {
      const myPostsFilter: PostFilter = {
        ...filter,
        userId: 'me', // This will be handled by the backend
      };

      return await this.getPosts(myPostsFilter);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw new Error('Failed to fetch my posts');
    }
  }

  /**
   * Get comments for a post
   */
  /**
   * Transform backend comment response to frontend format
   */
  private transformComment(backendComment: any): Comment {
    return {
      id: backendComment.id,
      postId: backendComment.postId,
      content: backendComment.content,
      author: {
        id: backendComment.user?.id || backendComment.userId,
        firstName: backendComment.user?.firstName || '',
        lastName: backendComment.user?.lastName || '',
        profilePicture: backendComment.user?.profilePicture,
        isVerified: backendComment.user?.isVerified || false,
        trustScore: backendComment.user?.trustScore || 0,
      },
      createdAt: backendComment.createdAt,
      updatedAt: backendComment.updatedAt,
      isEdited: backendComment.createdAt !== backendComment.updatedAt,
      parentCommentId: backendComment.parentCommentId,
      replies: backendComment.replies?.map((reply: any) => this.transformComment(reply)) || [],
      likesCount: 0, // TODO: Add when backend supports likes
      userLiked: false, // TODO: Add when backend supports likes
      media: backendComment.media || [],
      isApproved: backendComment.isApproved,
      isReply: backendComment.isReply || false,
    };
  }

  async getComments(postId: string, page: number = 1, limit: number = 20): Promise<{ data: Comment[]; hasNext: boolean; total: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COMMENTS.GET_ALL}/${postId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch comments');
      }

      const backendComments = await response.json();

      // Transform backend response to frontend format
      const transformedComments = backendComments.map((comment: any) => this.transformComment(comment));

      // Since backend doesn't have pagination yet, we simulate it
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedComments = transformedComments.slice(startIndex, endIndex);

      return {
        data: paginatedComments,
        hasNext: endIndex < transformedComments.length,
        total: transformedComments.length,
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Create a comment
   */
  async createComment(postId: string, commentData: CreateCommentRequest): Promise<Comment> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COMMENTS.CREATE}/${postId}`, {
        method: 'POST',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create comment');
      }

      const backendComment = await response.json();
      return this.transformComment(backendComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COMMENTS.UPDATE}/${commentId}`, {
        method: 'PUT',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update comment');
      }

      const backendComment = await response.json();
      return this.transformComment(backendComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COMMENTS.DELETE}/${commentId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string, reactionType: string = 'like'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.REACTIONS.ADD}/${postId}`, {
        method: 'POST',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like post');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.REACTIONS.REMOVE}/${postId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unlike post');
      }
    } catch (error) {
      console.error('Error unliking post:', error);
      throw new Error('Failed to unlike post');
    }
  }

  /**
   * Get post reactions
   */
  async getPostReactions(postId: string): Promise<Reaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.REACTIONS.GET_STATS}/${postId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reactions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reactions:', error);
      throw new Error('Failed to fetch reactions');
    }
  }

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bookmark post');
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      throw new Error('Failed to bookmark post');
    }
  }

  /**
   * Remove bookmark from a post
   */
  async unbookmarkPost(postId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/bookmark`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unbookmark post');
      }
    } catch (error) {
      console.error('Error unbookmarking post:', error);
      throw new Error('Failed to unbookmark post');
    }
  }

  /**
   * Get bookmarked posts
   */
  async getBookmarkedPosts(page: number = 1, limit: number = 20): Promise<PaginatedPosts> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/bookmarked?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookmarked posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      throw new Error('Failed to fetch bookmarked posts');
    }
  }
}

export default PostsService;
