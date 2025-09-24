import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  HttpStatus,
  All,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from '@app/auth';
import FormData from 'form-data';

@ApiTags('Gateway')
@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  @ApiOperation({ summary: 'API Gateway health check' })
  @ApiResponse({ status: 200, description: 'API Gateway is running' })
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Get('test')
  @ApiOperation({ summary: 'Test social service connection' })
  @ApiResponse({ status: 200, description: 'Social service test successful' })
  async testSocialService(@Res() res: Response) {
    try {
      const result: unknown = await this.apiGatewayService.proxyToSocialService(
        '/test',
        'GET',
      );
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Dynamic routing for auth service - handles ALL /auth/* routes
  @All('auth/*')
  @ApiOperation({ summary: 'Proxy all auth requests to auth service' })
  @ApiResponse({ status: 200, description: 'Request proxied to auth service' })
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the path after /auth
      const path = req.url.replace('/auth', '/auth');
      const result: unknown = await this.apiGatewayService.proxyToAuthService(
        path,
        req.method,
        req.body,
        req.headers as Record<string, string | string[] | undefined>,
      );

      // Set appropriate status code based on method and result
      let statusCode = HttpStatus.OK;
      if (
        req.method === 'POST' &&
        (req.url.includes('register') || req.url.includes('create'))
      ) {
        statusCode = HttpStatus.CREATED;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Test endpoint for media upload (no auth for debugging)
  @Post('media/upload-test')
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  @ApiOperation({ summary: 'Upload media files (test endpoint)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  async uploadMediaTest(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('🔧 API Gateway - Test media upload request received:');
      console.log('  - Files count:', files?.length || 0);
      console.log('  - Request body:', req.body);
      console.log(
        '  - Files details:',
        files?.map((f) => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          bufferLength: f.buffer?.length || 0,
        })),
      );

      // Create FormData for the social service
      const formData = new FormData();

      // Add files to form data
      if (files && files.length > 0) {
        files.forEach((file) => {
          if (file.buffer) {
            formData.append('files', file.buffer, {
              filename: file.originalname,
              contentType: file.mimetype,
            });
          } else {
            throw new Error(
              `File buffer is undefined for ${file.originalname}`,
            );
          }
        });
      } else {
        throw new Error('No files provided');
      }

      // Add other form fields
      if ((req.body as Record<string, any>).type)
        formData.append('type', (req.body as Record<string, any>).type);
      if ((req.body as Record<string, any>).caption)
        formData.append('caption', (req.body as Record<string, any>).caption);
      if ((req.body as Record<string, any>).quality)
        formData.append('quality', (req.body as Record<string, any>).quality);
      if ((req.body as Record<string, any>).maxWidth)
        formData.append('maxWidth', (req.body as Record<string, any>).maxWidth);
      if ((req.body as Record<string, any>).maxHeight)
        formData.append(
          'maxHeight',
          (req.body as Record<string, any>).maxHeight,
        );

      // Create headers without Content-Type (let FormData set it)
      const headers = {
        ...req.headers,
      };
      delete headers['content-type'];
      delete headers['Content-Type'];

      // Create mock user for testing
      const mockUser = {
        id: 'a4ba9886-ce30-43ea-9ac0-7ca4e5e45570',
        email: 'ayo@codemygig.com',
        firstName: 'Ayo',
        lastName: 'User',
        isActive: true,
        userNeighborhoods: [],
      };

      const result: unknown = await this.apiGatewayService.proxyToSocialService(
        '/media/upload',
        req.method,
        formData,
        headers as Record<string, string | string[] | undefined>,
        mockUser,
      );
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error('Media upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Specific route for media upload
  @Post('media/upload')
  @UseGuards(JwtAuthGuard) // Re-enabled JWT authentication
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  @ApiBearerAuth() // Re-enabled for Swagger documentation
  @ApiOperation({ summary: 'Upload media files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Create FormData for the social service
      const formData = new FormData();

      // Add files to form data
      if (files && files.length > 0) {
        files.forEach((file) => {
          if (file.buffer) {
            formData.append('files', file.buffer, {
              filename: file.originalname,
              contentType: file.mimetype,
            });
          } else {
            throw new Error(
              `File buffer is undefined for ${file.originalname}`,
            );
          }
        });
      } else {
        throw new Error('No files provided');
      }

      // Add other form fields
      if ((req.body as Record<string, any>).type)
        formData.append('type', (req.body as Record<string, any>).type);
      if ((req.body as Record<string, any>).caption)
        formData.append('caption', (req.body as Record<string, any>).caption);
      if ((req.body as Record<string, any>).quality)
        formData.append('quality', (req.body as Record<string, any>).quality);
      if ((req.body as Record<string, any>).maxWidth)
        formData.append('maxWidth', (req.body as Record<string, any>).maxWidth);
      if ((req.body as Record<string, any>).maxHeight)
        formData.append(
          'maxHeight',
          (req.body as Record<string, any>).maxHeight,
        );

      // Create headers without Content-Type (let FormData set it)
      const headers = {
        ...req.headers,
      };
      delete headers['content-type'];
      delete headers['Content-Type'];

      const result: unknown = await this.apiGatewayService.proxyToSocialService(
        '/media/upload',
        req.method,
        formData,
        headers as Record<string, string | string[] | undefined>,
        req.user as any,
      );
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error('Media upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Specific route for individual posts
  @All('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy individual post requests to social service' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to social service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async proxyIndividualPost(@Req() req: Request, @Res() res: Response) {
    try {
      const result: unknown = await this.apiGatewayService.proxyToSocialService(
        req.url,
        req.method,
        req.body,
        req.headers as Record<string, string | string[] | undefined>,
        req.user as any,
      );

      // Set appropriate status code based on method
      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Dynamic routing for social service - handles ALL social-related routes EXCEPT media uploads
  @All('posts')
  @All('posts/categories')
  @All('posts/categories/*')
  @All('categories')
  @All('categories/*')
  @All('media/stats')
  @All('media/my-media')
  @All('media/:id')
  @All('comments')
  @All('comments/*')
  @All('reactions')
  @All('reactions/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy social requests to social service' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to social service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async proxySocial(@Req() req: Request, @Res() res: Response) {
    try {
      const result: unknown = await this.apiGatewayService.proxyToSocialService(
        req.url,
        req.method,
        req.body,
        req.headers as Record<string, string | string[] | undefined>,
        req.user as any,
      );

      // Set appropriate status code based on method
      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }
}
