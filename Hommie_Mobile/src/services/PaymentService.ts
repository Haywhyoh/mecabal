import { Alert } from 'react-native';

export interface PaymentProvider {
  id: 'paystack' | 'flutterwave';
  name: string;
  logo: string;
  supportedMethods: PaymentMethod[];
  fees: {
    percentage: number;
    cap?: number; // Maximum fee in Naira
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentRequest {
  amount: number; // in kobo for Paystack, naira for Flutterwave
  currency: 'NGN';
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  reference: string;
  description: string;
  eventId?: string;
  userId?: string;
  metadata?: any;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  transactionId?: string;
  provider: 'paystack' | 'flutterwave';
  amount: number;
  currency: 'NGN';
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  message?: string;
  data?: any;
}

export class PaymentService {
  private static instance: PaymentService;
  private paystackPublicKey: string;
  private flutterwavePublicKey: string;

  private constructor() {
    // These would come from environment variables in production
    this.paystackPublicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_demo';
    this.flutterwavePublicKey = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-demo';
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Available payment providers
  public getAvailableProviders(): PaymentProvider[] {
    return [
      {
        id: 'paystack',
        name: 'Paystack',
        logo: 'https://paystack.com/assets/img/logo/paystack-logo.png',
        supportedMethods: [
          {
            id: 'card',
            name: 'Card Payment',
            icon: 'credit-card',
            description: 'Pay with your debit/credit card',
            minAmount: 100, // 1 Naira
            maxAmount: 500000000, // 5 Million Naira
          },
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            icon: 'bank',
            description: 'Direct bank transfer',
            minAmount: 100,
          },
          {
            id: 'ussd',
            name: 'USSD',
            icon: 'phone',
            description: 'Pay with your phone using USSD',
            minAmount: 100,
            maxAmount: 10000000, // 100,000 Naira
          },
          {
            id: 'qr',
            name: 'QR Code',
            icon: 'qrcode',
            description: 'Scan to pay with your banking app',
            minAmount: 100,
          },
        ],
        fees: {
          percentage: 1.5,
          cap: 200000, // 2000 Naira cap
        },
      },
      {
        id: 'flutterwave',
        name: 'Flutterwave',
        logo: 'https://flutterwave.com/images/logo/logo-colored.svg',
        supportedMethods: [
          {
            id: 'card',
            name: 'Card Payment',
            icon: 'credit-card',
            description: 'Pay with your debit/credit card',
            minAmount: 1, // 1 Naira
            maxAmount: 5000000, // 5 Million Naira
          },
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            icon: 'bank',
            description: 'Direct bank transfer',
            minAmount: 1,
          },
          {
            id: 'mobile_money',
            name: 'Mobile Money',
            icon: 'cellphone',
            description: 'Pay with mobile money',
            minAmount: 1,
          },
          {
            id: 'ussd',
            name: 'USSD',
            icon: 'phone',
            description: 'Pay with your phone using USSD',
            minAmount: 1,
            maxAmount: 100000, // 100,000 Naira
          },
        ],
        fees: {
          percentage: 1.4,
        },
      },
    ];
  }

  // Calculate payment fees
  public calculateFees(amount: number, provider: 'paystack' | 'flutterwave'): number {
    const providerData = this.getAvailableProviders().find(p => p.id === provider);
    if (!providerData) return 0;

    const fee = (amount * providerData.fees.percentage) / 100;
    
    if (providerData.fees.cap && fee > providerData.fees.cap) {
      return providerData.fees.cap;
    }

    return Math.round(fee);
  }

  // Generate payment reference
  public generateReference(prefix: string = 'MeCabal'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  // Validate payment amount
  public validateAmount(amount: number, method: PaymentMethod): { valid: boolean; message?: string } {
    if (amount < (method.minAmount || 1)) {
      return {
        valid: false,
        message: `Minimum amount is ₦${((method.minAmount || 1) / 100).toLocaleString()}`,
      };
    }

    if (method.maxAmount && amount > method.maxAmount) {
      return {
        valid: false,
        message: `Maximum amount is ₦${(method.maxAmount / 100).toLocaleString()}`,
      };
    }

    return { valid: true };
  }

  // Paystack payment integration
  public async initiatePaystackPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // In a real app, you would use react-native-paystack-webview or similar
      // This is a simulation of the payment flow
      console.log('Initiating Paystack payment:', request);

      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        return {
          success: true,
          reference: request.reference,
          transactionId: `PS_${Date.now()}`,
          provider: 'paystack',
          amount: request.amount,
          currency: 'NGN',
          status: 'success',
          message: 'Payment completed successfully',
          data: {
            authorization: {
              authorization_code: 'AUTH_demo123',
              card_type: 'visa',
              last4: '1234',
              bank: 'GTBank',
            },
          },
        };
      } else {
        return {
          success: false,
          reference: request.reference,
          provider: 'paystack',
          amount: request.amount,
          currency: 'NGN',
          status: 'failed',
          message: 'Payment failed. Please try again.',
        };
      }
    } catch (error: any) {
      console.error('Paystack payment error:', error);
      return {
        success: false,
        reference: request.reference,
        provider: 'paystack',
        amount: request.amount,
        currency: 'NGN',
        status: 'failed',
        message: error.message || 'Payment failed. Please try again.',
      };
    }
  }

  // Flutterwave payment integration
  public async initiateFlutterwavePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // In a real app, you would use react-native-flutterwave or similar
      // This is a simulation of the payment flow
      console.log('Initiating Flutterwave payment:', request);

      // Simulate payment processing
      const success = Math.random() > 0.15; // 85% success rate for demo

      if (success) {
        return {
          success: true,
          reference: request.reference,
          transactionId: `FW_${Date.now()}`,
          provider: 'flutterwave',
          amount: request.amount,
          currency: 'NGN',
          status: 'success',
          message: 'Payment completed successfully',
          data: {
            card: {
              last4digits: '1234',
              brand: 'MASTERCARD',
              type: 'DEBIT',
            },
          },
        };
      } else {
        return {
          success: false,
          reference: request.reference,
          provider: 'flutterwave',
          amount: request.amount,
          currency: 'NGN',
          status: 'failed',
          message: 'Payment failed. Please try again.',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave payment error:', error);
      return {
        success: false,
        reference: request.reference,
        provider: 'flutterwave',
        amount: request.amount,
        currency: 'NGN',
        status: 'failed',
        message: error.message || 'Payment failed. Please try again.',
      };
    }
  }

  // Main payment method
  public async processPayment(
    request: PaymentRequest,
    provider: 'paystack' | 'flutterwave'
  ): Promise<PaymentResponse> {
    switch (provider) {
      case 'paystack':
        return this.initiatePaystackPayment(request);
      case 'flutterwave':
        return this.initiateFlutterwavePayment(request);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  // Verify payment status
  public async verifyPayment(
    reference: string,
    provider: 'paystack' | 'flutterwave'
  ): Promise<PaymentResponse> {
    try {
      // In a real app, this would call the respective provider's verification endpoint
      console.log(`Verifying ${provider} payment:`, reference);

      // Simulate verification
      const verified = Math.random() > 0.05; // 95% verification success

      if (verified) {
        return {
          success: true,
          reference,
          provider,
          amount: 0, // Would be retrieved from verification
          currency: 'NGN',
          status: 'success',
          message: 'Payment verified successfully',
        };
      } else {
        return {
          success: false,
          reference,
          provider,
          amount: 0,
          currency: 'NGN',
          status: 'failed',
          message: 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        reference,
        provider,
        amount: 0,
        currency: 'NGN',
        status: 'failed',
        message: 'Verification failed. Please contact support.',
      };
    }
  }

  // Format amount for display
  public formatAmount(amount: number, includeCurrency: boolean = true): string {
    const naira = amount / 100; // Convert kobo to naira
    const formatted = naira.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return includeCurrency ? `₦${formatted}` : formatted;
  }

  // Convert naira to kobo (for Paystack)
  public nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  // Convert kobo to naira
  public koboToNaira(kobo: number): number {
    return kobo / 100;
  }

  // Handle payment success
  public handlePaymentSuccess(response: PaymentResponse, eventId?: string): void {
    Alert.alert(
      'Payment Successful! 🎉',
      `Your payment of ${this.formatAmount(response.amount)} has been processed successfully. You will receive a confirmation shortly.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to success screen or back to event
            console.log('Payment success handled:', response.reference);
          },
        },
      ]
    );
  }

  // Handle payment failure
  public handlePaymentFailure(response: PaymentResponse): void {
    Alert.alert(
      'Payment Failed',
      response.message || 'Your payment could not be processed. Please try again or use a different payment method.',
      [
        {
          text: 'Try Again',
          onPress: () => {
            console.log('Retry payment:', response.reference);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  // Get Nigerian banks (for bank transfer)
  public getNigerianBanks() {
    return [
      { code: '044', name: 'Access Bank' },
      { code: '014', name: 'Afribank' },
      { code: '023', name: 'Citibank' },
      { code: '050', name: 'Ecobank' },
      { code: '084', name: 'Enterprise Bank' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '011', name: 'First Bank' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '301', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '090', name: 'MainStreet Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered Bank' },
      { code: '232', name: 'Sterling Bank' },
      { code: '032', name: 'Union Bank' },
      { code: '033', name: 'United Bank for Africa' },
      { code: '215', name: 'Unity Bank' },
      { code: '057', name: 'Zenith Bank' },
    ];
  }
}

export default PaymentService;