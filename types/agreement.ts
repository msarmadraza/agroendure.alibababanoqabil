import { TermStatus } from './database';

export interface AgreementUpdate {
  field_name: string;
  previous_value?: any;
  new_value: any;
  status: TermStatus;
  confidence: number;
  evidence_message_ids: string[];
  reason: string;
}

export interface AgreementReadiness {
  percentage: number;
  status: 'incomplete' | 'ready_for_review' | 'confirmed';
}

export interface GeminiAgreementAnalysisResult {
  conversation_summary: string;
  agreement_updates: AgreementUpdate[];
  missing_fields: string[];
  conflicting_fields: string[];
  suggested_questions: string[];
  agreement_readiness: AgreementReadiness;
}

export interface CategorizedTerms {
  agreed: { field: string; label: string; value: string }[];
  pending: { field: string; label: string; value: string; status: TermStatus }[];
  missing: { field: string; label: string }[];
  conflicting: { field: string; label: string; previous: string; new_val: string }[];
}

export const KNOWN_AGREEMENT_FIELDS: Record<string, string> = {
  product_name: 'Product Name',
  product_category: 'Category',
  variety: 'Variety',
  quantity: 'Quantity',
  quantity_unit: 'Quantity Unit',
  quality: 'Quality',
  grade: 'Grade',
  packaging: 'Packaging',
  price_per_unit: 'Price per Unit',
  total_price: 'Total Price',
  currency: 'Currency',
  taxes: 'Taxes',
  additional_charges: 'Additional Charges',
  delivery_location: 'Delivery Location',
  delivery_address: 'Delivery Address',
  delivery_date: 'Delivery Date',
  delivery_time: 'Delivery Time',
  transportation_responsibility: 'Transport Responsibility',
  transportation_cost_responsibility: 'Transport Cost',
  payment_method: 'Payment Method',
  advance_payment: 'Advance Payment',
  advance_payment_amount: 'Advance Amount',
  remaining_payment: 'Remaining Payment',
  payment_due_date: 'Payment Due Date',
  inspection_terms: 'Inspection Terms',
  cancellation_terms: 'Cancellation Terms',
  dispute_resolution: 'Dispute Resolution',
  special_conditions: 'Special Conditions',
  additional_notes: 'Additional Notes',
};

export const KNOWN_AGREEMENT_FIELDS_URDU: Record<string, string> = {
  product_name: 'فصل / جنس کا نام',
  product_category: 'کیٹیگری',
  variety: 'ورائٹی / قسم',
  quantity: 'کل مقدار',
  quantity_unit: 'یونٹ',
  quality: 'کوالٹی',
  grade: 'گریڈ',
  packaging: 'پیکنگ',
  price_per_unit: 'قیمت فی من',
  total_price: 'کل مالیت',
  currency: 'کرنسی',
  taxes: 'ٹیکسز',
  additional_charges: 'اضافی اخراجات',
  delivery_location: 'ڈیلیوری مقام',
  delivery_address: 'مکمل پتہ',
  delivery_date: 'ترسیل کی تاریخ',
  delivery_time: 'ڈیلیوری وقت',
  transportation_responsibility: 'ٹرانسپورٹ ذمہ داری',
  transportation_cost_responsibility: 'کرایہ اخراجات',
  payment_method: 'طریقہ ادائیگی',
  advance_payment: 'ایڈوانس ادائیگی',
  advance_payment_amount: 'ایڈوانس رقم',
  remaining_payment: 'بقیہ رقم',
  payment_due_date: 'ادائیگی کی تاریخ',
  inspection_terms: 'معائنہ شرائط',
  cancellation_terms: 'منسوخی کی شرائط',
  dispute_resolution: 'تنازعات کا حل',
  special_conditions: 'خصوصی شرائط',
  additional_notes: 'اضافی نوٹس',
};

export function getAgreementFieldLabel(field: string, isUrdu: boolean): string {
  if (isUrdu && KNOWN_AGREEMENT_FIELDS_URDU[field]) {
    return KNOWN_AGREEMENT_FIELDS_URDU[field];
  }
  return KNOWN_AGREEMENT_FIELDS[field] || field;
}
