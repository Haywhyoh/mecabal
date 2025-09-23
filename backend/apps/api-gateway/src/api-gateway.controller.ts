import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';

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
      const result = await this.apiGatewayService.proxyToSocialService('/test', 'GET');
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Posts endpoints
  @Get('posts')
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getPosts(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService('/posts', 'GET', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService('/posts', 'POST', body, req.headers);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  async getPost(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService(`/posts/${id}`, 'GET', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update post by ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  async updatePost(@Param('id') id: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService(`/posts/${id}`, 'PUT', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete post by ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  async deletePost(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService(`/posts/${id}`, 'DELETE', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Categories endpoints
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService('/categories', 'GET', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Media endpoints
  @Post('media/upload')
  @ApiOperation({ summary: 'Upload media file' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  async uploadMedia(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService('/media/upload', 'POST', body, req.headers);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Auth endpoints
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/register', 'POST', body, req.headers);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/register-mobile')
  @ApiOperation({ summary: 'Register a new user (Mobile App)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async registerMobile(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/register-mobile', 'POST', body, req.headers);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/verify-otp', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  async login(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/login', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refresh(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/refresh', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/logout', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('auth/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/profile', 'GET', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('auth/me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/me', 'GET', null, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Put('auth/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/profile', 'PUT', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('auth/health')
  @ApiOperation({ summary: 'Auth service health check' })
  @ApiResponse({ status: 200, description: 'Auth service is healthy' })
  async getAuthHealth(@Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/health', 'GET');
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Email OTP endpoints
  @Post('auth/email/send-otp')
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendEmailOTP(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/email/send-otp', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/email/verify-otp')
  @ApiOperation({ summary: 'Verify email OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyEmailOTP(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/email/verify-otp', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Phone OTP endpoints
  @Post('auth/phone/send-otp')
  @ApiOperation({ summary: 'Send phone verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendPhoneOTP(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/phone/send-otp', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Post('auth/phone/verify-otp')
  @ApiOperation({ summary: 'Verify phone OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyPhoneOTP(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/phone/verify-otp', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Location setup endpoints
  @Post('auth/location/setup')
  @ApiOperation({ summary: 'Set user location (Nigerian context)' })
  @ApiResponse({ status: 200, description: 'Location set successfully' })
  async setupLocation(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/location/setup', 'POST', body, req.headers);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('auth/location/states')
  @ApiOperation({ summary: 'Get all Nigerian states and major cities' })
  @ApiResponse({ status: 200, description: 'Nigerian states and cities retrieved successfully' })
  async getNigerianStates(@Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToAuthService('/auth/location/states', 'GET');
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
