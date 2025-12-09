import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { State } from '@app/database';

@Injectable()
export class ApiGatewayService {
  private readonly socialServiceUrl =
    process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003';
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  private readonly marketplaceServiceUrl =
    process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3005';
  private readonly eventsServiceUrl =
    process.env.EVENTS_SERVICE_URL || 'http://localhost:3006';
  private readonly businessServiceUrl =
    process.env.BUSINESS_SERVICE_URL || 'http://localhost:3008';
  private readonly userServiceUrl =
    process.env.USER_SERVICE_URL || 'http://localhost:3002';
  private readonly messagingServiceUrl =
    process.env.MESSAGING_SERVICE_URL || 'http://localhost:3004';
  private readonly locationServiceUrl =
    process.env.LOCATION_SERVICE_URL || 'http://localhost:3007';
  // Payment service is now part of business service

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {
    console.log('🔧 API Gateway Service initialized:');
    console.log('  - Social Service URL:', this.socialServiceUrl);
    console.log('  - Auth Service URL:', this.authServiceUrl);
    console.log('  - Marketplace Service URL:', this.marketplaceServiceUrl);
    console.log('  - Events Service URL:', this.eventsServiceUrl);
    console.log('  - Business Service URL:', this.businessServiceUrl);
    console.log('  - User Service URL:', this.userServiceUrl);
    console.log('  - Messaging Service URL:', this.messagingServiceUrl);
    console.log('  - Location Service URL:', this.locationServiceUrl);
  }

  getHello(): string {
    return 'MeCabal API Gateway is running!';
  }

  // Get all Nigerian states
  async getStates(): Promise<State[]> {
    try {
      const states = await this.stateRepository.find({
        order: { name: 'ASC' },
      });
      return states;
    } catch (error) {
      console.error('Error fetching states:', error);
      throw new Error('Failed to fetch states from database');
    }
  }

