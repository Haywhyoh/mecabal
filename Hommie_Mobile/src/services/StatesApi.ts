// MeCabal States API Service
// Handles fetching Nigerian states from the backend database

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/environment';

// API Base Configuration
const API_BASE_URL = ENV.API.BASE_URL;
const API_TIMEOUT = ENV.API.TIMEOUT;

// States API endpoints
const STATES_ENDPOINTS = {
  BASE: '/states',
} as const;

// State interface matching the backend State entity
export interface State {
  id: number;
  name: string;
  code: string;
  createdAt: string;
}

// API client helper
class StatesApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');

      // Debug token retrieval
      if (token) {
        console.log(`🔐 Retrieved token for ${endpoint}:`, token.substring(0, 50) + '...');
      } else {
        console.log(`🔓 Public endpoint ${endpoint} (no token needed)`);
      }

      const config: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const duration = Date.now() - startTime;

      console.log(`🌐 ${config.method} ${endpoint} - ${response.status} (${duration}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Request failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

// Main States API Class
export class StatesApi {
  // Get all Nigerian states
  static async getStates(): Promise<State[]> {
    return StatesApiClient.makeRequest<State[]>(STATES_ENDPOINTS.BASE);
  }

  // Get states as a simple array of strings (for backward compatibility)
  static async getStateNames(): Promise<string[]> {
    const states = await this.getStates();
    return states.map(state => state.name);
  }

  // Get state by code
  static async getStateByCode(code: string): Promise<State | null> {
    const states = await this.getStates();
    return states.find(state => state.code === code) || null;
  }

  // Get state by name
  static async getStateByName(name: string): Promise<State | null> {
    const states = await this.getStates();
    return states.find(state => state.name === name) || null;
  }
}

// Error handling utility
export const handleStatesApiError = (error: any): string => {
  console.error('States API Error:', error);
  
  if (error.message?.includes('Network request failed')) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.message?.includes('API Error: 500')) {
    return 'Server error. Please try again later.';
  }
  
  if (error.message?.includes('API Error: 404')) {
    return 'States not found.';
  }
  
  return error.message || 'An unexpected error occurred while fetching states.';
};

export default StatesApi;

