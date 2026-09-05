import { supabase } from '@/services/supabase/client';
import { AgreementTerm, ChatMessage, Trade } from '@/types/database';
import {
  loadTradeConfirmation,
  saveTradeConfirmation,
} from './demoTradeStore';
import { crossTabSync } from './crossTabSync';

export async function createOrGetTrade(
  listingId: string,
  sellerId: string,
  buyerId: string
): Promise<Trade | null> {
  const { data: existingTrades } = await supabase
    .from('trades')
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId);

  if (existingTrades && existingTrades.length > 0) {
    return existingTrades[0];
  }

  const { data: newTrade, error } = await supabase
    .from('trades')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      status: 'negotiating',
    })
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .single();

  if (error) {
    console.error('Error creating trade:', error);
    throw error;
  }

  if (newTrade && newTrade.listing) {
    await supabase.from('agreement_terms').insert([
      {
        trade_id: newTrade.id,
        field_name: 'product_name',
        value: newTrade.listing.product_name,
        status: 'proposed',
        confidence: 1.0,
      },
      {
        trade_id: newTrade.id,
        field_name: 'quantity',
        value: newTrade.listing.quantity,
        status: 'proposed',
        confidence: 1.0,
      },
      {
        trade_id: newTrade.id,
        field_name: 'price_per_unit',
        value: newTrade.listing.price,
        status: 'proposed',
        confidence: 1.0,
      },
    ]);
  }

  return newTrade;
}

export async function fetchTradeById(tradeId: string): Promise<Trade | null> {
  const localConf = loadTradeConfirmation(tradeId);
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
      .eq('id', tradeId)
      .single();

    if (!error && data) {
      if (localConf.buyerConfirmed && !data.buyer_confirmed) {
        data.buyer_confirmed = true;
        data.buyer_confirmed_at = data.buyer_confirmed_at || localConf.buyerConfirmedAt;
      }
      if (localConf.sellerConfirmed && !data.seller_confirmed) {
        data.seller_confirmed = true;
        data.seller_confirmed_at = data.seller_confirmed_at || localConf.sellerConfirmedAt;
      }
      if (data.buyer_confirmed && data.seller_confirmed) {
        data.status = 'confirmed';
      }
      return data;
    }
  } catch (err) {
    console.warn('Supabase fetchTradeById error, fallback used:', err);
  }

  // Fallback trade record for offline or demo trade
  return {
    id: tradeId,
    listing_id: 'listing-101',
    buyer_id: 'buyer-001',
    seller_id: 'seller-101',
    status: localConf.buyerConfirmed && localConf.sellerConfirmed ? 'confirmed' : 'pending_confirmation',
    buyer_confirmed: localConf.buyerConfirmed,
    seller_confirmed: localConf.sellerConfirmed,
    buyer_confirmed_at: localConf.buyerConfirmedAt,
    seller_confirmed_at: localConf.sellerConfirmedAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    listing: {
      id: 'listing-101',
      seller_id: 'seller-101',
      title: 'سپر باسمتی چاول',
      description: 'اعلیٰ کوالٹی سپر باسمتی چاول',
      product_name: 'Rice (سپر باسمتی چاول)',
      price: 5700,
      quantity: 100,
      quantity_unit: 'Mann',
      currency: 'PKR',
      location: 'Lahore, Punjab',
      image_url: null,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    buyer: {
      id: 'buyer-001',
      full_name: 'Tariq Wholesale Buyer (طارق خریدار)',
      phone: '+92 300 1112233',
      role: 'buyer',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    seller: {
      id: 'seller-101',
      full_name: 'Chaudhry Ahmad (چوہدری احمد)',
      phone: '+92 300 5551234',
      role: 'seller',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  } as unknown as Trade;
}

export async function fetchUserTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user trades:', error);
    return [];
  }
  return data || [];
}

export async function fetchTradeMessages(tradeId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles(*)')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching trade messages:', error);
    return [];
  }
  return data || [];
}

export async function sendChatMessage(
  tradeId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'voice' | 'system' | 'ai_assistant' = 'text',
  audioUrl: string | null = null,
  transcription: string | null = null
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      trade_id: tradeId,
      sender_id: senderId,
      content,
      message_type: messageType,
      audio_url: audioUrl,
      transcription,
      language: 'en',
    })
    .select('*, sender:profiles(*)')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  return data;
}

export async function fetchAgreementTerms(tradeId: string): Promise<AgreementTerm[]> {
  const { data, error } = await supabase
    .from('agreement_terms')
    .select('*')
    .eq('trade_id', tradeId);

  if (error) {
    console.error('Error fetching agreement terms:', error);
    return [];
  }
  return data || [];
}

export async function confirmTrade(
  tradeId: string,
  role: 'buyer' | 'seller'
): Promise<void> {
  const now = new Date().toISOString();
  // 1. Immediately update demo store for offline & dual-sync resilience
  const localState = saveTradeConfirmation(tradeId, role, true);
  crossTabSync.broadcastConfirmation(tradeId, role, true);

  // 2. Sync to Supabase
  try {
    const { data: trade, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) {
      console.warn('Could not fetch trade for remote update, local confirmation persisted.');
      return;
    }

    const updatePayload: Record<string, any> = {
      updated_at: now,
    };

    if (role === 'buyer') {
      updatePayload.buyer_confirmed = true;
      updatePayload.buyer_confirmed_at = now;
    } else {
      updatePayload.seller_confirmed = true;
      updatePayload.seller_confirmed_at = now;
    }

    const otherConfirmed =
      role === 'buyer'
        ? trade?.seller_confirmed === true || localState.sellerConfirmed
        : trade?.buyer_confirmed === true || localState.buyerConfirmed;

    if (otherConfirmed) {
      updatePayload.status = 'confirmed';
    } else {
      updatePayload.status = 'pending_confirmation';
    }

    const { error: updateError } = await supabase
      .from('trades')
      .update(updatePayload)
      .eq('id', tradeId);

    if (updateError) {
      console.warn('Supabase confirmTrade update warning:', updateError);
    }
  } catch (err) {
    console.warn('confirmTrade remote sync warning:', err);
  }
}
