import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessCategoryService } from './business-category.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessCategoryController {
  constructor(private readonly categoryService: BusinessCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all business categories' })
  @ApiQuery({ name: 'includeCounts', required: false, type: Boolean, description: 'Include service counts per category' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(@Query('includeCounts') includeCounts?: string | boolean) {
    let categories;

    // Handle both string and boolean values from query parameters
    const shouldIncludeCounts = 
      includeCounts === true || 
      includeCounts === 'true' || 
      includeCounts === '1';

    if (shouldIncludeCounts) {
      categories = await this.categoryService.findAllWithServiceCounts();
    } else {
      categories = await this.categoryService.findAll();
    }

    return {
      success: true,
      data: categories,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search business categories' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(@Query('q') query: string) {
    const categories = await this.categoryService.searchCategories(query);
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@Param('id') id: string) {
    const category = await this.categoryService.findById(id);
    if (!category) {
      return {
        success: false,
        message: 'Category not found',
      };
    }
    return {
      success: true,
      data: category,
    };
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories for a business category' })
  @ApiResponse({ status: 200, description: 'Subcategories retrieved successfully' })
  async getSubcategories(@Param('id') id: string) {
    const subcategories = await this.categoryService.getSubcategories(id);
    return {
      success: true,
      data: subcategories,
    };
  }
}
