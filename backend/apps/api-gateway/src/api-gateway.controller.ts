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
  UploadedFile,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
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

  // Google OAuth specific routes for better documentation
  @Get('auth/google')
  @ApiOperation({ 
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects user to Google OAuth consent screen. After user consent, they will be redirected to /auth/google/callback'
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyAuth(req, res);
  }

  @Get('auth/google/callback')
  @ApiOperation({ 
    summary: 'Handle Google OAuth callback',
    description: 'Processes the OAuth callback from Google and redirects to frontend with tokens'
  })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with access and refresh tokens' })
  @ApiResponse({ status: 400, description: 'Google OAuth authentication failed' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    return this.proxyAuth(req, res);
  }

  @Post('auth/google/mobile')
  @ApiOperation({ 
    summary: 'Google OAuth for mobile apps',
    description: 'Authenticates mobile app users using Google ID token. Returns JWT tokens for API access.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Google authentication successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            profilePicture: { type: 'string' },
            googleId: { type: 'string' },
            authProvider: { type: 'string', enum: ['google'] },
            isEmailVerified: { type: 'boolean' }
          }
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        isNewUser: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid Google ID token' })
  @ApiResponse({ status: 409, description: 'Account conflict - email already exists' })
  async googleAuthMobile(@Req() req: Request, @Res() res: Response) {
    return this.proxyAuth(req, res);
  }

  @Post('auth/google/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Link Google account to existing user',
    description: 'Links a Google account to an existing user account. Requires authentication.'
  })
  @ApiResponse({ status: 200, description: 'Google account linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Google ID token or account already linked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkGoogleAccount(@Req() req: Request, @Res() res: Response) {
    return this.proxyAuth(req, res);
  }

  @Post('auth/google/unlink')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Unlink Google account from user',
    description: 'Unlinks Google account from user account. User must have another authentication method.'
  })
  @ApiResponse({ status: 200, description: 'Google account unlinked successfully' })
  @ApiResponse({ status: 400, description: 'Cannot unlink last authentication method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlinkGoogleAccount(@Req() req: Request, @Res() res: Response) {
    return this.proxyAuth(req, res);
  }

  // Dynamic routing for auth service - handles ALL /auth/* routes
  @All('auth/*path')
  @ApiOperation({ 
    summary: 'Proxy all auth requests to auth service',
    description: 'Handles all authentication requests including Google OAuth, local auth, OTP verification, and user management'
  })
  @ApiResponse({ status: 200, description: 'Request proxied to auth service' })
  @ApiResponse({ status: 302, description: 'Google OAuth redirect (for /auth/google endpoint)' })
  @ApiResponse({ status: 400, description: 'Invalid request or authentication failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Account conflict (for Google OAuth)' })
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

  // Dynamic routing for social service - handles ALL social-related routes EXCEPT media uploads
  // IMPORTANT: More specific routes must come BEFORE general routes to avoid conflicts

  // Dynamic routing for social service routes
  // Use wildcard matching to catch all social service routes
  // IMPORTANT: More specific routes must come FIRST

  // Posts routes - specific routes before general
  @All('posts/categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyPostCategories(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('posts/categories/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyPostCategoriesWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyPostById(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyPosts(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  // Comments routes
  @All('comments/posts/:postId/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCommentsPostsWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('comments/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCommentsPosts(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('comments/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCommentsWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyComments(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  // Reactions routes
  @All('reactions/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyReactionsPosts(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('reactions/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyReactionsWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyReactions(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  // Categories routes
  @All('categories/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCategoriesWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCategories(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  // Media routes
  @All('media/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMediaStats(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('media/my-media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMyMedia(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  @All('media/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMediaById(@Req() req: Request, @Res() res: Response) {
    return this.proxySocialRequest(req, res);
  }

  // Marketplace Listings routes
  @All('listings/nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingsNearby(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingsSaved(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMyListings(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/:id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingSave(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/:id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingView(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/:id/mark-sold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingMarkSold(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingById(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListings(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  // Listing Categories routes
  @All('listing-categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyListingCategoryById(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  @All('listing-categories')
  async proxyListingCategories(@Req() req: Request, @Res() res: Response) {
    return this.proxyMarketplaceRequest(req, res);
  }

  // Events routes
  @All('events/nearby')
  async proxyEventsNearby(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/my-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMyEvents(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/featured')
  async proxyFeaturedEvents(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/:id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyEventRsvp(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/:id/attendees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyEventAttendees(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/:id/increment-views')
  async proxyEventIncrementViews(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events/:id')
  async proxyEventById(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  @All('events')
  async proxyEvents(@Req() req: Request, @Res() res: Response) {
    return this.proxyEventsRequest(req, res);
  }

  // Business service routes - Specific routes first to avoid conflicts
  @All('business/search/featured')
  async proxyBusinessFeatured(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/search/trending')
  async proxyBusinessTrending(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/search/by-service-area')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessSearchByServiceArea(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessSearch(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessRegister(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/my-business')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyMyBusiness(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessCategories(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business-categories/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessCategoriesWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('user/inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserInquiries(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/inquiries/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessInquiryStats(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/inquiries/:inquiryId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessInquiryRespond(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/inquiries/:inquiryId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessInquiryStatus(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessInquiries(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/analytics/daily')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessAnalyticsDaily(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessAnalytics(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/activity/contact-click')
  async proxyBusinessActivityContactClick(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/activity/view')
  async proxyBusinessActivityView(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessActivity(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/reviews/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessReviewStats(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/reviews/:reviewId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessReviewRespond(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessReviewById(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessReviews(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/licenses/:licenseId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessLicenseVerify(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/licenses/:licenseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessLicenseById(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/licenses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessLicenses(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessServiceById(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:businessId/services')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessServices(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }


  @All('business/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessStatus(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusinessById(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  @All('business')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyBusiness(@Req() req: Request, @Res() res: Response) {
    return this.proxyBusinessRequest(req, res);
  }

  // User service routes - Specific routes first to avoid conflicts

  // Avatar upload - needs special multipart handling
  @Post('users/me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('🖼️ API Gateway - Avatar upload request received:');
      console.log('  - File:', file?.originalname, file?.mimetype, file?.size);

      if (!file) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'No file provided',
        });
      }

      // Create FormData for the user service
      const formData = new FormData();

      if (file.buffer) {
        formData.append('avatar', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      } else {
        throw new Error('File buffer is undefined');
      }

      // Create headers without Content-Type (let FormData set it)
      const headers = {
        ...req.headers,
      };
      delete headers['content-type'];
      delete headers['Content-Type'];

      const result: unknown = await this.apiGatewayService.proxyToUserService(
        '/users/me/avatar',
        'POST',
        formData,
        headers as Record<string, string | string[] | undefined>,
        req.user,
      );

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  @All('users/me/completion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserCompletion(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @All('users/dashboard/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserDashboardStats(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @All('users/dashboard/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserDashboardWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @All('users/me/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserMeWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @All('users/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUserWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @All('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.proxyUserRequest(req, res);
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all Nigerian states' })
  @ApiResponse({
    status: 200,
    description: 'List of Nigerian states',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Lagos' },
          code: { type: 'string', example: 'LA' },
        },
      },
    },
  })
  async getStates(@Res() res: Response) {
    try {
      const states = await this.apiGatewayService.getStates();
      res.status(HttpStatus.OK).json(states);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch states',
      });
    }
  }

  // Helper method to proxy requests to social service
  @ApiOperation({ summary: 'Proxy all social service requests' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to social service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private async proxySocialRequest(req: Request, res: Response) {
    try {
      console.log('🌐 API Gateway - Proxying social service request:', req.url, req.method);

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
      console.error('Error proxying social service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Helper method to proxy requests to marketplace service
  @ApiOperation({ summary: 'Proxy all marketplace service requests' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to marketplace service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private async proxyMarketplaceRequest(req: Request, res: Response) {
    try {
      console.log(
        '🌐 API Gateway - Proxying marketplace service request:',
        req.url,
        req.method,
      );

      const result: unknown =
        await this.apiGatewayService.proxyToMarketplaceService(
          req.url,
          req.method,
          req.body,
          req.headers as Record<string, string | string[] | undefined>,
          req.user,
        );

      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      } else if (req.method === 'DELETE') {
        statusCode = HttpStatus.NO_CONTENT;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error proxying marketplace service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Helper method to proxy requests to events service
  @ApiOperation({ summary: 'Proxy all events service requests' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to events service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private async proxyEventsRequest(req: Request, res: Response) {
    try {
      console.log(
        '🌐 API Gateway - Proxying events service request:',
        req.url,
        req.method,
      );

      const result: unknown =
        await this.apiGatewayService.proxyToEventsService(
          req.url,
          req.method,
          req.body,
          req.headers as Record<string, string | string[] | undefined>,
          req.user,
        );

      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      } else if (req.method === 'DELETE') {
        statusCode = HttpStatus.NO_CONTENT;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error proxying events service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  private eventsEndpointRequiresAuth(url: string, method: string): boolean {
    // Public endpoints (no auth required)
    const publicEndpoints = [
      { method: 'GET', path: '/events' }, // GET all events
      { method: 'GET', path: '/events/nearby' }, // GET nearby events
      { method: 'GET', path: '/events/featured' }, // GET featured events
      { method: 'GET', path: '/events/' }, // GET single event (if it matches pattern)
      { method: 'POST', path: '/events/' }, // POST increment views (if it matches pattern)
    ];

    // Check if this is a public endpoint
    for (const endpoint of publicEndpoints) {
      if (endpoint.method === method) {
        if (endpoint.path === '/events' && url === '/events') {
          return false; // GET /events is public
        }
        if (endpoint.path === '/events/nearby' && url.startsWith('/events/nearby')) {
          return false; // GET /events/nearby is public
        }
        if (endpoint.path === '/events/featured' && url.startsWith('/events/featured')) {
          return false; // GET /events/featured is public
        }
        if (endpoint.path === '/events/' && method === 'GET' && url.match(/^\/events\/[^\/]+$/)) {
          return false; // GET /events/:id is public
        }
        if (endpoint.path === '/events/' && method === 'POST' && url.match(/^\/events\/[^\/]+\/increment-views$/)) {
          return false; // POST /events/:id/increment-views is public
        }
      }
    }

    // All other endpoints require authentication
    return true;
  }

  // Helper method to proxy requests to business service
  @ApiOperation({ summary: 'Proxy all business service requests' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to business service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private async proxyBusinessRequest(req: Request, res: Response) {
    try {
      // Transform the URL to remove /business prefix for the business service
      let businessPath = req.url;
      if (businessPath.startsWith('/business')) {
        businessPath = businessPath.replace('/business', '');
        // If the path is empty after removing /business, set it to /
        if (businessPath === '') {
          businessPath = '/';
        }
      }

      console.log(
        '🌐 API Gateway - Proxying business service request:',
        'Original URL:', req.url,
        'Transformed URL:', businessPath,
        'Method:', req.method,
      );

      const result: unknown =
        await this.apiGatewayService.proxyToBusinessService(
          businessPath,
          req.method,
          req.body,
          req.headers as Record<string, string | string[] | undefined>,
          req.user,
        );

      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      } else if (req.method === 'DELETE') {
        statusCode = HttpStatus.NO_CONTENT;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error proxying business service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // Helper method to proxy requests to user service
  @ApiOperation({ summary: 'Proxy all user service requests' })
  @ApiResponse({
    status: 200,
    description: 'Request proxied to user service',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private async proxyUserRequest(req: Request, res: Response) {
    try {
      console.log(
        '🌐 API Gateway - Proxying user service request:',
        'URL:', req.url,
        'Method:', req.method,
      );

      const result: unknown =
        await this.apiGatewayService.proxyToUserService(
          req.url,
          req.method,
          req.body,
          req.headers as Record<string, string | string[] | undefined>,
          req.user,
        );

      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      } else if (req.method === 'DELETE') {
        statusCode = HttpStatus.NO_CONTENT;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error proxying user service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }

  // ========== MESSAGING SERVICE ROUTES ==========

  // Messaging routes - Specific routes first
  @All('messaging/health')
  @ApiOperation({ summary: 'Proxy messaging health check' })
  async proxyMessagingHealth(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/event/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy event conversation requests' })
  async proxyMessagingEventConversations(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/business/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy business conversation requests' })
  async proxyMessagingBusinessConversations(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy conversation messages requests' })
  async proxyMessagingConversationMessages(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/:id/mark-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy mark as read requests' })
  async proxyMessagingMarkRead(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/:id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy archive conversation requests' })
  async proxyMessagingArchive(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/:id/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy pin conversation requests' })
  async proxyMessagingPin(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy conversation by ID requests' })
  async proxyMessagingConversationById(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy conversations requests' })
  async proxyMessagingConversations(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/messages/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy message by ID requests' })
  async proxyMessagingMessageById(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy messages requests' })
  async proxyMessagingMessages(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/typing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy typing indicator requests' })
  async proxyMessagingTyping(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  @All('messaging/*path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy all other messaging requests' })
  async proxyMessagingWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyMessagingRequest(req, res);
  }

  // Helper method for messaging requests
  private async proxyMessagingRequest(@Req() req: Request, @Res() res: Response) {
    try {
      console.log(
        '🌐 API Gateway - Proxying messaging service request:',
        'URL:', req.url,
        'Method:', req.method,
      );

      const result: unknown =
        await this.apiGatewayService.proxyToMessagingService(
          req.url,
          req.method,
          req.body,
          req.headers as Record<string, string | string[] | undefined>,
          req.user,
        );

      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      } else if (req.method === 'DELETE') {
        statusCode = HttpStatus.NO_CONTENT;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error proxying messaging service request:', errorMessage);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: errorMessage });
    }
  }
}
