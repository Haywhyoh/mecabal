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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, Public } from '@app/auth';
import { CulturalProfileService } from '../services/cultural-profile.service';
import {
  CreateCulturalProfileDto,
  UpdateCulturalProfileDto,
  AddLanguageDto,
  UpdateLanguageDto,
  CulturalProfileResponseDto,
  ReferenceDataResponseDto,
} from '../dto/cultural-profile.dto';

@ApiTags('Cultural Profile')
@Controller('cultural-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CulturalProfileController {
  constructor(private readonly culturalProfileService: CulturalProfileService) {}

  @Get('reference-data')
  @Public() // Make public for registration flow
  @ApiOperation({ summary: 'Get all reference data for cultural profiles' })
  @ApiResponse({
    status: 200,
    description: 'Reference data retrieved successfully',
    type: ReferenceDataResponseDto,
  })
  async getReferenceData(): Promise<ReferenceDataResponseDto> {
    return this.culturalProfileService.getReferenceData();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user cultural profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Cultural profile retrieved successfully',
    type: CulturalProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCulturalProfile(@Param('userId') userId: string): Promise<CulturalProfileResponseDto> {
    return this.culturalProfileService.getCulturalProfile(userId);
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Create or update user cultural profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Cultural profile created/updated successfully',
    type: CulturalProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createOrUpdateCulturalProfile(
    @Param('userId') userId: string,
    @Body() createDto: CreateCulturalProfileDto,
  ): Promise<CulturalProfileResponseDto> {
    return this.culturalProfileService.createOrUpdateCulturalProfile(userId, createDto);
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user cultural profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Cultural profile updated successfully',
    type: CulturalProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCulturalProfile(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateCulturalProfileDto,
  ): Promise<CulturalProfileResponseDto> {
    return this.culturalProfileService.updateCulturalProfile(userId, updateDto);
  }

  @Post(':userId/languages')
  @ApiOperation({ summary: 'Add language to user profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Language added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User or language not found' })
  @ApiResponse({ status: 409, description: 'User already has this language' })
  @HttpCode(HttpStatus.CREATED)
  async addLanguage(
    @Param('userId') userId: string,
    @Body() addLanguageDto: AddLanguageDto,
  ): Promise<void> {
    return this.culturalProfileService.addLanguage(userId, addLanguageDto);
  }

  @Put(':userId/languages/:languageId')
  @ApiOperation({ summary: 'Update user language proficiency' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'languageId', description: 'Language ID' })
  @ApiResponse({ status: 200, description: 'Language proficiency updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User language not found' })
  async updateLanguageProficiency(
    @Param('userId') userId: string,
    @Param('languageId') languageId: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ): Promise<void> {
    return this.culturalProfileService.updateLanguageProficiency(userId, languageId, updateLanguageDto);
  }

  @Delete(':userId/languages/:languageId')
  @ApiOperation({ summary: 'Remove language from user profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'languageId', description: 'Language ID' })
  @ApiResponse({ status: 200, description: 'Language removed successfully' })
  @ApiResponse({ status: 404, description: 'User language not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLanguage(
    @Param('userId') userId: string,
    @Param('languageId') languageId: string,
  ): Promise<void> {
    return this.culturalProfileService.removeLanguage(userId, languageId);
  }

  @Get('search/cultural-matching')
  @ApiOperation({ summary: 'Find users by cultural criteria' })
  @ApiQuery({ name: 'languageId', required: false, description: 'Language ID to filter by' })
  @ApiQuery({ name: 'culturalBackgroundId', required: false, description: 'Cultural background ID to filter by' })
  @ApiQuery({ name: 'professionalCategoryId', required: false, description: 'Professional category ID to filter by' })
  @ApiQuery({ name: 'stateId', required: false, description: 'State ID to filter by' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/CulturalProfileResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async findUsersByCulturalCriteria(
    @Query('languageId') languageId?: string,
    @Query('culturalBackgroundId') culturalBackgroundId?: string,
    @Query('professionalCategoryId') professionalCategoryId?: string,
    @Query('stateId') stateId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.culturalProfileService.findUsersByCulturalCriteria({
      languageId,
      culturalBackgroundId,
      professionalCategoryId,
      stateId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}




