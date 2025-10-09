// Inquiry-related TypeScript interfaces matching backend DTOs

// Inquiry type enum
export enum InquiryType {
  BOOKING = 'booking',
  QUESTION = 'question',
  QUOTE = 'quote',
}

// Inquiry status enum
export enum InquiryStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

// Preferred contact method enum
export enum PreferredContact {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in-app',
}

// Business inquiry interface
export interface BusinessInquiry {
  id: string;
  businessId: string;
  userId: string;
  inquiryType: InquiryType;
  message: string;
  phoneNumber?: string;
  preferredContact?: PreferredContact;
  preferredDate?: string;
  status: InquiryStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields from backend
  business?: {
    id: string;
    businessName: string;
    category?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

// DTO for creating an inquiry
export interface CreateInquiryDto {
  inquiryType: InquiryType;
  message: string;
  phoneNumber?: string;
  preferredContact?: PreferredContact;
  preferredDate?: string;
}

// DTO for responding to an inquiry
export interface RespondToInquiryDto {
  response: string;
}

// DTO for updating inquiry status
export interface UpdateInquiryStatusDto {
  status: InquiryStatus;
}

// Inquiry statistics
export interface InquiryStats {
  total: number;
  pending: number;
  responded: number;
  closed: number;
  averageResponseTime: string; // e.g., "2 hours"
}
