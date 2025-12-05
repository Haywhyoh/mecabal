import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { InitializePaymentDto, PaymentFilterDto, RefundPaymentDto } from '../dto/payment.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    userId?: string; // For backward compatibility
    email: string;
  };
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize Paystack payment' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  async initialize(
    @Request() req: AuthenticatedRequest,
    @Body() initializeDto: InitializePaymentDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await this.paymentService.initializePayment(
      userId,
      initializeDto,
    );
    return {
      success: true,
      message: 'Payment initialized successfully',
      data: result,
    };
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verify(@Param('reference') reference: string) {
    const payment = await this.paymentService.verifyPayment(reference);
    return {
      success: true,
      message: 'Payment verified successfully',
      data: payment,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  async getPaymentHistory(
    @Request() req: AuthenticatedRequest,
    @Query() filter: PaymentFilterDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await this.paymentService.findUserPayments(
      userId,
      filter,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getById(@Param('id') id: string) {
    const payment = await this.paymentService.findById(id);
    return {
      success: true,
      data: payment,
    };
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refund(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() refundDto: RefundPaymentDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const payment = await this.paymentService.refundPayment(
      id,
      userId,
      refundDto,
    );
    return {
      success: true,
      message: 'Refund processed successfully',
      data: payment,
    };
  }
}