  // Proxy methods for social service
  async proxyToSocialService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      const url = `${this.socialServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to social service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );
      console.log('  - Data type:', data?.constructor?.name);
      console.log('  - Headers:', Object.keys(headers || {}));
      console.log('  - Social Service URL:', this.socialServiceUrl);

      // Check if data is FormData
      const isFormData =
        data &&
        typeof (data as { getHeaders?: () => any }).getHeaders === 'function';

      const baseHeaders: Record<string, string> = {
        // Don't set Content-Type for FormData, let axios handle it
        ...(isFormData
          ? {}
          : ({ 'Content-Type': 'application/json' } as Record<string, string>)),
        // Add cache-busting headers to prevent 304 responses
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Pass user information to social service
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      // If FormData, merge its headers (important for boundary)
      if (isFormData) {
        Object.assign(
          baseHeaders,
          (data as { getHeaders: () => Record<string, string> }).getHeaders(),
        );
      }

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        // Add timeout and other options
        timeout: 300000, // 5 minutes timeout for media uploads
        maxRedirects: 5,
        // Don't transform FormData - let axios handle it natively
        ...(isFormData
          ? {}
          : { transformRequest: [(data: unknown) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
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

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to social service: ${errorMessage}`);

      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (
          error as { response: { status: number; statusText: string } }
        ).response;
        const status = response.status;
        const statusText = response.statusText;

        if (status === 304) {
          console.log(
            '304 Not Modified received, returning appropriate response',
          );
          return { message: 'Not Modified' };
        }

        throw new Error(
          `Request failed with status code ${status}: ${statusText}`,
        );
      }

      throw error;
    }
  }

  // Proxy methods for auth service
  async proxyToAuthService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
  ) {
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
          Pragma: 'no-cache',
          Expires: '0',
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
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Handle 304 Not Modified responses
      if (response.status === 304) {
        console.log(
          'Auth service returned 304 Not Modified, returning empty response',
        );
        return { message: 'Not Modified' };
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to auth service: ${errorMessage}`);

      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number;
            statusText?: string;
            data?: any;
          } 
        };
        
        if (axiosError.response) {
          const status = axiosError.response.status || 500;
          const statusText = axiosError.response.statusText || 'Internal Server Error';
          
          if (status === 304) {
            console.log(
              'Auth service 304 Not Modified received, returning appropriate response',
            );
            return { message: 'Not Modified' };
          }

          // Try to extract detailed error message from response data
          let detailedError = statusText;
          if (axiosError.response.data) {
            if (typeof axiosError.response.data === 'string') {
              detailedError = axiosError.response.data;
            } else if (axiosError.response.data.message) {
              detailedError = axiosError.response.data.message;
            } else if (axiosError.response.data.error) {
              detailedError = axiosError.response.data.error;
            } else if (Array.isArray(axiosError.response.data) && axiosError.response.data.length > 0) {
              // Handle validation errors array
              detailedError = axiosError.response.data.join(', ');
            } else {
              detailedError = JSON.stringify(axiosError.response.data);
            }
          }

          const error = new Error(
            `Auth request failed with status code ${status}: ${detailedError}`,
          );
          (error as any).statusCode = status;
          throw error;
        }
      }

      throw error;
    }
  }

  // Proxy methods for marketplace service
  async proxyToMarketplaceService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      const url = `${this.marketplaceServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to marketplace service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log('  - Data:', data);
      console.log('  - Data type:', typeof data);
      console.log('  - Data stringified:', JSON.stringify(data, null, 2));
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );

      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Forward the original Authorization header for JWT authentication
        ...(headers && headers.authorization && {
          'Authorization': Array.isArray(headers.authorization) 
            ? headers.authorization[0] 
            : headers.authorization,
        }),
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        timeout: 60000,
        maxRedirects: 5,
        // Only apply transformRequest for non-string data to avoid double-stringification
        ...(typeof data === 'string' ? {} : { transformRequest: [(data: unknown) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'patch':
          response = await firstValueFrom(
            this.httpService.patch(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(
            this.httpService.delete(url, config),
          );
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to marketplace service: ${errorMessage}`);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response: { 
            status: number; 
            statusText: string;
            data?: any;
          } 
        };
        const response = axiosError.response;
        const status = response.status;
        const statusText = response.statusText;
        const responseData = response.data;

        console.error(`Marketplace Service Error Details:`);
        console.error(`  - Status: ${status} ${statusText}`);
        console.error(`  - Response Data:`, responseData);

        throw new Error(
          `Marketplace request failed with status code ${status}: ${statusText}`,
        );
      }

      throw error;
    }
  }

  // Proxy methods for events service
  async proxyToEventsService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      // Strip the /events prefix when forwarding to the events service
      let eventsPath = path.startsWith('/events') ? path.substring(7) : path;
      // If path becomes empty after stripping, use root path
      if (eventsPath === '') {
        eventsPath = '/';
      }
      const url = `${this.eventsServiceUrl}${eventsPath}`;

      console.log('🌐 API Gateway - Proxying to events service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );

      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Forward the original Authorization header for JWT authentication
        ...(headers && headers.authorization && {
          'Authorization': Array.isArray(headers.authorization) 
            ? headers.authorization[0] 
            : headers.authorization,
        }),
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        timeout: 60000,
        maxRedirects: 5,
        // Only apply transformRequest for non-string data to avoid double-stringification
        ...(typeof data === 'string' ? {} : { transformRequest: [(data: unknown) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'patch':
          response = await firstValueFrom(
            this.httpService.patch(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(
            this.httpService.delete(url, config),
          );
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to events service: ${errorMessage}`);
      console.error('Full error object:', error);

      // Check if it's a connection error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
          console.error(`Events service connection error: ${errorCode}`);
          throw new Error(
            `Cannot connect to events service at ${this.eventsServiceUrl}. Is the service running?`,
          );
        }
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status: number;
            statusText: string;
            data?: any;
          };
        };
        const response = axiosError.response;

        // Log the full error response for debugging
        if (response?.data) {
          console.error('Events service error response:', JSON.stringify(response.data, null, 2));
        }

        if (!response) {
          throw new Error(`Events service request failed: ${errorMessage}`);
        }

        const status = response.status;
        const statusText = response.statusText;

        throw new Error(
          `Events request failed with status code ${status}: ${statusText}`,
        );
      }

      throw error;
    }
  }

  // Proxy methods for business service
  async proxyToBusinessService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      const url = `${this.businessServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to business service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );
      console.log('  - Data type:', data?.constructor?.name);

      // Check if data is FormData
      const isFormData =
        data &&
        typeof (data as { getHeaders?: () => any }).getHeaders === 'function';

      console.log('  - Is FormData:', isFormData);

      const baseHeaders: Record<string, string> = {
        // Don't set Content-Type for FormData, let axios handle it
        ...(isFormData
          ? {}
          : ({ 'Content-Type': 'application/json' } as Record<string, string>)),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Forward the original Authorization header for JWT authentication
        ...(headers && headers.authorization && {
          'Authorization': Array.isArray(headers.authorization) 
            ? headers.authorization[0] 
            : headers.authorization,
        }),
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      // If FormData, merge its headers (important for boundary)
      if (isFormData) {
        Object.assign(
          baseHeaders,
          (data as { getHeaders: () => Record<string, string> }).getHeaders(),
        );
      }

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        timeout: 60000,
        maxRedirects: 5,
        // Don't transform FormData - let axios handle it natively
        ...(isFormData
          ? {}
          : (typeof data === 'string' ? {} : { transformRequest: [(data: unknown) => JSON.stringify(data)] })),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'patch':
          response = await firstValueFrom(
            this.httpService.patch(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(
            this.httpService.delete(url, config),
          );
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to business service: ${errorMessage}`);
      console.error('Full error object:', error);
      
      // Check if it's a connection error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
          console.error(`Business service connection error: ${errorCode}`);
          throw new Error(
            `Cannot connect to business service at ${this.businessServiceUrl}. Is the service running?`,
          );
        }
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status: number;
            statusText: string;
            data?: any;
          };
        };
        const response = axiosError.response;

        // Log the full error response for debugging
        if (response?.data) {
          console.error('Business service error response:', JSON.stringify(response.data, null, 2));
        }

        if (!response) {
          throw new Error(`Business service request failed: ${errorMessage}`);
        }

        const status = response.status;
        const statusText = response.statusText;
        
        // For 4xx errors (client errors), preserve the status code
        if (status >= 400 && status < 500) {
          const clientError = new Error(
            response.data?.message || response.data?.error || statusText,
          );
          (clientError as any).status = status;
          (clientError as any).response = response.data;
          throw clientError;
        }
        
        // Include full error details
        let errorDetails: any = {
          status,
          statusText,
          message: statusText,
        };

        if (response?.data) {
          if (typeof response.data === 'string') {
            errorDetails.message = response.data;
            errorDetails.raw = response.data;
          } else if (response.data) {
            // Include the full error response
            errorDetails = {
              ...errorDetails,
              ...response.data,
              message: response.data.message || response.data.error || statusText,
            };
          }
        }

        // Create a more detailed error message
        const finalErrorMsg = errorDetails.message || errorDetails.error || statusText;
        const finalError = new Error(
          `Business request failed with status code ${status}: ${finalErrorMsg}`,
        );

        // Attach full error details to the error object
        (finalError as any).response = errorDetails;
        (finalError as any).status = status;

        throw finalError;
      }

      throw error;
    }
  }

  // Proxy methods for user service
  async proxyToUserService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      const url = `${this.userServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to user service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );
      console.log('  - Data type:', data?.constructor?.name);

      // Check if data is FormData
      const isFormData =
        data &&
        typeof (data as { getHeaders?: () => any }).getHeaders === 'function';

      console.log('  - Is FormData:', isFormData);

      const baseHeaders: Record<string, string> = {
        // Don't set Content-Type for FormData, let axios handle it
        ...(isFormData
          ? {}
          : ({ 'Content-Type': 'application/json' } as Record<string, string>)),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Forward the original Authorization header for JWT authentication
        ...(headers && headers.authorization && {
          'Authorization': Array.isArray(headers.authorization)
            ? headers.authorization[0]
            : headers.authorization,
        }),
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      // If FormData, merge its headers (important for boundary)
      if (isFormData) {
        Object.assign(
          baseHeaders,
          (data as { getHeaders: () => Record<string, string> }).getHeaders(),
        );
      }

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        timeout: 60000,
        maxRedirects: 5,
        // Don't transform FormData - let axios handle it natively
        ...(isFormData
          ? {}
          : { transformRequest: [(data: unknown) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'patch':
          response = await firstValueFrom(
            this.httpService.patch(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(
            this.httpService.delete(url, config),
          );
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to user service: ${errorMessage}`);

      if (error && typeof error === 'object' && 'response' in error) {
        const response = (
          error as { response: { status: number; statusText: string } }
        ).response;
        const status = response.status;
        const statusText = response.statusText;

        throw new Error(
          `User request failed with status code ${status}: ${statusText}`,
        );
      }

      throw error;
    }
  }

  // Proxy methods for messaging service
  async proxyToMessagingService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      const url = `${this.messagingServiceUrl}${path}`;

      console.log('🌐 API Gateway - Proxying to messaging service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 30000, // 30 seconds timeout
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data as unknown;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error proxying to messaging service: ${errorMessage}`);

      if (error && typeof error === 'object' && 'response' in error) {
        const response = (
          error as { response: { status: number; statusText: string } }
        ).response;
        const status = response.status;
        const statusText = response.statusText;

        throw new Error(
          `Messaging request failed with status code ${status}: ${statusText}`,
        );
      }

      throw error;
    }
  }

  // Proxy methods for location service
  async proxyToLocationService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    try {
      // Remove /location prefix from path when proxying to location service
      const cleanPath = path.replace(/^\/location/, '');
      const url = `${this.locationServiceUrl}${cleanPath}`;

      console.log('🌐 API Gateway - Proxying to location service:');
      console.log('  - URL:', url);
      console.log('  - Method:', method);
      console.log(
        '  - User:',
        user
          ? {
              id: (user as { id: string; email: string }).id,
              email: (user as { id: string; email: string }).email,
            }
          : 'No user',
      );

      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Forward the original Authorization header for JWT authentication
        ...(headers && headers.authorization && {
          'Authorization': Array.isArray(headers.authorization)
            ? headers.authorization[0]
            : headers.authorization,
        }),
        ...(user && {
          'X-User-Id': (user as { id: string }).id,
        }),
      };

      const config: Record<string, unknown> = {
        headers: baseHeaders,
        timeout: 30000,
        maxRedirects: 5,
        // Only apply transformRequest for non-string data to avoid double-stringification
        ...(typeof data === 'string' ? {} : { transformRequest: [(data: unknown) => JSON.stringify(data)] }),
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await firstValueFrom(this.httpService.get(url, config));
          break;
        case 'post':
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
          break;
        case 'put':
          response = await firstValueFrom(
            this.httpService.put(url, data, config),
          );
          break;
        case 'delete':
          response = await firstValueFrom(this.httpService.delete(url, config));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data as unknown;
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error proxying to location service: ${errMsg}`);

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: {
            status: number;
            statusText: string;
            data?: any;
          };
        };
        const response = axiosError.response;

        // Log the full error response for debugging
        if (response?.data) {
          console.error('Location service error response:', JSON.stringify(response.data, null, 2));
        }

        if (!response) {
          throw new Error(`Location service request failed: ${errMsg}`);
        }

        const status = response.status;
        const statusText = response.statusText;
        // Include full error details
        let errorDetails: any = {
          status,
          statusText,
          message: statusText,
        };

        if (response?.data) {
          if (typeof response.data === 'string') {
            errorDetails.message = response.data;
            errorDetails.raw = response.data;
          } else if (response.data) {
            // Include the full error response
            errorDetails = {
              ...errorDetails,
              ...response.data,
              message: response.data.message || response.data.error || statusText,
            };
          }
        }

        // Create a more detailed error message
        const finalErrorMsg = errorDetails.message || errorDetails.error || statusText;
        const finalError = new Error(
          `Location request failed with status code ${status}: ${finalErrorMsg}`,
        );

        // Attach full error details to the error object
        (finalError as any).response = errorDetails;
        (finalError as any).status = status;

        throw finalError;
      }

      throw err;
    }
  }

  // Proxy methods for payment service (now part of business service)
  async proxyToPaymentService(
    path: string,
    method: string,
    data?: unknown,
    headers?: Record<string, string | string[] | undefined>,
    user?: any,
  ) {
    // Payment service is now part of business service, so proxy to business service
    return this.proxyToBusinessService(path, method, data, headers, user);
  }
}
