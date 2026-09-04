export type WizardQuestionType = 'crop_name' | 'quantity' | 'quality';

export interface CropNameExtraction {
  crop_name: string;
  original_response: string;
  language: string;
}

export interface QuantityExtraction {
  quantity: number | null;
  unit: string | null;
  original_response: string;
}

export interface QualityExtraction {
  quality: string;
  quality_description: string;
  confidence: number;
  original_response: string;
}

export interface AIListingResponse {
  success: boolean;
  question_type: WizardQuestionType;
  extracted_value: CropNameExtraction | QuantityExtraction | QualityExtraction | null;
  display_value: string | null;
  confidence: number;
  needs_clarification: boolean;
  clarification_question: string | null;
}

export interface ListingImageItem {
  id: string;
  uri: string;
}

export interface ListingWizardDraft {
  cropName: string | null;
  quantity: number | null;
  quantityUnit: string | null;
  quality: string | null;
  qualityDescription: string | null;
  images: ListingImageItem[];
  step: number; // 1: Crop, 2: Quantity, 3: Quality, 4: Photos, 5: Price & Publish
}
