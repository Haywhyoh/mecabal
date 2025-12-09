import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TermiiService } from './termii.service';
import axios from 'axios';

jest.mock('axios');

describe('TermiiService', () => {
  let service: TermiiService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        TERMII_API_KEY: 'test-api-key-123',
        TERMII_SENDER_ID: 'MeCabal',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermiiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TermiiService>(TermiiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should warn when TERMII_API_KEY is not configured', () => {
    mockConfigService.get.mockReturnValue(undefined);
    new TermiiService(mockConfigService as any);
    // Should log warning but not throw
  });

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      // Recreate service with API key configured
      const configWithKey = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config = {
            TERMII_API_KEY: 'test-api-key-123',
            TERMII_SENDER_ID: 'MeCabal',
          };
          return config[key] || defaultValue;
        }),
      };
      const serviceWithKey = new TermiiService(configWithKey as any);
      expect(serviceWithKey.isConfigured()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      const configWithoutKey = {
        get: jest.fn().mockReturnValue(undefined),
      };
      const newService = new TermiiService(configWithoutKey as any);
      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('sendToken', () => {
    const phoneNumber = '+2348012345678';
    const mockResponse = {
      data: {
        smsStatus: 'Message Sent',
        pinId: 'pin-123',
        pin_id: 'pin-123',
        to: '2348012345678',
        phone_number: '2348012345678',
        message_id_str: 'msg-123',
        status: 'success',
        pin: '1234',
      },
    };

    it('should send token successfully via DND channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.sendToken(phoneNumber, 'dnd');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.ng.termii.com/api/sms/otp/send',
        expect.objectContaining({
          api_key: 'test-api-key-123',
          to: '2348012345678',
          channel: 'dnd',
          from: 'MeCabal',
          pin_type: 'NUMERIC',
        }),
      );
    });

    it('should send token via generic channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendToken(phoneNumber, 'generic');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ channel: 'generic' }),
      );
    });

    it('should send token via WhatsApp channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendToken(phoneNumber, 'whatsapp');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ channel: 'whatsapp' }),
      );
    });

    it('should handle phone numbers without country code', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendToken('08012345678');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ to: '08012345678' }),
      );
    });

    it('should use custom pin length', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendToken(phoneNumber, 'dnd', 6);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ pin_length: 6 }),
      );
    });

    it('should use custom message text', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);
      const customMessage = 'Your code is < 1234 >';

      await service.sendToken(phoneNumber, 'dnd', 4, '< 1234 >', customMessage);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ message_text: customMessage }),
      );
    });

    it('should use custom time to live', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendToken(phoneNumber, 'dnd', 4, '< 1234 >', 'Message', 10);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ pin_time_to_live: 10 }),
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request',
            error: 'Bad request',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(service.sendToken(phoneNumber)).rejects.toThrow('Failed to send OTP');
    });

    it('should preserve original error in thrown error', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        message: 'Request failed',
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      try {
        await service.sendToken(phoneNumber);
      } catch (error: any) {
        expect(error.response).toBeDefined();
        expect(error.originalError).toBeDefined();
      }
    });
  });

  describe('sendWhatsAppToken', () => {
    const phoneNumber = '+2348012345678';
    const mockResponse = {
      data: {
        code: 'ok',
        balance: 100,
        message_id: 'msg-123',
        message_id_str: 'msg-123',
        message: 'Message sent',
        user: 'test-user',
      },
    };

    it('should send WhatsApp token successfully', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.sendWhatsAppToken(phoneNumber);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.ng.termii.com/api/sms/otp/send',
        expect.objectContaining({
          channel: 'whatsapp',
        }),
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API error'));

      await expect(service.sendWhatsAppToken(phoneNumber)).rejects.toThrow(
        'Failed to send WhatsApp OTP',
      );
    });
  });

  describe('verifyToken', () => {
    const pinId = 'pin-123';
    const pin = '1234';

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should verify token successfully', async () => {
      const mockResponse = {
        pinId: 'pin-123',
        verified: true,
        msisdn: '2348012345678',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.verifyToken(pinId, pin);

      expect(result.verified).toBe(true);
      expect(result.pinId).toBe(pinId);
    });

    it('should handle string "True" as verified', async () => {
      const mockResponse = {
        pinId: 'pin-123',
        verified: 'True',
        msisdn: '2348012345678',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.verifyToken(pinId, pin);

      expect(result.verified).toBe(true);
    });

    it('should retry with X-API-KEY header on 401', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            pinId: 'pin-123',
            verified: true,
            msisdn: '2348012345678',
          }),
        });

      const result = await service.verifyToken(pinId, pin);

      expect(result.verified).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle verification errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Invalid pin' }),
      });

      await expect(service.verifyToken(pinId, pin)).rejects.toThrow(
        'Failed to verify OTP',
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.verifyToken(pinId, pin)).rejects.toThrow(
        'Failed to verify OTP',
      );
    });
  });

  describe('sendSMS', () => {
    const phoneNumber = '+2348012345678';
    const message = 'Test SMS message';
    const mockResponse = {
      data: {
        message_id: 'msg-123',
        message: 'Message sent successfully',
        balance: 100,
        user: 'test-user',
      },
    };

    it('should send SMS successfully via DND channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.sendSMS(phoneNumber, message, 'dnd');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.ng.termii.com/api/sms/send',
        expect.objectContaining({
          api_key: 'test-api-key-123',
          to: '2348012345678',
          from: 'MeCabal',
          sms: message,
          type: 'plain',
          channel: 'dnd',
        }),
      );
    });

    it('should send SMS via generic channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendSMS(phoneNumber, message, 'generic');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ channel: 'generic' }),
      );
    });

    it('should send SMS via WhatsApp channel', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendSMS(phoneNumber, message, 'whatsapp');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ channel: 'whatsapp' }),
      );
    });

    it('should handle phone numbers without country code', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendSMS('08012345678', message);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ to: '08012345678' }),
      );
    });

    it('should handle long messages', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);
      const longMessage = 'A'.repeat(300);

      await service.sendSMS(phoneNumber, longMessage);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sms: longMessage }),
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { error: 'Invalid phone number' },
        },
        message: 'Request failed',
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(service.sendSMS(phoneNumber, message)).rejects.toThrow(
        'Failed to send SMS',
      );
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network timeout'));

      await expect(service.sendSMS(phoneNumber, message)).rejects.toThrow(
        'Failed to send SMS',
      );
    });

    it('should handle insufficient balance errors', async () => {
      const errorResponse = {
        response: {
          status: 402,
          data: { error: 'Insufficient balance' },
        },
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(service.sendSMS(phoneNumber, message)).rejects.toThrow(
        'Failed to send SMS',
      );
    });

    it('should use default DND channel when not specified', async () => {
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendSMS(phoneNumber, message);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ channel: 'dnd' }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty phone number', async () => {
      const mockResponse = { data: { smsStatus: 'Sent' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.sendSMS('', 'Test message');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ to: '' }),
      );
    });

    it('should handle special characters in message', async () => {
      const mockResponse = { data: { message_id: 'msg-123' } };
      mockedAxios.post.mockResolvedValue(mockResponse);
      const specialMessage = 'Test @#$%^&*() message';

      await service.sendSMS('+2348012345678', specialMessage);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sms: specialMessage }),
      );
    });

    it('should handle Unicode characters in message', async () => {
      const mockResponse = { data: { message_id: 'msg-123' } };
      mockedAxios.post.mockResolvedValue(mockResponse);
      const unicodeMessage = 'Hello 🎉 Unicode test 你好';

      await service.sendSMS('+2348012345678', unicodeMessage);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sms: unicodeMessage }),
      );
    });
  });
});
