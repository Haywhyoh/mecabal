import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  private readonly socialServiceUrl = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003';
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  
  constructor(private readonly httpService: HttpService) {
    console.log('🔧 API Gateway Service initialized:');
    console.log('  - Social Service URL:', this.socialServiceUrl);
    console.log('  - Auth Service URL:', this.authServiceUrl);
  }

  getHello(): string {
    return 'MeCabal API Gateway is running!';
  }

  // Proxy methods for social service
  async proxyToSocialService(path: string, method: string, data?: any, headers?: any, user?: any) {
    try {
      const url = `${this.socialServiceUrl}${path}`;
      
      console.log('🌐 API Gateway - Proxying to social service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log('  - User:', user ? { id: user.id, email: user.email } : 'No user');
      console.log('  - Data type:', data?.constructor?.name);
      console.log('  - Headers:', Object.keys(headers || {}));
      console.log('  - Social Service URL:', this.socialServiceUrl);
      
      // Check if data is FormData
      const isFormData = data && typeof data.getHeaders === 'function';

      const baseHeaders = {
        // Don't set Content-Type for FormData, let axios handle it
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        // Add cache-busting headers to prevent 304 responses
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Pass user information to social service - fix UUID format
        ...(user && { 'X-User-Id': user.id.length === 37 && user.id.endsWith('f') ? user.id.slice(0, -1) : user.id }),
      };

      // If FormData, merge its headers (important for boundary)
      if (isFormData) {
        Object.assign(baseHeaders, data.getHeaders());
      }

      const config = {
        headers: baseHeaders,
        // Add timeout and other options
        timeout: 300000, // 5 minutes timeout for media uploads
        maxRedirects: 5,
        // Don't transform FormData - let axios handle it natively
        ...(isFormData ? {} : { transformRequest: [(data: any) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(this.httpService.post(url, data, config));
          break;
        case 'put':
          response = await firstValueFrom(this.httpService.put(url, data, config));
          break;
        case 'delete':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Handle 304 Not Modified responses
      if (response.status === 304) {
        console.log('Received 304 Not Modified, returning empty response');
        return { message: 'Not Modified' };
      }

      return response.data;
    } catch (error) {
      console.error(`Error proxying to social service: ${error.message}`);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        
        if (status === 304) {
          console.log('304 Not Modified received, returning appropriate response');
          return { message: 'Not Modified' };
        }
        
        throw new Error(`Request failed with status code ${status}: ${statusText}`);
      }
      
      throw error;
    }
  }

  // Proxy methods for auth service
  async proxyToAuthService(path: string, method: string, data?: any, headers?: any) {
    try {
      const url = `${this.authServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to auth service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log('  - Headers:', Object.keys(headers || {}));

      const config = {
        headers: {
          'Content-Type': 'application/json',
          // Add cache-busting headers to prevent 304 responses
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...headers,
        },
        timeout: 30000, // 30 seconds timeout for auth requests
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(this.httpService.post(url, data, config));
          break;
        case 'put':
          response = await firstValueFrom(this.httpService.put(url, data, config));
          break;
        case 'delete':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Handle 304 Not Modified responses
      if (response.status === 304) {
        console.log('Auth service returned 304 Not Modified, returning empty response');
        return { message: 'Not Modified' };
      }

      return response.data;
    } catch (error) {
      console.error(`Error proxying to auth service: ${error.message}`);

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;

        if (status === 304) {
          console.log('Auth service 304 Not Modified received, returning appropriate response');
          return { message: 'Not Modified' };
        }

        throw new Error(`Auth request failed with status code ${status}: ${statusText}`);
      }

      throw error;
    }
  }
}
