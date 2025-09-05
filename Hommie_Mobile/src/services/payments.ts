// MeCabal Payment Services
// Nigerian payment processing with Paystack integration

import { supabase, handleSupabaseError, logPerformance } from './supabase';
import type { 
  PaymentInitResponse,
  PaymentVerifyResponse,
  PaymentTransaction,
  ApiResponse 
} from '../types';

export class MeCabalPayments {
  // Initialize payment with Paystack
  static async initializePayment(paymentData: {
    amount: number;
    email: string;
    phone?: string;
    listing_id?: string;
    user_id: string;
    transaction_type?: 'purchase' | 'escrow' | 'service' | 'event_ticket';
    callback_url?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentInitResponse> {
    const startTime = Date.now();
    
    try {
      // Validate required fields
      if (!paymentData.amount || !paymentData.email || !paymentData.user_id) {
        return {
          success: false,
          error: 'Amount, email, and user_id are required'
        };
      }

      // Validate minimum amount (₦100)
      if (paymentData.amount < 100) {
        return {
          success: false,
          error: 'Minimum payment amount is ₦100'
        };
      }

      // Initialize payment through edge function
      const { data, error } = await supabase.functions.invoke('paystack-payment/initialize', {
        body: {
          amount: paymentData.amount,
          email: paymentData.email,
          phone: paymentData.phone,
          listing_id: paymentData.listing_id,
          user_id: paymentData.user_id,
          transaction_type: paymentData.transaction_type || 'purchase',
          callback_url: paymentData.callback_url,
          metadata: {
            ...paymentData.metadata,
            platform: 'mecabal_mobile',
            timestamp: new Date().toISOString()
          }
        }
      });

      logPerformance('initializePayment', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return data;
    } catch (error: any) {
      logPerformance('initializePayment', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Verify payment after user completes transaction
  static async verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
    const startTime = Date.now();
    
    try {
      if (!reference) {
        return {
          success: false,
          error: 'Payment reference is required'
        };
      }

      const { data, error } = await supabase.functions.invoke('paystack-payment/verify', {
        body: { reference }
      });

      logPerformance('verifyPayment', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return data;
    } catch (error: any) {
      logPerformance('verifyPayment', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Get transaction status
  static async getTransactionStatus(
    reference: string, 
    userId?: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    const startTime = Date.now();
    
    try {
      let query = supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_reference', reference);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      logPerformance('getTransactionStatus', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as PaymentTransaction
      };
    } catch (error: any) {
      logPerformance('getTransactionStatus', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Get user's transaction history
  static async getTransactionHistory(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'successful' | 'failed' | 'cancelled';
      transaction_type?: string;
    }
  ): Promise<{
    transactions: PaymentTransaction[];
    total: number;
    has_more: boolean;
  }> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 20;
    
    try {
      let query = supabase
        .from('payment_transactions')
        .select('*, listing:marketplace_listings(title, media_urls)', { count: 'exact' })
        .eq('user_id', userId);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.transaction_type) {
        query = query.eq('transaction_type', options.transaction_type);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getTransactionHistory', startTime);

      if (error) {
        console.error('Error getting transaction history:', error);
        return { transactions: [], total: 0, has_more: false };
      }

      return {
        transactions: data as PaymentTransaction[],
        total: count || 0,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getTransactionHistory', startTime);
      console.error('Error getting transaction history:', error);
      return { transactions: [], total: 0, has_more: false };
    }
  }

  // Calculate transaction fee (Nigerian context)
  static calculateTransactionFee(amount: number): {
    amount_before_fee: number;
    paystack_fee: number;
    mecabal_fee: number;
    total_fee: number;
    amount_to_pay: number;
  } {
    // Paystack fees for Nigerian transactions
    const paystackFee = Math.max(100, Math.min(2000, amount * 0.015)); // 1.5% capped at ₦2000, min ₦100
    
    // MeCabal platform fee (2% for marketplace transactions)
    const mecabalFee = amount * 0.02;
    
    const totalFee = paystackFee + mecabalFee;
    
    return {
      amount_before_fee: amount,
      paystack_fee: Math.round(paystackFee),
      mecabal_fee: Math.round(mecabalFee),
      total_fee: Math.round(totalFee),
      amount_to_pay: Math.round(amount + totalFee)
    };
  }

  // Format Nigerian currency
  static formatNaira(amount: number, showSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return showSymbol ? `₦${formatted}` : formatted;
  }

  // Convert Naira to Kobo (Paystack uses kobo)
  static nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  // Convert Kobo to Naira
  static koboToNaira(kobo: number): number {
    return kobo / 100;
  }

  // Validate payment amount
  static validateAmount(amount: number): {
    valid: boolean;
    error?: string;
    formatted_amount?: number;
  } {
    if (isNaN(amount) || amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be a positive number'
      };
    }

    if (amount < 100) {
      return {
        valid: false,
        error: 'Minimum payment amount is ₦100'
      };
    }

    if (amount > 1000000) {
      return {
        valid: false,
        error: 'Maximum payment amount is ₦1,000,000'
      };
    }

    return {
      valid: true,
      formatted_amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
    };
  }

  // Get supported Nigerian payment methods
  static getSupportedPaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
  }> {
    return [
      {
        id: 'card',
        name: 'Debit/Credit Card',
        description: 'Visa, Mastercard, Verve',
        icon: 'credit-card',
        enabled: true
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'All Nigerian banks',
        icon: 'bank',
        enabled: true
      },
      {
        id: 'ussd',
        name: 'USSD',
        description: 'Dial *737# or other codes',
        icon: 'phone',
        enabled: true
      },
      {
        id: 'qr',
        name: 'QR Code',
        description: 'Scan to pay',
        icon: 'qr-code',
        enabled: true
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'Opay, PalmPay, etc.',
        icon: 'mobile-phone',
        enabled: true
      }
    ];
  }

  // Check if payment method is available for amount
  static isPaymentMethodAvailable(
    method: string, 
    amount: number
  ): boolean {
    switch (method) {
      case 'card':
        return amount >= 100; // All amounts
      case 'bank_transfer':
        return amount >= 100; // All amounts
      case 'ussd':
        return amount >= 100 && amount <= 1000000; // USSD limits
      case 'qr':
        return amount >= 100 && amount <= 500000; // QR limits
      case 'mobile_money':
        return amount >= 100 && amount <= 200000; // Mobile money limits
      default:
        return false;
    }
  }

  // Generate payment description for different transaction types
  static generatePaymentDescription(
    transactionType: string,
    metadata?: any
  ): string {
    switch (transactionType) {
      case 'purchase':
        return `Purchase: ${metadata?.listing_title || 'Marketplace Item'}`;
      case 'service':
        return `Service: ${metadata?.service_name || 'Professional Service'}`;
      case 'event_ticket':
        return `Event: ${metadata?.event_title || 'Community Event'}`;
      case 'escrow':
        return `Escrow: ${metadata?.listing_title || 'Secured Transaction'}`;
      default:
        return 'MeCabal Payment';
    }
  }

  // Handle payment success callback
  static async handlePaymentSuccess(
    reference: string,
    onSuccess?: (transaction: PaymentTransaction) => void
  ): Promise<void> {
    try {
      // Verify the payment
      const verifyResult = await this.verifyPayment(reference);
      
      if (verifyResult.success && verifyResult.data?.status === 'successful') {
        // Get the updated transaction record
        const statusResult = await this.getTransactionStatus(reference);
        
        if (statusResult.success && statusResult.data) {
          onSuccess?.(statusResult.data);
        }
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle payment failure
  static handlePaymentFailure(
    reference: string,
    error: string,
    onFailure?: (error: string) => void
  ): void {
    console.error(`Payment failed for reference ${reference}:`, error);
    onFailure?.(error);
  }
}