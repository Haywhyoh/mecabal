// API Connection Test
// This file tests the API connection and authentication

import { verificationService } from './verificationService';
import { userProfileService } from './userProfileService';
import { apiClient } from './api/apiClient';
import { ENV } from '../config/environment';

export class ApiConnectionTest {
  /**
   * Test basic API connectivity
   */
  static async testBasicConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔧 Testing API connection...');
      console.log('API Base URL:', ENV.API.BASE_URL);
      
      // Test if the API is reachable
      const response = await apiClient.get('/health');
      
      return {
        success: true,
        message: 'API connection successful',
        details: response
      };
    } catch (error: any) {
      console.error('❌ API connection failed:', error);
      
      return {
        success: false,
        message: 'API connection failed',
        details: {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      };
    }
  }

  /**
   * Test authentication status
   */
  static async testAuthentication(): Promise<{
    success: boolean;
    message: string;
    isAuthenticated: boolean;
    token?: string;
  }> {
    try {
      console.log('🔐 Testing authentication...');
      
      const isAuthenticated = await apiClient.isAuthenticated();
      const token = await apiClient.getAccessToken();
      
      if (isAuthenticated && token) {
        return {
          success: true,
          message: 'User is authenticated',
          isAuthenticated: true,
          token: token.substring(0, 20) + '...' // Show only first 20 chars
        };
      } else {
        return {
          success: false,
          message: 'User is not authenticated',
          isAuthenticated: false
        };
      }
    } catch (error: any) {
      console.error('❌ Authentication test failed:', error);
      
      return {
        success: false,
        message: 'Authentication test failed',
        isAuthenticated: false,
        token: undefined
      };
    }
  }

  /**
   * Test verification service endpoints
   */
  static async testVerificationService(): Promise<{
    success: boolean;
    message: string;
    tests: Array<{ name: string; success: boolean; message: string }>;
  }> {
    const tests = [];
    
    try {
      console.log('🔍 Testing verification service...');
      
      // Test 1: Get trust score (should work even without auth for some endpoints)
      try {
        await verificationService.getTrustScore();
        tests.push({ name: 'Get Trust Score', success: true, message: 'Success' });
      } catch (error: any) {
        tests.push({ 
          name: 'Get Trust Score', 
          success: false, 
          message: error.message || 'Failed' 
        });
      }
      
      // Test 2: Get user badges
      try {
        await verificationService.getUserBadges();
        tests.push({ name: 'Get User Badges', success: true, message: 'Success' });
      } catch (error: any) {
        tests.push({ 
          name: 'Get User Badges', 
          success: false, 
          message: error.message || 'Failed' 
        });
      }
      
      const successCount = tests.filter(t => t.success).length;
      const totalTests = tests.length;
      
      return {
        success: successCount > 0,
        message: `${successCount}/${totalTests} verification service tests passed`,
        tests
      };
    } catch (error: any) {
      console.error('❌ Verification service test failed:', error);
      
      return {
        success: false,
        message: 'Verification service test failed',
        tests: [{ name: 'Overall Test', success: false, message: error.message }]
      };
    }
  }

  /**
   * Test user profile service endpoints
   */
  static async testUserProfileService(): Promise<{
    success: boolean;
    message: string;
    tests: Array<{ name: string; success: boolean; message: string }>;
  }> {
    const tests = [];
    
    try {
      console.log('👤 Testing user profile service...');
      
      // Test 1: Get current user profile (requires auth)
      try {
        await userProfileService.getCurrentUserProfile();
        tests.push({ name: 'Get Current User Profile', success: true, message: 'Success' });
      } catch (error: any) {
        tests.push({ 
          name: 'Get Current User Profile', 
          success: false, 
          message: error.message || 'Failed' 
        });
      }
      
      // Test 2: Get dashboard stats
      try {
        await userProfileService.getDashboardStats();
        tests.push({ name: 'Get Dashboard Stats', success: true, message: 'Success' });
      } catch (error: any) {
        tests.push({ 
          name: 'Get Dashboard Stats', 
          success: false, 
          message: error.message || 'Failed' 
        });
      }
      
      const successCount = tests.filter(t => t.success).length;
      const totalTests = tests.length;
      
      return {
        success: successCount > 0,
        message: `${successCount}/${totalTests} user profile service tests passed`,
        tests
      };
    } catch (error: any) {
      console.error('❌ User profile service test failed:', error);
      
      return {
        success: false,
        message: 'User profile service test failed',
        tests: [{ name: 'Overall Test', success: false, message: error.message }]
      };
    }
  }

  /**
   * Run all API tests
   */
  static async runAllTests(): Promise<{
    overall: boolean;
    results: {
      connection: any;
      authentication: any;
      verification: any;
      userProfile: any;
    };
    summary: string;
  }> {
    console.log('🚀 Starting comprehensive API tests...');
    
    const [connection, authentication, verification, userProfile] = await Promise.all([
      this.testBasicConnection(),
      this.testAuthentication(),
      this.testVerificationService(),
      this.testUserProfileService()
    ]);
    
    const overall = connection.success && authentication.success;
    
    const summary = `
API Test Results:
================
✅ Connection: ${connection.success ? 'PASS' : 'FAIL'} - ${connection.message}
✅ Authentication: ${authentication.success ? 'PASS' : 'FAIL'} - ${authentication.message}
✅ Verification Service: ${verification.success ? 'PASS' : 'FAIL'} - ${verification.message}
✅ User Profile Service: ${userProfile.success ? 'PASS' : 'FAIL'} - ${userProfile.message}

Overall Status: ${overall ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
    `.trim();
    
    console.log(summary);
    
    return {
      overall,
      results: {
        connection,
        authentication,
        verification,
        userProfile
      },
      summary
    };
  }
}

// Export for easy testing
export default ApiConnectionTest;
