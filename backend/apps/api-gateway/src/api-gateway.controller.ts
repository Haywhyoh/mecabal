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
}
