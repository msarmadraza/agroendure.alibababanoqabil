export type CNICVerificationStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'extracted'
  | 'user_confirmed'
  | 'verified'
  | 'failed';

export type ExtractionSource = 'gemini_extracted' | 'user_edited';

export interface CNICExtractionResult {
  document_detected: boolean;
  document_type: string | null;
  is_readable: boolean;
  holder_name: string | null;
  holder_name_urdu?: string | null;
  cnic_number: string | null;
  confidence: number;
  issues: string[];
}

export interface IdentityVerificationRecord {
  id: string;
  user_id: string;
  document_type: string;
  holder_name: string | null;
  holder_name_urdu?: string | null;
  cnic_number: string | null;
  verification_status: CNICVerificationStatus;
  extraction_source: ExtractionSource;
  confidence: number;
  verification_attempts: number;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}
