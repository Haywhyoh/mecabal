import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { ListingsService } from './listings.service';
import { 
  CreateListingRateLimit, 
  SearchRateLimit, 
  GeneralRateLimit 
} from '../rate-limiting/decorators/rate-limit.decorator';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingFilterDto,
  ListingResponseDto,
  PaginatedListingsResponseDto,
} from './dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    neighborhoodId: string;
  };
}

@ApiTags('listings')
@Controller('listings')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @CreateListingRateLimit()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
    type: ListingResponseDto,
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createListingDto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.create(
      req.user.userId,
      req.user.neighborhoodId,
      createListingDto,
    );
  }

  @Get()
  @SearchRateLimit()
  @ApiOperation({ summary: 'Get all listings with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of listings',
    type: PaginatedListingsResponseDto,
  })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() filter: ListingFilterDto,
  ): Promise<PaginatedListingsResponseDto> {
    return this.listingsService.findAll(filter, req.user?.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find listings nearby' })
  @ApiResponse({
    status: 200,
    description: 'List of nearby listings',
    type: [ListingResponseDto],
  })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5,
    @Query() filter: ListingFilterDto,
  ): Promise<ListingResponseDto[]> {
    return this.listingsService.searchNearby(
      latitude,
      longitude,
      radius,
      filter,
    );
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get user saved listings' })
  @ApiResponse({
    status: 200,
    description: 'List of saved listings',
    type: PaginatedListingsResponseDto,
  })
  async getSaved(
    @Request() req: AuthenticatedRequest,
    @Query() filter: ListingFilterDto,
  ): Promise<PaginatedListingsResponseDto> {
    return this.listingsService.getSavedListings(req.user.userId, filter);
  }

  @Get('my-listings')
  @ApiOperation({ summary: 'Get user own listings' })
  @ApiResponse({
    status: 200,
    description: 'List of user listings',
    type: PaginatedListingsResponseDto,
  })
  async getMyListings(
    @Request() req: AuthenticatedRequest,
    @Query() filter: ListingFilterDto,
  ): Promise<PaginatedListingsResponseDto> {
    return this.listingsService.getUserListings(req.user.userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({
    status: 200,
    description: 'Listing details',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.findOne(id, req.user?.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  @ApiResponse({
    status: 200,
    description: 'Listing updated successfully',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.update(id, req.user.userId, updateListingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiResponse({ status: 200, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.listingsService.remove(id, req.user.userId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  async incrementView(@Param('id') id: string): Promise<void> {
    return this.listingsService.incrementViews(id);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a listing' })
  @ApiResponse({ status: 200, description: 'Listing saved successfully' })
  async save(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.listingsService.saveListing(id, req.user.userId);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Unsave a listing' })
  @ApiResponse({ status: 200, description: 'Listing unsaved successfully' })
  async unsave(@Request() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.listingsService.unsaveListing(id, req.user.userId);
  }

  @Patch(':id/mark-sold')
  @ApiOperation({ summary: 'Mark listing as sold' })
  @ApiResponse({
    status: 200,
    description: 'Listing marked as sold',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async markSold(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.markAsSold(id, req.user.userId);
  }
}
