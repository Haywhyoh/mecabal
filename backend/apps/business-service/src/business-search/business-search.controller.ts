import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessSearchService } from './business-search.service';
import { SearchBusinessDto } from '../dto/search-business.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessSearchController {
  constructor(private readonly searchService: BusinessSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search businesses with filters' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(@Query() searchDto: SearchBusinessDto) {
    const results = await this.searchService.search(searchDto);
    return {
      success: true,
      ...results,
    };
  }

  @Get('by-service-area')
  @ApiOperation({
    summary: 'Get businesses grouped by service area from user location',
  })
  @ApiResponse({ status: 200, description: 'Businesses grouped by service area' })
  async searchByServiceArea(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('category') category?: string,
  ) {
    const results = await this.searchService.searchByServiceArea(
      latitude,
      longitude,
      category,
    );
    return {
      success: true,
      data: results,
    };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured businesses' })
  @ApiResponse({ status: 200, description: 'Featured businesses retrieved' })
  async getFeatured(@Query('limit') limit: number = 10) {
    const businesses = await this.searchService.getFeaturedBusinesses(limit);
    return {
      success: true,
      data: businesses,
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending businesses' })
  @ApiResponse({ status: 200, description: 'Trending businesses retrieved' })
  async getTrending(@Query('limit') limit: number = 10) {
    const businesses = await this.searchService.getTrendingBusinesses(limit);
    return {
      success: true,
      data: businesses,
    };
  }
}
