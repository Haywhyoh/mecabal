import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  private readonly socialServiceUrl = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003';

  constructor(private readonly httpService: HttpService) {}

  getHello(): string {
    return 'MeCabal API Gateway is running!';
  }

  // Proxy methods for social service
  async proxyToSocialService(path: string, method: string, data?: any, headers?: any) {
    try {
      const url = `${this.socialServiceUrl}${path}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
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

      return response.data;
    } catch (error) {
      console.error(`Error proxying to social service: ${error.message}`);
      throw error;
    }
  }
}
