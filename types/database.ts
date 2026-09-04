export type UserRole = 'buyer' | 'seller';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  identity_verified?: boolean;
  identity_verification_status?: string;
  preferred_language?: string;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  phone_verified?: boolean;
  face_verified?: boolean;
  face_photo_url?: string | null;
  cnic_holder_name?: string | null;
  cnic_number?: string | null;
  created_at: string;
  updated_at: string;
}

export type ListingStatus = 'active' | 'sold' | 'draft';

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string;
  display_order: number;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  product_name: string;
  product_category?: string | null;
  quantity: number;
  quantity_unit: string;
  quality?: string | null;
  quality_description?: string | null;
  price: number;
  currency: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  images?: ListingImage[];
}

export type TradeStatus =
  | 'negotiating'
  | 'pending_confirmation'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface Trade {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: TradeStatus;
  created_at: string;
  updated_at: string;
  buyer_confirmed?: boolean;
  seller_confirmed?: boolean;
  buyer_confirmed_at?: string | null;
  seller_confirmed_at?: string | null;
  listing?: Listing;
  buyer?: Profile;
  seller?: Profile;
}

export type MessageType = 'text' | 'voice' | 'system' | 'ai_assistant';

export interface ChatMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string | null;
  audio_url: string | null;
  transcription: string | null;
  language: string;
  created_at: string;
  sender?: Profile;
}

export type TermStatus =
  | 'proposed'
  | 'negotiating'
  | 'agreed'
  | 'missing'
  | 'conflicting'
  | 'rejected';

export interface AgreementTerm {
  id: string;
  trade_id: string;
  field_name: string;
  value: any;
  status: TermStatus;
  confidence: number;
  evidence_message_ids: string[];
  updated_at: string;
  confirmed_by_buyer: boolean;
  confirmed_by_seller: boolean;
  version: number;
}

export interface AgreementSnapshot {
  id: string;
  trade_id: string;
  agreement_data: Record<string, any>;
  agreement_status: string;
  created_at: string;
}

export type AgreementDocumentStatus =
  | 'draft'
  | 'pending_confirmation'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface Agreement {
  id: string;
  trade_id: string;
  agreement_number: string;
  agreement_data: Record<string, any>;
  document_url: string | null;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  buyer_confirmed_at: string | null;
  seller_confirmed_at: string | null;
  status: AgreementDocumentStatus;
  created_at: string;
  updated_at: string;
}
