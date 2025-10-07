import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListingCategoriesService } from './listing-categories.service';
import { ListingCategory } from '@app/database';

@ApiTags('listing-categories')
@Controller('listing-categories')
export class ListingCategoriesController {
  constructor(
    private readonly listingCategoriesService: ListingCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all listing categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [ListingCategory],
  })
  async findAll(
    @Query('listingType') listingType?: string,
  ): Promise<ListingCategory[]> {
    return this.listingCategoriesService.findAll(listingType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: ListingCategory,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: number): Promise<ListingCategory> {
    return this.listingCategoriesService.findOne(id);
  }
}
