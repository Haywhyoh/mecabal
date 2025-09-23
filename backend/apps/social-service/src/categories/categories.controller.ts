import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryFilterDto,
  CategoryStatsDto,
} from './dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post category (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - category name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all post categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategories(@Query() filterDto: CategoryFilterDto): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getCategories(filterDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get category statistics (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category statistics retrieved successfully',
    type: CategoryStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategoryStats(): Promise<CategoryStatsDto> {
    return this.categoriesService.getCategoryStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategoryById(@Param('id') id: string): Promise<CategoryResponseDto> {
    const categoryId = parseInt(id, 10);
    return this.categoriesService.getCategoryById(categoryId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Bad request - category name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const categoryId = parseInt(id, 10);
    return this.categoriesService.updateCategory(categoryId, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Bad request - category has existing posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    const categoryId = parseInt(id, 10);
    return this.categoriesService.deleteCategory(categoryId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default categories (admin only)' })
  @ApiResponse({ status: 201, description: 'Default categories seeded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async seedDefaultCategories(): Promise<{ message: string }> {
    await this.categoriesService.seedDefaultCategories();
    return { message: 'Default categories seeded successfully' };
  }
}
