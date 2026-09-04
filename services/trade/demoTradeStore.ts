import { ChatMessage, AgreementTerm } from '@/types/database';

const STORAGE_KEY_MESSAGES = 'agroendure_demo_messages_';
const STORAGE_KEY_TERMS = 'agroendure_demo_terms_';

export const INITIAL_DEMO_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    trade_id: 'trade-101',
    sender_id: 'seller-101',
    message_type: 'text',
    content: 'میرے پاس 100 من چاول ہیں، 6000 روپے فی من۔',
    audio_url: null,
    transcription: null,
    language: 'ur',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    sender: {
      id: 'seller-101',
      full_name: 'Chaudhry Ahmad (Seller)',
      phone: '+92 300 5551234',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'msg-2',
    trade_id: 'trade-101',
    sender_id: 'buyer-001',
    message_type: 'text',
    content: 'اگر میں 100 من لوں تو 5700 کر دو۔',
    audio_url: null,
    transcription: null,
    language: 'ur',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    sender: {
      id: 'buyer-001',
      full_name: 'Tariq Wholesale Buyer',
      phone: '+92 300 1112233',
      role: 'buyer',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'msg-3',
    trade_id: 'trade-101',
    sender_id: 'seller-101',
    message_type: 'text',
    content: 'ٹھیک ہے، 5700 فائنل۔',
    audio_url: null,
    transcription: null,
    language: 'ur',
    created_at: new Date(Date.now() - 900000).toISOString(),
    sender: {
      id: 'seller-101',
      full_name: 'Chaudhry Ahmad (Seller)',
      phone: '+92 300 5551234',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export const INITIAL_DEMO_TERMS: AgreementTerm[] = [
  {
    id: 'term-1',
    trade_id: 'trade-101',
    field_name: 'product_name',
    value: 'Rice (چاول)',
    status: 'agreed',
    confidence: 0.98,
    evidence_message_ids: ['msg-1'],
    updated_at: new Date().toISOString(),
    confirmed_by_buyer: false,
    confirmed_by_seller: false,
    version: 1,
  },
  {
    id: 'term-2',
    trade_id: 'trade-101',
    field_name: 'quantity',
    value: '100 Mann',
    status: 'agreed',
    confidence: 0.98,
    evidence_message_ids: ['msg-1', 'msg-2'],
    updated_at: new Date().toISOString(),
    confirmed_by_buyer: false,
    confirmed_by_seller: false,
    version: 1,
  },
  {
    id: 'term-3',
    trade_id: 'trade-101',
    field_name: 'price_per_unit',
    value: 'PKR 5,700 per Mann',
    status: 'agreed',
    confidence: 0.96,
    evidence_message_ids: ['msg-2', 'msg-3'],
    updated_at: new Date().toISOString(),
    confirmed_by_buyer: false,
    confirmed_by_seller: false,
    version: 1,
  },
];

// In-memory cache
const memoryMessages: Record<string, ChatMessage[]> = {};
const memoryTerms: Record<string, AgreementTerm[]> = {};

export function loadTradeMessages(tradeId: string): ChatMessage[] {
  if (memoryMessages[tradeId] && memoryMessages[tradeId].length > 0) {
    return memoryMessages[tradeId];
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY_MESSAGES + tradeId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryMessages[tradeId] = parsed;
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
  }

  // Initial fallback
  const defaults = tradeId === 'trade-101' ? [...INITIAL_DEMO_MESSAGES] : [];
  memoryMessages[tradeId] = defaults;
  return defaults;
}

export function saveTradeMessage(tradeId: string, message: ChatMessage) {
  const current = loadTradeMessages(tradeId);
  if (!current.some((m) => m.id === message.id)) {
    const updated = [...current, message];
    memoryMessages[tradeId] = updated;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_MESSAGES + tradeId, JSON.stringify(updated));
      } catch {
        // Storage write fail silent
      }
    }
  }
}

export function loadTradeTerms(tradeId: string): AgreementTerm[] {
  if (memoryTerms[tradeId] && memoryTerms[tradeId].length > 0) {
    return memoryTerms[tradeId];
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY_TERMS + tradeId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryTerms[tradeId] = parsed;
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
  }

  const defaults = tradeId === 'trade-101' ? [...INITIAL_DEMO_TERMS] : [];
  memoryTerms[tradeId] = defaults;
  return defaults;
}

export function saveTradeTerms(tradeId: string, terms: AgreementTerm[]) {
  memoryTerms[tradeId] = terms;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_TERMS + tradeId, JSON.stringify(terms));
    } catch {
      // Storage write fail silent
    }
  }
}
