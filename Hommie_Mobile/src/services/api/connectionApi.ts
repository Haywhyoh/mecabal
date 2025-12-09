import { apiClient } from './apiClient';

// Types matching backend DTOs
export interface NeighborProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profilePicture?: string;
  estate?: string;
  building?: string;
  apartment?: string;
  isVerified: boolean;
  verificationLevel: string;
  trustScore: number;
  connectionStats: {
    totalConnections: number;
    trustedConnections: number;
    mutualConnections: number;
    followerCount: number;
    followingCount: number;
  };
  badges: string[];
  interests: string[];
  bio?: string;
  lastSeen?: string;
}

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  connectionType: 'connect' | 'follow' | 'trusted' | 'neighbor' | 'colleague' | 'family';
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  initiatedBy: string;
  createdAt: string;
  acceptedAt?: string;
  metadata?: Record<string, any>;
  neighbor: NeighborProfile;
  mutualConnections?: number;
}

export interface ConnectionRequest {
  incoming: Connection[];
  outgoing: Connection[];
}

export interface ConnectionRecommendation {
  id: string;
  neighbor: NeighborProfile;
  recommendationScore: number;
  reasons: Array<{
    type: string;
    description: string;
    strength: number;
  }>;
  mutualConnections?: NeighborProfile[];
  sharedInterests: string[];
  proximityInfo: {
    distance: number;
    location: string;
    sameBuilding: boolean;
    sameEstate: boolean;
  };
}

export interface ConnectionFilter {
  connectionType?: 'connect' | 'follow' | 'trusted' | 'neighbor' | 'colleague' | 'family';
  status?: 'pending' | 'accepted' | 'rejected' | 'blocked';
  estateId?: string;
  neighborhoodId?: string;
  lgaId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedConnections {
  data: Connection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateConnectionRequest {
  toUserId: string;
  connectionType: 'connect' | 'follow' | 'trusted' | 'neighbor' | 'colleague' | 'family';
  metadata?: Record<string, any>;
}

class ConnectionApi {
  private basePath = '/social/connections';

  /**
   * Get user's connections with optional filters
   */
  async getConnections(filter?: ConnectionFilter): Promise<PaginatedConnections> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString() 
        ? `${this.basePath}?${queryParams.toString()}`
        : this.basePath;

      return await apiClient.get<PaginatedConnections>(url);
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  /**
   * Get connection requests (incoming and outgoing)
   */
  async getConnectionRequests(): Promise<ConnectionRequest> {
    try {
      return await apiClient.get<ConnectionRequest>(`${this.basePath}/requests`);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      throw error;
    }
  }

  /**
   * Get connection recommendations
   */
  async getRecommendations(limit: number = 10): Promise<ConnectionRecommendation[]> {
    try {
      return await apiClient.get<ConnectionRecommendation[]>(
        `${this.basePath}/recommendations?limit=${limit}`
      );
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Send a connection request
   */
  async sendConnectionRequest(
    request: CreateConnectionRequest
  ): Promise<Connection> {
    try {
      return await apiClient.post<Connection>(
        `${this.basePath}/request`,
        request
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Accept a connection request
   */
  async acceptConnection(connectionId: string): Promise<Connection> {
    try {
      return await apiClient.post<Connection>(
        `${this.basePath}/${connectionId}/accept`
      );
    } catch (error) {
      console.error('Error accepting connection:', error);
      throw error;
    }
  }

  /**
   * Reject a connection request
   */
  async rejectConnection(connectionId: string): Promise<void> {
    try {
      return await apiClient.post<void>(
        `${this.basePath}/${connectionId}/reject`
      );
    } catch (error) {
      console.error('Error rejecting connection:', error);
      throw error;
    }
  }

  /**
   * Remove or block a connection
   */
  async removeConnection(connectionId: string): Promise<void> {
    try {
      return await apiClient.delete<void>(`${this.basePath}/${connectionId}`);
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Discover neighbors by location
   */
  async discoverNeighbors(filter?: ConnectionFilter): Promise<PaginatedConnections> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString() 
        ? `${this.basePath}/discover?${queryParams.toString()}`
        : `${this.basePath}/discover`;

      return await apiClient.get<PaginatedConnections>(url);
    } catch (error) {
      console.error('Error discovering neighbors:', error);
      throw error;
    }
  }

  /**
   * Get mutual connections with a user
   */
  async getMutualConnections(userId: string): Promise<NeighborProfile[]> {
    try {
      return await apiClient.get<NeighborProfile[]>(
        `${this.basePath}/mutual/${userId}`
      );
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
      throw error;
    }
  }
}

export const connectionApi = new ConnectionApi();
export default connectionApi;

