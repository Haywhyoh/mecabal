import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialAuthGuard } from '../guards/social-auth.guard';
import { HelpOffersService } from './help-offers.service';
import {
  CreateHelpOfferDto,
  HelpOfferResponseDto,
  UpdateHelpOfferStatusDto,
} from './dto';

@ApiTags('help-offers')
@Controller('help-offers')
@UseGuards(SocialAuthGuard)
@ApiBearerAuth()
export class HelpOffersController {
  constructor(private readonly helpOffersService: HelpOffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new help offer' })
  @ApiResponse({
    status: 201,
    description: 'Help offer created successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createHelpOffer(
    @Body() createHelpOfferDto: CreateHelpOfferDto,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto> {
    console.log('🔵 [HelpOffersController] createHelpOffer called');
    console.log('🔵 [HelpOffersController] Request body:', JSON.stringify(createHelpOfferDto, null, 2));
    console.log('🔵 [HelpOffersController] User ID:', req.user?.id);
    console.log('🔵 [HelpOffersController] DTO type:', typeof createHelpOfferDto);
    console.log('🔵 [HelpOffersController] postId:', createHelpOfferDto.postId);
    console.log('🔵 [HelpOffersController] message:', createHelpOfferDto.message);
    console.log('🔵 [HelpOffersController] contactMethod:', createHelpOfferDto.contactMethod);
    
    try {
      const result = await this.helpOffersService.createHelpOffer(
        createHelpOfferDto.postId,
        req.user.id,
        createHelpOfferDto,
      );
      console.log('✅ [HelpOffersController] Help offer created successfully');
      return result;
    } catch (error) {
      console.error('❌ [HelpOffersController] Error creating help offer:', error.constructor.name);
      console.error('❌ [HelpOffersController] Error message:', error.message);
      console.error('❌ [HelpOffersController] Error stack:', error.stack);
      throw error;
    }
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all help offers for a post' })
  @ApiResponse({
    status: 200,
    description: 'Help offers retrieved successfully',
    type: [HelpOfferResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not post owner' })
  async getHelpOffersByPost(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto[]> {
    // Only post owner can view offers
    return this.helpOffersService.getHelpOffersByPost(postId, req.user.id);
  }

  @Get('post/:postId/my-offer')
  @ApiOperation({ summary: 'Get current user\'s help offer for a specific post' })
  @ApiResponse({
    status: 200,
    description: 'User help offer retrieved successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found or no offer exists' })
  async getMyOfferForPost(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto | null> {
    const offer = await this.helpOffersService.getUserOfferForPost(postId, req.user.id);
    // Return null if no offer exists (frontend handles this)
    return offer;
  }

  @Get('my-offers')
  @ApiOperation({ summary: 'Get current user\'s help offers' })
  @ApiResponse({
    status: 200,
    description: 'User help offers retrieved successfully',
    type: [HelpOfferResponseDto],
  })
  async getMyOffers(@Request() req: any): Promise<HelpOfferResponseDto[]> {
    return this.helpOffersService.getHelpOffersByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific help offer by ID' })
  @ApiResponse({
    status: 200,
    description: 'Help offer retrieved successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Help offer not found' })
  async getHelpOfferById(
    @Param('id') id: string,
  ): Promise<HelpOfferResponseDto> {
    return this.helpOffersService.getHelpOfferById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a help offer (post owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Help offer accepted successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Help offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not post owner' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async acceptHelpOffer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto> {
    return this.helpOffersService.acceptHelpOffer(id, req.user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a help offer (post owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Help offer rejected successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Help offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not post owner' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async rejectHelpOffer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto> {
    return this.helpOffersService.rejectHelpOffer(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel own help offer' })
  @ApiResponse({
    status: 200,
    description: 'Help offer cancelled successfully',
    type: HelpOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Help offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not offer owner' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async cancelHelpOffer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HelpOfferResponseDto> {
    return this.helpOffersService.cancelHelpOffer(id, req.user.id);
  }
}

