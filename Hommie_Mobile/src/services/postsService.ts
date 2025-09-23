import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';

// Types
export interface Post {
  id: string;
  title?: string;
  content: string;
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
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
}

export interface CreatePostRequest {
  title?: string;
  content: string;
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
  privacyLevel: 'neighborhood' | 'group' | 'public';
  categoryId?: number;
  expiresAt?: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  isPinned?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  postType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
  privacyLevel?: 'neighborhood' | 'group' | 'public';
  categoryId?: number;
  expiresAt?: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>;
  isPinned?: boolean;
}

export interface PostFilter {
  page?: number;
  limit?: number;
  postType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
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

      return await this.ge