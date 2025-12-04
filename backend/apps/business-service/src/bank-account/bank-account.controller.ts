import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto, VerifyBankAccountDto } from '../dto/bank-account.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    userId?: string; // For backward compatibility
    email: string;
  };
}

@ApiTags('Bank Accounts')
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Add bank account' })
  @ApiResponse({ status: 201, description: 'Bank account added successfully' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBankAccountDto,
  ) {
    const userId = req.user.id || req.user.userId;
    const account = await this.bankAccountService.create(
      userId,
      createDto,
    );
    return {
      success: true,
      message: 'Bank account added successfully',
      data: account,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user bank accounts' })
  @ApiResponse({ status: 200, description: 'Bank accounts retrieved' })
  async findAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id || req.user.userId;
    const accounts = await this.bankAccountService.findAll(userId);
    return {
      success: true,
      data: accounts,
    };
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify bank account' })
  @ApiResponse({ status: 200, description: 'Bank account verified' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  async verify(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() verifyDto: VerifyBankAccountDto,
  ) {
    const userId = req.user.id || req.user.userId;
    const account = await this.bankAccountService.verify(
      id,
      userId,
      verifyDto,
    );
    return {
      success: true,
      message: 'Bank account verified successfully',
      data: account,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove bank account' })
  @ApiResponse({ status: 200, description: 'Bank account removed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id || req.user.userId;
    await this.bankAccountService.remove(id, userId);
    return {
      success: true,
      message: 'Bank account removed successfully',
    };
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'Set default bank account' })
  @ApiResponse({ status: 200, description: 'Default bank account set' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  async setDefault(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id || req.user.userId;
    const account = await this.bankAccountService.setDefault(id, userId);
    return {
      success: true,
      message: 'Default bank account set successfully',
      data: account,
    };
  }
}

