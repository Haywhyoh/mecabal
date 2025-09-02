import { Injectable } from '@nestjs/common';

export interface CarrierInfo {
  name: string;
  code: string;
  prefixes: string[];
  color: string;
  ussdCodes: {
    balance: string;
    dataBalance: string;
    help: string;
  };
}

export enum NigerianCarrier {
  MTN = 'MTN',
  AIRTEL = 'Airtel',
  GLO = 'Glo',
  NINE_MOBILE = '9mobile',
  UNKNOWN = 'Unknown'
}

@Injectable()
export class NigerianCarrierService {
  private readonly carriers: Map<string, CarrierInfo> = new Map([
    [NigerianCarrier.MTN, {
      name: 'MTN',
      code: 'MTN',
      prefixes: [
        '0803', '0806', '0813', '0816', '0810', '0814', '0903', '0906',
        '0703', '0706', '0704', '0705', '0708', '0709', '070', '080', 
        '081', '090', '091'
      ],
      color: '#FFCC00',
      ussdCodes: {
        balance: '*556#',
        dataBalance: '*131*4#',
        help: '*123#'
      }
    }],
    [NigerianCarrier.AIRTEL, {
      name: 'Airtel',
      code: 'AIRTEL',
      prefixes: [
        '0802', '0808', '0812', '0701', '0902', '0901', '0904', '0907', '0901'
      ],
      color: '#FF0000',
      ussdCodes: {
        balance: '*123#',
        dataBalance: '*140#',
        help: '*123#'
      }
    }],
    [NigerianCarrier.GLO, {
      name: 'Glo',
      code: 'GLO',
      prefixes: [
        '0805', '0807', '0811', '0815', '0705', '0905'
      ],
      color: '#00A651',
      ussdCodes: {
        balance: '*124#',
        dataBalance: '*777#',
        help: '*777#'
      }
    }],
    [NigerianCarrier.NINE_MOBILE, {
      name: '9mobile',
      code: '9MOBILE',
      prefixes: [
        '0809', '0817', '0818', '0908', '0909'
      ],
      color: '#006837',
      ussdCodes: {
        balance: '*232#',
        dataBalance: '*228#',
        help: '*200#'
      }
    }]
  ]);

  /**
   * Detect carrier from Nigerian phone number
   * @param phoneNumber - Nigerian phone number (with or without country code)
   * @returns Detected carrier information
   */
  detectCarrier(phoneNumber: string): { carrier: NigerianCarrier; info?: CarrierInfo; confidence: 'high' | 'medium' | 'low' } {
    // Normalize phone number
    const normalized = this.normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      return { carrier: NigerianCarrier.UNKNOWN, confidence: 'low' };
    }

    // Check against carrier prefixes
    for (const [carrierName, carrierInfo] of this.carriers.entries()) {
      for (const prefix of carrierInfo.prefixes) {
        if (normalized.startsWith(prefix)) {
          return {
            carrier: carrierName as NigerianCarrier,
            info: carrierInfo,
            confidence: prefix.length >= 4 ? 'high' : 'medium'
          };
        }
      }
    }

    // Fallback: check shorter prefixes
    const shortPrefix = normalized.substring(0, 3);
    for (const [carrierName, carrierInfo] of this.carriers.entries()) {
      for (const prefix of carrierInfo.prefixes) {
        if (prefix.startsWith(shortPrefix) || shortPrefix.startsWith(prefix.substring(0, 3))) {
          return {
            carrier: carrierName as NigerianCarrier,
            info: carrierInfo,
            confidence: 'low'
          };
        }
      }
    }

    return { carrier: NigerianCarrier.UNKNOWN, confidence: 'low' };
  }

  /**
   * Get all available carriers
   */
  getAllCarriers(): Map<string, CarrierInfo> {
    return new Map(this.carriers);
  }

  /**
   * Get carrier information by name
   */
  getCarrierInfo(carrierName: NigerianCarrier): CarrierInfo | undefined {
    return this.carriers.get(carrierName);
  }

  /**
   * Check if phone number is a valid Nigerian mobile number
   */
  isValidNigerianMobile(phoneNumber: string): boolean {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    if (!normalized || normalized.length !== 11) {
      return false;
    }

    // Must start with known mobile prefixes
    const detection = this.detectCarrier(phoneNumber);
    return detection.carrier !== NigerianCarrier.UNKNOWN;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string, includeCountryCode: boolean = true): string {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    if (!normalized) return phoneNumber;

    if (includeCountryCode) {
      return `+234 ${normalized.substring(1, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7)}`;
    }

    return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7)}`;
  }

  /**
   * Get USSD codes for specific carrier
   */
  getUSSDCodes(carrierName: NigerianCarrier): CarrierInfo['ussdCodes'] | undefined {
    const info = this.carriers.get(carrierName);
    return info?.ussdCodes;
  }

  /**
   * Generate carrier-specific verification message
   */
  getCarrierVerificationMessage(carrierName: NigerianCarrier, language: string = 'en'): string {
    const messages = {
      en: {
        [NigerianCarrier.MTN]: 'For MTN users, you can also verify by dialing *123*1# on your MTN line.',
        [NigerianCarrier.AIRTEL]: 'For Airtel users, you can also verify by dialing *123*1# on your Airtel line.',
        [NigerianCarrier.GLO]: 'For Glo users, you can also verify by dialing *777*1# on your Glo line.',
        [NigerianCarrier.NINE_MOBILE]: 'For 9mobile users, you can also verify by dialing *200*1# on your 9mobile line.',
        [NigerianCarrier.UNKNOWN]: 'Standard SMS verification will be used for your number.'
      }
    };

    return messages[language]?.[carrierName] || messages.en[carrierName];
  }

  /**
   * Normalize Nigerian phone number to standard 11-digit format
   * Handles: +2348..., 2348..., 08..., 8...
   */
  private normalizePhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null;

    // Remove all non-digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (digitsOnly.startsWith('234')) {
      // +2348... or 2348... format
      return '0' + digitsOnly.substring(3);
    } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
      // 08... format (already correct)
      return digitsOnly;
    } else if (digitsOnly.length === 10 && digitsOnly.startsWith('8')) {
      // 8... format (missing leading 0)
      return '0' + digitsOnly;
    }

    return null; // Invalid format
  }

  /**
   * Get suggested SMS gateway for carrier (for better delivery rates)
   */
  getSMSGatewayPriority(carrierName: NigerianCarrier): string[] {
    const gateways = {
      [NigerianCarrier.MTN]: ['termii', 'bulk-sms', 'send-ng'],
      [NigerianCarrier.AIRTEL]: ['bulk-sms', 'termii', 'send-ng'],
      [NigerianCarrier.GLO]: ['send-ng', 'bulk-sms', 'termii'],
      [NigerianCarrier.NINE_MOBILE]: ['bulk-sms', 'send-ng', 'termii'],
      [NigerianCarrier.UNKNOWN]: ['termii', 'bulk-sms', 'send-ng']
    };

    return gateways[carrierName] || gateways[NigerianCarrier.UNKNOWN];
  }
}