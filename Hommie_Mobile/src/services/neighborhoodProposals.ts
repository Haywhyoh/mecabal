import { supabase, handleSupabaseError, logPerformance } from './supabase';

export interface NeighborhoodProposal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  state_name: string;
  lga?: string;
  center_latitude: number;
  center_longitude: number;
  proposed_radius_km: number;
  neighborhood_type: 'estate' | 'traditional_area' | 'road_based' | 'landmark_based' | 'transport_hub' | 'market_based';
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  landmarks: any[];
  businesses: any[];
  photos: string[];
  supporting_documents: any;
  supporters_count: number;
  supporters: any[];
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalData {
  name: string;
  description?: string;
  state_name: string;
  lga?: string;
  center_latitude: number;
  center_longitude: number;
  proposed_radius_km?: number;
  neighborhood_type?: 'estate' | 'traditional_area' | 'road_based' | 'landmark_based' | 'transport_hub' | 'market_based';
  landmarks?: any[];
  businesses?: any[];
  photos?: string[];
  supporting_documents?: any;
}

export interface NearbyProposal {
  id: string;
  name: string;
  description?: string;
  state_name: string;
  lga?: string;
  center_latitude: number;
  center_longitude: number;
  proposed_radius_km: number;
  neighborhood_type: string;
  status: string;
  supporters_count: number;
  distance_km: number;
  created_at: string;
}

export class NeighborhoodProposalsService {
  /**
   * Create a new neighborhood proposal
   */
  static async createProposal(
    proposalData: CreateProposalData,
    userId: string
  ): Promise<{
    success: boolean;
    data?: NeighborhoodProposal;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('neighborhood_proposals')
        .insert({
          user_id: userId,
          name: proposalData.name,
          description: proposalData.description,
          state_name: proposalData.state_name,
          lga: proposalData.lga,
          center_latitude: proposalData.center_latitude,
          center_longitude: proposalData.center_longitude,
          proposed_radius_km: proposalData.proposed_radius_km || 2.0,
          neighborhood_type: proposalData.neighborhood_type || 'traditional_area',
          landmarks: proposalData.landmarks || [],
          businesses: proposalData.businesses || [],
          photos: proposalData.photos || [],
          supporting_documents: proposalData.supporting_documents || {},
          status: 'pending'
        })
        .select()
        .single();

      logPerformance('createProposal', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NeighborhoodProposal
      };
    } catch (error: any) {
      logPerformance('createProposal', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Get nearby neighborhood proposals
   */
  static async getNearbyProposals(
    latitude: number,
    longitude: number,
    radiusKm: number = 10.0
  ): Promise<{
    success: boolean;
    data?: NearbyProposal[];
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('get_nearby_proposals', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm
      });

      logPerformance('getNearbyProposals', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NearbyProposal[]
      };
    } catch (error: any) {
      logPerformance('getNearbyProposals', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Get user's proposals
   */
  static async getUserProposals(
    userId: string
  ): Promise<{
    success: boolean;
    data?: NeighborhoodProposal[];
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('neighborhood_proposals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      logPerformance('getUserProposals', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NeighborhoodProposal[]
      };
    } catch (error: any) {
      logPerformance('getUserProposals', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Get proposal by ID
   */
  static async getProposal(
    proposalId: string
  ): Promise<{
    success: boolean;
    data?: NeighborhoodProposal;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('neighborhood_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      logPerformance('getProposal', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NeighborhoodProposal
      };
    } catch (error: any) {
      logPerformance('getProposal', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Support a neighborhood proposal
   */
  static async supportProposal(
    proposalId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('support_neighborhood_proposal', {
        proposal_id: proposalId,
        user_id: userId
      });

      logPerformance('supportProposal', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Already supported this proposal'
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      logPerformance('supportProposal', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Withdraw support from a neighborhood proposal
   */
  static async withdrawSupport(
    proposalId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('withdraw_support_neighborhood_proposal', {
        proposal_id: proposalId,
        user_id: userId
      });

      logPerformance('withdrawSupport', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'You have not supported this proposal'
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      logPerformance('withdrawSupport', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Update a proposal (only if pending)
   */
  static async updateProposal(
    proposalId: string,
    updates: Partial<CreateProposalData>,
    userId: string
  ): Promise<{
    success: boolean;
    data?: NeighborhoodProposal;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // First check if user owns the proposal and it's pending
      const { data: existingProposal, error: fetchError } = await supabase
        .from('neighborhood_proposals')
        .select('user_id, status')
        .eq('id', proposalId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: handleSupabaseError(fetchError)
        };
      }

      if (existingProposal.user_id !== userId) {
        return {
          success: false,
          error: 'You can only update your own proposals'
        };
      }

      if (existingProposal.status !== 'pending') {
        return {
          success: false,
          error: 'You can only update pending proposals'
        };
      }

      const { data, error } = await supabase
        .from('neighborhood_proposals')
        .update(updates)
        .eq('id', proposalId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      logPerformance('updateProposal', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NeighborhoodProposal
      };
    } catch (error: any) {
      logPerformance('updateProposal', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Delete a proposal (only if pending)
   */
  static async deleteProposal(
    proposalId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('neighborhood_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      logPerformance('deleteProposal', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      logPerformance('deleteProposal', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Get all proposals (admin only)
   */
  static async getAllProposals(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    success: boolean;
    data?: NeighborhoodProposal[];
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      let query = supabase
        .from('neighborhood_proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      logPerformance('getAllProposals', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NeighborhoodProposal[]
      };
    } catch (error: any) {
      logPerformance('getAllProposals', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Check if user has supported a proposal
   */
  static async hasUserSupported(
    proposalId: string,
    userId: string
  ): Promise<{
    success: boolean;
    supported?: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('neighborhood_proposals')
        .select('supporters')
        .eq('id', proposalId)
        .single();

      logPerformance('hasUserSupported', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      const supported = data.supporters ? data.supporters[userId] !== undefined : false;

      return {
        success: true,
        supported
      };
    } catch (error: any) {
      logPerformance('hasUserSupported', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }
}

