import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityDocument, DocumentType } from '@app/database';
import { VerificationAudit } from '@app/database';
import { FileUploadService } from '@app/storage';

export interface DocumentUploadRequest {
  userId: string;
  documentType: DocumentType;
  documentNumber?: string;
  file: Express.Multer.File;
  expiryDate?: Date;
}

export interface DocumentVerificationRequest {
  documentId: string;
  isVerified: boolean;
  verifiedBy: string;
  rejectionReason?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  documentsByType: Record<DocumentType, number>;
  recentUploads: IdentityDocument[];
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  constructor(
    @InjectRepository(IdentityDocument)
    private readonly identityDocumentRepository: Repository<IdentityDocument>,
    @InjectRepository(VerificationAudit)
    private readonly verificationAuditRepository: Repository<VerificationAudit>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Upload and store an identity document
   */
  async uploadDocument(
    request: DocumentUploadRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; documentId?: string }> {
    try {
      const { userId, documentType, documentNumber, file, expiryDate } = request;

      // Validate file
      this.validateFile(file);

      // Check if user already has this document type
      const existingDocument = await this.identityDocumentRepository.findOne({
        where: { userId, documentType, isVerified: true },
      });

      if (existingDocument) {
        throw new BadRequestException(`User already has a verified ${documentType} document`);
      }

      // Upload file to storage
      const fileUrl = await this.uploadFileToStorage(file, userId, documentType);

      // Create document record
      const document = this.identityDocumentRepository.create({
        userId,
        documentType,
        documentNumber,
        documentUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        isVerified: false,
        expiryDate,
      });

      const savedDocument = await this.identityDocumentRepository.save(document);

      // Create audit log
      await this.createAuditLog(
        userId,
        'document',
        'uploaded',
        'success',
        null,
        { documentId: savedDocument.id, documentType, fileSize: file.size },
        { ipAddress, userAgent },
        userId,
      );

      this.logger.log(`Document uploaded for user ${userId}: ${documentType}`);
      return {
        success: true,
        message: 'Document uploaded successfully',
        documentId: savedDocument.id,
      };
    } catch (error) {
      this.logger.error(`Error uploading document:`, error);
      throw error;
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<{
    documents: IdentityDocument[];
    stats: DocumentStats;
  }> {
    const documents = await this.identityDocumentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const stats = await this.calculateDocumentStats(userId);

    return { documents, stats };
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<IdentityDocument> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Verify or reject a document (admin function)
   */
  async verifyDocument(
    request: DocumentVerificationRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { documentId, isVerified, verifiedBy, rejectionReason } = request;

      const document = await this.identityDocumentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Update document
      document.isVerified = isVerified;
      document.verifiedAt = new Date();
      document.verifiedBy = verifiedBy;
      document.rejectionReason = rejectionReason;

      await this.identityDocumentRepository.save(document);

      // Create audit log
      await this.createAuditLog(
        document.userId,
        'document',
        isVerified ? 'verified' : 'rejected',
        'success',
        { documentId, previousStatus: 'pending' },
        { documentId, newStatus: isVerified ? 'verified' : 'rejected', rejectionReason },
        { ipAddress, userAgent },
        verifiedBy,
      );

      // Auto-award verification badge if document is verified
      if (isVerified) {
        // This would integrate with the badge service
        this.logger.log(`Document ${documentId} verified, badge should be awarded`);
      }

      this.logger.log(`Document ${documentId} ${isVerified ? 'verified' : 'rejected'} by ${verifiedBy}`);
      return {
        success: true,
        message: `Document ${isVerified ? 'verified' : 'rejected'} successfully`,
      };
    } catch (error) {
      this.logger.error(`Error verifying document:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(
    documentId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const document = await this.identityDocumentRepository.findOne({
        where: { id: documentId, userId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Delete file from storage
      await this.deleteFileFromStorage(document.documentUrl);

      // Delete document record
      await this.identityDocumentRepository.remove(document);

      // Create audit log
      await this.createAuditLog(
        userId,
        'document',
        'deleted',
        'success',
        { documentId, documentType: document.documentType },
        null,
        { ipAddress, userAgent },
        userId,
      );

      this.logger.log(`Document ${documentId} deleted by user ${userId}`);
      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting document:`, error);
      throw error;
    }
  }

  /**
   * Get document statistics for a user
   */
  async getDocumentStats(userId: string): Promise<DocumentStats> {
    return this.calculateDocumentStats(userId);
  }

  /**
   * Get all pending documents (admin function)
   */
  async getPendingDocuments(): Promise<IdentityDocument[]> {
    return this.identityDocumentRepository.find({
      where: { isVerified: false },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get documents by type for a user
   */
  async getDocumentsByType(
    userId: string,
    documentType: DocumentType,
  ): Promise<IdentityDocument[]> {
    return this.identityDocumentRepository.find({
      where: { userId, documentType },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
  }

  /**
   * Upload file to storage service
   */
  private async uploadFileToStorage(
    file: Express.Multer.File,
    userId: string,
    documentType: DocumentType,
  ): Promise<string> {
    try {
      const mediaFile = {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };

      const result = await this.fileUploadService.uploadDocument(
        mediaFile,
        userId,
        false, // Documents are not public by default
      );

      return result.url;
    } catch (error) {
      this.logger.error('Error uploading file to storage:', error);
      throw new BadRequestException('Failed to upload file to storage');
    }
  }

  /**
   * Delete file from storage service
   */
  private async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract file key from URL for deletion
      const fileKey = fileUrl.split('/').pop();
      if (fileKey) {
        await this.fileUploadService.deleteFile(fileKey);
      }
    } catch (error) {
      this.logger.error('Error deleting file from storage:', error);
      // Don't throw error as the database record is already deleted
    }
  }

  /**
   * Calculate document statistics for a user
   */
  private async calculateDocumentStats(userId: string): Promise<DocumentStats> {
    const documents = await this.identityDocumentRepository.find({
      where: { userId },
    });

    const verifiedDocuments = documents.filter(doc => doc.isVerified).length;
    const pendingDocuments = documents.filter(doc => !doc.isVerified && !doc.rejectionReason).length;
    const rejectedDocuments = documents.filter(doc => !doc.isVerified && doc.rejectionReason).length;

    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    const recentUploads = documents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      totalDocuments: documents.length,
      verifiedDocuments,
      pendingDocuments,
      rejectedDocuments,
      documentsByType,
      recentUploads,
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    verificationType: string,
    action: string,
    status: string,
    previousValue: any,
    newValue: any,
    metadata: any,
    performedBy: string,
  ): Promise<void> {
    try {
      const auditLog = this.verificationAuditRepository.create({
        userId,
        verificationType,
        action,
        status,
        previousValue,
        newValue,
        metadata,
        performedBy,
      });

      await this.verificationAuditRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}
