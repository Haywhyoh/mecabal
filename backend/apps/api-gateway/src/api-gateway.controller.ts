import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res, HttpStatus, All, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from '@app/auth';

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

  // Dynamic routing for auth service - handles ALL /auth/* routes
  @All('auth/*')
  @ApiOperation({ summary: 'Proxy all auth requests to auth service' })
  @ApiResponse({ status: 200, description: 'Request proxied to auth service' })
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the path after /auth
      const path = req.url.replace('/auth', '/auth');
      const result = await this.apiGatewayService.proxyToAuthService(path, req.method, req.body, req.headers);

      // Set appropriate status code based on method and result
      let statusCode = HttpStatus.OK;
      if (req.method === 'POST' && (req.url.includes('register') || req.url.includes('create'))) {
        statusCode = HttpStatus.CREATED;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Dynamic routing for social service - handles ALL social-related routes
  @All('posts')
  @All('posts/*')
  @All('categories')
  @All('categories/*')
  @All('media/*')
  @All('comments')
  @All('comments/*')
  @All('reactions')
  @All('reactions/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy social requests to social service' })
  @ApiResponse({ status: 200, description: 'Request proxied to social service' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async proxySocial(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.apiGatewayService.proxyToSocialService(req.url, req.method, req.body, req.headers, req.user);

      // Set appropriate status code based on method
      let statusCode = HttpStatus.OK;
      if (req.method === 'POST') {
        statusCode = HttpStatus.CREATED;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
