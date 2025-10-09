import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { DocumentService } from '../services/document.service';
import {
  UploadDocumentDto,
  VerifyDocumentDto,
  DocumentResponseDto,
  UserDocumentsResponseDto,
  DocumentStatsDto,
  PendingDocumentsResponseDto,
} from '../dto/document.dto';
import { DocumentType } from '@app/database';

@ApiTags('Documents')
@Controller('verification/documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload identity document',
    description: 'Upload an identity document for verification',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (JPEG, PNG, or PDF)',
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Type of document',
        },
        documentNumber: {
          type: 'string',
          description: 'Document number (optional)',
        },
        expiryDate: {
          type: 'string',
          format: 'date',
          description: 'Document expiry date (optional)',
        },
      },
      required: ['file', 'documentType'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async uploadDocument(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Uploading document for user ${userId}: ${uploadDocumentDto.documentType}`);

    return this.documentService.uploadDocument(
      {
        userId,
        documentType: uploadDocumentDto.documentType,
        documentNumber: uploadDocumentDto.documentNumber,
        file,
        expiryDate: uploadDocumentDto.expiryDate ? new Date(uploadDocumentDto.expiryDate) : undefined,
      },
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get user documents',
    description: 'Get all documents for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User documents retrieved successfully',
    type: UserDocumentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserDocuments(@Request() req: any): Promise<UserDocumentsResponseDto> {
    const userId = req.user.id;

    this.logger.log(`Getting documents for user ${userId}`);

    const result = await this.documentService.getUserDocuments(userId);

    return {
      success: true,
      data: result,
      message: 'User documents retrieved successfully',
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get documents for specific user',
    description: 'Get all documents for a specific user (admin function)',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get documents for' })
  @ApiResponse({
    status: 200,
    description: 'User documents retrieved successfully',
    type: UserDocumentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserDocumentsById(@Param('userId') userId: string): Promise<UserDocumentsResponseDto> {
    this.logger.log(`Getting documents for user ${userId}`);

    const result = await this.documentService.getUserDocuments(userId);

    return {
      success: true,
      data: result,
      message: 'User documents retrieved successfully',
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get document statistics',
    description: 'Get document statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getDocumentStats(@Request() req: any): Promise<{
    success: boolean;
    data: DocumentStatsDto;
    message: string;
  }> {
    const userId = req.user.id;

    this.logger.log(`Getting document stats for user ${userId}`);

    const stats = await this.documentService.getDocumentStats(userId);

    return {
      success: true,
      data: stats,
      message: 'Document statistics retrieved successfully',
    };
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Get pending documents',
    description: 'Get all pending documents for verification (admin function)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending documents retrieved successfully',
    type: PendingDocumentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getPendingDocuments(): Promise<PendingDocumentsResponseDto> {
    this.logger.log('Getting pending documents');

    const documents = await this.documentService.getPendingDocuments();

    return {
      success: true,
      data: documents,
      message: 'Pending documents retrieved successfully',
    };
  }

  @Get('by-type')
  @ApiOperation({
    summary: 'Get documents by type',
    description: 'Get documents filtered by type for the authenticated user',
  })
  @ApiQuery({ name: 'documentType', enum: DocumentType, description: 'Document type to filter by' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getDocumentsByType(
    @Request() req: any,
    @Query('documentType') documentType: DocumentType,
  ): Promise<{
    success: boolean;
    data: any[];
    message: string;
  }> {
    const userId = req.user.id;

    this.logger.log(`Getting documents by type for user ${userId}: ${documentType}`);

    const documents = await this.documentService.getDocumentsByType(userId, documentType);

    return {
      success: true,
      data: documents,
      message: 'Documents retrieved successfully',
    };
  }

  @Get(':documentId')
  @ApiOperation({
    summary: 'Get specific document',
    description: 'Get details of a specific document',
  })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getDocument(@Param('documentId') documentId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    this.logger.log(`Getting document ${documentId}`);

    const document = await this.documentService.getDocument(documentId);

    return {
      success: true,
      data: document,
      message: 'Document retrieved successfully',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify or reject document',
    description: 'Verify or reject a document (admin function)',
  })
  @ApiBody({ type: VerifyDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document verification updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async verifyDocument(
    @Request() req: any,
    @Body() verifyDocumentDto: VerifyDocumentDto,
  ): Promise<DocumentResponseDto> {
    const verifiedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Verifying document ${verifyDocumentDto.documentId}`);

    return this.documentService.verifyDocument(
      {
        ...verifyDocumentDto,
        verifiedBy,
      },
      ipAddress,
      userAgent,
    );
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document (user can only delete their own documents)',
  })
  @ApiParam({ name: 'documentId', description: 'Document ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async deleteDocument(
    @Request() req: any,
    @Param('documentId') documentId: string,
  ): Promise<DocumentResponseDto> {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Deleting document ${documentId} by user ${userId}`);

    return this.documentService.deleteDocument(documentId, userId, ipAddress, userAgent);
  }
}
