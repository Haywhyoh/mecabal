import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MarketplaceAuthGuard } from '../guards/marketplace-auth.guard';
import { SearchService } from './search.service';
import {
  SearchListingsDto,
  PaginatedListingsResponseDto,
  ListingResponseDto,
} from '../listings/dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    neighborhoodId: string;
  };
}

@ApiTags('search')
@Controller('search')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Advanced search for listings' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: PaginatedListingsResponseDto,
  })
  async searchListings(
    @Request() req: AuthenticatedRequest,
    @Body() searchDto: SearchListingsDto,
  ): Promise<PaginatedListingsResponseDto> {
    return this.searchService.searchListings(searchDto, req.user?.userId);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Search listings with query parameters' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: PaginatedListingsResponseDto,
  })
  async searchListingsGet(
    @Request() req: AuthenticatedRequest,
    @Query() searchDto: SearchListingsDto,
  ): Promise<PaginatedListingsResponseDto> {
    return this.searchService.searchListings(searchDto, req.user?.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Search listings nearby' })
  @ApiResponse({
    status: 200,
    description: 'Nearby listings',
    type: [ListingResponseDto],
  })
  async searchNearby(
    @Request() req: AuthenticatedRequest,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5,
    @Query() searchDto: SearchListingsDto,
  ): Promise<ListingResponseDto[]> {
    return this.searchService.searchNearby(
      latitude,
      longitude,
      radius,
      searchDto,
      req.user?.userId,
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
    type: [String],
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ): Promise<string[]> {
    return this.searchService.getSearchSuggestions(query, limit);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiResponse({
    status: 200,
    description: 'Popular searches',
    type: [String],
  })
  async getPopularSearches(
    @Query('limit') limit: number = 10,
  ): Promise<string[]> {
    return this.searchService.getPopularSearches(limit);
  }
}
